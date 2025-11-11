import express from "express";
import db from "../db.js";
import { authRequired, adminOnly, residentAuthRequired, anyAuthRequired } from "../middleware/auth.js";

const router = express.Router();

function logAudit(action, details, user, callback) {
  db.run(
    "INSERT INTO audit_log (action, details, byUser, ts) VALUES (?, ?, ?, ?)",
    [action, JSON.stringify(details), user, new Date().toISOString()],
    callback
  );
}

// Get all events (available to both staff and residents)
router.get("/", anyAuthRequired, (req, res) => {
  const { eventType } = req.query;
  let query = "SELECT * FROM events WHERE 1=1";
  const params = [];

  if (eventType) {
    query += " AND eventType = ?";
    params.push(eventType);
  }

  query += " ORDER BY eventDate DESC, createdAt DESC";

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error fetching events" });
    }
    res.json(rows);
  });
});

// Get single event (available to both staff and residents)
router.get("/:id", anyAuthRequired, (req, res) => {
  db.get("SELECT * FROM events WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (!row) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(row);
  });
});

// Create event
router.post("/", authRequired, (req, res) => {
  const { title, description, eventDate, eventType } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Event title is required" });
  }

  const createdBy = req.user.email || req.user.username;

  db.run(
    "INSERT INTO events (title, description, eventDate, eventType, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    [title, description, eventDate, eventType, createdBy, new Date().toISOString()],
    function (err) {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error creating event" });
      }

      const eventId = this.lastID;

      logAudit("event:create", { id: eventId, title }, createdBy, () => {
        res.status(201).json({
          id: eventId,
          message: "Event created successfully",
        });
      });
    }
  );
});

// Update event
router.put("/:id", authRequired, (req, res) => {
  const { title, description, eventDate, eventType } = req.body;
  const updatedBy = req.user.email || req.user.username;

  db.run(
    "UPDATE events SET title = ?, description = ?, eventDate = ?, eventType = ? WHERE id = ?",
    [title, description, eventDate, eventType, req.params.id],
    function (err) {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error updating event" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Event not found" });
      }

      logAudit("event:update", { id: req.params.id }, updatedBy, () => {
        res.json({ message: "Event updated successfully" });
      });
    }
  );
});

// Delete event
router.delete("/:id", authRequired, adminOnly, (req, res) => {
  const deletedBy = req.user.email || req.user.username;

  db.run("DELETE FROM events WHERE id = ?", [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Database error deleting event" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    logAudit("event:delete", { id: req.params.id }, deletedBy, () => {
      res.json({ message: "Event deleted successfully" });
    });
  });
});

// Get event attendance (available to both staff and residents)
router.get("/:id/attendance", anyAuthRequired, (req, res) => {
  db.all(
    `SELECT ea.*, r.fullName, r.contact 
     FROM event_attendance ea
     LEFT JOIN residents r ON ea.residentId = r.id
     WHERE ea.eventId = ?
     ORDER BY ea.attendedAt DESC`,
    [req.params.id],
    (err, rows) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error fetching attendance" });
      }
      res.json(rows);
    }
  );
});

// Record attendance (both staff and residents can register)
router.post("/:id/attendance", anyAuthRequired, (req, res) => {
  let { residentId, residentIdNumber } = req.body;
  const eventId = req.params.id;

  // If resident is registering themselves, use their data
  if (req.userType === "resident") {
    residentId = req.resident.residentId;
    residentIdNumber = req.resident.idNumber;
  }

  if (!residentId && !residentIdNumber) {
    return res.status(400).json({ error: "Resident ID or ID number is required" });
  }

  // Check if already registered
  db.get(
    "SELECT id FROM event_attendance WHERE eventId = ? AND (residentId = ? OR residentIdNumber = ?)",
    [eventId, residentId, residentIdNumber],
    (err, existing) => {
      if (err) {
        console.error("Database error checking attendance:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (existing) {
        return res.status(409).json({ error: "Already registered for this event" });
      }

      const createdBy = req.userType === "resident" 
        ? req.resident.idNumber 
        : (req.user.email || req.user.username);

      db.run(
        "INSERT INTO event_attendance (eventId, residentId, residentIdNumber, attendedAt) VALUES (?, ?, ?, ?)",
        [eventId, residentId, residentIdNumber, new Date().toISOString()],
        function (err) {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error recording attendance" });
          }

          const attendanceId = this.lastID;

          logAudit("attendance:record", { id: attendanceId, eventId, residentId }, createdBy, () => {
            res.status(201).json({
              id: attendanceId,
              message: "Attendance recorded successfully",
            });
          });
        }
      );
    }
  );
});

export default router;
