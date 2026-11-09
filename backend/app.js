import "./env.js";
import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import pool from "./db.js";
import { ok, fail } from "./utils/response.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import topicRoutes from "./routes/topics.js";
import indicatorRoutes from "./routes/indicators.js";
import assignmentRoutes from "./routes/assignments.js";
import reportRoutes from "./routes/reports.js";
import profileRoutes from "./routes/profile.js";
import selfEvaluationRoutes from "./routes/selfEvaluations.js";
import evidenceRoutes from "./routes/evidences.js";
import committeeRoutes from "./routes/committee.js";
import backupRoutes from "./routes/backups.js";

// สร้าง app แยกจาก server.js เพื่อให้ไฟล์ทดสอบ import ไปใช้ได้โดยไม่ต้องเปิด port 5000
const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(
  fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // ไฟล์ไม่เกิน 10MB
    abortOnLimit: true,
    defParamCharset: "utf8", // ชื่อไฟล์ภาษาไทยไม่เพี้ยน
    limitHandler: (req, res) => fail(res, 400, "ไฟล์ต้องมีขนาดไม่เกิน 10MB"),
  })
);

// เช็กว่า API และฐานข้อมูลทำงาน
app.get("/api/health", async (req, res) => {
  const [rows] = await pool.query("SELECT 1 AS ok");
  ok(res, { db: rows[0].ok }, "API พร้อมใช้งาน");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/indicators", indicatorRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/self-evaluations", selfEvaluationRoutes);
app.use("/api/evidences", evidenceRoutes);
app.use("/api/committee", committeeRoutes);
app.use("/api/backups", backupRoutes);

// ไม่พบ endpoint
app.use((req, res) => fail(res, 404, "ไม่พบ endpoint นี้"));

// error ที่ไม่ได้ดักไว้ (Express 5 ส่ง error จาก async มาที่นี่เอง)
app.use((err, req, res, next) => {
  if (err.status === 400) return fail(res, 400, "รูปแบบข้อมูลที่ส่งมาไม่ถูกต้อง"); // เช่น JSON พัง
  // error จาก MySQL ที่เกิดจากข้อมูลผู้ใช้ ตอบ 400
  if (err.code === "ER_DUP_ENTRY") return fail(res, 400, "ข้อมูลซ้ำกับที่มีอยู่แล้ว");
  if (err.code === "ER_NO_REFERENCED_ROW_2") return fail(res, 400, "ไม่พบข้อมูลที่อ้างอิง");
  if (err.code === "ER_CHECK_CONSTRAINT_VIOLATED") return fail(res, 400, "ข้อมูลไม่อยู่ในช่วงที่กำหนด");
  console.error(err);
  fail(res, 500, "เกิดข้อผิดพลาดในระบบ");
});

export default app;
