import jwt from "jsonwebtoken";

const JWT_SECRET = "PALITAN-MO-TO-SA-DEPLOYMENT"; // Keep secret if you deploy later

/**
 * Middleware to verify staff/admin authentication
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No auth token" });

  const token = header.replace("Bearer ", "");
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  } catch {
    res.status(401).json({ error: "Invalid/expired token" });
  }
}

/**
 * Middleware to verify resident authentication
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export function residentAuthRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "No auth token" });
  }

  const token = header.replace("Bearer ", "");
  try {
    const data = jwt.verify(token, JWT_SECRET);
    
    // Verify this is a resident token
    if (data.role !== "resident") {
      return res.status(403).json({ error: "Resident access only" });
    }
    
    req.resident = data;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid/expired token" });
  }
}

/**
 * Middleware to verify admin-only access
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

/**
 * Middleware to allow both staff/admin and resident access
 * Sets req.user or req.resident accordingly
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export function anyAuthRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "No auth token" });
  }

  const token = header.replace("Bearer ", "");
  try {
    const data = jwt.verify(token, JWT_SECRET);
    
    if (data.role === "resident") {
      req.resident = data;
      req.userType = "resident";
    } else if (data.role === "admin" || data.role === "staff") {
      req.user = data;
      req.userType = "staff";
    } else {
      return res.status(403).json({ error: "Invalid user role" });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid/expired token" });
  }
}

export const SECRET = JWT_SECRET;
