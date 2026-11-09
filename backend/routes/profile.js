import { Router } from "express";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { profileSchema } from "../schemas/user.js";

const router = Router();
router.use(verifyToken, requireRole("hr", "evaluatee", "committee"));

// GET /api/profile  ข้อมูลส่วนตัวของผู้ที่ login อยู่
router.get("/", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, username, full_name, email, phone, position, department, role, must_change_password FROM users WHERE id = ?",
    [req.user.id]
  );
  if (!rows[0]) return fail(res, 404, "ไม่พบผู้ใช้");
  ok(res, rows[0]);
});

// PUT /api/profile  body: { full_name, email, phone, position, department }
router.put("/", validate(profileSchema), async (req, res) => {
  const { full_name, email, phone, position, department } = req.body;
  await pool.query("UPDATE users SET full_name = ?, email = ?, phone = ?, position = ?, department = ? WHERE id = ?", [
    full_name, email, phone, position, department, req.user.id,
  ]);
  ok(res, null, "บันทึกข้อมูลส่วนตัวสำเร็จ");
});

export default router;
