import { z } from "zod";

// ข้อความบังคับกรอก (กรณีไม่ส่งมาเลย หรือส่งค่าว่าง ได้ข้อความเดียวกัน)
export const requiredText = (msg, max = 255) =>
  z.string({ error: msg }).trim().min(1, msg).max(max, `ต้องไม่เกิน ${max} ตัวอักษร`);

// ข้อความไม่บังคับ: ค่าว่างเก็บเป็น null
export const optionalText = (max = 255) =>
  z.string().trim().max(max, `ต้องไม่เกิน ${max} ตัวอักษร`).nullish().transform((v) => v || null);

// รหัส (id) ที่ต้องเป็นจำนวนเต็มบวก รับได้ทั้งตัวเลขและข้อความตัวเลข
export const idField = (msg) => z.coerce.number({ error: msg }).int(msg).positive(msg);

export const dateField = (msg) => z.iso.date({ error: msg });

export const passwordText = z
  .string({ error: "กรุณากรอกรหัสผ่านใหม่" })
  .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
  .max(50, "รหัสผ่านต้องไม่เกิน 50 ตัวอักษร");
