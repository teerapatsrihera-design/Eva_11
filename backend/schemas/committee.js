import { z } from "zod";
import { idField, optionalText } from "./common.js";

// บันทึกร่าง: คะแนนรายตัวชี้วัด (ให้ไม่ครบได้) + ความเห็นสรุป
export const draftSchema = z.object({
  scores: z
    .array(
      z.object({
        indicator_id: idField("รหัสตัวชี้วัดไม่ถูกต้อง"),
        score: z.number({ error: "คะแนนต้องเป็นตัวเลข" }).int("คะแนนต้องเป็นจำนวนเต็ม"),
      }),
      { error: "รูปแบบคะแนนไม่ถูกต้อง" }
    )
    .max(500),
  summary_comment: optionalText(2000),
});

// ยืนยันผล: ลายเซ็นเป็นรูป PNG แบบ data URL จาก canvas.toDataURL()
export const confirmSchema = z.object({
  signature: z
    .string({ error: "กรุณาลงลายเซ็น" })
    .regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, "กรุณาลงลายเซ็น")
    .max(1_000_000, "ไฟล์ลายเซ็นใหญ่เกินไป"),
});
