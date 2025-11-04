// APAS25/backend/routes/uploadRoute.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ../admin/src/assets relative to backend/routes/
const assetsDir = path.resolve(__dirname, "../../admin/src/assets");

// Ensure target dir exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, assetsDir);
  },
  filename: function (_req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const okMime =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel"; // common CSV mime
    const okExt = /\.csv$/i.test(file.originalname); // case-insensitive
    if (okMime || okExt) return cb(null, true);
    return cb(new Error("Only CSV files are allowed!"), false);
  },
});

router.post("/admin/upload-csv", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded or invalid type." });
  }
  return res.json({
    success: true,
    message: "File uploaded and saved to assets!",
    filename: req.file.filename,
    url: `/assets/${req.file.filename}`, // served by your static /assets route
  });
});

// Optional: multer error handler for nicer messages
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  return res.status(500).json({ success: false, message: "Server error" });
});

export default router;
