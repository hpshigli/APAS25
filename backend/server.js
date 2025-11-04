// backend/server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

import { connectDB, sequelize } from "./config/db.js";
import adminRouter from "./routes/adminRoute.js";
import uploadRouter from "./routes/uploadRoute.js";
import studentRouter from "./routes/studentRoute.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

// Parse JSON BEFORE routes
app.use(express.json());

// If you use Vite proxy (recommended), simple CORS is enough in dev:
app.use(cors());

// Static files
const adminAssetsPath = path.resolve(__dirname, "../admin/src/assets");
const uploadsPath = path.resolve(__dirname, "uploads");
app.use("/assets", express.static(adminAssetsPath));
app.use("/images", express.static(uploadsPath));

// Health
app.get("/", (_req, res) => res.send("API Working"));

// API routes
app.use("/api/admin", adminRouter);   // <-- login/register live here
app.use("/api", uploadRouter);        // /api/admin/upload-csv etc.
app.use("/api/students", studentRouter);

// 404 fallback
app.use((req, res) => res.status(404).json({ error: "Not found" }));

const start = async () => {
  await connectDB();
  await sequelize.sync({ alter: false });
  app.listen(port, () =>
    console.log(`Server is running on http://localhost:${port}`)
  );
};

start();
