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
      fullName TEXT NOT NULL,
      birthDate TEXT,
      address TEXT,
      contact TEXT,
      purokOrPosition TEXT,
      emergencyContact TEXT,
      household TEXT,
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending','Released')),
      idNumber TEXT UNIQUE NOT NULL,
      photoUrl TEXT,
      signatureUrl TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      releasedAt TEXT,
      createdBy TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      residentIdNumber TEXT NOT NULL,
      docType TEXT NOT NULL,
      purpose TEXT,
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Released')),
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT,
      FOREIGN KEY (residentIdNumber) REFERENCES residents(idNumber)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      residentIdNumber TEXT,
      details TEXT NOT NULL,
      ts TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'Open' CHECK(status IN ('Open','InProgress','Resolved','Closed'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      details TEXT,
      byUser TEXT NOT NULL,
      ts TEXT DEFAULT CURRENT_TIMESTAMP,
      ipAddress TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      eventDate TEXT,
      eventType TEXT CHECK(eventType IN ('program','relief','medical','event','cleanup','assembly')),
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      createdBy TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS event_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventId INTEGER NOT NULL,
      residentId INTEGER,
      residentIdNumber TEXT,
      attendedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (eventId) REFERENCES events(id),
      FOREIGN KEY (residentId) REFERENCES residents(id)
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
