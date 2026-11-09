import { Router } from "express";
import crypto from "node:crypto";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { hashPassword } from "../utils/password.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { userSchema, userUpdateSchema } from "../schemas/user.js";

const router = Router();
router.use(verifyToken, requireRole("hr")); // ทุก route ในไฟล์นี้เฉพาะ hr

const USER_FIELDS = "id, username, full_name, email, phone, position, department, role, must_change_password, created_at";

// รหัสผ่านชั่วคราว 6 หลัก (ผู้ใช้ต้องเปลี่ยนตอน login ครั้งแรก)
const tempPassword = () => crypto.randomInt(100000, 1000000).toString();

// GET /api/users?role=evaluatee&q=สมชาย
router.get("/", async (req, res) => {
  const { role, q } = req.query;
  let sql = `SELECT ${USER_FIELDS} FROM users WHERE 1 = 1`;
  const params = [];
  if (role) {
    sql += " AND role = ?";
    params.push(role);
  }
  if (q) {
    sql += " AND (full_name LIKE ? OR username LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  const [rows] = await pool.query(sql + " ORDER BY id", params);
  ok(res, rows);
});

// GET /api/users/:id
router.get("/:id", async (req, res) => {
  const [rows] = await pool.query(`SELECT ${USER_FIELDS} FROM users WHERE id = ?`, [req.params.id]);
  if (!rows[0]) return fail(res, 404, "ไม่พบผู้ใช้");
  ok(res, rows[0]);
});

// POST /api/users  body: { username, full_name, email, phone, position, department, role }
router.post("/", validate(userSchema), async (req, res) => {
  const u = req.body;
  const password = tempPassword();
  const [result] = await pool.query(
    "INSERT INTO users (username, password_hash, full_name, email, phone, position, department, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [u.username, await hashPassword(password), u.full_name, u.email, u.phone, u.position, u.department, u.role]
  );
  ok(res, { id: result.insertId, username: u.username, temp_password: password }, "เพิ่มผู้ใช้สำเร็จ", 201);
});

// POST /api/users/import  form-data: file (ไฟล์ .csv)
// หัวตาราง: username,full_name,role,email,phone,position,department
router.post("/import", async (req, res) => {
  const file = req.files?.file;
  if (!file) return fail(res, 400, "กรุณาเลือกไฟล์ CSV");
  if (!file.name.toLowerCase().endsWith(".csv")) return fail(res, 400, "รองรับเฉพาะไฟล์ .csv");

  // แยกบรรทัด ตัด BOM และบรรทัดว่าง
  const lines = file.data.toString("utf8").replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const headers = lines[0]?.split(",").map((h) => h.trim());
  if (!headers?.includes("username") || lines.length < 2) {
    return fail(res, 400, "ไฟล์ต้องมีหัวตารางและข้อมูลอย่างน้อย 1 แถว");
  }

  // ตรวจทุกแถวก่อน ถ้ามีแถวผิดไม่บันทึกเลย
  const users = [];
  const errors = [];
  lines.slice(1).forEach((line, i) => {
    const values = line.split(",").map((v) => v.trim());
    const row = Object.fromEntries(headers.map((h, j) => [h, values[j] ?? ""]));
    const result = userSchema.safeParse(row);
    if (result.success) users.push(result.data);
    else errors.push({ row: i + 2, message: result.error.issues[0].message });
  });
  if (errors.length) return fail(res, 400, `ข้อมูลไม่ถูกต้อง ${errors.length} แถว`, errors);

  // INSERT ทีเดียวทุกแถว (ถ้าซ้ำจะ error ทั้งก้อน ไม่มีแถวไหนถูกบันทึก)
  const created = [];
  const values = [];
  for (const u of users) {
    const password = tempPassword();
    created.push({ username: u.username, full_name: u.full_name, temp_password: password });
    values.push([u.username, await hashPassword(password), u.full_name, u.email, u.phone, u.position, u.department, u.role]);
  }
  await pool.query(
    "INSERT INTO users (username, password_hash, full_name, email, phone, position, department, role) VALUES ?",
    [values]
  );
  ok(res, created, `นำเข้าผู้ใช้สำเร็จ ${created.length} คน`, 201);
});

// PUT /api/users/:id  body: เหมือน POST แต่ไม่มี role
router.put("/:id", validate(userUpdateSchema), async (req, res) => {
  const u = req.body;
  const [result] = await pool.query(
    "UPDATE users SET username = ?, full_name = ?, email = ?, phone = ?, position = ?, department = ? WHERE id = ?",
    [u.username, u.full_name, u.email, u.phone, u.position, u.department, req.params.id]
  );
  if (!result.affectedRows) return fail(res, 404, "ไม่พบผู้ใช้");
  ok(res, null, "แก้ไขผู้ใช้สำเร็จ");
});

// DELETE /api/users/:id  (ข้อมูลการประเมินของผู้ใช้จะถูกลบตาม)
router.delete("/:id", async (req, res) => {
  if (Number(req.params.id) === req.user.id) return fail(res, 400, "ลบบัญชีของตัวเองไม่ได้");
  const [result] = await pool.query("DELETE FROM users WHERE id = ? AND role <> 'hr'", [req.params.id]);
  if (!result.affectedRows) return fail(res, 404, "ไม่พบผู้ใช้");
  ok(res, null, "ลบผู้ใช้สำเร็จ");
});

// PUT /api/users/:id/reset-password  สุ่มรหัสชั่วคราว และบังคับเปลี่ยนตอน login
router.put("/:id/reset-password", async (req, res) => {
  const [rows] = await pool.query("SELECT id, role FROM users WHERE id = ?", [req.params.id]);
  if (!rows[0]) return fail(res, 404, "ไม่พบผู้ใช้");
  if (rows[0].role === "hr") return fail(res, 400, "รีเซ็ตได้เฉพาะผู้รับการประเมินและกรรมการ");
  const password = tempPassword();
  await pool.query("UPDATE users SET password_hash = ?, must_change_password = TRUE WHERE id = ?", [
    await hashPassword(password),
    req.params.id,
  ]);
  ok(res, { temp_password: password }, "รีเซ็ตรหัสผ่านสำเร็จ");
});

export default router;
