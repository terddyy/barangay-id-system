import express from "express";
import db from "../db.js";
import { authRequired, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// Helper function to log audit
function logAudit(action, details, user, callback) {
  db.run(
    "INSERT INTO audit_log (action, details, byUser, ts) VALUES (?, ?, ?, ?)",
    [action, JSON.stringify(details), user, new Date().toISOString()],
    callback
  );
}

// Generate unique ID number
router.post("/generate-id", authRequired, (req, res) => {
  const { purokOrPosition } = req.body;
  const year = new Date().getFullYear();
  const prefix = (purokOrPosition || "BHSPK").replace(/\s+/g, "").toUpperCase().substring(0, 10);
  const idPrefix = `${prefix}-${year}-`;

  db.all(
    "SELECT idNumber FROM residents WHERE idNumber LIKE ? ORDER BY idNumber DESC LIMIT 1",
    [`${idPrefix}%`],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Database error generating ID" });
      }

      let nextSeq = 1;
      if (rows.length > 0) {
        const lastId = rows[0].idNumber;
        const match = lastId.match(/-(\d+)$/);
        if (match) {
          nextSeq = parseInt(match[1], 10) + 1;
        }
      }

      const idNumber = `${idPrefix}${String(nextSeq).padStart(3, "0")}`;
      res.json({ idNumber });
    }
  );
});

// Get all residents
router.get("/", authRequired, (req, res) => {
  const { search, status } = req.query;
  let query = "SELECT * FROM residents WHERE 1=1";
  const params = [];

  if (search) {
    query += " AND (fullName LIKE ? OR idNumber LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  query += " ORDER BY createdAt DESC";

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error fetching residents" });
    }
    res.json(rows);
  });
});

// Get single resident
router.get("/:id", authRequired, (req, res) => {
  db.get("SELECT * FROM residents WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (!row) {
      return res.status(404).json({ error: "Resident not found" });
    }
    res.json(row);
  });
});

// Create resident
router.post("/", authRequired, (req, res) => {
  const {
    fullName,
    birthDate,
    address,
    contact,
    purokOrPosition,
    emergencyContact,
    household,
    idNumber,
    photoUrl,
    signatureUrl,
  } = req.body;

  // Validation
  if (!fullName || !idNumber) {
    return res.status(400).json({ error: "Full name and ID number are required" });
  }

  const createdBy = req.user.email || req.user.username;

  db.run(
    `INSERT INTO residents 
     (fullName, birthDate, address, contact, purokOrPosition, emergencyContact, household, idNumber, photoUrl, signatureUrl, createdBy, createdAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      fullName,
      birthDate,
      address,
      contact,
      purokOrPosition,
      emergencyContact,
      household,
      idNumber,
      photoUrl,
      signatureUrl,
      createdBy,
      new Date().toISOString(),
    ],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(409).json({ error: "ID number already exists" });
        }
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error creating resident" });
      }

      const residentId = this.lastID;

      logAudit("resident:create", { id: residentId, idNumber, fullName }, createdBy, () => {
        res.status(201).json({
          id: residentId,
          idNumber,
          message: "Resident created successfully",
        });
      });
    }
  );
});

// Update resident
router.put("/:id", authRequired, (req, res) => {
  const {
    fullName,
    birthDate,
    address,
    contact,
    purokOrPosition,
    emergencyContact,
    household,
    photoUrl,
    signatureUrl,
  } = req.body;

  const updatedBy = req.user.email || req.user.username;

  db.run(
    `UPDATE residents 
     SET fullName = ?, birthDate = ?, address = ?, contact = ?, purokOrPosition = ?, 
         emergencyContact = ?, household = ?, photoUrl = ?, signatureUrl = ?
     WHERE id = ?`,
    [
      fullName,
      birthDate,
      address,
      contact,
      purokOrPosition,
      emergencyContact,
      household,
      photoUrl,
      signatureUrl,
      req.params.id,
    ],
    function (err) {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error updating resident" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Resident not found" });
      }

      logAudit("resident:update", { id: req.params.id }, updatedBy, () => {
        res.json({ message: "Resident updated successfully" });
      });
    }
  );
});

// Update status
router.put("/:id/status", authRequired, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!["Pending", "Released"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const updatedBy = req.user.email || req.user.username;
  const releasedAt = status === "Released" ? new Date().toISOString() : null;

  db.run(
    "UPDATE residents SET status = ?, releasedAt = ? WHERE id = ?",
    [status, releasedAt, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Database error updating status" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Resident not found" });
      }

      logAudit("resident:status", { id, status }, updatedBy, () => {
        res.json({ message: "Status updated successfully" });
      });
    }
  );
});

// Delete resident (admin only)
router.delete("/:id", authRequired, adminOnly, (req, res) => {
  const { id } = req.params;
  const deletedBy = req.user.email || req.user.username;

  // First get resident info for audit
  db.get("SELECT idNumber, fullName FROM residents WHERE id = ?", [id], (err, resident) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (!resident) {
      return res.status(404).json({ error: "Resident not found" });
    }

    db.run("DELETE FROM residents WHERE id = ?", [id], function (err) {
      if (err) {
        return res.status(500).json({ error: "Database error deleting resident" });
      }

      logAudit(
        "resident:delete",
        { id, idNumber: resident.idNumber, fullName: resident.fullName },
        deletedBy,
        () => {
          res.json({ message: "Resident deleted successfully" });
        }
      );
    });
  });
});

export default router;