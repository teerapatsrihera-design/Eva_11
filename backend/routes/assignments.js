import { Router } from "express";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { assignmentSchema, assignmentRoleSchema } from "../schemas/assignment.js";

const router = Router();
router.use(verifyToken, requireRole("hr"));

// GET /api/assignments?evaluatee_id=5&committee_id=2
// พร้อมชื่อ และจำนวนตัวชี้วัดที่กรรมการให้คะแนนแล้ว (ใช้ติดตามสถานะ)
router.get("/", async (req, res) => {
  const { evaluatee_id, committee_id } = req.query;
  let sql = `
    SELECT a.id, a.committee_id, a.evaluatee_id, a.committee_role, a.status, a.confirmed_at,
           c.full_name AS committee_name, e.full_name AS evaluatee_name,
           (SELECT COUNT(*) FROM committee_scores s WHERE s.assignment_id = a.id) AS scored_count
    FROM assignments a
    JOIN users c ON c.id = a.committee_id
    JOIN users e ON e.id = a.evaluatee_id
    WHERE 1 = 1`;
  const params = [];
  if (evaluatee_id) {
    sql += " AND a.evaluatee_id = ?";
    params.push(evaluatee_id);
  }
  if (committee_id) {
    sql += " AND a.committee_id = ?";
    params.push(committee_id);
  }
  const [rows] = await pool.query(sql + " ORDER BY a.evaluatee_id, a.committee_role, a.id", params);
  ok(res, rows);
});

// ผู้รับประเมิน 1 คน มีประธานได้คนเดียว
async function hasOtherChair(evaluateeId, exceptId = 0) {
  const [rows] = await pool.query(
    "SELECT id FROM assignments WHERE evaluatee_id = ? AND committee_role = 'chair' AND id <> ?",
    [evaluateeId, exceptId]
  );
  return rows.length > 0;
}

// POST /api/assignments  body: { committee_id, evaluatee_id, committee_role }
router.post("/", validate(assignmentSchema), async (req, res) => {
  const { committee_id, evaluatee_id, committee_role } = req.body;

  // ตรวจว่า id ตรงกับ role จริง
  const [users] = await pool.query("SELECT id, role FROM users WHERE id IN (?, ?)", [committee_id, evaluatee_id]);
  const roleOf = (id) => users.find((u) => u.id === id)?.role;
  if (roleOf(committee_id) !== "committee") return fail(res, 400, "ผู้ใช้ที่เลือกไม่ใช่กรรมการ");
  if (roleOf(evaluatee_id) !== "evaluatee") return fail(res, 400, "ผู้ใช้ที่เลือกไม่ใช่ผู้รับการประเมิน");
  if (committee_role === "chair" && (await hasOtherChair(evaluatee_id))) {
    return fail(res, 400, "ผู้รับการประเมินคนนี้มีประธานกรรมการแล้ว");
  }

  const [result] = await pool.query(
    "INSERT INTO assignments (committee_id, evaluatee_id, committee_role) VALUES (?, ?, ?)",
    [committee_id, evaluatee_id, committee_role]
  );
  ok(res, { id: result.insertId }, "มอบหมายกรรมการสำเร็จ", 201);
});

// PUT /api/assignments/:id  body: { committee_role }  เปลี่ยนบทบาทกรรมการ
router.put("/:id", validate(assignmentRoleSchema), async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM assignments WHERE id = ?", [req.params.id]);
  if (!rows[0]) return fail(res, 404, "ไม่พบการมอบหมาย");
  if (req.body.committee_role === "chair" && (await hasOtherChair(rows[0].evaluatee_id, rows[0].id))) {
    return fail(res, 400, "ผู้รับการประเมินคนนี้มีประธานกรรมการแล้ว");
  }
  await pool.query("UPDATE assignments SET committee_role = ? WHERE id = ?", [req.body.committee_role, req.params.id]);
  ok(res, null, "เปลี่ยนบทบาทกรรมการสำเร็จ");
});

// DELETE /api/assignments/:id  (คะแนนที่กรรมการคนนี้ให้ไว้ถูกลบตาม)
router.delete("/:id", async (req, res) => {
  const [result] = await pool.query("DELETE FROM assignments WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) return fail(res, 404, "ไม่พบการมอบหมาย");
  ok(res, null, "ยกเลิกการมอบหมายสำเร็จ");
});

export default router;
