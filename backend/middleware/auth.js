import jwt from "jsonwebtoken";
import { fail } from "../utils/response.js";

// ตรวจ JWT จาก header: Authorization: Bearer <token>
export function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return fail(res, 401, "กรุณาเข้าสู่ระบบ");
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, role, full_name }
    next();
  } catch {
    fail(res, 401, "Token ไม่ถูกต้องหรือหมดอายุ");
  }
}

// อนุญาตเฉพาะ role ที่กำหนด ใช้ต่อจาก verifyToken
export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : fail(res, 403, "ไม่มีสิทธิ์เข้าถึง");
