import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "กรุณากรอกชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, "กรุณากรอกรหัสผ่านเดิม"),
    new_password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร").max(50, "รหัสผ่านต้องไม่เกิน 50 ตัวอักษร"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "ยืนยันรหัสผ่านไม่ตรงกัน",
    path: ["confirm_password"],
  });
