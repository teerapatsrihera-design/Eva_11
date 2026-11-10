import { z } from "zod";
import { requiredText, passwordText } from "./common.js";
import { userSchema } from "./user.js";

export const loginSchema = z.object({
  username: requiredText("กรุณากรอกชื่อผู้ใช้"),
  password: requiredText("กรุณากรอกรหัสผ่าน"),
});

// สมัครสมาชิก: ตัด role ออก ถ้าส่ง role มา Zod จะทิ้งให้เอง
export const registerSchema = userSchema.omit({ role: true }).extend({ password: passwordText });

export const changePasswordSchema = z.object({
  old_password: requiredText("กรุณากรอกรหัสผ่านเดิม"),
  new_password: passwordText,
});
