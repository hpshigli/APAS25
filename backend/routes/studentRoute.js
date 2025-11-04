import express from "express";
import Student from "../models/studentModel.js";
import { requireAdmin } from "../middleware/auth.js";
import { Op } from "sequelize";

const router = express.Router();

/**
 * GET /api/students/sections
 * → unique section list
 */
router.get("/sections", requireAdmin, async (_req, res) => {
  try {
    const rows = await Student.findAll({
      attributes: ["section"],
      group: ["section"],
      order: [["section", "ASC"]],
    });
    const sections = rows.map((r) => r.section);
    res.json({ success: true, sections });
  } catch (e) {
    console.error("sections error:", e);
    res.status(500).json({ success: false, message: e.message || "Failed to fetch sections" });
  }
});

/**
 * GET /api/students/section/:section
 * → students of one section + aggregates
 */
router.get("/section/:section", requireAdmin, async (req, res) => {
  try {
    const { section } = req.params;

    const students = await Student.findAll({
      where: { section },
      order: [["srn", "ASC"]],
    });

    if (!students.length) {
      return res.json({
        success: true,
        students: [],
        summary: { numStudents: 0, avgAttendance: 0, avgPhysics: 0, avgChemistry: 0, avgMaths: 0 },
      });
    }

    const sum = students.reduce(
      (acc, s) => {
        acc.attendance += Number(s.attendance) || 0;
        acc.physics += Number(s.physics) || 0;
        acc.chemistry += Number(s.chemistry) || 0;
        acc.maths += Number(s.maths) || 0;
        return acc;
      },
      { attendance: 0, physics: 0, chemistry: 0, maths: 0 }
    );

    const n = students.length;
    const summary = {
      numStudents: n,
      avgAttendance: +(sum.attendance / n).toFixed(2),
      avgPhysics: +(sum.physics / n).toFixed(2),
      avgChemistry: +(sum.chemistry / n).toFixed(2),
      avgMaths: +(sum.maths / n).toFixed(2),
    };

    res.json({ success: true, students, summary });
  } catch (e) {
    console.error("section error:", e);
    res.status(500).json({ success: false, message: e.message || "Failed to fetch section data" });
  }
});

/**
 * GET /api/students/all
 * → students across all sections + aggregates
 */
router.get("/all", requireAdmin, async (_req, res) => {
  try {
    // authoritative DB count (no filters)
    const totalDbCount = await Student.count();

    // fetch all rows actually returned in this route
    const students = await Student.findAll({
      order: [["section", "ASC"], ["srn", "ASC"]],
    });

    const n = students.length;

    // compute averages from what the route returns
    const sum = students.reduce(
      (acc, s) => {
        acc.attendance += Number(s.attendance) || 0;
        acc.physics += Number(s.physics) || 0;
        acc.chemistry += Number(s.chemistry) || 0;
        acc.maths += Number(s.maths) || 0;
        return acc;
      },
      { attendance: 0, physics: 0, chemistry: 0, maths: 0 }
    );

    const summary = n
      ? {
          numStudents: n,
          avgAttendance: +(sum.attendance / n).toFixed(2),
          avgPhysics: +(sum.physics / n).toFixed(2),
          avgChemistry: +(sum.chemistry / n).toFixed(2),
          avgMaths: +(sum.maths / n).toFixed(2),
        }
      : { numStudents: 0, avgAttendance: 0, avgPhysics: 0, avgChemistry: 0, avgMaths: 0 };

    // also send db total for quick comparison
    return res.json({ success: true, students, summary, totalDbCount });
  } catch (e) {
    console.error("all error:", e);
    res.status(500).json({ success: false, message: e.message || "Failed to fetch combined data" });
  }
});


// // GET /api/students/stats → total in DB + per-section counts
// router.get("/stats", requireAdmin, async (_req, res) => {
//   try {
//     const total = await Student.count();

//     const perSection = await Student.findAll({
//       attributes: ["section", [fn("COUNT", col("section")), "count"]],
//       group: ["section"],
//       order: [["section", "ASC"]],
//       raw: true,
//     });

//     res.json({ success: true, total, perSection });
//   } catch (e) {
//     console.error("stats error:", e);
//     res.status(500).json({ success: false, message: e.message || "Failed to fetch stats" });
//   }
// });

export default router;
