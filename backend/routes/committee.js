import { Router } from "express";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { draftSchema, confirmSchema } from "../schemas/committee.js";
import { isValidScore, weighted, sum, percent } from "../utils/score.js";

const router = Router();
router.use(verifyToken, requireRole("committee")); // เฉพาะกรรมการ เห็นเฉพาะงานที่ได้รับมอบหมาย

// งานมอบหมายของกรรมการที่ login อยู่ (ไม่ใช่ของตัวเอง = ไม่พบ)
async function findMyAssignment(id, committeeId) {
  const [rows] = await pool.query("SELECT * FROM assignments WHERE id = ? AND committee_id = ?", [id, committeeId]);
  return rows[0];
}

// GET /api/committee/assignments  ผู้รับการประเมินที่ต้องประเมิน
router.get("/assignments", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT a.id, a.evaluatee_id, a.committee_role, a.status, a.confirmed_at,
            u.full_name, u.position, u.department,
            (SELECT COUNT(*) FROM committee_scores s WHERE s.assignment_id = a.id) AS scored_count,
            (SELECT COUNT(*) FROM self_evaluations se WHERE se.evaluatee_id = a.evaluatee_id AND se.score IS NOT NULL) AS self_count
     FROM assignments a JOIN users u ON u.id = a.evaluatee_id
     WHERE a.committee_id = ? ORDER BY a.status = 'confirmed', u.full_name`,
    [req.user.id]
  );
  const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM indicators");
  ok(res, rows.map((r) => ({ ...r, indicator_count: total })));
});

// GET /api/committee/assignments/:id  ข้อมูลสำหรับประเมิน 1 คน
// หัวข้อ > ตัวชี้วัด + รายละเอียด/หลักฐาน + คะแนนตนเอง + คะแนนที่กรรมการให้ + ตารางสรุป
router.get("/assignments/:id", async (req, res) => {
  const assignment = await findMyAssignment(req.params.id, req.user.id);
  if (!assignment) return fail(res, 404, "ไม่พบงานที่ได้รับมอบหมาย");

  const [[evaluatee]] = await pool.query(
    "SELECT id, full_name, email, phone, position, department FROM users WHERE id = ?",
    [assignment.evaluatee_id]
  );
  const [topics] = await pool.query("SELECT id, title, description, start_date, end_date FROM evaluation_topics ORDER BY id");
  const [indicators] = await pool.query("SELECT * FROM indicators ORDER BY id");
  const [selfRows] = await pool.query("SELECT * FROM self_evaluations WHERE evaluatee_id = ?", [evaluatee.id]);
  const [evidences] = await pool.query(
    `SELECT ev.id, ev.self_evaluation_id, ev.description, ev.file_name, ev.url
     FROM evidences ev JOIN self_evaluations se ON se.id = ev.self_evaluation_id
     WHERE se.evaluatee_id = ? ORDER BY ev.id`,
    [evaluatee.id]
  );
  const [myScores] = await pool.query("SELECT indicator_id, score FROM committee_scores WHERE assignment_id = ?", [assignment.id]);

  const rows = indicators.map((i) => {
    const self = selfRows.find((s) => s.indicator_id === i.id);
    const score = myScores.find((s) => s.indicator_id === i.id)?.score ?? null;
    return {
      ...i,
      self_score: self?.score ?? null,
      evidences: self ? evidences.filter((e) => e.self_evaluation_id === self.id) : [],
      score,
      weighted_score: weighted(score, i),
    };
  });
  for (const t of topics) t.indicators = rows.filter((r) => r.topic_id === t.id);

  const total_weight = sum(rows.map((r) => r.weight));
  const total = sum(rows.map((r) => r.weighted_score));
  const scored = rows.filter((r) => r.score != null).length;

  ok(res, {
    assignment,
    evaluatee,
    topics,
    summary: { indicator_count: rows.length, scored, total, total_weight, percent: percent(total, total_weight) },
  });
});

// PUT /api/committee/assignments/:id/scores  บันทึกร่าง (แก้ได้จนกว่าจะยืนยัน)
// body: { scores: [{ indicator_id, score }], summary_comment }
router.put("/assignments/:id/scores", validate(draftSchema), async (req, res) => {
  const assignment = await findMyAssignment(req.params.id, req.user.id);
  if (!assignment) return fail(res, 404, "ไม่พบงานที่ได้รับมอบหมาย");
  if (assignment.status === "confirmed") return fail(res, 400, "ยืนยันผลแล้ว แก้ไขไม่ได้");

  // ตรวจคะแนนทุกข้อตามรูปแบบของตัวชี้วัด
  const { scores, summary_comment } = req.body;
  const [indicators] = await pool.query("SELECT id, name, score_type FROM indicators");
  for (const s of scores) {
    const indicator = indicators.find((i) => i.id === s.indicator_id);
    if (!indicator) return fail(res, 400, `ไม่พบตัวชี้วัดรหัส ${s.indicator_id}`);
    if (!isValidScore(s.score, indicator.score_type)) return fail(res, 400, `คะแนนของ "${indicator.name}" ไม่ถูกต้อง`);
  }

  // บันทึกคะแนน + สถานะ พร้อมกันด้วย transaction (สำเร็จทั้งหมด หรือไม่บันทึกเลย)
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (scores.length) {
      await conn.query(
        "INSERT INTO committee_scores (assignment_id, indicator_id, score) VALUES ? AS new ON DUPLICATE KEY UPDATE score = new.score",
        [scores.map((s) => [assignment.id, s.indicator_id, s.score])]
      );
    }
    await conn.query("UPDATE assignments SET status = 'draft', summary_comment = ? WHERE id = ?", [summary_comment, assignment.id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  ok(res, null, "บันทึกร่างสำเร็จ");
});

// PUT /api/committee/assignments/:id/confirm  body: { signature }  ยืนยันและส่งผล (หลังจากนี้แก้ไม่ได้)
router.put("/assignments/:id/confirm", validate(confirmSchema), async (req, res) => {
  const assignment = await findMyAssignment(req.params.id, req.user.id);
  if (!assignment) return fail(res, 404, "ไม่พบงานที่ได้รับมอบหมาย");
  if (assignment.status === "confirmed") return fail(res, 400, "ยืนยันผลไปแล้ว");

  const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM indicators");
  const [[{ scored }]] = await pool.query("SELECT COUNT(*) AS scored FROM committee_scores WHERE assignment_id = ?", [assignment.id]);
  if (scored < total) return fail(res, 400, `ยังให้คะแนนไม่ครบ (${scored}/${total} ตัวชี้วัด)`);
  if (!assignment.summary_comment) return fail(res, 400, "กรุณาบันทึกความเห็นสรุปก่อนยืนยัน");

  await pool.query("UPDATE assignments SET status = 'confirmed', signature = ?, confirmed_at = NOW() WHERE id = ?", [
    req.body.signature,
    assignment.id,
  ]);
  ok(res, null, "ยืนยันและส่งผลการประเมินสำเร็จ");
});

export default router;
