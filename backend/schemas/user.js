import { z } from "zod";
import { requiredText, optionalText } from "./common.js";

// hr เพิ่มได้เฉพาะผู้รับการประเมินและกรรมการ
export const userSchema = z.object({
  username: requiredText("กรุณากรอกชื่อผู้ใช้", 50)
    .min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร")
    .regex(/^[a-zA-Z0-9_.]+$/, "ชื่อผู้ใช้ใช้ได้เฉพาะ a-z, 0-9, _ และ ."),
  full_name: requiredText("กรุณากรอกชื่อ-สกุล", 100),
  email: z
    .union([z.literal(""), z.email("รูปแบบอีเมลไม่ถูกต้อง").max(100)])
    .nullish()
    .transform((v) => v || null),
  phone: z
    .union([z.literal(""), z.string().regex(/^0\d{8,9}$/, "เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก ขึ้นต้นด้วย 0")])
    .nullish()
    .transform((v) => v || null),
  position: optionalText(100),
  department: optionalText(100),
  role: z.enum(["evaluatee", "committee"], { error: "บทบาทต้องเป็นผู้รับการประเมินหรือกรรมการ" }),
});

// แก้ไข: เปลี่ยนบทบาทไม่ได้
export const userUpdateSchema = userSchema.omit({ role: true });

// ผู้ใช้แก้ข้อมูลตัวเอง: แก้ username ไม่ได้
export const profileSchema = userSchema.omit({ role: true, username: true });
