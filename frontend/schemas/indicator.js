import { z } from "zod";

export const indicatorSchema = z.object({
  topic_id: z.coerce.number().int().positive("กรุณาเลือกหัวข้อ"),
  name: z.string().trim().min(1, "กรุณากรอกชื่อตัวชี้วัด").max(200, "ชื่อตัวชี้วัดต้องไม่เกิน 200 ตัวอักษร"),
  description: z.string().trim().max(2000, "ต้องไม่เกิน 2000 ตัวอักษร"),
  weight: z.coerce.number({ error: "น้ำหนักต้องเป็นตัวเลข" }).positive("น้ำหนักต้องมากกว่า 0").max(100, "น้ำหนักต้องไม่เกิน 100"),
  score_type: z.enum(["yes_no", "scale_4"], { error: "กรุณาเลือกรูปแบบการประเมิน" }),
  evidence_type: z.enum(["none", "file", "url", "any"], { error: "กรุณาเลือกหลักฐานที่ต้องแนบ" }),
  evidence_note: z.string().trim().max(255, "ต้องไม่เกิน 255 ตัวอักษร"),
});
