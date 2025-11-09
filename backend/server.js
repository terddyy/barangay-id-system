import express from "express";
import cors from "cors";
import "./db.js";
import authRoutes from "./routes/auth.js";
import residentRoutes from "./routes/residents.js";
import requestRoutes from "./routes/request.js";
import complaintsRoutes from "./routes/complaints.js";
import auditRoutes from "./routes/audit.js";
import reportRoutes from "./routes/reports.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api", authRoutes);
app.use("/api/residents", residentRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/complaints", complaintsRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/reports", reportRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true, service: "Digital ID Backend API" }));

app.listen(3000, () => console.log("✅ API running on http://localhost:3000"));
