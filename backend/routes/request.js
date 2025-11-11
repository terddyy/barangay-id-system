import express from "express";
import db from "../db.js";
import { authRequired, residentAuthRequired, anyAuthRequired } from "../middleware/auth.js";

const router = express.Router();

function logAudit(action, details, user, callback) {
  db.run(
    "INSERT INTO audit_log (action, details, byUser, ts) VALUES (?, ?, ?, ?)",
    [action, JSON.stringify(details), user, new Date().toISOString()],
    callback
  );
}

// Get all requests (staff see all, residents see only their own)
router.get("/", anyAuthRequired, (req, res) => {
  const { status, residentIdNumber } = req.query;
  let query = "SELECT * FROM requests WHERE 1=1";
  const params = [];

  // If resident is logged in, only show their requests
  if (req.userType === "resident") {
    query += " AND residentIdNumber = ?";
    params.push(req.resident.idNumber);
  } else if (residentIdNumber) {
    // Staff can filter by residentIdNumber
    query += " AND residentIdNumber = ?";
    params.push(residentIdNumber);
  }

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  query += " ORDER BY createdAt DESC";

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error fetching requests" });
    }
    res.json(rows);
  });
});

// Create request (both staff and residents can create)
router.post("/", anyAuthRequired, (req, res) => {
  let { residentIdNumber, docType, purpose } = req.body;

  // If resident is creating their own request, use their ID number
  if (req.userType === "resident") {
    residentIdNumber = req.resident.idNumber;
  }

  // Validation
  if (!residentIdNumber || !docType) {
    return res.status(400).json({ error: "Resident ID number and document type are required" });
  }

  // Verify resident exists and their ID is released
  db.get(
    "SELECT id, status FROM residents WHERE idNumber = ?", 
    [residentIdNumber], 
    (err, resident) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!resident) {
        return res.status(404).json({ error: "Resident not found with that ID number" });
      }

      // Only residents with released IDs can request documents
      if (resident.status !== "Released" && req.userType === "resident") {
        return res.status(403).json({ 
          error: "Your ID must be released before you can request documents" 
        });
      }

      const createdBy = req.userType === "resident" 
        ? req.resident.idNumber 
        : (req.user.email || req.user.username);

      db.run(
        "INSERT INTO requests (residentIdNumber, docType, purpose, createdAt) VALUES (?, ?, ?, ?)",
        [residentIdNumber, docType, purpose, new Date().toISOString()],
        function (err) {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error creating request" });
          }

          const requestId = this.lastID;

          logAudit("request:create", { id: requestId, residentIdNumber, docType }, createdBy, () => {
            res.status(201).json({
              id: requestId,
              message: "Request submitted successfully",
            });
          });
        }
      );
    }
  );
});

// Update request status
router.put("/:id/status", authRequired, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!["Pending", "Approved", "Released"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const updatedBy = req.user.email || req.user.username;

  db.run(
    "UPDATE requests SET status = ?, updatedAt = ? WHERE id = ?",
    [status, new Date().toISOString(), id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Database error updating status" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Request not found" });
      }

      logAudit("request:status", { id, status }, updatedBy, () => {
        res.json({ message: "Request status updated successfully" });
      });
    }
  );
});

export default router;