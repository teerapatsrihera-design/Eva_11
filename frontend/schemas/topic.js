import { z } from "zod";

export const topicSchema = z
  .object({
    title: z.string().trim().min(1, "กรุณากรอกชื่อหัวข้อ").max(200, "ชื่อหัวข้อต้องไม่เกิน 200 ตัวอักษร"),
    description: z.string().trim().max(2000, "ต้องไม่เกิน 2000 ตัวอักษร"),
    start_date: z.string().min(1, "กรุณาเลือกวันเริ่มประเมิน"),
    end_date: z.string().min(1, "กรุณาเลือกวันสิ้นสุดการประเมิน"),
  })
  .refine((d) => d.end_date >= d.start_date, {
    message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม",
    path: ["end_date"],
  });
