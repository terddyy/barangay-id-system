import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import "./db.js";
import authRoutes from "./routes/auth.js";
import residentRoutes from "./routes/residents.js";
import requestRoutes from "./routes/request.js";
import complaintsRoutes from "./routes/complaints.js";
import auditRoutes from "./routes/audit.js";
import reportRoutes from "./routes/reports.js";
import eventsRoutes from "./routes/events.js";
import uploadRoutes from "./routes/upload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", authRoutes);
app.use("/api/residents", residentRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/complaints", complaintsRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true, service: "Digital ID Backend API" }));

app.listen(3000, () => console.log("✅ API running on http://localhost:3000"));
