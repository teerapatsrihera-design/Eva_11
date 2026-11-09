import axios from "axios";
import { getToken, logout } from "./auth";

// ตัวเรียก API กลาง: ใส่ token ให้ทุก request
// เรียก /api ของเว็บเดียวกัน แล้ว Next.js ส่งต่อไปที่ backend (ดู rewrites ใน next.config.mjs)
// จึงเปิดเว็บจากเครื่องไหน IP อะไรก็ใช้ได้ ไม่ต้องแก้ URL
const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// token หมดอายุ/ไม่ถูกต้อง -> ออกจากระบบ (ยกเว้นตอนกด login เอง)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes("/auth/login")) logout();
    return Promise.reject(err);
  }
);

// ดึงข้อความ error จาก response ของ API
export const errorMessage = (err) => err.response?.data?.message || "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้";

export default api;

// ดาวน์โหลดไฟล์จาก API ที่ต้องใช้ token (ลิงก์ <a href> ธรรมดาส่ง token ไม่ได้)
export async function downloadFile(url, fileName) {
  const res = await api.get(url, { responseType: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(res.data);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}
