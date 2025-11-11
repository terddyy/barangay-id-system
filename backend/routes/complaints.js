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

// Get all complaints (staff see all, residents see only their own)
router.get("/", anyAuthRequired, (req, res) => {
  const { status } = req.query;
  let query = "SELECT * FROM complaints WHERE 1=1";
  const params = [];

  // If resident is logged in, only show their complaints
  if (req.userType === "resident") {
    query += " AND residentIdNumber = ?";
    params.push(req.resident.idNumber);
  }

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  query += " ORDER BY ts DESC";

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error fetching complaints" });
    }
    res.json(rows);
  });
});

// Create complaint (both staff and residents can create)
router.post("/", anyAuthRequired, (req, res) => {
  let { residentIdNumber, details } = req.body;

  // If resident is creating their own complaint, use their ID number
  if (req.userType === "resident") {
    residentIdNumber = req.resident.idNumber;
  }

  if (!details) {
    return res.status(400).json({ error: "Complaint details are required" });
  }

  const createdBy = req.userType === "resident" 
    ? req.resident.idNumber 
    : (req.user.email || req.user.username);

  db.run(
    "INSERT INTO complaints (residentIdNumber, details, ts) VALUES (?, ?, ?)",
    [residentIdNumber, details, new Date().toISOString()],
    function (err) {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error creating complaint" });
      }

      const complaintId = this.lastID;

      logAudit("complaint:create", { id: complaintId, residentIdNumber }, createdBy, () => {
        res.status(201).json({
          id: complaintId,
          message: "Complaint submitted successfully",
        });
      });
    }
  );
});

// Update complaint status
router.put("/:id/status", authRequired, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!["Open", "InProgress", "Resolved", "Closed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const updatedBy = req.user.email || req.user.username;

  db.run("UPDATE complaints SET status = ? WHERE id = ?", [status, id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Database error updating status" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    logAudit("complaint:status", { id, status }, updatedBy, () => {
      res.json({ message: "Complaint status updated successfully" });
    });
  });
});

export default router;