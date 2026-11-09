import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs/promises";

export const UPLOAD_DIR = path.join(import.meta.dirname, "..", "uploads");

// ไฟล์หลักฐานที่รับ: นามสกุล -> mimetype
const ALLOWED = { ".pdf": "application/pdf", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };

// ตรวจชนิดไฟล์ คืนข้อความ error หรือ null ถ้าผ่าน
export function checkFile(file) {
  const ext = path.extname(file.name).toLowerCase();
  if (ALLOWED[ext] !== file.mimetype) return "รองรับเฉพาะไฟล์ PDF, JPG และ PNG";
  return null;
}

// ตรวจไฟล์แนบตามชนิดหลักฐานของตัวชี้วัด (none/file/url/any) และแนบได้รายการละ 1 อย่าง
// รายละเอียดที่เป็นข้อความอย่างเดียว (ไม่แนบอะไร) เพิ่มได้ทุกตัวชี้วัด
export function checkAttachment(evidenceType, hasFile, hasUrl) {
  if (hasFile && hasUrl) return "แนบได้รายการละ 1 อย่าง: ไฟล์ หรือ URL";
  if (evidenceType === "none" && (hasFile || hasUrl)) return "ตัวชี้วัดนี้ไม่ต้องแนบหลักฐาน";
  if (evidenceType === "file" && hasUrl) return "ตัวชี้วัดนี้ต้องแนบหลักฐานเป็นไฟล์";
  if (evidenceType === "url" && hasFile) return "ตัวชี้วัดนี้ต้องแนบหลักฐานเป็น URL";
  return null;
}

// บันทึกไฟล์ด้วยชื่อสุ่ม (กันชื่อซ้ำ/ชื่อภาษาไทย) คืนชื่อไฟล์ที่บันทึก
export async function saveFile(file) {
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${path.extname(file.name).toLowerCase()}`;
  await file.mv(path.join(UPLOAD_DIR, name));
  return name;
}

export const deleteFile = (name) => fs.rm(path.join(UPLOAD_DIR, name), { force: true });
