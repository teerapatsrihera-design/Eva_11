import { Router } from "express";
import path from "node:path";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { UPLOAD_DIR, deleteFile } from "../utils/upload.js";

const router = Router();
router.use(verifyToken);

// หลักฐาน พร้อมเจ้าของ (evaluatee_id) และสถานะเปิดของหัวข้อ
async function findEvidence(id) {
  const [rows] = await pool.query(
    `SELECT ev.*, se.evaluatee_id, (CURDATE() BETWEEN t.start_date AND t.end_date) AS is_open
     FROM evidences ev
     JOIN self_evaluations se ON se.id = ev.self_evaluation_id
     JOIN indicators i ON i.id = se.indicator_id
     JOIN evaluation_topics t ON t.id = i.topic_id
     WHERE ev.id = ?`,
    [id]
  );
  return rows[0];
}

// GET /api/evidences/:id/file  ดาวน์โหลดไฟล์หลักฐาน
// hr ทุกไฟล์, ผู้รับประเมินเฉพาะของตัวเอง, กรรมการเฉพาะคนที่ได้รับมอบหมาย
router.get("/:id/file", requireRole("hr", "evaluatee", "committee"), async (req, res) => {
  const evidence = await findEvidence(req.params.id);
  if (!evidence?.file_path) return fail(res, 404, "ไม่พบไฟล์");

  const { role, id: userId } = req.user;
  if (role === "evaluatee" && evidence.evaluatee_id !== userId) return fail(res, 403, "ไม่มีสิทธิ์ดาวน์โหลดไฟล์นี้");
  if (role === "committee") {
    const [rows] = await pool.query("SELECT id FROM assignments WHERE committee_id = ? AND evaluatee_id = ?", [
      userId,
      evidence.evaluatee_id,
    ]);
    if (!rows.length) return fail(res, 403, "ไม่มีสิทธิ์ดาวน์โหลดไฟล์นี้");
  }
  res.download(path.join(UPLOAD_DIR, evidence.file_path), evidence.file_name);
});

// DELETE /api/evidences/:id  ลบรายละเอียด/หลักฐานของตัวเอง (พร้อมไฟล์)
router.delete("/:id", requireRole("evaluatee"), async (req, res) => {
  const evidence = await findEvidence(req.params.id);
  if (!evidence || evidence.evaluatee_id !== req.user.id) return fail(res, 404, "ไม่พบรายละเอียดประกอบ");
  if (!evidence.is_open) return fail(res, 400, "หัวข้อนี้ไม่อยู่ในช่วงเวลาการประเมิน");

  await pool.query("DELETE FROM evidences WHERE id = ?", [evidence.id]);
  if (evidence.file_path) await deleteFile(evidence.file_path);
  ok(res, null, "ลบรายละเอียดประกอบสำเร็จ");
});

export default router;
