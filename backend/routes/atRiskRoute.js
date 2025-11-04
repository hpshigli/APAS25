import express from "express";
import { Op } from "sequelize";
import { requireAdmin } from "../middleware/auth.js";
import Student from "../models/studentModel.js";
import AtRisk from "../models/atRiskModel.js";
import { sequelize } from "../config/db.js";

const router = express.Router();

// safe number parser
const numOr = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function buildReason(s, marksThreshold, attendanceThreshold) {
  const problems = [];
  if ((Number(s.attendance) || 0) < attendanceThreshold) {
    problems.push(`Attendance ${s.attendance}% < ${attendanceThreshold}%`);
  }
  if ((Number(s.physics) || 0) < marksThreshold) problems.push(`Physics ${s.physics} < ${marksThreshold}`);
  if ((Number(s.chemistry) || 0) < marksThreshold) problems.push(`Chemistry ${s.chemistry} < ${marksThreshold}`);
  if ((Number(s.maths) || 0) < marksThreshold) problems.push(`Maths ${s.maths} < ${marksThreshold}`);
  return problems.join("; ");
}

/**
 * GET /api/atrisk
 */
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const rows = await AtRisk.findAll({ order: [["section", "ASC"], ["srn", "ASC"]] });
    res.json({ success: true, students: rows });
  } catch (e) {
    console.error("AtRisk list error:", e);
    res.status(500).json({ success: false, message: e.message || "Failed to load at-risk list" });
  }
});

/**
 * POST /api/atrisk/rebuild?attendance=75&marks=40
 * - excludes students where students.notified = true
 */
// routes/atRiskRoute.js
router.post("/rebuild", requireAdmin, async (req, res) => {
  try {
    const attendanceThreshold = numOr(req.query.attendance, 75);
    const marksThreshold = numOr(req.query.marks, 40);

    const candidates = await Student.findAll({
      where: {
        notified: false,
        [Op.or]: [
          { attendance: { [Op.lt]: attendanceThreshold } },
          { physics: { [Op.lt]: marksThreshold } },
          { chemistry: { [Op.lt]: marksThreshold } },
          { maths: { [Op.lt]: marksThreshold } },
        ],
      },
      order: [["section", "ASC"], ["srn", "ASC"]],
    });

    const payload = candidates.map((s) => ({
      studentId: s.id,
      srn: s.srn,
      name: s.name,
      section: s.section,
      email: s.email,
      phone: s.phone,
      attendance: Number(s.attendance) || 0,
      physics: Number(s.physics) || 0,
      chemistry: Number(s.chemistry) || 0,
      maths: Number(s.maths) || 0,
      reason: buildReason(s, marksThreshold, attendanceThreshold),
    }));

    await AtRisk.destroy({ where: {} });
    if (payload.length) await AtRisk.bulkCreate(payload);

    // NEW: return the rows from DB with their auto ids
    const rows = await AtRisk.findAll({ order: [["section","ASC"],["srn","ASC"]] });
    return res.json({ success: true, count: rows.length, students: rows });
  } catch (e) {
    console.error("AtRisk rebuild error:", e);
    res.status(500).json({ success: false, message: e.message || "Rebuild failed" });
  }
});

/**
 * DELETE /api/atrisk/:id/notify
 * Idempotent:
 *   - removes from AtRisk (by AtRisk.id)
 *   - marks Student as notified=true and sets lastNotifiedAt=NOW()
 *   - returns success even if already removed
 */
router.delete("/:id/notify", requireAdmin, async (req, res) => {
  const atRiskId = parseInt(req.params.id, 10);
  if (!Number.isInteger(atRiskId) || atRiskId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }

  try {
    const result = await sequelize.transaction(async (t) => {
      // 1) Get the AtRisk row to read studentId
      const at = await AtRisk.findByPk(atRiskId, { transaction: t });
      if (!at) {
        // already removed -> success (idempotent)
        return { success: true, status: "already-removed" };
      }

      // 2) Mark student as notified (so rebuild won’t include them again)
      await Student.update(
        { notified: true, lastNotifiedAt: new Date() },
        { where: { id: at.studentId }, transaction: t }
      );

      // 3) Remove the AtRisk row
      await AtRisk.destroy({ where: { id: atRiskId }, transaction: t });

      return { success: true, status: "deleted", studentId: at.studentId, atRiskId };
    });

    return res.json(result);
  } catch (e) {
    console.error("AtRisk notify error:", e);
    return res.status(500).json({ success: false, message: e.message || "Notify failed" });
  }
});

export default router;
