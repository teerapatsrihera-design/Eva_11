import { Router } from "express";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { topicSchema } from "../schemas/topic.js";

const router = Router();
router.use(verifyToken);

// is_open = วันนี้อยู่ในช่วงเปิด-ปิดหรือไม่
const TOPIC_FIELDS = "*, (CURDATE() BETWEEN start_date AND end_date) AS is_open";

// GET /api/topics  หัวข้อทั้งหมด พร้อมตัวชี้วัดของแต่ละหัวข้อ (ทุก role ดูได้)
router.get("/", requireRole("hr", "evaluatee", "committee"), async (req, res) => {
  const [topics] = await pool.query(`SELECT ${TOPIC_FIELDS} FROM evaluation_topics ORDER BY id`);
  const [indicators] = await pool.query("SELECT * FROM indicators ORDER BY id");
  for (const t of topics) t.indicators = indicators.filter((i) => i.topic_id === t.id);
  ok(res, topics);
});

// GET /api/topics/:id
router.get("/:id", requireRole("hr", "evaluatee", "committee"), async (req, res) => {
  const [rows] = await pool.query(`SELECT ${TOPIC_FIELDS} FROM evaluation_topics WHERE id = ?`, [req.params.id]);
  if (!rows[0]) return fail(res, 404, "ไม่พบหัวข้อการประเมิน");
  const [indicators] = await pool.query("SELECT * FROM indicators WHERE topic_id = ? ORDER BY id", [req.params.id]);
  ok(res, { ...rows[0], indicators });
});

// POST /api/topics  body: { title, description, start_date, end_date }
router.post("/", requireRole("hr"), validate(topicSchema), async (req, res) => {
  const { title, description, start_date, end_date } = req.body;
  const [result] = await pool.query(
    "INSERT INTO evaluation_topics (title, description, start_date, end_date) VALUES (?, ?, ?, ?)",
    [title, description, start_date, end_date]
  );
  ok(res, { id: result.insertId }, "เพิ่มหัวข้อสำเร็จ", 201);
});

// PUT /api/topics/:id  (ใช้กำหนดช่วงเปิด-ปิดด้วย)
router.put("/:id", requireRole("hr"), validate(topicSchema), async (req, res) => {
  const { title, description, start_date, end_date } = req.body;
  const [result] = await pool.query(
    "UPDATE evaluation_topics SET title = ?, description = ?, start_date = ?, end_date = ? WHERE id = ?",
    [title, description, start_date, end_date, req.params.id]
  );
  if (!result.affectedRows) return fail(res, 404, "ไม่พบหัวข้อการประเมิน");
  ok(res, null, "แก้ไขหัวข้อสำเร็จ");
});

// DELETE /api/topics/:id  (ตัวชี้วัดและคะแนนในหัวข้อนี้ถูกลบตาม)
router.delete("/:id", requireRole("hr"), async (req, res) => {
  const [result] = await pool.query("DELETE FROM evaluation_topics WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) return fail(res, 404, "ไม่พบหัวข้อการประเมิน");
  ok(res, null, "ลบหัวข้อสำเร็จ");
});

export default router;
