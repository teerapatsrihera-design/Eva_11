import { Router } from "express";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { indicatorSchema } from "../schemas/indicator.js";

const router = Router();
router.use(verifyToken);

// GET /api/indicators?topic_id=1
router.get("/", requireRole("hr", "evaluatee", "committee"), async (req, res) => {
  const { topic_id } = req.query;
  const [rows] = topic_id
    ? await pool.query("SELECT * FROM indicators WHERE topic_id = ? ORDER BY id", [topic_id])
    : await pool.query("SELECT * FROM indicators ORDER BY id");
  ok(res, rows);
});

// GET /api/indicators/:id
router.get("/:id", requireRole("hr", "evaluatee", "committee"), async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM indicators WHERE id = ?", [req.params.id]);
  if (!rows[0]) return fail(res, 404, "ไม่พบตัวชี้วัด");
  ok(res, rows[0]);
});

// POST /api/indicators  body: { topic_id, name, description, weight, score_type, evidence_type, evidence_note }
router.post("/", requireRole("hr"), validate(indicatorSchema), async (req, res) => {
  const i = req.body;
  const [result] = await pool.query(
    "INSERT INTO indicators (topic_id, name, description, weight, score_type, evidence_type, evidence_note) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [i.topic_id, i.name, i.description, i.weight, i.score_type, i.evidence_type, i.evidence_note]
  );
  ok(res, { id: result.insertId }, "เพิ่มตัวชี้วัดสำเร็จ", 201);
});

// PUT /api/indicators/:id
router.put("/:id", requireRole("hr"), validate(indicatorSchema), async (req, res) => {
  const i = req.body;
  const [[old]] = await pool.query("SELECT score_type FROM indicators WHERE id = ?", [req.params.id]);
  if (!old) return fail(res, 404, "ไม่พบตัวชี้วัด");

  // มีคะแนนแล้ว ห้ามเปลี่ยนรูปแบบการประเมิน (คะแนนเดิมจะผิดความหมาย)
  if (old.score_type !== i.score_type) {
    const [[{ n }]] = await pool.query(
      `SELECT (SELECT COUNT(*) FROM self_evaluations WHERE indicator_id = ? AND score IS NOT NULL)
            + (SELECT COUNT(*) FROM committee_scores WHERE indicator_id = ?) AS n`,
      [req.params.id, req.params.id]
    );
    if (n) return fail(res, 400, "ตัวชี้วัดนี้มีการให้คะแนนแล้ว เปลี่ยนรูปแบบการประเมินไม่ได้");
  }

  const [result] = await pool.query(
    "UPDATE indicators SET topic_id = ?, name = ?, description = ?, weight = ?, score_type = ?, evidence_type = ?, evidence_note = ? WHERE id = ?",
    [i.topic_id, i.name, i.description, i.weight, i.score_type, i.evidence_type, i.evidence_note, req.params.id]
  );
  if (!result.affectedRows) return fail(res, 404, "ไม่พบตัวชี้วัด");
  ok(res, null, "แก้ไขตัวชี้วัดสำเร็จ");
});

// DELETE /api/indicators/:id
router.delete("/:id", requireRole("hr"), async (req, res) => {
  const [result] = await pool.query("DELETE FROM indicators WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) return fail(res, 404, "ไม่พบตัวชี้วัด");
  ok(res, null, "ลบตัวชี้วัดสำเร็จ");
});

export default router;
