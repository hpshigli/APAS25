// backend/app.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import adminRouter from "./routes/adminRoute.js";
import uploadRouter from "./routes/uploadRoute.js";
import studentRouter from "./routes/studentRoute.js";
import atRiskRouter from "./routes/atRiskRoute.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🧠 Middleware
app.use(express.json());
app.use(cors());

// 📁 Static assets
const adminAssetsPath = path.resolve(__dirname, "../admin/src/assets");
const uploadsPath = path.resolve(__dirname, "uploads");

app.use("/assets", express.static(adminAssetsPath));
app.use("/images", express.static(uploadsPath));

// ✅ Health check
app.get("/", (_req, res) => res.send("API Working"));

// 🧩 API routes
app.use("/api/admin", adminRouter);   // Admin login/register
app.use("/api", uploadRouter);        // Upload CSVs
app.use("/api/students", studentRouter);
app.use("/api/atrisk", atRiskRouter);

// 🚫 404 fallback
app.use((req, res) => res.status(404).json({ error: "Not found" }));

export default app;
