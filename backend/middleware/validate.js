import { fail } from "../utils/response.js";

// ตรวจ req.body ด้วย Zod ถ้าไม่ผ่านตอบ 400 พร้อมรายการ error
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
    return fail(res, 400, errors[0].message, errors);
  }
  req.body = result.data; // ข้อมูลที่ผ่านการ trim/แปลงแล้ว
  next();
};
