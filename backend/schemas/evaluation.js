import { z } from "zod";
import { requiredText } from "./common.js";

// คะแนนประเมินตนเอง (ตรวจช่วงตามรูปแบบตัวชี้วัดอีกครั้งใน route)
export const selfScoreSchema = z.object({
  score: z.coerce.number({ error: "กรุณาเลือกคะแนน" }).int("คะแนนต้องเป็นจำนวนเต็ม"),
});

// รายละเอียดประกอบ (ไฟล์แนบตรวจแยกใน route เพราะมาจาก req.files)
export const evidenceSchema = z.object({
  description: requiredText("กรุณากรอกรายละเอียดประกอบ", 1000),
  url: z
    .union([z.literal(""), z.url({ protocol: /^https?$/, error: "URL ต้องขึ้นต้นด้วย http:// หรือ https://" }).max(500)])
    .nullish()
    .transform((v) => v || null),
});
