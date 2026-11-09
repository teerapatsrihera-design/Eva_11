import { Router } from "express";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, changePasswordSchema } from "../schemas/auth.js";

const router = Router();
const ALL_ROLES = ["hr", "evaluatee", "committee"];

// POST /api/auth/login  body: { username, password }
router.post("/login", validate(loginSchema), async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return fail(res, 401, "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  }
  const token = jwt.sign(
    { id: user.id, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
  ok(res, {
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      must_change_password: !!user.must_change_password,
    },
  }, "เข้าสู่ระบบสำเร็จ");
});

// PUT /api/auth/change-password  body: { old_password, new_password }
router.put("/change-password", verifyToken, requireRole(...ALL_ROLES), validate(changePasswordSchema), async (req, res) => {
  const { old_password, new_password } = req.body;
  const [rows] = await pool.query("SELECT password_hash FROM users WHERE id = ?", [req.user.id]);
  if (!rows[0]) return fail(res, 404, "ไม่พบผู้ใช้");
  if (!(await verifyPassword(old_password, rows[0].password_hash))) {
    return fail(res, 400, "รหัสผ่านเดิมไม่ถูกต้อง");
  }
  if (old_password === new_password) return fail(res, 400, "รหัสผ่านใหม่ต้องไม่ซ้ำรหัสผ่านเดิม");
  await pool.query("UPDATE users SET password_hash = ?, must_change_password = FALSE WHERE id = ?", [
    await hashPassword(new_password),
    req.user.id,
  ]);
  ok(res, null, "เปลี่ยนรหัสผ่านสำเร็จ");
});

export default router;
