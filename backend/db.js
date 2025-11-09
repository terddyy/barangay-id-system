import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";

const db = new sqlite3.Database("./digitalid.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      username TEXT UNIQUE,
      password_hash TEXT,
      role TEXT CHECK(role IN ('admin','staff')) NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS residents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT,
      birthDate TEXT,
      address TEXT,
      contact TEXT,
      purokOrPosition TEXT,
      emergencyContact TEXT,
      status TEXT DEFAULT 'Pending',
      idNumber TEXT UNIQUE,
      photoUrl TEXT,
      signatureUrl TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      residentIdNumber TEXT,
      docType TEXT,
      purpose TEXT,
      status TEXT DEFAULT 'Pending'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      residentIdNumber TEXT,
      details TEXT,
      ts TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT,
      details TEXT,
      byUser TEXT,
      ts TEXT
    )
  `);

  // Seed default users if empty
  db.get(`SELECT COUNT(*) as cnt FROM users`, async (err, row) => {
    if (err) {
      console.error("DB check users failed:", err);
      return;
    }
    if (row.cnt === 0) {
      console.log("Seeding default users...");
      const adminPass = await bcrypt.hash("admin123", 10);
      const staffPass = await bcrypt.hash("staff123", 10);

      db.run(
        `INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)`,
        ["admin@example", "admin", adminPass, "admin"]
      );
      db.run(
        `INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)`,
        ["staff@example", "staff", staffPass, "staff"]
      );
    }
  });
});

export default db;
