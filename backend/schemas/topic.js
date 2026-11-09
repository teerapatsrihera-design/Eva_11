import { z } from "zod";
import { requiredText, optionalText, dateField } from "./common.js";

export const topicSchema = z
  .object({
    title: requiredText("กรุณากรอกชื่อหัวข้อ", 200),
    description: optionalText(2000),
    start_date: dateField("กรุณาเลือกวันเริ่มประเมิน"),
    end_date: dateField("กรุณาเลือกวันสิ้นสุดการประเมิน"),
  })
  .refine((d) => d.end_date >= d.start_date, {
    message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม",
    path: ["end_date"],
  });
