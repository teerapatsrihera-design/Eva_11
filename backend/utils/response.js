// รูปแบบ response เดียวทั้งระบบ: { status, message, data }
export const ok = (res, data = null, message = "สำเร็จ", code = 200) =>
  res.status(code).json({ status: "success", message, data });

export const fail = (res, code, message, data = null) =>
  res.status(code).json({ status: "error", message, data });
