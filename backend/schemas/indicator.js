import { z } from "zod";
import { requiredText, optionalText, idField } from "./common.js";

export const indicatorSchema = z.object({
  topic_id: idField("กรุณาเลือกหัวข้อ"),
  name: requiredText("กรุณากรอกชื่อตัวชี้วัด", 200),
  description: optionalText(2000),
  weight: z.coerce
    .number({ error: "น้ำหนักต้องเป็นตัวเลข" })
    .positive("น้ำหนักต้องมากกว่า 0")
    .max(100, "น้ำหนักต้องไม่เกิน 100"),
  score_type: z.enum(["yes_no", "scale_4"], { error: "กรุณาเลือกรูปแบบการประเมิน" }),
  evidence_type: z.enum(["none", "file", "url", "any"], { error: "กรุณาเลือกหลักฐานที่ต้องแนบ" }),
  evidence_note: optionalText(255),
});
