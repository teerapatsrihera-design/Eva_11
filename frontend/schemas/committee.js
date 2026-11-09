import { z } from "zod";

const comment = z.string().trim().max(2000, "ความเห็นต้องไม่เกิน 2000 ตัวอักษร");

// บันทึกร่าง: ความเห็นว่างได้
export const draftSchema = z.object({ summary_comment: comment });

// ก่อนยืนยันผล: ให้คะแนนครบ มีความเห็นสรุป และลงลายเซ็นแล้ว
export const confirmSchema = z
  .object({
    scored: z.number(),
    total: z.number(),
    summary_comment: comment.min(1, "กรุณากรอกความเห็นสรุปก่อนยืนยัน"),
    signature: z.string().min(1, "กรุณาลงลายเซ็นก่อนยืนยัน"),
  })
  .refine((d) => d.scored === d.total, { message: "กรุณาให้คะแนนให้ครบทุกตัวชี้วัด", path: ["scores"] });
