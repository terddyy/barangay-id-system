import express from "express";
import db from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, (req, res) => {
  db.all("SELECT * FROM audit_log ORDER BY id DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

router.post("/", authRequired, (req, res) => {
  const { action, details } = req.body;
  const byUser = req.user.email;
  const ts = new Date().toISOString();
  
  db.run(
    "INSERT INTO audit_log (action, details, byUser, ts) VALUES (?, ?, ?, ?)",
    [action, details, byUser, ts],
    function(err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ id: this.lastID, message: "Audit log entry created" });
    }
  );
});

export default router;