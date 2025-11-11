/**
 * Resident Authentication Routes
 * 
 * Provides authentication and profile management for barangay residents.
 * Residents can register, login, and manage their profiles using their ID number.
 * 
 * @module routes/resident-auth
 * @requires express
 * @requires bcryptjs
 * @requires jsonwebtoken
 */

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { SECRET } from "../middleware/auth.js";
import { residentAuthRequired } from "../middleware/auth.js";

const router = express.Router();
const JWT_SECRET = SECRET;

/**
 * Helper function to log audit trail
 * @param {string} action - The action being performed
 * @param {object} details - Additional details about the action
 * @param {string} user - User performing the action
 * @param {function} callback - Callback function after logging
 */
function logAudit(action, details, user, callback) {
  db.run(
    "INSERT INTO audit_log (action, details, byUser, ts) VALUES (?, ?, ?, ?)",
    [action, JSON.stringify(details), user, new Date().toISOString()],
    callback || (() => {})
  );
}

/**
 * POST /api/resident-auth/register
 * Register a new resident account
 * 
 * @body {string} idNumber - Resident's ID number (must exist in residents table)
 * @body {string} password - Password for the account (min 8 characters)
 * @body {string} email - Optional email address
 * @body {string} mobileNumber - Optional mobile number
 * @returns {object} Success message and resident info
 */
router.post("/register", async (req, res) => {
  const { idNumber, password, email, mobileNumber } = req.body;

  // Input validation
  if (!idNumber || !password) {
    return res.status(400).json({ 
      error: "ID number and password are required" 
    });
  }

  if (password.length < 8) {
    return res.status(400).json({ 
      error: "Password must be at least 8 characters long" 
    });
  }

  try {
    // Check if resident exists in the residents table
    db.get(
      "SELECT id, idNumber, fullName, status FROM residents WHERE idNumber = ?",
      [idNumber],
      async (err, resident) => {
        if (err) {
          console.error("Database error checking resident:", err);
          return res.status(500).json({ error: "Database error" });
        }

        if (!resident) {
          return res.status(404).json({ 
            error: "ID number not found. Please contact barangay office to register as a resident first." 
          });
        }

        // Check if account already exists
        db.get(
          "SELECT id FROM resident_auth WHERE idNumber = ?",
          [idNumber],
          async (err, existing) => {
            if (err) {
              console.error("Database error checking existing auth:", err);
              return res.status(500).json({ error: "Database error" });
            }

            if (existing) {
              return res.status(409).json({ 
                error: "Account already exists for this ID number. Please login instead." 
              });
            }

            // Check email uniqueness if provided
            if (email) {
              const emailCheck = await new Promise((resolve, reject) => {
                db.get("SELECT id FROM resident_auth WHERE email = ?", [email], (err, row) => {
                  if (err) reject(err);
                  else resolve(row);
                });
              });

              if (emailCheck) {
                return res.status(409).json({ 
                  error: "Email already registered" 
                });
              }
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create resident auth record
            db.run(
              `INSERT INTO resident_auth 
               (residentId, idNumber, password_hash, email, mobileNumber, createdAt) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [resident.id, idNumber, passwordHash, email, mobileNumber, new Date().toISOString()],
              function (err) {
                if (err) {
                  console.error("Database error creating resident auth:", err);
                  return res.status(500).json({ error: "Database error creating account" });
                }

                // Log the registration
                logAudit(
                  "resident:register",
                  { residentId: resident.id, idNumber },
                  idNumber,
                  () => {
                    res.status(201).json({
                      message: "Account created successfully",
                      resident: {
                        id: resident.id,
                        idNumber: resident.idNumber,
                        fullName: resident.fullName
                      }
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error("Error in resident registration:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

/**
 * POST /api/resident-auth/login
 * Login as a resident
 * 
 * @body {string} idNumber - Resident's ID number or email
 * @body {string} password - Account password
 * @returns {object} JWT token and resident info
 */
router.post("/login", async (req, res) => {
  const { idNumber, password } = req.body;

  if (!idNumber || !password) {
    return res.status(400).json({ 
      error: "ID number and password are required" 
    });
  }

  try {
    // Check both idNumber and email fields
    db.get(
      `SELECT ra.*, r.fullName, r.address, r.contact, r.status, r.photoUrl 
       FROM resident_auth ra
       INNER JOIN residents r ON ra.residentId = r.id
       WHERE ra.idNumber = ? OR ra.email = ?`,
      [idNumber, idNumber],
      async (err, residentAuth) => {
        if (err) {
          console.error("Database error during login:", err);
          return res.status(500).json({ error: "Database error" });
        }

        if (!residentAuth) {
          return res.status(401).json({ 
            error: "Invalid credentials" 
          });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, residentAuth.password_hash);
        if (!validPassword) {
          return res.status(401).json({ 
            error: "Invalid credentials" 
          });
        }

        // Check if resident ID is released
        if (residentAuth.status !== "Released") {
          return res.status(403).json({ 
            error: "Your ID is not yet released. Please contact the barangay office.",
            status: residentAuth.status
          });
        }

        // Update last login
        db.run(
          "UPDATE resident_auth SET lastLogin = ? WHERE id = ?",
          [new Date().toISOString(), residentAuth.id],
          (err) => {
            if (err) console.error("Error updating last login:", err);
          }
        );

        // Generate JWT token
        const token = jwt.sign(
          { 
            id: residentAuth.id,
            residentId: residentAuth.residentId,
            idNumber: residentAuth.idNumber,
            role: "resident" 
          },
          JWT_SECRET,
          { expiresIn: "7d" } // 7 days for residents
        );

        // Log successful login
        logAudit(
          "resident:login",
          { residentId: residentAuth.residentId, idNumber: residentAuth.idNumber },
          residentAuth.idNumber
        );

        res.json({
          token,
          resident: {
            id: residentAuth.residentId,
            idNumber: residentAuth.idNumber,
            fullName: residentAuth.fullName,
            email: residentAuth.email,
            mobileNumber: residentAuth.mobileNumber,
            address: residentAuth.address,
            contact: residentAuth.contact,
            photoUrl: residentAuth.photoUrl,
            status: residentAuth.status
          }
        });
      }
    );
  } catch (error) {
    console.error("Error in resident login:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

/**
 * GET /api/resident-auth/profile
 * Get current resident's profile
 * 
 * @header {string} Authorization - Bearer token
 * @returns {object} Resident profile information
 */
router.get("/profile", residentAuthRequired, (req, res) => {
  db.get(
    `SELECT r.*, ra.email, ra.mobileNumber, ra.lastLogin, ra.createdAt as accountCreatedAt
     FROM residents r
     INNER JOIN resident_auth ra ON r.id = ra.residentId
     WHERE r.id = ?`,
    [req.resident.residentId],
    (err, resident) => {
      if (err) {
        console.error("Database error fetching profile:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (!resident) {
        return res.status(404).json({ error: "Resident profile not found" });
      }

      res.json({
        id: resident.id,
        idNumber: resident.idNumber,
        fullName: resident.fullName,
        birthDate: resident.birthDate,
        address: resident.address,
        contact: resident.contact,
        purokOrPosition: resident.purokOrPosition,
        emergencyContact: resident.emergencyContact,
        household: resident.household,
        status: resident.status,
        photoUrl: resident.photoUrl,
        signatureUrl: resident.signatureUrl,
        email: resident.email,
        mobileNumber: resident.mobileNumber,
        createdAt: resident.createdAt,
        accountCreatedAt: resident.accountCreatedAt,
        lastLogin: resident.lastLogin
      });
    }
  );
});

/**
 * PUT /api/resident-auth/profile
 * Update resident's profile (limited fields)
 * 
 * @header {string} Authorization - Bearer token
 * @body {string} email - Email address
 * @body {string} mobileNumber - Mobile number
 * @body {string} contact - Contact number
 * @returns {object} Success message
 */
router.put("/profile", residentAuthRequired, (req, res) => {
  const { email, mobileNumber, contact } = req.body;

  // Validate email format if provided
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Update resident_auth table (email, mobileNumber)
  db.run(
    "UPDATE resident_auth SET email = ?, mobileNumber = ? WHERE residentId = ?",
    [email, mobileNumber, req.resident.residentId],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(409).json({ error: "Email already in use" });
        }
        console.error("Database error updating auth profile:", err);
        return res.status(500).json({ error: "Database error" });
      }

      // Update residents table (contact)
      if (contact) {
        db.run(
          "UPDATE residents SET contact = ? WHERE id = ?",
          [contact, req.resident.residentId],
          function (err) {
            if (err) {
              console.error("Database error updating resident contact:", err);
              return res.status(500).json({ error: "Database error" });
            }

            logAudit(
              "resident:profile-update",
              { residentId: req.resident.residentId },
              req.resident.idNumber,
              () => {
                res.json({ message: "Profile updated successfully" });
              }
            );
          }
        );
      } else {
        logAudit(
          "resident:profile-update",
          { residentId: req.resident.residentId },
          req.resident.idNumber,
          () => {
            res.json({ message: "Profile updated successfully" });
          }
        );
      }
    }
  );
});

/**
 * PUT /api/resident-auth/change-password
 * Change resident's password
 * 
 * @header {string} Authorization - Bearer token
 * @body {string} currentPassword - Current password
 * @body {string} newPassword - New password (min 8 characters)
 * @returns {object} Success message
 */
router.put("/change-password", residentAuthRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ 
      error: "Current password and new password are required" 
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ 
      error: "New password must be at least 8 characters long" 
    });
  }

  try {
    // Get current password hash
    db.get(
      "SELECT password_hash FROM resident_auth WHERE residentId = ?",
      [req.resident.residentId],
      async (err, auth) => {
        if (err) {
          console.error("Database error fetching auth:", err);
          return res.status(500).json({ error: "Database error" });
        }

        if (!auth) {
          return res.status(404).json({ error: "Account not found" });
        }

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, auth.password_hash);
        if (!validPassword) {
          return res.status(401).json({ error: "Current password is incorrect" });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        db.run(
          "UPDATE resident_auth SET password_hash = ? WHERE residentId = ?",
          [newPasswordHash, req.resident.residentId],
          function (err) {
            if (err) {
              console.error("Database error updating password:", err);
              return res.status(500).json({ error: "Database error" });
            }

            logAudit(
              "resident:change-password",
              { residentId: req.resident.residentId },
              req.resident.idNumber,
              () => {
                res.json({ message: "Password changed successfully" });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Server error changing password" });
  }
});

/**
 * GET /api/resident-auth/verify
 * Verify if the resident token is valid
 * 
 * @header {string} Authorization - Bearer token
 * @returns {object} Verification status
 */
router.get("/verify", residentAuthRequired, (req, res) => {
  res.json({
    valid: true,
    resident: {
      id: req.resident.residentId,
      idNumber: req.resident.idNumber,
      role: req.resident.role
    }
  });
});

export default router;
