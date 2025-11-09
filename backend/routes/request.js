import express from "express";
import db from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, (req, res) => {
  db.all("SELECT * FROM requests ORDER BY id DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

router.post("/", authRequired, (req, res) => {
  const { residentIdNumber, docType, purpose } = req.body;
  
  db.run(
    "INSERT INTO requests (residentIdNumber, docType, purpose) VALUES (?, ?, ?)",
    [residentIdNumber, docType, purpose],
    function(err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ id: this.lastID, message: "Request submitted successfully" });
    }
  );
});

export default router;