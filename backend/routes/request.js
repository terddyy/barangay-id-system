import express from "express";
import db from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

function logAudit(action, details, user, callback) {
  db.run(
    "INSERT INTO audit_log (action, details, byUser, ts) VALUES (?, ?, ?, ?)",
    [action, JSON.stringify(details), user, new Date().toISOString()],
    callback
  );
}

// Get all requests
router.get("/", authRequired, (req, res) => {
  const { status, residentIdNumber } = req.query;
  let query = "SELECT * FROM requests WHERE 1=1";
  const params = [];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  if (residentIdNumber) {
    query += " AND residentIdNumber = ?";
    params.push(residentIdNumber);
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

// Create request
router.post("/", authRequired, (req, res) => {
  const { residentIdNumber, docType, purpose } = req.body;

  // Validation
  if (!residentIdNumber || !docType) {
    return res.status(400).json({ error: "Resident ID number and document type are required" });
  }

  // Verify resident exists
  db.get("SELECT id FROM residents WHERE idNumber = ?", [residentIdNumber], (err, resident) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (!resident) {
      return res.status(404).json({ error: "Resident not found with that ID number" });
    }

    const createdBy = req.user.email || req.user.username;

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
  });
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