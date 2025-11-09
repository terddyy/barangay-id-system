import jwt from "jsonwebtoken";

const JWT_SECRET = "PALITAN-MO-TO-SA-DEPLOYMENT"; // Keep secret if you deploy later

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

export function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

export const SECRET = JWT_SECRET;
