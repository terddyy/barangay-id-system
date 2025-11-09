import express from "express";
import db from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, (req, res) => {
  db.all("SELECT * FROM residents ORDER BY id DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

router.post("/", authRequired, (req, res) => {
  const { fullName, birthDate, address, contact, purokOrPosition, emergencyContact, photoUrl, signatureUrl } = req.body;
  
  const idNumber = "ID" + Date.now();
  
  db.run(
    `INSERT INTO residents (fullName, birthDate, address, contact, purokOrPosition, emergencyContact, idNumber, photoUrl, signatureUrl) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [fullName, birthDate, address, contact, purokOrPosition, emergencyContact, idNumber, photoUrl, signatureUrl],
    function(err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ id: this.lastID, idNumber, message: "Resident added successfully" });
    }
  );
});

router.put("/:id/status", authRequired, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  
  db.run(
    "UPDATE residents SET status = ? WHERE id = ?",
    [status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Status updated successfully" });
    }
  );
});

export default router;