import express from "express";
import db from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/residents", authRequired, (req, res) => {
  db.all(
    `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
       SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending
     FROM residents`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(rows[0]);
    }
  );
});

router.get("/requests", authRequired, (req, res) => {
  db.all(
    `SELECT docType, COUNT(*) as count FROM requests GROUP BY docType`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(rows);
    }
  );
});

export default router;