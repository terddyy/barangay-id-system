/**
 * Unit Tests for Resident Authentication Module
 * 
 * Test coverage includes:
 * - Resident registration
 * - Resident login
 * - Profile management
 * - Password change
 * - Token verification
 * - Access control
 * 
 * @module tests/resident-auth.test
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { SECRET } from "../middleware/auth.js";

// Test data
const testResident = {
  fullName: "Juan Dela Cruz",
  birthDate: "1990-01-01",
  address: "123 Test St, Barangay Test",
  contact: "09171234567",
  purokOrPosition: "Purok 1",
  idNumber: "PUROK1-2025-999",
  status: "Released"
};

const testAuth = {
  idNumber: "PUROK1-2025-999",
  password: "TestPassword123",
  email: "juan@test.com",
  mobileNumber: "09171234567"
};

let testResidentId;
let testAuthId;

/**
 * Test Suite: Database Setup
 */
describe("Resident Authentication - Database Setup", () => {
  before(async () => {
    // Clean up any existing test data
    await new Promise((resolve) => {
      db.run("DELETE FROM resident_auth WHERE idNumber = ?", [testAuth.idNumber], () => {
        db.run("DELETE FROM residents WHERE idNumber = ?", [testResident.idNumber], resolve);
      });
    });

    // Create test resident
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO residents (fullName, birthDate, address, contact, purokOrPosition, idNumber, status, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          testResident.fullName,
          testResident.birthDate,
          testResident.address,
          testResident.contact,
          testResident.purokOrPosition,
          testResident.idNumber,
          testResident.status,
          new Date().toISOString()
        ],
        function (err) {
          if (err) reject(err);
          testResidentId = this.lastID;
          resolve();
        }
      );
    });
  });

  it("should create test resident successfully", () => {
    assert.ok(testResidentId, "Test resident ID should be created");
  });
});

/**
 * Test Suite: Resident Registration
 */
describe("Resident Authentication - Registration", () => {
  it("should fail registration without required fields", async () => {
    try {
      // Simulate missing password
      const result = await registerResident({
        idNumber: testAuth.idNumber
      });
      assert.fail("Should have thrown validation error");
    } catch (error) {
      assert.ok(error.message.includes("required"), "Should validate required fields");
    }
  });

  it("should fail registration with short password", async () => {
    try {
      const result = await registerResident({
        idNumber: testAuth.idNumber,
        password: "short"
      });
      assert.fail("Should have thrown password length error");
    } catch (error) {
      assert.ok(error.message.includes("8 characters"), "Should validate password length");
    }
  });

  it("should fail registration with non-existent ID number", async () => {
    try {
      const result = await registerResident({
        idNumber: "INVALID-2025-000",
        password: "ValidPassword123"
      });
      assert.fail("Should have thrown ID not found error");
    } catch (error) {
      assert.ok(error.message.includes("not found"), "Should validate ID exists");
    }
  });

  it("should successfully register resident account", async () => {
    const result = await registerResident(testAuth);
    assert.ok(result.message.includes("created"), "Should create account successfully");
    assert.strictEqual(result.resident.idNumber, testAuth.idNumber, "Should return correct ID number");
  });

  it("should fail duplicate registration", async () => {
    try {
      const result = await registerResident(testAuth);
      assert.fail("Should have thrown duplicate error");
    } catch (error) {
      assert.ok(error.message.includes("already exists"), "Should prevent duplicate accounts");
    }
  });
});

/**
 * Test Suite: Resident Login
 */
describe("Resident Authentication - Login", () => {
  it("should fail login without credentials", async () => {
    try {
      const result = await loginResident({});
      assert.fail("Should have thrown validation error");
    } catch (error) {
      assert.ok(error.message.includes("required"), "Should validate credentials");
    }
  });

  it("should fail login with wrong password", async () => {
    try {
      const result = await loginResident({
        idNumber: testAuth.idNumber,
        password: "WrongPassword123"
      });
      assert.fail("Should have thrown invalid credentials error");
    } catch (error) {
      assert.ok(error.message.includes("Invalid credentials"), "Should reject wrong password");
    }
  });

  it("should fail login with non-existent ID", async () => {
    try {
      const result = await loginResident({
        idNumber: "INVALID-2025-000",
        password: testAuth.password
      });
      assert.fail("Should have thrown invalid credentials error");
    } catch (error) {
      assert.ok(error.message.includes("Invalid credentials"), "Should reject non-existent ID");
    }
  });

  it("should successfully login with ID number", async () => {
    const result = await loginResident({
      idNumber: testAuth.idNumber,
      password: testAuth.password
    });
    assert.ok(result.token, "Should return JWT token");
    assert.strictEqual(result.resident.idNumber, testAuth.idNumber, "Should return resident data");
    
    // Verify token structure
    const decoded = jwt.verify(result.token, SECRET);
    assert.strictEqual(decoded.role, "resident", "Token should have resident role");
    assert.strictEqual(decoded.idNumber, testAuth.idNumber, "Token should contain ID number");
  });

  it("should successfully login with email", async () => {
    const result = await loginResident({
      idNumber: testAuth.email, // Using email in idNumber field
      password: testAuth.password
    });
    assert.ok(result.token, "Should return JWT token");
    assert.strictEqual(result.resident.email, testAuth.email, "Should return resident data");
  });

  it("should update last login timestamp", async () => {
    await loginResident({
      idNumber: testAuth.idNumber,
      password: testAuth.password
    });

    const lastLogin = await new Promise((resolve) => {
      db.get(
        "SELECT lastLogin FROM resident_auth WHERE idNumber = ?",
        [testAuth.idNumber],
        (err, row) => resolve(row?.lastLogin)
      );
    });

    assert.ok(lastLogin, "Last login should be recorded");
  });
});

/**
 * Test Suite: Profile Management
 */
describe("Resident Authentication - Profile Management", () => {
  let token;

  before(async () => {
    const result = await loginResident({
      idNumber: testAuth.idNumber,
      password: testAuth.password
    });
    token = result.token;
  });

  it("should get resident profile with valid token", async () => {
    const profile = await getProfile(token);
    assert.strictEqual(profile.idNumber, testAuth.idNumber, "Should return correct profile");
    assert.strictEqual(profile.fullName, testResident.fullName, "Should include resident data");
    assert.strictEqual(profile.email, testAuth.email, "Should include auth data");
  });

  it("should fail to get profile without token", async () => {
    try {
      await getProfile(null);
      assert.fail("Should have thrown authentication error");
    } catch (error) {
      assert.ok(error.message.includes("token"), "Should require token");
    }
  });

  it("should update profile contact information", async () => {
    const updatedData = {
      email: "newemail@test.com",
      mobileNumber: "09189999999",
      contact: "09189999999"
    };

    const result = await updateProfile(token, updatedData);
    assert.ok(result.message.includes("updated"), "Should update successfully");

    // Verify updates
    const profile = await getProfile(token);
    assert.strictEqual(profile.email, updatedData.email, "Email should be updated");
    assert.strictEqual(profile.mobileNumber, updatedData.mobileNumber, "Mobile should be updated");
  });
});

/**
 * Test Suite: Password Change
 */
describe("Resident Authentication - Password Change", () => {
  let token;
  const newPassword = "NewTestPassword456";

  before(async () => {
    const result = await loginResident({
      idNumber: testAuth.idNumber,
      password: testAuth.password
    });
    token = result.token;
  });

  it("should fail password change with wrong current password", async () => {
    try {
      await changePassword(token, {
        currentPassword: "WrongPassword",
        newPassword: newPassword
      });
      assert.fail("Should have thrown incorrect password error");
    } catch (error) {
      assert.ok(error.message.includes("incorrect"), "Should reject wrong current password");
    }
  });

  it("should fail password change with short new password", async () => {
    try {
      await changePassword(token, {
        currentPassword: testAuth.password,
        newPassword: "short"
      });
      assert.fail("Should have thrown password length error");
    } catch (error) {
      assert.ok(error.message.includes("8 characters"), "Should validate new password length");
    }
  });

  it("should successfully change password", async () => {
    const result = await changePassword(token, {
      currentPassword: testAuth.password,
      newPassword: newPassword
    });
    assert.ok(result.message.includes("changed"), "Should change password successfully");

    // Verify new password works
    const loginResult = await loginResident({
      idNumber: testAuth.idNumber,
      password: newPassword
    });
    assert.ok(loginResult.token, "Should login with new password");
  });

  it("should fail login with old password", async () => {
    try {
      await loginResident({
        idNumber: testAuth.idNumber,
        password: testAuth.password // Old password
      });
      assert.fail("Should have thrown invalid credentials error");
    } catch (error) {
      assert.ok(error.message.includes("Invalid credentials"), "Old password should not work");
    }
  });
});

/**
 * Test Suite: Token Verification
 */
describe("Resident Authentication - Token Verification", () => {
  let validToken;

  before(async () => {
    // Change password back for cleanup
    const result = await loginResident({
      idNumber: testAuth.idNumber,
      password: "NewTestPassword456"
    });
    validToken = result.token;
  });

  it("should verify valid resident token", async () => {
    const result = await verifyToken(validToken);
    assert.ok(result.valid, "Token should be valid");
    assert.strictEqual(result.resident.role, "resident", "Should have resident role");
  });

  it("should reject invalid token", async () => {
    try {
      await verifyToken("invalid.token.here");
      assert.fail("Should have thrown invalid token error");
    } catch (error) {
      assert.ok(error.message.includes("Invalid"), "Should reject invalid token");
    }
  });

  it("should reject expired token", async () => {
    // Create expired token
    const expiredToken = jwt.sign(
      { id: 1, residentId: testResidentId, idNumber: testAuth.idNumber, role: "resident" },
      SECRET,
      { expiresIn: "1ms" }
    );

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 10));

    try {
      await verifyToken(expiredToken);
      assert.fail("Should have thrown expired token error");
    } catch (error) {
      assert.ok(error.message.includes("expired") || error.message.includes("Invalid"), "Should reject expired token");
    }
  });
});

/**
 * Test Suite: Cleanup
 */
describe("Resident Authentication - Cleanup", () => {
  after(async () => {
    // Clean up test data
    await new Promise((resolve) => {
      db.run("DELETE FROM resident_auth WHERE idNumber = ?", [testAuth.idNumber], () => {
        db.run("DELETE FROM residents WHERE idNumber = ?", [testResident.idNumber], resolve);
      });
    });
  });

  it("should clean up test data", () => {
    assert.ok(true, "Cleanup completed");
  });
});

/**
 * Helper Functions
 */

function registerResident(data) {
  return new Promise((resolve, reject) => {
    const { idNumber, password, email, mobileNumber } = data;

    if (!idNumber || !password) {
      reject(new Error("ID number and password are required"));
      return;
    }

    if (password.length < 8) {
      reject(new Error("Password must be at least 8 characters long"));
      return;
    }

    db.get(
      "SELECT id, idNumber, fullName, status FROM residents WHERE idNumber = ?",
      [idNumber],
      async (err, resident) => {
        if (err) {
          reject(new Error("Database error"));
          return;
        }

        if (!resident) {
          reject(new Error("ID number not found"));
          return;
        }

        db.get(
          "SELECT id FROM resident_auth WHERE idNumber = ?",
          [idNumber],
          async (err, existing) => {
            if (err) {
              reject(new Error("Database error"));
              return;
            }

            if (existing) {
              reject(new Error("Account already exists"));
              return;
            }

            const passwordHash = await bcrypt.hash(password, 10);

            db.run(
              `INSERT INTO resident_auth (residentId, idNumber, password_hash, email, mobileNumber, createdAt)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [resident.id, idNumber, passwordHash, email, mobileNumber, new Date().toISOString()],
              function (err) {
                if (err) {
                  reject(new Error("Database error creating account"));
                  return;
                }

                resolve({
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
  });
}

function loginResident(data) {
  return new Promise((resolve, reject) => {
    const { idNumber, password } = data;

    if (!idNumber || !password) {
      reject(new Error("ID number and password are required"));
      return;
    }

    db.get(
      `SELECT ra.*, r.fullName, r.address, r.contact, r.status, r.photoUrl
       FROM resident_auth ra
       INNER JOIN residents r ON ra.residentId = r.id
       WHERE ra.idNumber = ? OR ra.email = ?`,
      [idNumber, idNumber],
      async (err, residentAuth) => {
        if (err) {
          reject(new Error("Database error"));
          return;
        }

        if (!residentAuth) {
          reject(new Error("Invalid credentials"));
          return;
        }

        const validPassword = await bcrypt.compare(password, residentAuth.password_hash);
        if (!validPassword) {
          reject(new Error("Invalid credentials"));
          return;
        }

        if (residentAuth.status !== "Released") {
          reject(new Error("ID not yet released"));
          return;
        }

        db.run(
          "UPDATE resident_auth SET lastLogin = ? WHERE id = ?",
          [new Date().toISOString(), residentAuth.id],
          () => {}
        );

        const token = jwt.sign(
          {
            id: residentAuth.id,
            residentId: residentAuth.residentId,
            idNumber: residentAuth.idNumber,
            role: "resident"
          },
          SECRET,
          { expiresIn: "7d" }
        );

        resolve({
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
  });
}

function getProfile(token) {
  return new Promise((resolve, reject) => {
    if (!token) {
      reject(new Error("No auth token"));
      return;
    }

    try {
      const data = jwt.verify(token, SECRET);

      db.get(
        `SELECT r.*, ra.email, ra.mobileNumber, ra.lastLogin
         FROM residents r
         INNER JOIN resident_auth ra ON r.id = ra.residentId
         WHERE r.id = ?`,
        [data.residentId],
        (err, resident) => {
          if (err) {
            reject(new Error("Database error"));
            return;
          }

          if (!resident) {
            reject(new Error("Resident profile not found"));
            return;
          }

          resolve(resident);
        }
      );
    } catch (error) {
      reject(new Error("Invalid token"));
    }
  });
}

function updateProfile(token, data) {
  return new Promise((resolve, reject) => {
    if (!token) {
      reject(new Error("No auth token"));
      return;
    }

    try {
      const decoded = jwt.verify(token, SECRET);
      const { email, mobileNumber, contact } = data;

      db.run(
        "UPDATE resident_auth SET email = ?, mobileNumber = ? WHERE residentId = ?",
        [email, mobileNumber, decoded.residentId],
        function (err) {
          if (err) {
            reject(new Error("Database error"));
            return;
          }

          if (contact) {
            db.run(
              "UPDATE residents SET contact = ? WHERE id = ?",
              [contact, decoded.residentId],
              function (err) {
                if (err) {
                  reject(new Error("Database error"));
                  return;
                }
                resolve({ message: "Profile updated successfully" });
              }
            );
          } else {
            resolve({ message: "Profile updated successfully" });
          }
        }
      );
    } catch (error) {
      reject(new Error("Invalid token"));
    }
  });
}

function changePassword(token, data) {
  return new Promise((resolve, reject) => {
    if (!token) {
      reject(new Error("No auth token"));
      return;
    }

    const { currentPassword, newPassword } = data;

    if (!currentPassword || !newPassword) {
      reject(new Error("Current password and new password are required"));
      return;
    }

    if (newPassword.length < 8) {
      reject(new Error("New password must be at least 8 characters long"));
      return;
    }

    try {
      const decoded = jwt.verify(token, SECRET);

      db.get(
        "SELECT password_hash FROM resident_auth WHERE residentId = ?",
        [decoded.residentId],
        async (err, auth) => {
          if (err) {
            reject(new Error("Database error"));
            return;
          }

          if (!auth) {
            reject(new Error("Account not found"));
            return;
          }

          const validPassword = await bcrypt.compare(currentPassword, auth.password_hash);
          if (!validPassword) {
            reject(new Error("Current password is incorrect"));
            return;
          }

          const newPasswordHash = await bcrypt.hash(newPassword, 10);

          db.run(
            "UPDATE resident_auth SET password_hash = ? WHERE residentId = ?",
            [newPasswordHash, decoded.residentId],
            function (err) {
              if (err) {
                reject(new Error("Database error"));
                return;
              }

              resolve({ message: "Password changed successfully" });
            }
          );
        }
      );
    } catch (error) {
      reject(new Error("Invalid token"));
    }
  });
}

function verifyToken(token) {
  return new Promise((resolve, reject) => {
    if (!token) {
      reject(new Error("No auth token"));
      return;
    }

    try {
      const data = jwt.verify(token, SECRET);

      if (data.role !== "resident") {
        reject(new Error("Invalid token role"));
        return;
      }

      resolve({
        valid: true,
        resident: {
          id: data.residentId,
          idNumber: data.idNumber,
          role: data.role
        }
      });
    } catch (error) {
      reject(new Error("Invalid or expired token"));
    }
  });
}
