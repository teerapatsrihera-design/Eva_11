import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { BACKUP_DIR, isBackupName, createBackup, restoreBackup, listBackups } from "../utils/backup.js";

const router = Router();
router.use(verifyToken, requireRole("hr")); // สำรอง/กู้คืนข้อมูลได้เฉพาะ hr

// ไฟล์สำรองต้องเป็นของระบบนี้ (มีตาราง users)
const isSystemBackup = (sql) => sql.includes("CREATE TABLE `users`");

// path ของไฟล์สำรองจากชื่อใน URL (ชื่อผิดรูปแบบหรือไม่มีไฟล์ = null)
function backupPath(name) {
  if (!isBackupName(name)) return null;
  const file = path.join(BACKUP_DIR, name);
  return fs.existsSync(file) ? file : null;
}

// GET /api/backups  รายการไฟล์สำรอง
router.get("/", (req, res) => ok(res, listBackups()));

// POST /api/backups  สำรองข้อมูลตอนนี้
router.post("/", async (req, res) => {
  try {
    const name = await createBackup();
    ok(res, { name }, "สำรองข้อมูลสำเร็จ", 201);
  } catch (err) {
    console.error(err);
    fail(res, 500, `สำรองข้อมูลไม่สำเร็จ: ${err.message}`);
  }
});

// GET /api/backups/:name/download  ดาวน์โหลดไฟล์สำรอง
router.get("/:name/download", (req, res) => {
  const file = backupPath(req.params.name);
  if (!file) return fail(res, 404, "ไม่พบไฟล์สำรอง");
  res.download(file);
});

// กู้คืน: สำรองข้อมูลปัจจุบันไว้ก่อนเสมอ (กันกู้ผิดไฟล์)
async function restore(res, sql) {
  if (!isSystemBackup(sql)) return fail(res, 400, "ไฟล์นี้ไม่ใช่ไฟล์สำรองของระบบประเมินบุคลากร");
  try {
    const before = await createBackup("-before-restore");
    await restoreBackup(sql);
    ok(res, { before }, `กู้คืนข้อมูลสำเร็จ (ข้อมูลก่อนกู้คืนถูกเก็บไว้ที่ ${before})`);
  } catch (err) {
    console.error(err);
    fail(res, 500, `กู้คืนข้อมูลไม่สำเร็จ: ${err.message}`);
  }
}

// POST /api/backups/restore  form-data: file (.sql)  กู้คืนจากไฟล์ที่อัปโหลด
router.post("/restore", async (req, res) => {
  const file = req.files?.file;
  if (!file) return fail(res, 400, "กรุณาเลือกไฟล์ .sql");
  if (!file.name.toLowerCase().endsWith(".sql")) return fail(res, 400, "รองรับเฉพาะไฟล์ .sql");
  await restore(res, file.data.toString("utf8"));
});

// POST /api/backups/:name/restore  กู้คืนจากไฟล์สำรองบน server
router.post("/:name/restore", async (req, res) => {
  const file = backupPath(req.params.name);
  if (!file) return fail(res, 404, "ไม่พบไฟล์สำรอง");
  await restore(res, fs.readFileSync(file, "utf8"));
});

// DELETE /api/backups/:name
router.delete("/:name", (req, res) => {
  const file = backupPath(req.params.name);
  if (!file) return fail(res, 404, "ไม่พบไฟล์สำรอง");
  fs.rmSync(file);
  ok(res, null, "ลบไฟล์สำรองสำเร็จ");
});

export default router;
