import { z } from "zod";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// รายละเอียดประกอบ + ไฟล์หรือ URL (ไม่บังคับ แนบได้ 1 อย่าง)
export const evidenceSchema = z
  .object({
    description: z.string().trim().min(1, "กรุณากรอกรายละเอียดประกอบ").max(1000, "ต้องไม่เกิน 1000 ตัวอักษร"),
    url: z.union([z.literal(""), z.url({ protocol: /^https?$/, error: "URL ต้องขึ้นต้นด้วย http:// หรือ https://" })]),
    file: z.any(), // FileList จาก <input type="file">
  })
  .refine((d) => !(d.url && d.file?.length), { message: "แนบได้รายการละ 1 อย่าง: ไฟล์ หรือ URL", path: ["url"] })
  .refine((d) => !d.file?.length || /\.(pdf|jpe?g|png)$/i.test(d.file[0].name), {
    message: "รองรับเฉพาะไฟล์ PDF, JPG และ PNG",
    path: ["file"],
  })
  .refine((d) => !d.file?.length || d.file[0].size <= MAX_SIZE, { message: "ไฟล์ต้องมีขนาดไม่เกิน 10MB", path: ["file"] });
