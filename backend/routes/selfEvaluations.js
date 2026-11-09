import { Router } from "express";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { selfScoreSchema, evidenceSchema } from "../schemas/evaluation.js";
import { isValidScore, indicatorProgress, percent } from "../utils/score.js";
import { checkFile, checkAttachment, saveFile } from "../utils/upload.js";

const router = Router();
router.use(verifyToken, requireRole("evaluatee")); // เฉพาะผู้รับการประเมิน ทำกับข้อมูลของตัวเอง

// ตัวชี้วัด พร้อม is_open (หัวข้ออยู่ในช่วงเปิด-ปิดหรือไม่)
async function findIndicator(id) {
  const [rows] = await pool.query(
    `SELECT i.*, (CURDATE() BETWEEN t.start_date AND t.end_date) AS is_open
     FROM indicators i JOIN evaluation_topics t ON t.id = i.topic_id WHERE i.id = ?`,
    [id]
  );
  return rows[0];
}

// GET /api/self-evaluations  หัวข้อ > ตัวชี้วัด พร้อมคะแนนตนเอง รายละเอียด และความคืบหน้า
router.get("/", async (req, res) => {
  const userId = req.user.id;
  const [topics] = await pool.query(
    "SELECT *, (CURDATE() BETWEEN start_date AND end_date) AS is_open FROM evaluation_topics ORDER BY id"
  );
  const [indicators] = await pool.query("SELECT * FROM indicators ORDER BY id");
  const [selfRows] = await pool.query("SELECT * FROM self_evaluations WHERE evaluatee_id = ?", [userId]);
  const [evidences] = await pool.query(
    `SELECT ev.* FROM evidences ev JOIN self_evaluations se ON se.id = ev.self_evaluation_id
     WHERE se.evaluatee_id = ? ORDER BY ev.id`,
    [userId]
  );

  let filled = 0;
  for (const t of topics) {
    t.indicators = indicators
      .filter((i) => i.topic_id === t.id)
      .map((i) => {
        const self = selfRows.find((s) => s.indicator_id === i.id);
        const list = self ? evidences.filter((e) => e.self_evaluation_id === self.id) : [];
        const score = self?.score ?? null;
        const progress = indicatorProgress(i, score, list.length);
        if (progress === 100) filled++;
        return { ...i, score, evidences: list, progress };
      });
  }
  const count = indicators.length;
  ok(res, { topics, summary: { indicator_count: count, filled, progress: percent(filled, count) } });
});

// PUT /api/self-evaluations/:indicatorId  body: { score }  กรอก/แก้คะแนนตนเอง
router.put("/:indicatorId", validate(selfScoreSchema), async (req, res) => {
  const indicator = await findIndicator(req.params.indicatorId);
  if (!indicator) return fail(res, 404, "ไม่พบตัวชี้วัด");
  if (!indicator.is_open) return fail(res, 400, "หัวข้อนี้ไม่อยู่ในช่วงเวลาการประเมิน");

  const { score } = req.body;
  if (!isValidScore(score, indicator.score_type)) {
    return fail(res, 400, indicator.score_type === "yes_no" ? "คะแนนต้องเป็น 1 (มี) หรือ 0 (ไม่มี)" : "คะแนนต้องอยู่ระหว่าง 1-4");
  }
  await pool.query(
    "INSERT INTO self_evaluations (evaluatee_id, indicator_id, score) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE score = ?",
    [req.user.id, indicator.id, score, score]
  );
  ok(res, null, "บันทึกคะแนนสำเร็จ");
});

// POST /api/self-evaluations/:indicatorId/evidences
// form-data: description (บังคับ), url (ไม่บังคับ), file (PDF/JPG/PNG ไม่บังคับ)
router.post("/:indicatorId/evidences", validate(evidenceSchema), async (req, res) => {
  const indicator = await findIndicator(req.params.indicatorId);
  if (!indicator) return fail(res, 404, "ไม่พบตัวชี้วัด");
  if (!indicator.is_open) return fail(res, 400, "หัวข้อนี้ไม่อยู่ในช่วงเวลาการประเมิน");

  const file = req.files?.file;
  const { description, url } = req.body;
  const error = checkAttachment(indicator.evidence_type, !!file, !!url) || (file && checkFile(file));
  if (error) return fail(res, 400, error);

  // ต้องมีแถวประเมินตนเองก่อน (เพิ่มรายละเอียดก่อนกรอกคะแนนได้)
  await pool.query(
    "INSERT INTO self_evaluations (evaluatee_id, indicator_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE id = id",
    [req.user.id, indicator.id]
  );
  const [[self]] = await pool.query("SELECT id FROM self_evaluations WHERE evaluatee_id = ? AND indicator_id = ?", [
    req.user.id,
    indicator.id,
  ]);

  const fileName = file ? await saveFile(file) : null;
  const [result] = await pool.query(
    "INSERT INTO evidences (self_evaluation_id, description, file_path, file_name, url) VALUES (?, ?, ?, ?, ?)",
    [self.id, description, fileName, file?.name ?? null, url]
  );
  ok(res, { id: result.insertId }, "เพิ่มรายละเอียดประกอบสำเร็จ", 201);
});

export default router;
