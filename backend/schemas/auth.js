import { z } from "zod";
import { requiredText, passwordText } from "./common.js";

export const loginSchema = z.object({
  username: requiredText("กรุณากรอกชื่อผู้ใช้"),
  password: requiredText("กรุณากรอกรหัสผ่าน"),
});

export const changePasswordSchema = z.object({
  old_password: requiredText("กรุณากรอกรหัสผ่านเดิม"),
  new_password: passwordText,
});
