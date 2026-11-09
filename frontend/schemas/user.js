import { z } from "zod";

export const userSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(50, "ชื่อผู้ใช้ต้องไม่เกิน 50 ตัวอักษร")
    .regex(/^[a-zA-Z0-9_.]+$/, "ชื่อผู้ใช้ใช้ได้เฉพาะ a-z, 0-9, _ และ ."),
  full_name: z.string().trim().min(1, "กรุณากรอกชื่อ-สกุล").max(100, "ชื่อ-สกุลต้องไม่เกิน 100 ตัวอักษร"),
  email: z.union([z.literal(""), z.email("รูปแบบอีเมลไม่ถูกต้อง")]),
  phone: z.union([z.literal(""), z.string().regex(/^0\d{8,9}$/, "เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก ขึ้นต้นด้วย 0")]),
  position: z.string().trim().max(100, "ต้องไม่เกิน 100 ตัวอักษร"),
  department: z.string().trim().max(100, "ต้องไม่เกิน 100 ตัวอักษร"),
  role: z.enum(["evaluatee", "committee"], { error: "กรุณาเลือกบทบาท" }),
});

export const userUpdateSchema = userSchema.omit({ role: true });

export const profileSchema = userSchema.omit({ role: true, username: true });
