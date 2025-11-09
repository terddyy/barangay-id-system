import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { SECRET } from "../middleware/auth.js";

const router = express.Router();
const JWT_SECRET = SECRET;

router.post("/login", (req, res) => {
  const { usernameOrEmail, password } = req.body;
  
  db.get(
    `SELECT * FROM users WHERE email = ? OR username = ?`,
    [usernameOrEmail, usernameOrEmail],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        }
      });
    }
  );
});

export default router;