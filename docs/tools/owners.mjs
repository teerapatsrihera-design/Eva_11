// ไฟล์ทั้งหมดของระบบ และใครเป็นคนทำ (ตรงกับบท 14 ขั้น 14.2)
// kind: config = ไฟล์ตั้งค่าโปรเจกต์ (บท 01, 13), shared = ส่วนกลาง (ทำชั่วโมงแรก), own = เส้น API ของตัวเอง, test = ไฟล์ทดสอบ (บท 12)
// เพิ่มไฟล์ใหม่ในโปรเจกต์แล้วต้องเพิ่มที่นี่ด้วย ไม่งั้น npm run map จะแจ้งว่าไม่มีเจ้าของ
export const OWNERS = [
  // ไฟล์ตั้งค่าโปรเจกต์ (คนที่ 1 สร้างตอนเริ่ม, Docker ตอน deploy)
  [".gitignore", 1, "config"],
  [".env.example", 1, "config"],
  ["docker-compose.yml", 1, "config"],
  ["backend/package.json", 1, "config"],
  ["backend/Dockerfile", 1, "config"],
  ["backend/.dockerignore", 1, "config"],
  ["frontend/package.json", 1, "config"],
  ["frontend/next.config.mjs", 1, "config"],
  ["frontend/jsconfig.json", 1, "config"],
  ["frontend/eslint.config.mjs", 1, "config"],
  ["frontend/.gitignore", 1, "config"],
  ["frontend/styles/globals.css", 1, "config"],
  ["frontend/Dockerfile", 1, "config"],
  ["frontend/.dockerignore", 1, "config"],

  // ส่วนกลาง คนที่ 1
  ["backend/env.js", 1, "shared"],
  ["backend/server.js", 1, "shared"],
  ["backend/db.js", 1, "shared"],
  ["backend/app.js", 1, "shared"],
  ["backend/utils/response.js", 1, "shared"],
  ["backend/utils/password.js", 1, "shared"],
  ["backend/middleware/auth.js", 1, "shared"],
  ["backend/middleware/validate.js", 1, "shared"],
  ["backend/schemas/common.js", 1, "shared"],
  ["backend/schemas/auth.js", 1, "shared"],
  ["backend/schemas/user.js", 1, "shared"],
  ["backend/routes/auth.js", 1, "shared"],
  ["frontend/pages/_app.js", 1, "shared"],
  ["frontend/pages/_document.js", 1, "shared"],
  ["frontend/pages/index.js", 1, "shared"],
  ["frontend/components/Field.js", 1, "shared"],
  ["frontend/components/Modal.js", 1, "shared"],
  ["frontend/components/Layout.js", 1, "shared"],
  ["frontend/components/StatusBadge.js", 1, "shared"],
  // ส่วนกลาง คนที่ 2
  ["backend/sql/schema.sql", 2, "shared"],
  ["frontend/pages/login.js", 2, "shared"],
  ["frontend/pages/register.js", 2, "shared"],
  ["frontend/pages/change-password.js", 2, "shared"],
  ["backend/utils/dataCheck.js", 2, "shared"], // reports.js ของคนที่ 3 import ไฟล์นี้ จึงต้องเสร็จชั่วโมงแรก
  // ส่วนกลาง คนที่ 3
  ["frontend/lib/api.js", 3, "shared"],
  ["frontend/lib/auth.js", 3, "shared"],
  ["frontend/lib/validate.js", 3, "shared"],
  ["frontend/lib/format.js", 3, "shared"],
  ["frontend/lib/constants.js", 3, "shared"],
  ["frontend/schemas/auth.js", 3, "shared"],
  ["frontend/schemas/user.js", 3, "shared"],
  ["backend/utils/score.js", 3, "shared"], // selfEvaluations.js และ dataCheck.js ของคนที่ 2 import ไฟล์นี้ จึงต้องเสร็จชั่วโมงแรก

  // คนที่ 1: งานบุคลากร
  ["backend/schemas/topic.js", 1, "own"],
  ["backend/schemas/indicator.js", 1, "own"],
  ["backend/schemas/assignment.js", 1, "own"],
  ["backend/routes/users.js", 1, "own"],
  ["backend/routes/topics.js", 1, "own"],
  ["backend/routes/indicators.js", 1, "own"],
  ["backend/routes/assignments.js", 1, "own"],
  ["frontend/schemas/topic.js", 1, "own"],
  ["frontend/schemas/indicator.js", 1, "own"],
  ["frontend/components/hr/TopicModal.js", 1, "own"],
  ["frontend/components/hr/IndicatorModal.js", 1, "own"],
  ["frontend/components/hr/UserModal.js", 1, "own"],
  ["frontend/pages/hr/topics.js", 1, "own"],
  ["frontend/pages/hr/users.js", 1, "own"],
  ["frontend/pages/hr/assignments.js", 1, "own"],
  ["frontend/public/users-template.csv", 1, "own"],

  // คนที่ 2: ผู้รับการประเมิน + สำรองข้อมูล + Dashboard
  ["backend/utils/upload.js", 2, "own"],
  ["backend/utils/backup.js", 2, "own"],
  ["backend/schemas/evaluation.js", 2, "own"],
  ["backend/routes/profile.js", 2, "own"],
  ["backend/routes/selfEvaluations.js", 2, "own"],
  ["backend/routes/evidences.js", 2, "own"],
  ["backend/routes/backups.js", 2, "own"],
  ["frontend/schemas/evaluation.js", 2, "own"],
  ["frontend/components/evaluatee/IndicatorCard.js", 2, "own"],
  ["frontend/pages/profile.js", 2, "own"],
  ["frontend/pages/evaluatee/index.js", 2, "own"],
  ["frontend/pages/evaluatee/evaluation.js", 2, "own"],
  ["frontend/pages/evaluatee/result.js", 2, "own"],
  ["frontend/pages/hr/index.js", 2, "own"],
  ["frontend/pages/hr/backups.js", 2, "own"],

  // คนที่ 3: กรรมการ + รายงาน (reports.js มีเส้น overview ของคนที่ 2 อยู่ในไฟล์เดียวกัน)
  ["backend/schemas/committee.js", 3, "own"],
  ["backend/routes/committee.js", 3, "own"],
  ["backend/routes/reports.js", 3, "own"],
  ["frontend/schemas/committee.js", 3, "own"],
  ["frontend/components/SignaturePad.js", 3, "own"],
  ["frontend/components/EvaluationReport.js", 3, "own"],
  ["frontend/pages/committee/index.js", 3, "own"],
  ["frontend/pages/committee/evaluate/[id].js", 3, "own"],
  ["frontend/pages/hr/reports/index.js", 3, "own"],
  ["frontend/pages/hr/reports/committees/[id].js", 3, "own"],
  ["frontend/pages/hr/reports/evaluatees/[id].js", 3, "own"],

  // ไฟล์ทดสอบ (บท 12)
  ["backend/tests/password.test.js", 1, "test"],
  ["backend/tests/api.test.js", 1, "test"],
  ["backend/tests/validate.test.js", 1, "test"],
  ["backend/tests/score.test.js", 1, "test"],
  ["backend/tests/sort.test.js", 1, "test"],
];

// ไฟล์ที่ npm หรือ create-next-app สร้างให้เอง ไม่ต้องพิมพ์
export const GENERATED = ["backend/package-lock.json", "frontend/package-lock.json", "frontend/AGENTS.md", "frontend/README.md", "frontend/public/favicon.ico", "backend/uploads/.gitkeep"];

export const ownerOf = (file) => OWNERS.find(([f]) => f === file)?.[1];
