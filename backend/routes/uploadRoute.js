import express from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import Student from "../models/studentModel.js";
import { sequelize } from "../config/db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// In-memory storage; we only need the buffer
const upload = multer({ storage: multer.memoryStorage() });

const REQUIRED_HEADERS = [
  "Name","SRN","Section","Email","Phone","Attendance","Physics","Chemistry","Maths"
];

router.post("/admin/upload-csv", requireAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const content = req.file.buffer.toString("utf8");

    // Parse CSV
    const rows = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // Validate headers
    const headers = Object.keys(rows[0] || {});
    const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h));
    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing headers: ${missing.join(", ")}`
      });
    }

    const errors = [];
    const clean = [];

    // Row validation helper
    const num = (v) => {
      if (v === undefined || v === null || v === "") return NaN;
      return Number(v);
    };
    const pct = (v) => {
      const n = num(v);
      return isFinite(n) ? n : NaN;
    };

    rows.forEach((r, idx) => {
      const rowNum = idx + 2; // considering header as row 1
      const record = {
        name: String(r.Name || "").trim(),
        srn: String(r.SRN || "").trim(),
        section: String(r.Section || "").trim(),
        email: String(r.Email || "").trim(),
        phone: String(r.Phone || "").trim(),
        attendance: pct(r.Attendance),
        physics: pct(r.Physics),
        chemistry: pct(r.Chemistry),
        maths: pct(r.Maths),
      };

      // basic validations
      if (!record.name || !record.srn || !record.section || !record.email || !record.phone) {
        errors.push(`Row ${rowNum}: Missing mandatory fields`);
        return;
      }
      if (!/^[A-Za-z0-9]+$/.test(record.srn)) {
        errors.push(`Row ${rowNum}: Invalid SRN`);
        return;
      }
      if (Number.isNaN(record.attendance) || record.attendance < 0 || record.attendance > 100) {
        errors.push(`Row ${rowNum}: Attendance must be 0–100`);
        return;
      }
      for (const [k, v] of [["Physics",record.physics],["Chemistry",record.chemistry],["Maths",record.maths]]) {
        if (Number.isNaN(v) || v < 0 || v > 100) {
          errors.push(`Row ${rowNum}: ${k} must be 0–100`);
          return;
        }
      }

      clean.push(record);
    });

    if (clean.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid rows to import",
        errors
      });
    }

    // Upsert by SRN (MySQL)
    // NOTE: updateOnDuplicate requires MySQL/MariaDB dialect
    const t = await sequelize.transaction();
    try {
      await Student.bulkCreate(clean, {
        updateOnDuplicate: [
          "name","section","email","phone","attendance","physics","chemistry","maths","updatedAt"
        ],
        transaction: t
      });
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }

    return res.json({
      success: true,
      message: `Imported ${clean.length} rows${errors.length ? ` with ${errors.length} warnings` : ""}.`,
      imported: clean.length,
      warnings: errors
    });
  } catch (err) {
    console.error("CSV import error:", err);
    return res.status(500).json({ success: false, message: err.message || "Import failed" });
  }
});

export default router;
