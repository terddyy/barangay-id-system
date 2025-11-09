import express from "express";
import db from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, (req, res) => {
  db.all("SELECT * FROM complaints ORDER BY id DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

router.post("/", authRequired, (req, res) => {
  const { residentIdNumber, details } = req.body;
  const ts = new Date().toISOString();
  
  db.run(
    "INSERT INTO complaints (residentIdNumber, details, ts) VALUES (?, ?, ?)",
    [residentIdNumber, details, ts],
    function(err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ id: this.lastID, message: "Complaint submitted successfully" });
    }
  );
});

export default router;