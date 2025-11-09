// =========================
// DIGITAL ID E-SERVICES JS
// =========================

/************* IndexedDB Setup *************/
// NOTE: bumped to version 3 to align with Core B schema (events / eventAttendance)
const DB_NAME = "digital-id-db";
const DB_VERSION = 3;
let db;

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const d = e.target.result;

      // residents
      if (!d.objectStoreNames.contains("residents")) {
        const os = d.createObjectStore("residents", { keyPath: "id" });
        os.createIndex("byName", "name", { unique: false });
      }

      // e-docs requests
      if (!d.objectStoreNames.contains("requests")) {
        d.createObjectStore("requests", {
          keyPath: "rid",
          autoIncrement: true,
        });
      }

      // complaints / feedback
      if (!d.objectStoreNames.contains("complaints")) {
        d.createObjectStore("complaints", {
          keyPath: "cid",
          autoIncrement: true,
        });
      }

      // audit trail
      if (!d.objectStoreNames.contains("audit")) {
        d.createObjectStore("audit", { keyPath: "ts" });
      }

      // events / programs / relief ops
      if (!d.objectStoreNames.contains("events")) {
        // {eid, title, desc, date, type:'program'|'relief'|'medical'|'event'|'cleanup'|'assembly', ...}
        d.createObjectStore("events", {
          keyPath: "eid",
          autoIncrement: true,
        });
      }

      // attendance per event
      if (!d.objectStoreNames.contains("eventAttendance")) {
        // {aid, eid, residentId, residentIdNo, ts}
        d.createObjectStore("eventAttendance", {
          keyPath: "aid",
          autoIncrement: true,
        });
      }
    };

    req.onsuccess = () => {
      db = req.result;
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

function tx(store, mode = "readonly") {
  return db.transaction(store, mode).objectStore(store);
}

const put = (store, val) =>
  new Promise((res, rej) => {
    const r = tx(store, "readwrite").put(val);
    r.onsuccess = () => res(val);
    r.onerror = () => rej(r.error);
  });

const getRec = (store, key) =>
  new Promise((res, rej) => {
    const r = tx(store).get(key);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });

const all = (store) =>
  new Promise((res, rej) => {
    const r = tx(store).getAll();
    r.onsuccess = () => res(r.result || []);
    r.onerror = () => rej(r.error);
  });

const delRec = (store, key) =>
  new Promise((res, rej) => {
    const r = tx(store, "readwrite").delete(key);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  });

async function audit(action, info) {
  await put("audit", { ts: Date.now(), action, info });
  renderAudit();
}

/************* Auth (demo only) *************/
let currentUser = null;
const demoUsers = {
  "admin@example": { pass: "admin123", role: "admin" },
  "staff@example": { pass: "staff123", role: "staff" },
};

const roleBadge = document.getElementById("roleBadge");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");

btnLogin.onclick = async () => {
  const u = prompt("Username (admin@example / staff@example)");
  const p = prompt("Password");
  if (!u || !p) return;

  const rec = demoUsers[u];
  if (rec && rec.pass === p) {
    currentUser = { user: u, role: rec.role };

    roleBadge.textContent = rec.role.toUpperCase();
    roleBadge.className = "tag " + (rec.role === "admin" ? "green" : "amber");

    btnLogin.classList.add("hidden");
    btnLogout.classList.remove("hidden");

    await audit("login", { user: u });
  } else {
    alert("Invalid credentials");
  }
};

btnLogout.onclick = async () => {
  await audit("logout", { user: currentUser?.user });
  currentUser = null;

  roleBadge.textContent = "Signed-out";
  roleBadge.className = "tag amber";

  btnLogout.classList.add("hidden");
  btnLogin.classList.remove("hidden");
};

// basic check
function requireStaff() {
  if (!currentUser) {
    alert("Login required");
    return false;
  }
  return true;
}

// stricter check (admin only for sensitive stuff)
function requireAdmin() {
  if (!currentUser) {
    alert("Login required");
    return false;
  }
  if (currentUser.role !== "admin") {
    alert("Admin role required");
    return false;
  }
  return true;
}

/************* Helpers *************/
// convert file -> base64 dataURL
async function fileToDataURL(file) {
  return new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.readAsDataURL(file);
  });
}

// auto-crop portrait to standard ID aspect ratio
async function cropToID(dataURL) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const W = 300,
        H = 360; // ~5:6 portrait
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d");

      const s = Math.max(W / img.width, H / img.height);
      const w = img.width * s,
        h = img.height * s;
      const dx = (W - w) / 2,
        dy = (H - h) / 2;

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, dx, dy, w, h);

      resolve(c.toDataURL("image/jpeg", 0.9));
    };
    img.src = dataURL;
  });
}

// generate unique ID number like BHSPK-2025-001
async function nextIdNumber(purok = "BHSPK") {
  const list = await all("residents");
  const year = new Date().getFullYear();
  const prefix = `${(purok || "BHSPK").replaceAll(" ", "").toUpperCase()}-${year}`;

  const nums = list
    .filter((r) => r.idno?.startsWith(prefix))
    .map((r) => parseInt(r.idno.split("-").pop() || "0", 10));

  const seq = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${String(seq).padStart(3, "0")}`;
}

/************* Residents (Add / List / Edit / Delete) *************/
const resForm = document.getElementById("resForm");
const resTable = document.getElementById("resTable");
const resSearch = document.getElementById("resSearch");
const preview = document.getElementById("preview");
const sigPreview = document.getElementById("sigPreview");

const photoInput = document.getElementById("photo");
photoInput?.addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const url = await fileToDataURL(f);
  const cropped = await cropToID(url);
  preview.src = cropped;
  preview.classList.remove("hidden");
  preview.dataset.cropped = cropped;
});

const signatureInput = document.getElementById("signature");
signatureInput?.addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const url = await fileToDataURL(f);
  sigPreview.src = url;
  sigPreview.classList.remove("hidden");
  sigPreview.dataset.sig = url;
});

resForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!requireStaff()) return;

  const name = document.getElementById("fullName").value.trim();
  const birthdate = document.getElementById("birthdate").value;
  const address = document.getElementById("address").value.trim();
  const contact = document.getElementById("contact").value.trim();
  const purok = document.getElementById("purok").value.trim() || "BHSPK"; // also used as "role"
  const tanod = document.getElementById("tanod").value.trim();
  const household = document.getElementById("household").value.trim();

  const photoData = preview.dataset.cropped || "";
  const sigData = sigPreview.dataset.sig || "";

  const docsInput = document.getElementById("docs");
  const docs = [];
  for (const f of docsInput.files || []) {
    docs.push({ name: f.name, data: await fileToDataURL(f) });
  }

  const id = crypto.randomUUID();
  const idno = await nextIdNumber(purok);

  const rec = {
    id,
    idno,
    name,
    birthdate,
    address,
    contact,
    purok,
    tanod,
    household,
    photo: photoData,
    signature: sigData,
    docs,
    status: "pending",
    createdAt: Date.now(),
    // releasedAt to be stamped later
  };

  await put("residents", rec);
  await audit("resident:add", { idno, name });

  // reset form and previews
  resForm.reset();
  preview.classList.add("hidden");
  sigPreview.classList.add("hidden");
  delete preview.dataset.cropped;
  delete sigPreview.dataset.sig;

  renderResidents();
});

// build residents table
async function renderResidents(filter = "") {
  const list = await all("residents");
  list.sort((a, b) => a.idno.localeCompare(b.idno));

  const q = filter.toLowerCase();
  const show = q
    ? list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.idno.toLowerCase().includes(q)
      )
    : list;

  resTable.innerHTML = show
    .map((r) => {
      const tag =
        r.status === "released"
          ? '<span class="tag green">Released</span>'
          : '<span class="tag red">Pending</span>';

      return `
        <tr>
          <td>${r.idno}</td>
          <td>${r.name}</td>
          <td>${r.purok || ""}</td>
          <td>${tag}</td>
          <td>
            <button class="btn ghost" onclick="loadToID('${r.id}')">Open</button>
            <button class="btn" onclick="openEdit('${r.id}')">Edit</button>
            <button class="btn secondary" onclick="removeResident('${r.id}')">Delete</button>
          </td>
        </tr>`;
    })
    .join("");

  updateStats(list);
}

resSearch?.addEventListener("input", () => {
  renderResidents(resSearch.value);
});

async function removeResident(id) {
  if (!requireAdmin()) return;
  if (!confirm("Delete resident?")) return;
  const r = await getRec("residents", id);
  await delRec("residents", id);
  await audit("resident:delete", { idno: r?.idno, name: r?.name });
  renderResidents();
}

// edit modal logic
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
let editId = null;

// assumes you have inputs with these IDs in the edit modal
const e_name = document.getElementById("e_name");
const e_birthdate = document.getElementById("e_birthdate");
const e_address = document.getElementById("e_address");
const e_contact = document.getElementById("e_contact");
const e_purok = document.getElementById("e_purok");
const e_tanod = document.getElementById("e_tanod");
const e_household = document.getElementById("e_household");
const e_photo = document.getElementById("e_photo");
const e_signature = document.getElementById("e_signature");

async function openEdit(id) {
  const r = await getRec("residents", id);
  if (!r) return;
  editId = id;

  e_name.value = r.name || "";
  e_birthdate.value = r.birthdate || "";
  e_address.value = r.address || "";
  e_contact.value = r.contact || "";
  e_purok.value = r.purok || "";
  e_tanod.value = r.tanod || "";
  e_household.value = r.household || "";

  editModal.showModal();
}

editForm.addEventListener("close", () => {
  editId = null;
});

editForm.addEventListener("submit", (e) => {
  e.preventDefault(); // stop default <form> submit
});

// IMPORTANT FIX: make this async so we can await inside
editForm.addEventListener("click", async (e) => {
  const val = e.target.value;
  if (!val) return;

  if (val === "save" && editId) {
    if (!requireStaff()) return;

    const r = await getRec("residents", editId);
    if (!r) return;

    r.name = e_name.value.trim();
    r.birthdate = e_birthdate.value;
    r.address = e_address.value.trim();
    r.contact = e_contact.value.trim();
    r.purok = e_purok.value.trim();
    r.tanod = e_tanod.value.trim();
    r.household = e_household.value.trim();

    if (e_photo.files?.[0]) {
      const u = await fileToDataURL(e_photo.files[0]);
      r.photo = await cropToID(u);
    }
    if (e_signature.files?.[0]) {
      r.signature = await fileToDataURL(e_signature.files[0]);
    }

    await put("residents", r);
    await audit("resident:edit", { idno: r.idno });

    editModal.close();
    renderResidents();
  }

  if (val === "cancel") {
    editModal.close();
  }
});

// expose these to inline HTML onclick=""
window.loadToID = loadToID;
window.removeResident = removeResident;
window.openEdit = openEdit;

/************* ID Generator (Preview / Status / Print) *************/
const frontFullName = document.getElementById("frontFullName");
const frontRole = document.getElementById("frontRole");
const frontIdNumber = document.getElementById("frontIdNumber");
const idPhoto = document.getElementById("idPhoto");
const sigImg = document.getElementById("sigImg");
const barcodeSvg = document.getElementById("barcode");

// back fields
const backAddress = document.getElementById("backAddress");
const backContact = document.getElementById("backContact");
const backPrecinct = document.getElementById("backPrecinct");
const backRole = document.getElementById("backRole");

const cardStatusBadge = document.getElementById("cardStatusBadge");

// theme dropdown + preview text
const templateSelect = document.getElementById("templateSelect");
const themePreviewText = document.getElementById("themePreviewText");

// will be filled when opening a resident
let currentResidentId = null;

/* THEME SWITCHER with Memory + Fade Transition */
function applyTemplate() {
  const design = templateSelect ? templateSelect.value || "A" : "A";
  const frontCard = document.getElementById("idFront");
  const backCard = document.getElementById("idBack");
  if (!frontCard || !backCard) return;

  // start fade-out
  frontCard.classList.add("fade-out");
  backCard.classList.add("fade-out");

  setTimeout(() => {
    // remove all theme classes
    frontCard.classList.remove("themeAFront", "themeBFront", "themeCFront");
    backCard.classList.remove("themeABack", "themeBBack", "themeCBack");

    // apply chosen theme
    if (design === "A") {
      frontCard.classList.add("themeAFront");
      backCard.classList.add("themeABack");
      if (themePreviewText) {
        themePreviewText.textContent = "Currently: Theme A – Yellow (Official)";
      }
    } else if (design === "B") {
      frontCard.classList.add("themeBFront");
      backCard.classList.add("themeBBack");
      if (themePreviewText) {
        themePreviewText.textContent = "Currently: Theme B – Blue (Alternate)";
      }
    } else if (design === "C") {
      frontCard.classList.add("themeCFront");
      backCard.classList.add("themeCBack");
      if (themePreviewText) {
        themePreviewText.textContent =
          "Currently: Theme C – Black & Gold (Modern)";
      }
    }

    // remember theme
    localStorage.setItem("selectedTheme", design);

    // fade back in
    frontCard.classList.remove("fade-out");
    backCard.classList.remove("fade-out");
    frontCard.classList.add("fade-in");
    backCard.classList.add("fade-in");

    setTimeout(() => {
      frontCard.classList.remove("fade-in");
      backCard.classList.remove("fade-in");
    }, 400);
  }, 200);
}

// Restore saved theme asap
(function restoreThemeFromLocalStorage() {
  const saved = localStorage.getItem("selectedTheme");
  if (saved && templateSelect) {
    templateSelect.value = saved;
  }
})();

// listen to dropdown changes
templateSelect?.addEventListener("change", applyTemplate);

// fill preview card with resident info
async function loadToID(id) {
  const r = await getRec("residents", id);
  if (!r) return;

  currentResidentId = id;
  showPage("idgen");

  // FRONT
  if (frontFullName) frontFullName.textContent = r.name || "—";
  if (frontRole) frontRole.textContent = (r.purok || "RESIDENT").toUpperCase();
  if (frontIdNumber) frontIdNumber.textContent = r.idno || "—";
  if (idPhoto) idPhoto.src = r.photo || "";
  if (sigImg) sigImg.src = r.signature || "";

  // BACK
  if (backAddress) backAddress.textContent = r.address || "—";
  if (backContact) backContact.textContent = r.contact || "—";
  if (backPrecinct) backPrecinct.textContent = r.household || "—"; // household as precinct
  if (backRole) backRole.textContent = (r.purok || "RESIDENT").toUpperCase();

  // BARCODE
  if (typeof JsBarcode === "function" && barcodeSvg) {
    JsBarcode(barcodeSvg, r.idno || "N/A", {
      format: "CODE128",
      width: 1.4,
      height: 40,
      displayValue: false,
    });
  }

  // STATUS BADGE
  if (cardStatusBadge) {
    if (r.status === "released") {
      cardStatusBadge.textContent = "Released";
      cardStatusBadge.className = "tag green";
    } else {
      cardStatusBadge.textContent = "Pending";
      cardStatusBadge.className = "tag red";
    }
  }

  // apply theme (with fade)
  applyTemplate();
}

// mark status buttons
const btnPending = document.getElementById("btnPending");
const btnReleased = document.getElementById("btnReleased");

btnPending?.addEventListener("click", async () => {
  if (!requireStaff() || !currentResidentId) return;
  const r = await getRec("residents", currentResidentId);
  r.status = "pending";
  await put("residents", r);
  await audit("id:mark-pending", { idno: r.idno });

  if (cardStatusBadge) {
    cardStatusBadge.textContent = "Pending";
    cardStatusBadge.className = "tag red";
  }

  renderResidents();
});

btnReleased?.addEventListener("click", async () => {
  if (!requireStaff() || !currentResidentId) return;
  const r = await getRec("residents", currentResidentId);
  r.status = "released";

  // stamp release date only if not yet stamped
  if (!r.releasedAt) {
    r.releasedAt = Date.now();
  }

  await put("residents", r);
  await audit("id:mark-released", {
    idno: r.idno,
    releasedAt: r.releasedAt,
  });

  if (cardStatusBadge) {
    cardStatusBadge.textContent = "Released";
    cardStatusBadge.className = "tag green";
  }

  renderResidents();
});

// PRINT helpers
const btnReprint = document.getElementById("btnReprint");
const btnPrintPVCFront = document.getElementById("btnPrintPVCFront");
const btnPrintPVCBack = document.getElementById("btnPrintPVCBack");

btnReprint?.addEventListener("click", () => {
  if (!currentResidentId) {
    alert("Open a resident in ID Generator first.");
    return;
  }
  window.print();
});

// clone screen preview into hidden print wrappers for PVC
function syncCardToPrintWrappers() {
  const liveFront = document.getElementById("idFront");
  const liveBack = document.getElementById("idBack");

  const printFrontCard = document.getElementById("printFrontCard");
  const printBackCard = document.getElementById("printBackCard");

  if (liveFront && printFrontCard) {
    // copy HTML and its theme classes
    printFrontCard.className = liveFront.className;
    printFrontCard.innerHTML = liveFront.innerHTML;
  }
  if (liveBack && printBackCard) {
    printBackCard.className = liveBack.className;
    printBackCard.innerHTML = liveBack.innerHTML;
  }
}

// which = 'front' or 'back'
function printPVC(which) {
  if (!currentResidentId) {
    alert("Open a resident first.");
    return;
  }

  syncCardToPrintWrappers();

  const frontWrap = document.getElementById("printFrontWrapper");
  const backWrap = document.getElementById("printBackWrapper");

  // reset classes
  frontWrap.classList.remove("printing-now");
  backWrap.classList.remove("printing-now");

  // choose which one shows to printer
  if (which === "front") {
    frontWrap.classList.add("printing-now");
  } else {
    backWrap.classList.add("printing-now");
  }

  // make wrappers visible for print context
  frontWrap.classList.remove("hidden");
  backWrap.classList.remove("hidden");

  window.print();

  // cleanup after print
  frontWrap.classList.add("hidden");
  backWrap.classList.add("hidden");
  frontWrap.classList.remove("printing-now");
  backWrap.classList.remove("printing-now");
}

btnPrintPVCFront?.addEventListener("click", () => {
  printPVC("front");
});
btnPrintPVCBack?.addEventListener("click", () => {
  printPVC("back");
});

// in-panel search for resident to load
const searchInput = document.getElementById("searchId");
const searchResults = document.getElementById("searchResults");

searchInput?.addEventListener("input", async () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    searchResults.innerHTML = "";
    return;
  }

  const list = await all("residents");
  const matches = list.filter(
    (r) =>
      r.idno.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q)
  );

  if (matches.length === 0) {
    searchResults.innerHTML = `<span class="muted">No match</span>`;
    return;
  }

  searchResults.innerHTML = matches
    .slice(0, 8)
    .map(
      (r) => `
        <div>
          <a href="#" data-id="${r.id}" class="pickPerson">
            ${r.idno} — ${r.name}
          </a>
        </div>`
    )
    .join("");

  searchResults.querySelectorAll(".pickPerson").forEach((a) => {
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      const rid = a.getAttribute("data-id");
      loadToID(rid);
    });
  });
});

/************* E-Docs (Clearance / Indigency / etc.) *************/
const reqForm = document.getElementById("reqForm");
const reqTable = document.getElementById("reqTable");
const docModal = document.getElementById("docModal");
const docTitleUI = document.getElementById("docTitleUI");
const printDocWrapper = document.getElementById("printDocWrapper");
const btnCloseDocModal = document.getElementById("btnCloseDocModal");
const btnPrintDoc = document.getElementById("btnPrintDoc");

reqForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const idno = reqId.value.trim();
  const doc = reqDoc.value;
  const purpose = reqPurpose.value.trim();
  const status = "Pending";

  await put("requests", {
    rid: Date.now(),
    idno,
    doc,
    purpose,
    status,
    createdAt: Date.now(),
  });

  await audit("edoc:request", { idno, doc });
  reqForm.reset();
  renderReqs();
});

async function renderReqs() {
  const rows = await all("requests");
  rows.sort((a, b) => b.createdAt - a.createdAt);

  reqTable.innerHTML = rows
    .map((x) => {
      const tagClass =
        x.status === "Released"
          ? "green"
          : x.status === "Approved"
          ? "amber"
          : "red";

      return `
        <tr data-req-id="${x.rid}">
          <td>${x.idno}</td>
          <td>${x.doc}</td>
          <td>${x.purpose || ""}</td>
          <td><span class="tag ${tagClass}">${x.status}</span></td>
          <td class="row" style="gap:6px;flex-wrap:wrap;">
            <button class="btn ghost" data-action="approve">Approve</button>
            <button class="btn" data-action="release">Release</button>
            <button class="btn secondary" data-action="preview-doc">Preview Doc</button>
          </td>
        </tr>`;
    })
    .join("");
}

// delegated click for Approve / Release / Preview Doc
reqTable?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const tr = e.target.closest("tr[data-req-id]");
  if (!tr) return;

  const rid = parseInt(tr.getAttribute("data-req-id"), 10);
  const act = btn.getAttribute("data-action");

  if (act === "approve") {
    if (!requireStaff()) return;
    const rows = await all("requests");
    const row = rows.find((r) => r.rid === rid);
    if (!row) return;
    row.status = "Approved";
    await put("requests", row);
    await audit("edoc:status", { rid, status: row.status });
    renderReqs();
    return;
  }

  if (act === "release") {
    if (!requireStaff()) return;
    const rows = await all("requests");
    const row = rows.find((r) => r.rid === rid);
    if (!row) return;
    row.status = "Released";
    await put("requests", row);
    await audit("edoc:status", { rid, status: row.status });
    renderReqs();
    return;
  }

  if (act === "preview-doc") {
    openDocPreviewByRequestId(rid);
    return;
  }
});

/************* AUTH HASH (anti-tamper) *************/
// NOTE: This secret should be unique per machine. Change it on each barangay laptop.
const LOCAL_DEVICE_SECRET = "BHSQC-LOCAL-DEVICE-KEY-2025";

// create a simple reproducible hash for verification.
// This is not high-end crypto, it's just to stop casual fake editing.
function generateAuthHash(reqRecord, resident) {
  const base = [
    reqRecord.rid,
    reqRecord.doc,
    reqRecord.status,
    resident?.name || "",
    resident?.address || "",
    reqRecord.createdAt,
    LOCAL_DEVICE_SECRET,
  ].join("|");

  let h = 0 >>> 0;
  for (let i = 0; i < base.length; i++) {
    h = (h * 31 + base.charCodeAt(i)) >>> 0;
  }

  // return short uppercase hex so it's easy to read/encode
  return h.toString(16).toUpperCase();
}

/************* Doc Builder + QR *************/
// builds the printable barangay doc HTML + QR text + AUTH code
function buildOfficialDocHTML({ docType, resident, reqRecord }) {
  const fullName = resident?.name || "(NAME)";
  const address = resident?.address || "(ADDRESS)";
  const purpose = reqRecord?.purpose || "(NO STATED PURPOSE)";

  const today = new Date();
  const todayStr = today.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // control number (per request)
  const controlNo = "CTRL-" + reqRecord.rid;

  // status (Released > Approved > Pending)
  const qrStatus = reqRecord.status || "Pending";

  // compute AUTH hash (anti-tamper)
  const authCode = generateAuthHash(reqRecord, resident);

  // logos
  const leftSeal = "assets/brgy-holy-spirit-logo.jpg";
  const rightSeal = "assets/Quezon_City_LGU_logo.jpg";

  // pick doc wording
  let title = "";
  let bodyHTML = "";

  if (docType === "Barangay Clearance") {
    title = "BARANGAY CLEARANCE";
    bodyHTML = `
      <p>TO WHOM IT MAY CONCERN:</p>

      <p>This is to certify that <span class="resident-name">${fullName}</span>,
      of legal age, and a resident of <b>${address}</b>, Barangay Holy
      Spirit, Quezon City, is known to this office to be of good moral
      character and without any derogatory record on file as of this
      date.</p>

      <p>This certification is being issued upon the request of the
      above-named person for the purpose of
      <span class="purpose-text">${purpose}</span>.</p>

      <p>Issued this ${todayStr} at Barangay Holy Spirit, Quezon City.</p>
    `;
  } else if (docType === "Certificate of Indigency") {
    title = "CERTIFICATION OF INDIGENCY";
    bodyHTML = `
      <p>TO WHOM IT MAY CONCERN:</p>

      <p>This is to certify that <span class="resident-name">${fullName}</span>,
      presently residing at <b>${address}</b>, Barangay Holy Spirit,
      Quezon City, is known to this Barangay as belonging to an
      indigent/low-income household and is in need of financial and/or
      social assistance.</p>

      <p>This certification is being issued upon request of the
      subject resident for the purpose of
      <span class="purpose-text">${purpose}</span>.</p>

      <p>Issued this ${todayStr} at Barangay Holy Spirit, Quezon City.</p>
    `;
  } else {
    // default: Residency Certificate
    title = "CERTIFICATE OF RESIDENCY";
    bodyHTML = `
      <p>TO WHOM IT MAY CONCERN:</p>

      <p>This is to certify that <span class="resident-name">${fullName}</span>
      is a bona fide resident of <b>${address}</b> within the jurisdiction of
      Barangay Holy Spirit, Quezon City, and has been residing therein as
      verified by our records and/or actual barangay verification.</p>

      <p>This certification is issued upon request of the subject resident
      for the purpose of <span class="purpose-text">${purpose}</span>.</p>

      <p>Issued this ${todayStr} at Barangay Holy Spirit, Quezon City.</p>
    `;
  }

  const captainName = "ESTRELLA C. VALMOCINA";
  const captainRole = "Punong Barangay / Barangay Chairwoman";

  // Build QR payload (plain text, human-readable)
  const qrText = [
    "BARANGAY HOLY SPIRIT - OFFICIAL",
    "Quezon City, PH",
    `CTRL: ${controlNo}`,
    `NAME: ${fullName}`,
    `DATE: ${todayStr}`,
    `STATUS: ${qrStatus}`,
    `DOC: ${docType}`,
    `AUTH: ${authCode}`,
  ].join("\n");

  // Full printable block (we'll insert this into modal)
  const htmlMarkup = `
    <section class="doc-header">
      <img src="${leftSeal}"  class="left-seal"  alt="Barangay Seal"/>
      <img src="${rightSeal}" class="right-seal" alt="City Seal"/>

      <div class="gov-line-1">Republic of the Philippines</div>
      <div class="gov-line-2">Quezon City</div>
      <div class="gov-line-2">Barangay Holy Spirit</div>
      <div class="gov-line-3">06 Faustino St., Barangay Holy Spirit, Quezon City</div>

      <div class="doc-type-title">${title}</div>
    </section>

    <section class="doc-body">
      ${bodyHTML}
    </section>

    <section class="doc-sign-block">
      <div class="sig-label">Certified by:</div>
      <br/><br/>
      <div class="sig-name">${captainName}</div>
      <div class="sig-role">${captainRole}</div>
    </section>

    <section class="doc-verify-row">
      <div class="doc-verify-meta">
        Control No.: <b>${controlNo}</b><br/>
        Requested ID No.: <b>${reqRecord.idno || "N/A"}</b><br/>
        Issued: <b>${todayStr}</b><br/>
        Status: <b>${qrStatus}</b><br/>
        Doc Type: <b>${docType}</b><br/>
        AUTH CODE: <b>${authCode}</b>
      </div>

      <div class="doc-qr-box">
        <div id="qrBox"
             style="width:100%;height:100%;
                    display:flex;align-items:center;justify-content:center;
                    font-size:10px;text-align:center;">
          Generating QR...
        </div>
      </div>
    </section>
  `;

  return { htmlMarkup, qrText, authCode };
}

// tiny QR generator wrapper (expects QRCode lib already loaded on page)
function renderQRInto(elementId, text) {
  const box = document.getElementById(elementId);
  if (!box) return;

  // clear old QR
  box.innerHTML = "";

  new QRCode(box, {
    text: text,
    width: 96,
    height: 96,
    correctLevel: QRCode.CorrectLevel.M,
  });
}

// open preview modal for a specific request
async function openDocPreviewByRequestId(rid) {
  if (!requireStaff()) return;

  // 1. get request record
  const reqRows = await all("requests");
  const reqRecord = reqRows.find((r) => r.rid === Number(rid));
  if (!reqRecord) {
    alert("Request not found.");
    return;
  }

  // 2. find resident based on idno
  const residents = await all("residents");
  const resident = residents.find((r) => r.idno === reqRecord.idno);

  // 3. build content
  const built = buildOfficialDocHTML({
    docType: reqRecord.doc,
    resident,
    reqRecord,
  });
  // built: { htmlMarkup, qrText, authCode }

  // 4. inject into modal DOM
  if (docTitleUI) docTitleUI.textContent = reqRecord.doc;
  if (printDocWrapper) printDocWrapper.innerHTML = built.htmlMarkup;

  // 5. show modal
  if (docModal && !docModal.open) {
    docModal.showModal();
  }

  // 6. AFTER it's rendered, generate the QR to #qrBox
  setTimeout(() => {
    renderQRInto("qrBox", built.qrText);
  }, 0);

  // 7. audit preview (optional trail)
  await audit("edoc:preview", {
    rid: reqRecord.rid,
    doc: reqRecord.doc,
    auth: built.authCode,
  });
}

// modal buttons for print / close
btnPrintDoc?.addEventListener("click", () => {
  if (!requireStaff()) return;
  window.print();
});
btnCloseDocModal?.addEventListener("click", () => {
  if (docModal && docModal.open) {
    docModal.close();
  }
});

/************* Complaints / Feedback *************/
const cmpForm = document.getElementById("cmpForm");
const cmpTable = document.getElementById("cmpTable");

cmpForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const idno = cmpId.value.trim();
  const text = cmpText.value.trim();

  await put("complaints", {
    cid: Date.now(),
    idno,
    text,
    createdAt: Date.now(),
  });

  await audit("complaint:add", { idno });
  cmpForm.reset();
  renderComplaints();
});

async function renderComplaints() {
  const rows = await all("complaints");
  rows.sort((a, b) => b.createdAt - a.createdAt);

  cmpTable.innerHTML = rows
    .map(
      (x) => `
        <tr>
          <td>${x.idno || "—"}</td>
          <td>${x.text}</td>
          <td>${new Date(x.createdAt).toLocaleString()}</td>
        </tr>`
    )
    .join("");
}

/************* Router (Top Nav Tabs) *************/
const sections = [
  "dashboard",
  "residents",
  "idgen",
  "edocs",
  "complaints",
  "reports",
  "settings",
  // page-backup exists in UI but not on nav for now
];
const nav = document.getElementById("topnav");

nav.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  showPage(btn.dataset.page);
});

function showPage(id) {
  sections.forEach((s) => {
    document
      .getElementById("page-" + s)
      .classList.toggle("hidden", s !== id);
  });

  Array.from(nav.querySelectorAll("button")).forEach((b) => {
    b.classList.toggle("active", b.dataset.page === id);
  });
}

/************* Dashboard Stats & Audit *************/
function updateStats(list) {
  const total = list.length;
  const pending = list.filter((r) => r.status === "pending").length;
  const released = list.filter((r) => r.status === "released").length;

  statResidents.textContent = `Residents: ${total}`;
  statPending.textContent = `IDs Pending: ${pending}`;
  statReleased.textContent = `IDs Released: ${released}`;
}

async function renderAudit() {
  const logs = await all("audit");
  logs.sort((a, b) => b.ts - a.ts);

  auditLatest.innerHTML = logs
    .slice(0, 12)
    .map((l) => {
      const when = new Date(l.ts).toLocaleString();
      return `
        <div class="mb8">
          <b>${l.action}</b><br>
          <span class="muted">${when}</span>
        </div>`;
    })
    .join("");
}

/************* AI Face Detection & Matching *************/
const cam = document.getElementById("cam");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("btnStartCam");
const captureBtn = document.getElementById("btnCapture");
const veriStatus = document.getElementById("veriStatus");

let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) return;
  const url = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights";
  await faceapi.nets.tinyFaceDetector.loadFromUri(url);
  await faceapi.nets.faceRecognitionNet.loadFromUri(url);
  await faceapi.nets.faceLandmark68Net.loadFromUri(url);
  modelsLoaded = true;
}

startBtn?.addEventListener("click", async () => {
  await loadModels();
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  cam.srcObject = stream;

  veriStatus.textContent = "Camera on";
  veriStatus.className = "tag amber";
});

captureBtn?.addEventListener("click", async () => {
  if (!currentResidentId) {
    alert("Open a resident in ID Generator first.");
    return;
  }

  await loadModels();

  veriStatus.textContent = "Detecting…";
  veriStatus.className = "tag amber";

  const r = await getRec("residents", currentResidentId);
  if (!r || !r.photo) {
    alert("Resident has no reference photo");
    return;
  }

  // reference face (resident's saved photo)
  const refImg = await faceapi.fetchImage(r.photo);
  const refDet = await faceapi
    .detectSingleFace(refImg, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!refDet) {
    veriStatus.textContent = "No face in stored photo";
    veriStatus.className = "tag red";
    await audit("verify:fail", {
      idno: r.idno,
      reason: "no face in stored",
    });
    return;
  }

  // snapshot from live camera
  const c = document.createElement("canvas");
  c.width = cam.videoWidth;
  c.height = cam.videoHeight;
  c.getContext("2d").drawImage(cam, 0, 0);

  const det = await faceapi
    .detectSingleFace(c, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  // draw detection box overlay
  const ctx = overlay.getContext("2d");
  ctx.clearRect(0, 0, overlay.width, overlay.height);

  if (det?.detection) {
    const { x, y, width, height } = det.detection.box;
    const sx = overlay.width / c.width;
    const sy = overlay.height / c.height;
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2;
    ctx.strokeRect(x * sx, y * sy, width * sx, height * sy);
  }

  if (!det) {
    veriStatus.textContent = "No human face detected";
    veriStatus.className = "tag red";
    await audit("verify:fail", { idno: r.idno, reason: "no face live" });
    return;
  }

  // compare descriptor distance
  const dist = faceapi.euclideanDistance(
    refDet.descriptor,
    det.descriptor
  );
  const pass = dist <= 0.5; // tweak threshold if too strict/loose

  veriStatus.textContent = pass
    ? `Matched (distance ${dist.toFixed(3)})`
    : `Not match (${dist.toFixed(3)})`;

  veriStatus.className = pass ? "tag green" : "tag red";

  await audit(pass ? "verify:pass" : "verify:fail", {
    idno: r.idno,
    dist,
  });

  // privacy: wipe temp canvas
  c.width = 0;
  c.height = 0;
});

/************* BACKUP / RESTORE *************/
/* small helper to download files */
function downloadFile(filename, content, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/***********************
 * BACKUP / RESTORE LOGIC
 ***********************/
async function getAllDataForBackup() {
  const residentsData = await all("residents");
  const requestsData = await all("requests");
  const complaintsData = await all("complaints");
  const auditData = await all("audit");

  // from Core B features (may or may not have data yet)
  async function safeAll(storeName) {
    try {
      return await all(storeName);
    } catch (e) {
      return [];
    }
  }
  const eventsData = await safeAll("events");
  const eventAttendanceData = await safeAll("eventAttendance");

  return {
    residents: residentsData,
    requests: requestsData,
    complaints: complaintsData,
    audit: auditData,
    events: eventsData,
    eventAttendance: eventAttendanceData,
    exportedAt: Date.now(),
  };
}

// Turn array of flat objects into CSV text.
function toCSV(rows) {
  if (!rows || rows.length === 0) {
    return "";
  }
  const cols = Object.keys(rows[0]);
  const header = cols.join(",");
  const body = rows
    .map((r) => {
      return cols
        .map((c) => {
          let v = r[c] === undefined || r[c] === null ? "" : String(r[c]);
          // escape quotes
          v = v.replace(/"/g, '""');
          if (v.match(/[",\n]/)) {
            v = `"${v}"`;
          }
          return v;
        })
        .join(",");
    })
    .join("\n");

  return header + "\n" + body;
}

// Export ALL tables as sections in one .txt
async function exportAllCSV() {
  const data = await getAllDataForBackup();

  const parts = [];
  parts.push("=== RESIDENTS ===\n" + toCSV(data.residents));
  parts.push("\n\n=== REQUESTS ===\n" + toCSV(data.requests));
  parts.push("\n\n=== COMPLAINTS ===\n" + toCSV(data.complaints));
  parts.push("\n\n=== AUDIT ===\n" + toCSV(data.audit));
  parts.push("\n\n=== EVENTS ===\n" + toCSV(data.events));
  parts.push(
    "\n\n=== EVENT_ATTENDANCE ===\n" + toCSV(data.eventAttendance)
  );

  const fullText = parts.join("\n");
  const filename =
    "barangay-backup-CSV-" +
    new Date().toISOString().slice(0, 10) +
    ".txt";

  downloadFile(filename, fullText, "text/plain");
  await audit("backup:exportCSV", { filename });
}

// Export JSON backup
async function exportAllJSON() {
  const data = await getAllDataForBackup();
  const filename =
    "barangay-backup-" +
    new Date().toISOString().slice(0, 10) +
    ".json";
  downloadFile(filename, JSON.stringify(data, null, 2), "application/json");

  await audit("backup:exportJSON", { filename });
}

// Import backup JSON
async function importBackupJSON(file) {
  if (!requireAdmin()) {
    // stricter: only admin can restore full DB
    return;
  }
  if (
    !confirm(
      "Restoring backup will OVERWRITE current data on this device. Continue?"
    )
  ) {
    return;
  }

  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    alert("Invalid backup file.");
    return;
  }

  // helper to clear a store
  async function clearStore(store) {
    return new Promise((resolve, reject) => {
      const t = db
        .transaction(store, "readwrite")
        .objectStore(store)
        .clear();
      t.onsuccess = () => resolve();
      t.onerror = () => reject(t.error);
    });
  }

  // helper to bulk insert
  async function bulkPut(store, arr) {
    for (const item of arr || []) {
      await put(store, item);
    }
  }

  // only restore stores that exist in this DB
  const storesToRestore = [
    { name: "residents", key: "residents" },
    { name: "requests", key: "requests" },
    { name: "complaints", key: "complaints" },
    { name: "audit", key: "audit" },
    { name: "events", key: "events" },
    { name: "eventAttendance", key: "eventAttendance" },
  ];

  for (const st of storesToRestore) {
    if (db.objectStoreNames.contains(st.name)) {
      await clearStore(st.name);
      await bulkPut(st.name, parsed[st.key] || []);
    }
  }

  await audit("backup:importJSON", {
    countResidents: (parsed.residents || []).length,
  });
  alert("Backup restored successfully.");

  // refresh UI
  renderResidents();
  renderReqs();
  renderComplaints();
  renderAudit();
}

// auto-backup every Friday 5:00 PM local time
async function autoWeeklyBackupTick() {
  // must be logged in as staff/admin to auto-backup
  if (!currentUser) return;

  const now = new Date();
  const isFriday = now.getDay() === 5; // Friday=5 (0=Sunday)
  const hour = now.getHours();
  const minute = now.getMinutes();

  if (isFriday && hour === 17 && minute === 0) {
    const todayKey = now.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const last = localStorage.getItem("lastAutoBackupDate");

    if (last === todayKey) {
      // already did auto-backup today
      return;
    }

    // build data and download
    const data = await getAllDataForBackup();
    const filename = "AUTO-backup-" + todayKey + ".json";
    downloadFile(
      filename,
      JSON.stringify(data, null, 2),
      "application/json"
    );

    localStorage.setItem("lastAutoBackupDate", todayKey);

    const autoStatus = document.getElementById("autoBackupStatus");
    if (autoStatus) {
      autoStatus.textContent = "Auto-backup done " + todayKey;
    }

    await audit("backup:autoJSON", { filename });
  }
}

// Hook up backup buttons
const btnExportCSV = document.getElementById("btnExportCSV");
const btnExportJSON = document.getElementById("btnExportJSON");
const btnImportBackup = document.getElementById("btnImportBackup");
const importFileInput = document.getElementById("importFileInput");

if (btnExportCSV) {
  btnExportCSV.addEventListener("click", async () => {
    if (!requireStaff()) return;
    await exportAllCSV();
  });
}
if (btnExportJSON) {
  btnExportJSON.addEventListener("click", async () => {
    if (!requireStaff()) return;
    await exportAllJSON();
  });
}
if (btnImportBackup) {
  btnImportBackup.addEventListener("click", () => {
    if (!requireAdmin()) return;
    importFileInput.click();
  });
}
if (importFileInput) {
  importFileInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await importBackupJSON(file);
    importFileInput.value = "";
  });
}

// run every 60s to see if it's backup time
setInterval(autoWeeklyBackupTick, 60000);

/************* INIT APP *************/
(async function init() {
  await idbOpen();
  await renderResidents();
  await renderReqs();
  await renderComplaints();
  await renderAudit();

  // after data & DOM are ready, apply saved theme once (so card loads in right skin)
  applyTemplate();

  // show auto-backup status in UI if element exists
  const autoStatus = document.getElementById("autoBackupStatus");
  if (autoStatus) {
    const last = localStorage.getItem("lastAutoBackupDate") || "None yet";
    autoStatus.textContent = "Last auto-backup: " + last;
  }
})();
