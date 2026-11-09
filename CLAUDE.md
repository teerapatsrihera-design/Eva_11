# ระบบประเมินบุคลากร (ข้อสอบแข่งทักษะ ปวช. IT ข้อ 57)
ใช้เป็นเฉลยต้นแบบสำหรับสอนเด็กซ้อมแข่งแบบออฟไลน์ เด็กยังไม่คล่อง React
โค้ดต้องสั้น อ่านง่าย จำง่าย คอมเมนต์เป็นภาษาไทยเฉพาะจุดที่จำเป็น
ผู้ใช้ 3 บทบาท: hr (งานบุคลากร), evaluatee (ผู้รับการประเมิน), committee (กรรมการ)

## Stack (ใช้เท่านี้ ห้ามเพิ่ม ถ้าจำเป็นต้องเพิ่มให้ถามก่อน)
- Frontend: Next.js (Pages Router, JavaScript, ไม่ใช้ getServerSideProps/getStaticProps),
  React, Axios, React Hook Form, Zod, TailwindCSS, DaisyUI, lucide-react
- Backend (ESM, "type": "module"): express, cors, dotenv, nodemon,
  jsonwebtoken, express-fileupload, mysql2, zod
- DB: MySQL 8 (Docker) | Node.js >= 24
- ห้ามใช้: TypeScript, App Router, Zustand, @hookform/resolvers, bcrypt/bcryptjs,
  multer, vitest, react-signature-canvas, jspdf, recharts/chart.js

## ใช้แทน
อัปโหลด=express-fileupload / hash รหัสผ่าน=crypto.scrypt (backend/utils/password.js:
hashPassword, verifyPassword) / ลายเซ็น=<canvas> เขียนเอง + toDataURL() /
PDF=window.print() + class print:hidden / Dashboard=stat, progress ของ DaisyUI /
Unit Test=node --test + node:assert / state ฝั่ง client=localStorage + lib/auth.js

## โครงโปรเจกต์ (Git repo เดียว อยู่ที่ C:\Eva_11)
- frontend/: pages/, components/, lib/auth.js, lib/api.js, lib/validate.js, schemas/, Dockerfile
- backend/: server.js (เปิด port), app.js (สร้าง express app ให้เทสต์ import ได้), env.js (โหลด .env),
  db.js, routes/, middleware/, utils/, schemas/, sql/ (schema.sql, seed.sql), uploads/,
  backups/ (ไฟล์สำรอง .sql ไม่ commit), tests/, Dockerfile
- docs/criteria.md (เกณฑ์ฉบับเต็ม ห้ามแก้), docs/guide/ (คู่มือสอนทีละบท)
- docker-compose.yml, README.md (เอกสาร API), .env.example

## กติกาโค้ด
- Backend: import path ลงท้าย .js, ใช้ import.meta.dirname แทน __dirname,
  async/await, แยกไฟล์ด้วย express.Router, db.js ใช้ mysql2/promise pool
- Response รูปแบบเดียว: { status, message, data } และ HTTP status ให้ตรง (200/201/400/401/403/404/500)
- Validate ด้วย Zod safeParse ทั้งสองฝั่ง (ฝั่งหน้าใช้ validateWith ใน lib/validate.js)
- Auth: JWT + middleware verifyToken และ requireRole(...roles) ทุก route ที่ไม่ใช่ login
- Frontend: อ่าน localStorage ใน useEffect เท่านั้น, login สำเร็จใช้ window.location.href,
  ทุกหน้าที่ต้อง login เช็ก role ใน useEffect แล้ว return null จนกว่าจะผ่าน
- ทุกหน้า responsive (มือถือและ desktop) ด้วย class ของ Tailwind/DaisyUI
- รหัสผ่านเก็บเป็น hash เสมอ, .env ห้าม commit

## เกณฑ์คะแนนที่ต้องครอบคลุม
พัฒนาโปรแกรม 34 (hr 14, ผู้รับประเมิน 10, กรรมการ 10), ทดสอบ 14, Back-end API 12,
โจทย์ท้าทาย 10 (Dashboard, Data Validation, Backup/Restore, Reporting), RESTful API 5

## เกณฑ์ฉบับเต็ม
เอกสารเกณฑ์อยู่ที่ docs/criteria.md (ข้อ 57 ทักษะการพัฒนาระบบประเมินบุคลากร ปวช. 2569)
ก่อนเริ่มแต่ละเฟส ให้อ่านข้อที่เกี่ยวข้องในไฟล์นี้ก่อนเสมอ
(เฟส 3 = ข้อ 5.1, เฟส 4 = ข้อ 5.2, เฟส 5 = ข้อ 5.3, เฟส 6 = ข้อ 8, เฟส 7 = ข้อ 3.1.8, 7.5, 6.9)
ถ้า prompt กับเอกสารขัดกัน ให้ยึดเอกสาร แล้วแจ้งผม
ไฟล์นี้แปลงมาจาก PDF อาจมีตัวอักษรเพี้ยนบางจุด ถ้าอ่านไม่รู้เรื่องให้ถามผม
เลขข้อที่อ้างในไฟล์นี้ (5.1.x, 5.2.x, 5.3.x, 6.x, 7.x, 8.x) คือเลขในตาราง "เกณฑ์การให้คะแนน" ส่วนที่ 1-8 ท้ายเอกสาร
ส่วนรายละเอียดงานอ่านที่หัวข้อ 3.2.5 และ 3.5.x
ความผิดปกติในต้นฉบับ: 5.3.7 กับ 5.3.9 ซ้ำกัน (ลายเซ็น), 8.3 กับ 8.4 เป็น Backup/Restore ทั้งคู่ ให้ทำให้ครอบคลุมทั้งสองข้อ

## วิธีทำงาน
- ทำทีละเฟส จบเฟสให้รันเช็กเกณฑ์ผ่าน แล้ว git commit ข้อความภาษาอังกฤษสั้นๆ
- มี warning เรื่องเวอร์ชันให้รายงาน ห้ามแก้ด้วยการเพิ่ม package นอก stack
- ตอนจบทุกเฟส สรุปสั้นๆ ว่าทำอะไร ทดสอบอะไรผ่าน อะไรยังไม่ได้ทำ