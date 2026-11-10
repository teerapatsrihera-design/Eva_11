# ระบบประเมินบุคลากร (Eva)

ระบบประเมินบุคลากรมี 3 บทบาท:
- งานบุคลากร (`hr`)
- ผู้รับการประเมิน (`evaluatee`)
- กรรมการผู้ประเมิน (`committee`)

**Stack**
- Frontend: Next.js (Pages Router), React, Axios, React Hook Form, Zod, TailwindCSS, DaisyUI, lucide-react
- Backend: Express (ESM), jsonwebtoken, express-fileupload, mysql2, zod
- Database: MySQL 8 บน Docker

> 📘 **คู่มือสอนสร้างระบบนี้ตั้งแต่ 0% ถึง 100%** (สำหรับครูและนักเรียน): [docs/guide/](docs/guide/README.md)
>
> 📍 **แผนที่โค้ดรายเส้น API แยกตามเด็ก 3 คน:** [shared.html](docs/api-map/shared.html) (ส่วนกลาง อ่านก่อน), [person-1-hr.html](docs/api-map/person-1-hr.html), [person-2-evaluatee.html](docs/api-map/person-2-evaluatee.html), [person-3-committee.html](docs/api-map/person-3-committee.html)
>
> 🛠️ **เครื่องมือของครู** (สร้างเอกสารใหม่หลังแก้โค้ด และทดสอบคู่มือกับระบบจริง): [docs/tools/](docs/tools/README.md)

## สารบัญ
- [วิธีรัน](#วิธีรัน)
- [เตรียมเครื่องสำหรับพัฒนาแบบออฟไลน์](#เตรียมเครื่องสำหรับพัฒนาแบบออฟไลน์)
- [Deploy ผ่าน GitLab ของกรรมการ](#deploy-ผ่าน-gitlab-ของกรรมการ)
- [การทดสอบ](#การทดสอบ)
- [ฐานข้อมูล](#ฐานข้อมูล)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [API: หลักการออกแบบ](#api-หลักการออกแบบ)
- [API: ความปลอดภัย](#api-ความปลอดภัย)
- [API: รายการ Endpoint ทั้งหมด](#api-รายการ-endpoint-ทั้งหมด)
- [API: รายละเอียดแต่ละ Endpoint](#api-รายละเอียดแต่ละ-endpoint)

---

## วิธีรัน
ทุกวิธีเริ่มจากคัดลอก `.env.example` เป็น `.env` แล้วแก้ `DB_PASSWORD` และ `JWT_SECRET`

### วิธีที่ 1: รันทั้งระบบด้วย Docker (ใช้ตอน deploy / ส่งกรรมการ)
เครื่องต้องมีแค่ Docker Desktop ไม่ต้องลง Node.js
```
docker compose up -d --build
```
ได้ 3 container:
- `mysql`: ฐานข้อมูล
- `backend`: API ที่ port 5000
- `frontend`: หน้าเว็บที่ port 3000

เปิดเว็บที่ `http://<IP เครื่อง>:3000` เครื่องอื่นในวงแลนเข้าผ่าน IP นี้ได้เลย

### วิธีที่ 2: รันแบบพัฒนา (แก้โค้ดแล้วเห็นผลทันที)
ต้องมี Node.js 24 ขึ้นไป และ Docker Desktop
1. เปิดเฉพาะฐานข้อมูล:
   ```
   docker compose up -d mysql
   ```
2. เปิด Backend (http://localhost:5000):
   ```
   cd backend
   npm install
   npm run dev
   ```
3. เปิด Frontend (http://localhost:3000) ในอีกหน้าต่าง:
   ```
   cd frontend
   npm install
   npm run dev
   ```

ถ้าเคยรันวิธีที่ 1 อยู่ ให้หยุด container ของ backend/frontend ก่อน เพราะใช้ port เดียวกัน:
```
docker compose stop backend frontend
```

### Frontend เรียก API อย่างไร
- หน้าเว็บเรียก `/api/...` ที่ port เดียวกับหน้าเว็บ แล้ว Next.js ส่งต่อไปที่ backend (`rewrites` ใน `frontend/next.config.mjs`)
- ที่อยู่ backend อ่านจาก `API_URL`:
  - รันบนเครื่อง: `http://localhost:5000` (ค่าเริ่มต้น)
  - ใน Docker: `http://backend:5000` (ตั้งไว้ใน `frontend/Dockerfile`)
- จึงเปิดเว็บจากเครื่องไหน IP อะไรก็ได้ ไม่ต้องแก้ URL
- ทดสอบ API ด้วย Thunder Client ยิงตรงไปที่ `http://<IP เครื่อง>:5000/api` ได้เหมือนเดิม

## เตรียมเครื่องสำหรับพัฒนาแบบออฟไลน์
ทำตอน setup ขณะที่ยังมีอินเทอร์เน็ต (ใน root ของโปรเจกต์)

**1. โหลด image และ package ทั้งหมด**
```
docker pull mysql:8.4
docker pull node:24-alpine
cd backend  && npm install && cd ..
cd frontend && npm install && cd ..
```

**2. build image ของระบบ 1 ครั้ง** เพื่อเก็บ cache ขั้นตอนที่ต้องโหลดจากเน็ต (`apk add`, `npm ci`):
```
docker compose build
```

**3. ตรวจว่าพร้อม** (ต้องเห็นครบ 4 image):
```
docker images
```
ต้องมี `mysql:8.4`, `node:24-alpine`, `eva_learn-backend`, `eva_learn-frontend` (ชื่อขึ้นต้นตามชื่อโฟลเดอร์โปรเจกต์)

**ตอนออฟไลน์ทำอะไรได้**
| งาน | คำสั่ง | ใช้อะไร |
|---|---|---|
| พัฒนา | `docker compose up -d mysql` + `npm run dev` | image `mysql:8.4` + `node_modules` ในเครื่อง |
| รันทั้งระบบหลังแก้โค้ด | `docker compose up -d --build` | build ใหม่เฉพาะ `COPY . .` และ `npm run build` ส่วนที่ต้องใช้เน็ตดึงจาก cache |

**ห้ามทำตอนออฟไลน์** (cache หรือ image จะหาย และโหลดใหม่ไม่ได้):
- `docker system prune`, `docker builder prune`, `docker image prune -a`
- `docker compose build --no-cache` หรือ `--pull`
- แก้ `package.json` / `npm install` package ใหม่ (ต้องใช้เน็ต)
- แก้ 2-3 บรรทัดแรกของ `Dockerfile` (บรรทัดที่อยู่ก่อน `COPY . .`)

**สำรอง image ไว้กันพลาด** (ไม่บังคับ ไฟล์ประมาณ 0.6 GB):
```
docker save -o eva-images.tar mysql:8.4 node:24-alpine eva_learn-backend eva_learn-frontend
docker load -i eva-images.tar
```
- `docker save`: เก็บ image ทั้งหมดเป็นไฟล์เดียว
- `docker load`: นำกลับมา หรือนำไปลงเครื่องอื่นที่ไม่มีเน็ต

## Deploy ผ่าน GitLab ของกรรมการ
**1. push โค้ดขึ้น GitLab** (เครื่องที่พัฒนา) ให้สร้าง project เปล่าใน GitLab ก่อน แล้วสั่ง:
```
git remote add origin http://<gitlab-server>/<group>/<project>.git
git push -u origin master
```
- ถ้ากรรมการกำหนดชื่อ branch เป็น `main` ให้สั่ง `git push -u origin master:main`
- `.env`, `node_modules`, ไฟล์อัปโหลด และไฟล์สำรอง ไม่ขึ้น git (อยู่ใน `.gitignore`)

**2. deploy บนเครื่องแม่ข่าย:**
```
git clone http://<gitlab-server>/<group>/<project>.git eva
cd eva
cp .env.example .env        # Windows: copy .env.example .env  แล้วแก้รหัสผ่านและ JWT_SECRET
docker compose up -d --build
```
ตารางสร้างให้อัตโนมัติตอนรันครั้งแรก จากนั้นเปิด `http://<IP เครื่องแม่ข่าย>:3000` แล้วสร้างบัญชีแรกตาม[ขั้นตอนในหัวข้อฐานข้อมูล](#ฐานข้อมูล)

**คำสั่งที่ใช้บ่อย**
| ทำอะไร | คำสั่ง |
|---|---|
| ดูสถานะ | `docker compose ps` |
| ดู log | `docker compose logs -f backend` |
| อัปเดตเป็นโค้ดล่าสุด | `git pull` แล้ว `docker compose up -d --build` |
| หยุดระบบ (ข้อมูลยังอยู่) | `docker compose down` |
| ลบทุกอย่างรวมฐานข้อมูล เริ่มใหม่ | `docker compose down -v` |

**ปัญหาที่อาจเจอ**
- **port ซ้ำกับโปรแกรมอื่น:** แก้ `WEB_PORT`, `PORT`, `DB_PORT` ใน `.env`
- **เครื่องอื่นเปิดไม่ได้:** อนุญาต port 3000 และ 5000 ใน Windows Firewall
- **build ต้องใช้อินเทอร์เน็ต:** ต้องโหลด image `node:24-alpine`, `mysql:8.4` และ package จาก npm ถ้าสนามแข่งไม่มีเน็ต ให้ถามกรรมการว่ามี image และ npm registry ให้ใช้ไหม
- **สร้างฐานข้อมูลอัตโนมัติแค่ครั้งแรก:** ถ้าต้องการเริ่มใหม่ ใช้ `docker compose down -v` หรือคำสั่งรีเซ็ตในหัวข้อ [ฐานข้อมูล](#ฐานข้อมูล)

## การทดสอบ
ใช้ `node --test` กับ `node:assert` ซึ่งมีมากับ Node อยู่แล้ว ไม่ต้องลง package เพิ่ม

```
docker compose up -d     # api.test.js ต้องใช้ฐานข้อมูล
cd backend
npm test
```

| ไฟล์ | ทดสอบอะไร | เกณฑ์ |
|---|---|---|
| `tests/score.test.js` | คำนวณคะแนนถ่วงน้ำหนัก, ค่าเฉลี่ย, ร้อยละ, ตรวจช่วงคะแนน, ความคืบหน้า, สรุปผลรายบุคคล (`buildResult`) | 7.5 |
| `tests/sort.test.js` | การเรียงข้อมูลมาก-น้อย, น้อย-มาก, ตามชื่อ, ค่าว่างไว้ท้าย | 7.5 |
| `tests/validate.test.js` | ตรวจช่องว่าง, รูปแบบอีเมล/เบอร์โทร/URL, ความยาว, ชนิดไฟล์แนบ, ความครบถ้วนของข้อมูล | 7.4, 8.2 |
| `tests/password.test.js` | hash รหัสผ่านด้วย `crypto.scrypt` และตรวจรหัสผ่านถูก/ผิด | 6.12 |
| `tests/api.test.js` | สมัครสมาชิก, Login ถูก/ผิด, 401/403/404, เพิ่ม (POST), อ่าน (GET), แก้ไข (PUT), ลบ (DELETE) ผู้ใช้ | 7.1, 7.2, 7.3, 7.6 |

**หมายเหตุเรื่อง `api.test.js`**
- เปิด app ที่ port สุ่ม จึงรันพร้อม `npm run dev` ได้
- ข้อมูลที่เพิ่มระหว่างทดสอบจะถูกลบตอนจบ
- สร้างบัญชีทดสอบเองผ่าน `POST /api/auth/register` จึงรันบนฐานข้อมูลว่างได้

## ฐานข้อมูล
**การสร้างตาราง:** ตอนสั่ง `docker compose up` ครั้งแรก ระบบจะรัน `backend/sql/schema.sql` ให้อัตโนมัติ ได้ตารางเปล่า ไม่มีข้อมูลตัวอย่าง

**รีเซ็ตเป็นฐานข้อมูลว่าง** (ใช้ได้ทั้ง PowerShell และ Git Bash):
```
docker exec eva_mysql sh -c 'mysql -uroot -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE < /docker-entrypoint-initdb.d/schema.sql'
```

**สร้างบัญชี hr คนแรก**
1. สมัครสมาชิกที่หน้า `/register` บัญชีใหม่จะเป็นผู้รับการประเมินเสมอ
2. เปลี่ยน role ในฐานข้อมูล แก้ `your_username` ให้ตรงกับที่สมัคร (ใช้ได้ทั้ง PowerShell และ Git Bash หรือจะใช้ HeidiSQL/DBeaver ก็ได้):
   ```
   echo "UPDATE users SET role='hr' WHERE username='your_username'" | docker exec -i eva_mysql sh -c 'mysql -uroot -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE'
   ```
3. เข้าสู่ระบบใหม่ เพราะ role ถูกเก็บไว้ใน token ตอน login จากนั้น hr เพิ่มกรรมการ หัวข้อ และตัวชี้วัดผ่านหน้าเว็บได้

ผู้ใช้ที่ hr เพิ่มต้องเปลี่ยนรหัสผ่านตอน login ครั้งแรก ส่วนผู้ที่สมัครเองตั้งรหัสผ่านไว้แล้วจึงไม่ถูกบังคับ

**ตารางในระบบ**
| ตาราง | เก็บอะไร |
|---|---|
| `users` | ผู้ใช้ทุกบทบาท (รหัสผ่านเก็บเป็น hash) |
| `evaluation_topics` | หัวข้อการประเมิน และช่วงวันเปิด-ปิด |
| `indicators` | ตัวชี้วัด น้ำหนัก รูปแบบคะแนน (`yes_no` / `scale_4`) และชนิดหลักฐาน |
| `assignments` | การมอบหมายกรรมการ 1 คน ต่อผู้รับการประเมิน 1 คน พร้อมบทบาท สถานะ ความเห็นสรุป ลายเซ็น |
| `self_evaluations` | คะแนนประเมินตนเองรายตัวชี้วัด |
| `evidences` | รายละเอียดประกอบ / ไฟล์ / URL หลักฐาน |
| `committee_scores` | คะแนนที่กรรมการให้รายตัวชี้วัด |

**การคิดคะแนน**
- คะแนนถ่วงน้ำหนักของแต่ละตัวชี้วัด:
  - สเกล 1-4: `(คะแนน / 4) x น้ำหนัก`
  - มี/ไม่มี: `คะแนน (0 หรือ 1) x น้ำหนัก`
- ผลจากกรรมการใช้ค่าเฉลี่ยของกรรมการที่ "ยืนยันผลแล้ว" เท่านั้น
- ตัวชี้วัด 1 ตัวนับว่า "บันทึกครบ" เมื่อกรอกคะแนนแล้ว และแนบหลักฐานแล้ว (ถ้าตัวชี้วัดนั้นต้องแนบ)

## โครงสร้างโปรเจกต์
```
docker-compose.yml  mysql + backend + frontend
.env.example        ตัวอย่างค่าตั้งค่า (คัดลอกเป็น .env)
backend/
  Dockerfile        image ของ API (มี mysql-client สำหรับ Backup/Restore)
  app.js            สร้าง express app + ผูก router + จัดการ error (ไฟล์ทดสอบ import ไปใช้)
  server.js         เปิด port
  db.js             mysql2/promise pool
  routes/           แยก router ตามกลุ่มข้อมูล (1 ไฟล์ = 1 กลุ่ม endpoint)
  middleware/       auth.js (verifyToken, requireRole), validate.js (Zod)
  schemas/          Zod schema ของข้อมูลที่รับเข้า
  utils/            response.js, password.js, score.js, upload.js, backup.js, dataCheck.js
  sql/              schema.sql
  uploads/          ไฟล์หลักฐานที่อัปโหลด
  backups/          ไฟล์สำรองข้อมูล .sql
  tests/            unit test + API test
frontend/
  Dockerfile        build หน้าเว็บแบบ production (next build + next start)
  next.config.mjs   rewrites: ส่งต่อ /api ไปที่ backend
  pages/            หน้าเว็บ แยกโฟลเดอร์ตามบทบาท hr/, evaluatee/, committee/
  components/       Layout, Modal, SignaturePad, EvaluationReport ...
  lib/              auth.js, api.js, validate.js, format.js, constants.js
  schemas/          Zod schema ฝั่งหน้าเว็บ
```

---

## API: หลักการออกแบบ
**Base URL:** `http://localhost:5000/api`

**หลัก RESTful**
- URL เป็นคำนามพหูพจน์ที่บอกกลุ่มข้อมูล เช่น `/users`, `/topics`, `/indicators`, `/assignments`
- ข้อมูล 1 รายการใช้ `/{กลุ่ม}/{id}` เช่น `/users/5`
- HTTP method บอกการกระทำ:

  | Method | ใช้ทำอะไร |
  |---|---|
  | `GET` | อ่านข้อมูล |
  | `POST` | เพิ่มข้อมูล (ตอบ 201) |
  | `PUT` | แก้ไขข้อมูล |
  | `DELETE` | ลบข้อมูล |

- ข้อมูลย่อยของรายการใช้ path ซ้อน เช่น `/self-evaluations/{indicatorId}/evidences`
- การกระทำที่ไม่ใช่ CRUD ตรงๆ ใช้คำกริยาต่อท้าย เช่น `/committee/assignments/{id}/confirm`, `/backups/{name}/restore`

**รูปแบบ Response:** ทุก endpoint ตอบรูปแบบเดียวกัน
```json
{ "status": "success", "message": "ข้อความอธิบาย", "data": { } }
```
- `status` เป็น `"success"` หรือ `"error"`
- `data` เป็นข้อมูลที่ขอ หรือ `null`
- ถ้า validate ไม่ผ่าน `data` เป็นรายการช่องที่ผิด

**HTTP Status Code ที่ใช้**
| Code | ความหมาย | ตัวอย่างกรณี |
|---|---|---|
| 200 | สำเร็จ | อ่าน / แก้ไข / ลบสำเร็จ |
| 201 | สร้างข้อมูลใหม่สำเร็จ | `POST /users`, `POST /topics` |
| 400 | ข้อมูลที่ส่งมาไม่ถูกต้อง | ไม่กรอกช่องบังคับ, อีเมลผิดรูปแบบ, ข้อมูลซ้ำ, หัวข้อปิดแล้ว |
| 401 | ยังไม่ได้ login / token ผิดหรือหมดอายุ / รหัสผ่านผิด | ไม่ส่ง header `Authorization` |
| 403 | login แล้วแต่ไม่มีสิทธิ์ | ผู้รับการประเมินเรียก `/api/users` |
| 404 | ไม่พบข้อมูลหรือ endpoint | `GET /users/999` |
| 500 | ข้อผิดพลาดในระบบ | ฐานข้อมูลไม่ทำงาน |

**ตัวอย่าง Response กรณี Error (ใช้กับทุก endpoint)**

400 Validate ไม่ผ่าน (`message` เป็นข้อความของช่องแรกที่ผิด):
```json
{
  "status": "error",
  "message": "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร",
  "data": [
    { "field": "username", "message": "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร" },
    { "field": "full_name", "message": "กรุณากรอกชื่อ-สกุล" }
  ]
}
```

400 ข้อมูลซ้ำ (เช่น username ซ้ำ):
```json
{ "status": "error", "message": "ข้อมูลซ้ำกับที่มีอยู่แล้ว", "data": null }
```

401 ไม่ได้ส่ง token:
```json
{ "status": "error", "message": "กรุณาเข้าสู่ระบบ", "data": null }
```

401 token ปลอมหรือหมดอายุ:
```json
{ "status": "error", "message": "Token ไม่ถูกต้องหรือหมดอายุ", "data": null }
```

403 บทบาทไม่มีสิทธิ์:
```json
{ "status": "error", "message": "ไม่มีสิทธิ์เข้าถึง", "data": null }
```

404 ไม่พบข้อมูล:
```json
{ "status": "error", "message": "ไม่พบผู้ใช้", "data": null }
```

404 ไม่พบ endpoint:
```json
{ "status": "error", "message": "ไม่พบ endpoint นี้", "data": null }
```

500 ข้อผิดพลาดในระบบ:
```json
{ "status": "error", "message": "เกิดข้อผิดพลาดในระบบ", "data": null }
```

## API: ความปลอดภัย
**1. JWT**
- `POST /api/auth/login` คืน token ที่ลงนาม (sign) ด้วย `JWT_SECRET` ใน `.env` แบบ HS256
- อายุ token ตาม `JWT_EXPIRES_IN` (ค่าเริ่มต้น 8 ชั่วโมง)
- ใน token มี `id`, `role`, `full_name` ของผู้ใช้
- ถ้ามีคนแก้ token จะตรวจลายเซ็นไม่ผ่านและได้ 401

**2. ส่ง token ทุก request:**
```
Authorization: Bearer <token>
```
ฝั่ง frontend ทำให้อัตโนมัติใน `lib/api.js` (axios interceptor) และถ้าได้ 401 จะพากลับไปหน้า login

**3. `verifyToken`:** ใช้กับทุก endpoint ยกเว้น `POST /auth/login` และ `GET /health` ตรวจ token แล้วเก็บผู้ใช้ไว้ใน `req.user` ไม่ผ่านตอบ 401

**4. `requireRole(...roles)`:** ระบุบทบาทที่เรียก endpoint ได้ ไม่ผ่านตอบ 403 เช่น
```js
router.use(verifyToken, requireRole("hr"));
```

**5. ตรวจความเป็นเจ้าของข้อมูล:** นอกจากบทบาทแล้วยังตรวจว่าเป็นข้อมูลของตัวเองหรือไม่
- ผู้รับการประเมินเห็นและแก้ได้เฉพาะของตัวเอง (ใช้ `req.user.id` จาก token ไม่เชื่อ id ที่ส่งมา)
- กรรมการเห็นเฉพาะผู้รับการประเมินที่ได้รับมอบหมาย
- ยืนยันผลแล้วแก้ไม่ได้

**6. รหัสผ่าน**
- เก็บเป็น hash ด้วย `crypto.scrypt` + salt สุ่ม (`utils/password.js`) ไม่เก็บรหัสจริง
- ไม่ส่ง hash กลับใน response
- login ผิดตอบข้อความเดียวกันทั้งกรณีไม่มีผู้ใช้และรหัสผิด

**7. Validate ข้อมูลเข้า:** ทุก body ผ่าน Zod `safeParse` ก่อนใช้ (middleware `validate`) และ SQL ใช้ placeholder `?` ทุกจุด กัน SQL Injection

**8. ไฟล์อัปโหลด**
- รับเฉพาะ PDF/JPG/PNG โดยนามสกุลต้องตรงกับชนิดไฟล์ และขนาดไม่เกิน 10MB
- บันทึกด้วยชื่อสุ่ม
- ดาวน์โหลดผ่าน API ที่ตรวจสิทธิ์เท่านั้น ไม่เปิดโฟลเดอร์ `uploads` เป็น static

**9. ไฟล์สำรองข้อมูล:** ชื่อไฟล์ต้องตรงรูปแบบ `backup-*.sql` (กันการขอไฟล์อื่นด้วย `../`) และทำได้เฉพาะ hr

**10. ความลับ:** `.env` ไม่ขึ้น git (มี `.env.example` เป็นตัวอย่าง)

---

## API: รายการ Endpoint ทั้งหมด
| Method | Endpoint | สิทธิ์ | คำอธิบาย |
|---|---|---|---|
| GET | `/api/health` | ไม่ต้อง login | เช็กว่า API และฐานข้อมูลทำงาน |
| **Auth** | | | |
| POST | `/api/auth/register` | ไม่ต้อง login | สมัครสมาชิก (ได้บทบาทผู้รับการประเมินเสมอ) |
| POST | `/api/auth/login` | ไม่ต้อง login | เข้าสู่ระบบ รับ JWT token |
| PUT | `/api/auth/change-password` | ทุกบทบาท | เปลี่ยนรหัสผ่านของตัวเอง |
| **Profile** | | | |
| GET | `/api/profile` | ทุกบทบาท | ข้อมูลส่วนตัวของตัวเอง |
| PUT | `/api/profile` | ทุกบทบาท | แก้ไขข้อมูลส่วนตัว |
| **Users** | | | |
| GET | `/api/users` | hr | รายชื่อผู้ใช้ (ค้นหา/กรองบทบาท) |
| GET | `/api/users/{id}` | hr | ข้อมูลผู้ใช้ 1 คน |
| POST | `/api/users` | hr | เพิ่มผู้ใช้ |
| POST | `/api/users/import` | hr | นำเข้าผู้ใช้จากไฟล์ CSV |
| PUT | `/api/users/{id}` | hr | แก้ไขผู้ใช้ |
| DELETE | `/api/users/{id}` | hr | ลบผู้ใช้ |
| PUT | `/api/users/{id}/reset-password` | hr | รีเซ็ตรหัสผ่าน |
| **Topics** | | | |
| GET | `/api/topics` | ทุกบทบาท | หัวข้อทั้งหมด พร้อมตัวชี้วัด |
| GET | `/api/topics/{id}` | ทุกบทบาท | หัวข้อ 1 รายการ |
| POST | `/api/topics` | hr | เพิ่มหัวข้อ |
| PUT | `/api/topics/{id}` | hr | แก้ไขหัวข้อ / ช่วงเปิด-ปิด |
| DELETE | `/api/topics/{id}` | hr | ลบหัวข้อ |
| **Indicators** | | | |
| GET | `/api/indicators` | ทุกบทบาท | ตัวชี้วัด (กรองตามหัวข้อได้) |
| GET | `/api/indicators/{id}` | ทุกบทบาท | ตัวชี้วัด 1 รายการ |
| POST | `/api/indicators` | hr | เพิ่มตัวชี้วัด |
| PUT | `/api/indicators/{id}` | hr | แก้ไขตัวชี้วัด |
| DELETE | `/api/indicators/{id}` | hr | ลบตัวชี้วัด |
| **Assignments** | | | |
| GET | `/api/assignments` | hr | รายการมอบหมายกรรมการ |
| POST | `/api/assignments` | hr | มอบหมายกรรมการ |
| PUT | `/api/assignments/{id}` | hr | เปลี่ยนบทบาทกรรมการ (ประธาน/กรรมการ) |
| DELETE | `/api/assignments/{id}` | hr | ยกเลิกการมอบหมาย |
| **Self evaluations / Evidences** | | | |
| GET | `/api/self-evaluations` | evaluatee | แบบประเมินตนเอง พร้อมคะแนนและหลักฐาน |
| PUT | `/api/self-evaluations/{indicatorId}` | evaluatee | กรอก/แก้คะแนนตนเอง |
| POST | `/api/self-evaluations/{indicatorId}/evidences` | evaluatee | เพิ่มรายละเอียดประกอบ + อัปโหลดไฟล์/URL |
| GET | `/api/evidences/{id}/file` | ทุกบทบาท (ตามสิทธิ์) | ดาวน์โหลดไฟล์หลักฐาน |
| DELETE | `/api/evidences/{id}` | evaluatee (เจ้าของ) | ลบรายละเอียดประกอบ |
| **Committee** | | | |
| GET | `/api/committee/assignments` | committee | ผู้รับการประเมินที่ได้รับมอบหมาย |
| GET | `/api/committee/assignments/{id}` | committee | ข้อมูลสำหรับประเมิน 1 คน |
| PUT | `/api/committee/assignments/{id}/scores` | committee | บันทึกร่างคะแนน + ความเห็นสรุป |
| PUT | `/api/committee/assignments/{id}/confirm` | committee | ลงลายเซ็นและยืนยันผล |
| **Reports** | | | |
| GET | `/api/reports/overview` | hr | ข้อมูล Dashboard |
| GET | `/api/reports/evaluatees` | hr | สรุปผลรายผู้รับการประเมิน |
| GET | `/api/reports/evaluatees/{id}` | hr / evaluatee (ตัวเอง) / committee (ที่ได้รับมอบหมาย) | รายงานผลรายบุคคล |
| GET | `/api/reports/committees` | hr | สถานะการประเมินรายกรรมการ |
| GET | `/api/reports/committees/{id}` | hr | สรุปการประเมินของกรรมการ 1 คน |
| **Backups** | | | |
| GET | `/api/backups` | hr | รายการไฟล์สำรอง |
| POST | `/api/backups` | hr | สำรองข้อมูลตอนนี้ |
| GET | `/api/backups/{name}/download` | hr | ดาวน์โหลดไฟล์สำรอง |
| POST | `/api/backups/{name}/restore` | hr | กู้คืนจากไฟล์สำรองบน server |
| POST | `/api/backups/restore` | hr | กู้คืนจากไฟล์ .sql ที่อัปโหลด |
| DELETE | `/api/backups/{name}` | hr | ลบไฟล์สำรอง |

---

## API: รายละเอียดแต่ละ Endpoint
**วิธีอ่านแต่ละ endpoint**
- ทุก endpoint ที่ต้อง login ส่ง header `Authorization: Bearer <token>`
- ถ้าไม่ส่งหรือ token ผิด ได้ 401, บทบาทไม่ตรงได้ 403, ระบบผิดพลาดได้ 500 ตาม[ตัวอย่างด้านบน](#api-หลักการออกแบบ)
- ในแต่ละ endpoint จะเขียนเฉพาะ response ที่เป็นของ endpoint นั้น
- ช่องที่มีเครื่องหมาย `*` คือช่องบังคับ

### GET /api/health
เช็กว่า API และฐานข้อมูลทำงาน (ไม่ต้องใช้ token)
- **200**
  ```json
  { "status": "success", "message": "API พร้อมใช้งาน", "data": { "db": 1 } }
  ```
- **500** ฐานข้อมูลไม่ทำงาน:
  ```json
  { "status": "error", "message": "เกิดข้อผิดพลาดในระบบ", "data": null }
  ```

### Auth

#### POST /api/auth/register
สมัครสมาชิก (ไม่ต้องใช้ token) บัญชีใหม่เป็น `evaluatee` เสมอ ถึงส่ง `role` มาก็ไม่มีผล และไม่ถูกบังคับเปลี่ยนรหัสผ่าน

**Body (JSON)**
| ช่อง | ชนิด | คำอธิบาย |
|---|---|---|
| `username`* | string | 3-50 ตัว ใช้ได้เฉพาะ a-z, 0-9, _ และ . |
| `password`* | string | 6-50 ตัว |
| `full_name`* | string | ไม่เกิน 100 ตัว |
| `email` | string | รูปแบบอีเมล ไม่ซ้ำกับผู้อื่น |
| `phone` | string | ตัวเลข 9-10 หลัก ขึ้นต้นด้วย 0 |
| `position` | string | ไม่เกิน 100 ตัว |
| `department` | string | ไม่เกิน 100 ตัว |

**ตัวอย่าง Body**
```json
{ "username": "teach_a", "password": "123456", "full_name": "สมชาย รักเรียน", "department": "แผนกเทคโนโลยีสารสนเทศ" }
```

**Responses**
- **201**
  ```json
  { "status": "success", "message": "สมัครสมาชิกสำเร็จ", "data": { "id": 2, "username": "teach_a" } }
  ```
- **400** ข้อมูลไม่ถูกต้อง:
  ```json
  { "status": "error", "message": "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร", "data": [{ "field": "password", "message": "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }] }
  ```
- **400** ชื่อผู้ใช้หรืออีเมลซ้ำ:
  ```json
  { "status": "error", "message": "ข้อมูลซ้ำกับที่มีอยู่แล้ว", "data": null }
  ```

#### POST /api/auth/login
เข้าสู่ระบบ (ไม่ต้องใช้ token)

**Body (JSON)**
| ช่อง | ชนิด | คำอธิบาย |
|---|---|---|
| `username`* | string | ชื่อผู้ใช้ |
| `password`* | string | รหัสผ่าน |

**ตัวอย่าง Body**
```json
{ "username": "teach1", "password": "123456" }
```

**Responses**
- **200**: `must_change_password = true` หมายถึงต้องไปหน้าเปลี่ยนรหัสผ่านก่อน
  ```json
  {
    "status": "success",
    "message": "เข้าสู่ระบบสำเร็จ",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": { "id": 5, "username": "teach1", "full_name": "สมชาย รักเรียน", "role": "evaluatee", "must_change_password": true }
    }
  }
  ```
- **400** ไม่กรอกข้อมูล:
  ```json
  { "status": "error", "message": "กรุณากรอกชื่อผู้ใช้", "data": [{ "field": "username", "message": "กรุณากรอกชื่อผู้ใช้" }] }
  ```
- **401** ชื่อผู้ใช้หรือรหัสผ่านผิด:
  ```json
  { "status": "error", "message": "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", "data": null }
  ```

#### PUT /api/auth/change-password
เปลี่ยนรหัสผ่านของผู้ที่ login อยู่ (ทุกบทบาท) เปลี่ยนแล้วไม่ถูกบังคับเปลี่ยนอีก

**Body (JSON)**
| ช่อง | ชนิด | คำอธิบาย |
|---|---|---|
| `old_password`* | string | รหัสผ่านเดิม |
| `new_password`* | string | รหัสผ่านใหม่ 6-50 ตัว และต้องไม่ซ้ำรหัสเดิม |

**Responses**
- **200**
  ```json
  { "status": "success", "message": "เปลี่ยนรหัสผ่านสำเร็จ", "data": null }
  ```
- **400** รหัสเดิมผิด:
  ```json
  { "status": "error", "message": "รหัสผ่านเดิมไม่ถูกต้อง", "data": null }
  ```
- **400** รหัสใหม่ซ้ำรหัสเดิม:
  ```json
  { "status": "error", "message": "รหัสผ่านใหม่ต้องไม่ซ้ำรหัสผ่านเดิม", "data": null }
  ```
- **400** รหัสใหม่สั้นเกิน:
  ```json
  { "status": "error", "message": "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร", "data": [ ... ] }
  ```

### Profile

#### GET /api/profile
ข้อมูลส่วนตัวของผู้ที่ login อยู่ (ทุกบทบาท)
- **200**
  ```json
  {
    "status": "success",
    "message": "สำเร็จ",
    "data": {
      "id": 5, "username": "teach1", "full_name": "สมชาย รักเรียน", "email": "teach1@school.ac.th",
      "phone": "0810000005", "position": "ครู", "department": "แผนกเทคโนโลยีสารสนเทศ",
      "role": "evaluatee", "must_change_password": 0
    }
  }
  ```
- **404** ผู้ใช้ถูกลบไปแล้ว:
  ```json
  { "status": "error", "message": "ไม่พบผู้ใช้", "data": null }
  ```

#### PUT /api/profile
แก้ไขข้อมูลส่วนตัว (แก้ username และบทบาทไม่ได้)

**Body (JSON)**
| ช่อง | ชนิด | คำอธิบาย |
|---|---|---|
| `full_name`* | string | ชื่อ-สกุล ไม่เกิน 100 ตัว |
| `email` | string | รูปแบบอีเมล |
| `phone` | string | ขึ้นต้นด้วย 0 ยาว 9-10 หลัก |
| `position` | string | ตำแหน่ง |
| `department` | string | แผนก/ฝ่าย |

**Responses**
- **200**
  ```json
  { "status": "success", "message": "บันทึกข้อมูลส่วนตัวสำเร็จ", "data": null }
  ```
- **400** อีเมลผิดรูปแบบ:
  ```json
  { "status": "error", "message": "รูปแบบอีเมลไม่ถูกต้อง", "data": [{ "field": "email", "message": "รูปแบบอีเมลไม่ถูกต้อง" }] }
  ```

### Users (hr เท่านั้น)

#### GET /api/users
รายชื่อผู้ใช้ทั้งหมด

**Query**
| ช่อง | คำอธิบาย |
|---|---|
| `role` | กรองบทบาท: `hr` / `evaluatee` / `committee` |
| `q` | ค้นหาจากชื่อ-สกุลหรือ username |

**ตัวอย่าง:** `GET /api/users?role=evaluatee&q=สมชาย`

**Responses**
- **200**
  ```json
  {
    "status": "success",
    "message": "สำเร็จ",
    "data": [
      {
        "id": 5, "username": "teach1", "full_name": "สมชาย รักเรียน", "email": "teach1@school.ac.th",
        "phone": "0810000005", "position": "ครู", "department": "แผนกเทคโนโลยีสารสนเทศ",
        "role": "evaluatee", "must_change_password": 1, "created_at": "2026-11-07 12:12:14"
      }
    ]
  }
  ```

#### GET /api/users/{id}
**Path:** `id` รหัสผู้ใช้

**Responses**
- **200**: `data` เป็น object รูปแบบเดียวกับแต่ละรายการใน `GET /api/users`
- **404**
  ```json
  { "status": "error", "message": "ไม่พบผู้ใช้", "data": null }
  ```

#### POST /api/users
เพิ่มผู้ใช้ ระบบสุ่มรหัสผ่านชั่วคราว 6 หลักให้ ผู้ใช้ต้องเปลี่ยนรหัสตอน login ครั้งแรก

**Body (JSON)**
| ช่อง | ชนิด | คำอธิบาย |
|---|---|---|
| `username`* | string | 3-50 ตัว ใช้ได้เฉพาะ a-z, 0-9, `_`, `.` และห้ามซ้ำ |
| `full_name`* | string | ชื่อ-สกุล |
| `role`* | string | `evaluatee` หรือ `committee` |
| `email` | string | รูปแบบอีเมล |
| `phone` | string | ขึ้นต้นด้วย 0 ยาว 9-10 หลัก |
| `position` | string | ตำแหน่ง |
| `department` | string | แผนก/ฝ่าย |

**ตัวอย่าง Body**
```json
{ "username": "teach6", "full_name": "ครูใหม่ ใจดี", "email": "teach6@school.ac.th", "role": "evaluatee" }
```

**Responses**
- **201**
  ```json
  { "status": "success", "message": "เพิ่มผู้ใช้สำเร็จ", "data": { "id": 10, "username": "teach6", "temp_password": "482913" } }
  ```
- **400** ข้อมูลไม่ถูกต้อง: ดู[ตัวอย่าง 400 Validate](#api-หลักการออกแบบ)
- **400** username ซ้ำ:
  ```json
  { "status": "error", "message": "ข้อมูลซ้ำกับที่มีอยู่แล้ว", "data": null }
  ```

#### POST /api/users/import
นำเข้าผู้ใช้หลายคนจากไฟล์ CSV
- ตรวจทุกแถวก่อน ถ้ามีแถวผิดจะไม่บันทึกเลย
- ตัวอย่างไฟล์อยู่ที่ `frontend/public/users-template.csv`

**Body (multipart/form-data)**
| ช่อง | คำอธิบาย |
|---|---|
| `file`* | ไฟล์ `.csv` (UTF-8) หัวตาราง `username,full_name,role,email,phone,position,department` |

**Responses**
- **201**
  ```json
  {
    "status": "success",
    "message": "นำเข้าผู้ใช้สำเร็จ 2 คน",
    "data": [
      { "username": "teach6", "full_name": "ครูใหม่ ใจดี", "temp_password": "482913" },
      { "username": "comm4", "full_name": "กรรมการ ใหม่", "temp_password": "105277" }
    ]
  }
  ```
- **400** บางแถวไม่ถูกต้อง (`row` คือเลขบรรทัดในไฟล์):
  ```json
  { "status": "error", "message": "ข้อมูลไม่ถูกต้อง 1 แถว", "data": [{ "row": 3, "message": "รูปแบบอีเมลไม่ถูกต้อง" }] }
  ```
- **400** ไม่ได้เลือกไฟล์:
  ```json
  { "status": "error", "message": "กรุณาเลือกไฟล์ CSV", "data": null }
  ```
- **400** ไม่ใช่ไฟล์ .csv:
  ```json
  { "status": "error", "message": "รองรับเฉพาะไฟล์ .csv", "data": null }
  ```

#### PUT /api/users/{id}
แก้ไขผู้ใช้ (เปลี่ยนบทบาทไม่ได้)
- **Path:** `id`
- **Body (JSON):** เหมือน `POST /api/users` แต่ไม่มี `role`

**Responses**
- **200**
  ```json
  { "status": "success", "message": "แก้ไขผู้ใช้สำเร็จ", "data": null }
  ```
- **400** ข้อมูลไม่ถูกต้อง หรือ username ซ้ำ
- **404**
  ```json
  { "status": "error", "message": "ไม่พบผู้ใช้", "data": null }
  ```

#### DELETE /api/users/{id}
ลบผู้ใช้ ข้อมูลการประเมินของผู้ใช้นั้นถูกลบตาม (ลบบัญชี hr ไม่ได้)

**Path:** `id`

**Responses**
- **200**
  ```json
  { "status": "success", "message": "ลบผู้ใช้สำเร็จ", "data": null }
  ```
- **400** ลบบัญชีของตัวเอง:
  ```json
  { "status": "error", "message": "ลบบัญชีของตัวเองไม่ได้", "data": null }
  ```
- **404** ไม่พบผู้ใช้ หรือเป็นบัญชี hr:
  ```json
  { "status": "error", "message": "ไม่พบผู้ใช้", "data": null }
  ```

#### PUT /api/users/{id}/reset-password
สุ่มรหัสผ่านชั่วคราวใหม่ และบังคับให้ผู้ใช้เปลี่ยนตอน login

**Path:** `id`

**Responses**
- **200**
  ```json
  { "status": "success", "message": "รีเซ็ตรหัสผ่านสำเร็จ", "data": { "temp_password": "736410" } }
  ```
- **400** เป็นบัญชี hr:
  ```json
  { "status": "error", "message": "รีเซ็ตได้เฉพาะผู้รับการประเมินและกรรมการ", "data": null }
  ```
- **404**
  ```json
  { "status": "error", "message": "ไม่พบผู้ใช้", "data": null }
  ```

### Topics (หัวข้อการประเมิน)

#### GET /api/topics
หัวข้อทั้งหมด พร้อมตัวชี้วัดของแต่ละหัวข้อ (ทุกบทบาท)

`is_open` บอกว่าวันนี้อยู่ในช่วงเปิดประเมินหรือไม่ (1 = เปิด, 0 = ปิด)

**Responses**
- **200**
  ```json
  {
    "status": "success",
    "message": "สำเร็จ",
    "data": [
      {
        "id": 1,
        "title": "ด้านการจัดการเรียนการสอน",
        "description": "ประเมินการวางแผนและการจัดการเรียนรู้",
        "start_date": "2026-11-01",
        "end_date": "2026-12-31",
        "created_at": "2026-11-07 12:12:14",
        "is_open": 1,
        "indicators": [
          {
            "id": 1, "topic_id": 1, "name": "การจัดทำแผนการจัดการเรียนรู้",
            "description": "มีแผนการจัดการเรียนรู้ครบทุกรายวิชาที่สอน", "weight": 20,
            "score_type": "scale_4", "evidence_type": "file",
            "evidence_note": "ไฟล์ PDF แผนการจัดการเรียนรู้", "created_at": "2026-11-07 12:12:14"
          }
        ]
      }
    ]
  }
  ```

#### GET /api/topics/{id}
**Path:** `id` รหัสหัวข้อ

**Responses**
- **200**: `data` เป็นหัวข้อ 1 รายการ รูปแบบเดียวกับข้างบน
- **404**
  ```json
  { "status": "error", "message": "ไม่พบหัวข้อการประเมิน", "data": null }
  ```

#### POST /api/topics
เพิ่มหัวข้อการประเมิน (hr)

**Body (JSON)**
| ช่อง | ชนิด | คำอธิบาย |
|---|---|---|
| `title`* | string | ชื่อหัวข้อ ไม่เกิน 200 ตัว |
| `description` | string | คำอธิบาย |
| `start_date`* | string | วันเริ่มประเมิน `YYYY-MM-DD` |
| `end_date`* | string | วันสิ้นสุด `YYYY-MM-DD` ต้องไม่ก่อนวันเริ่ม |

**ตัวอย่าง Body**
```json
{ "title": "ด้านการบริการชุมชน", "start_date": "2026-11-01", "end_date": "2026-12-31" }
```

**Responses**
- **201**
  ```json
  { "status": "success", "message": "เพิ่มหัวข้อสำเร็จ", "data": { "id": 3 } }
  ```
- **400** วันสิ้นสุดก่อนวันเริ่ม:
  ```json
  { "status": "error", "message": "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม", "data": [{ "field": "end_date", "message": "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม" }] }
  ```

#### PUT /api/topics/{id}
แก้ไขหัวข้อ ใช้กำหนดช่วงเวลาเปิด-ปิดการประเมินด้วย (hr)
- **Path:** `id`
- **Body (JSON):** เหมือน `POST /api/topics`

**Responses**
- **200**
  ```json
  { "status": "success", "message": "แก้ไขหัวข้อสำเร็จ", "data": null }
  ```
- **400** ข้อมูลไม่ถูกต้อง
- **404**
  ```json
  { "status": "error", "message": "ไม่พบหัวข้อการประเมิน", "data": null }
  ```

#### DELETE /api/topics/{id}
ลบหัวข้อ ตัวชี้วัดและคะแนนในหัวข้อนี้ถูกลบตาม (hr)

**Path:** `id`

**Responses**
- **200**
  ```json
  { "status": "success", "message": "ลบหัวข้อสำเร็จ", "data": null }
  ```
- **404**
  ```json
  { "status": "error", "message": "ไม่พบหัวข้อการประเมิน", "data": null }
  ```

### Indicators (ตัวชี้วัด)

#### GET /api/indicators
ตัวชี้วัดทั้งหมด (ทุกบทบาท)

**Query:** `topic_id` (ไม่บังคับ) กรองเฉพาะหัวข้อ เช่น `GET /api/indicators?topic_id=2`

**Responses**
- **200**
  ```json
  {
    "status": "success",
    "message": "สำเร็จ",
    "data": [
      {
        "id": 4, "topic_id": 2, "name": "การเข้ารับการอบรมพัฒนาตนเอง",
        "description": "เข้ารับการอบรมอย่างน้อย 20 ชั่วโมงต่อปี", "weight": 10,
        "score_type": "yes_no", "evidence_type": "any",
        "evidence_note": "เกียรติบัตร หรือ URL หลักฐานการอบรม", "created_at": "2026-11-07 12:12:14"
      }
    ]
  }
  ```

#### GET /api/indicators/{id}
**Path:** `id`

**Responses**
- **200**: `data` เป็นตัวชี้วัด 1 รายการ
- **404**
  ```json
  { "status": "error", "message": "ไม่พบตัวชี้วัด", "data": null }
  ```

#### POST /api/indicators
เพิ่มตัวชี้วัด (hr)

**Body (JSON)**
| ช่อง | ชนิด | คำอธิบาย |
|---|---|---|
| `topic_id`* | number | รหัสหัวข้อ |
| `name`* | string | ชื่อตัวชี้วัด ไม่เกิน 200 ตัว |
| `description` | string | คำอธิบาย |
| `weight`* | number | น้ำหนักคะแนน มากกว่า 0 และไม่เกิน 100 |
| `score_type`* | string | `scale_4` (สเกล 1-4) หรือ `yes_no` (มี/ไม่มี) |
| `evidence_type`* | string | หลักฐานที่ต้องแนบ: `none` / `file` / `url` / `any` |
| `evidence_note` | string | คำแนะนำหลักฐาน เช่น "ไฟล์ PDF แผนการสอน" |

**ตัวอย่าง Body**
```json
{ "topic_id": 1, "name": "การวัดผลประเมินผล", "weight": 10, "score_type": "scale_4", "evidence_type": "file" }
```

**Responses**
- **201**
  ```json
  { "status": "success", "message": "เพิ่มตัวชี้วัดสำเร็จ", "data": { "id": 7 } }
  ```
- **400** น้ำหนักไม่ถูกต้อง:
  ```json
  { "status": "error", "message": "น้ำหนักต้องมากกว่า 0", "data": [{ "field": "weight", "message": "น้ำหนักต้องมากกว่า 0" }] }
  ```
- **400** ไม่มีหัวข้อนี้:
  ```json
  { "status": "error", "message": "ไม่พบข้อมูลที่อ้างอิง", "data": null }
  ```

#### PUT /api/indicators/{id}
แก้ไขตัวชี้วัด (hr)
- **Path:** `id`
- **Body (JSON):** เหมือน `POST /api/indicators`

**Responses**
- **200**
  ```json
  { "status": "success", "message": "แก้ไขตัวชี้วัดสำเร็จ", "data": null }
  ```
- **400** มีคะแนนแล้วแต่จะเปลี่ยน `score_type`:
  ```json
  { "status": "error", "message": "ตัวชี้วัดนี้มีการให้คะแนนแล้ว เปลี่ยนรูปแบบการประเมินไม่ได้", "data": null }
  ```
- **404**
  ```json
  { "status": "error", "message": "ไม่พบตัวชี้วัด", "data": null }
  ```

#### DELETE /api/indicators/{id}
ลบตัวชี้วัด (hr)

**Path:** `id`

**Responses**
- **200**
  ```json
  { "status": "success", "message": "ลบตัวชี้วัดสำเร็จ", "data": null }
  ```
- **404**
  ```json
  { "status": "error", "message": "ไม่พบตัวชี้วัด", "data": null }
  ```

### Assignments (มอบหมายกรรมการ, hr เท่านั้น)

#### GET /api/assignments
รายการมอบหมาย พร้อมชื่อ สถานะ และจำนวนตัวชี้วัดที่กรรมการให้คะแนนแล้ว (`scored_count`)

**Query (ไม่บังคับ)**
| ช่อง | คำอธิบาย |
|---|---|
| `evaluatee_id` | กรองตามผู้รับการประเมิน |
| `committee_id` | กรองตามกรรมการ |

**Responses**
- **200**: `status` เป็น `pending` (ยังไม่ประเมิน), `draft` (บันทึกร่าง) หรือ `confirmed` (ยืนยันแล้ว)
  ```json
  {
    "status": "success",
    "message": "สำเร็จ",
    "data": [
      {
        "id": 1, "committee_id": 2, "evaluatee_id": 5, "committee_role": "chair",
        "status": "confirmed", "confirmed_at": "2026-11-05 10:00:00",
        "committee_name": "ประเสริฐ วงศ์ดี", "evaluatee_name": "สมชาย รักเรียน", "scored_count": 6
      }
    ]
  }
  ```

#### POST /api/assignments
มอบหมายกรรมการให้ผู้รับการประเมิน (ผู้รับการประเมิน 1 คนมีประธานได้คนเดียว)

**Body (JSON)**
| ช่อง | ชนิด | คำอธิบาย |
|---|---|---|
| `committee_id`* | number | รหัสผู้ใช้ที่เป็นกรรมการ |
| `evaluatee_id`* | number | รหัสผู้ใช้ที่เป็นผู้รับการประเมิน |
| `committee_role`* | string | `chair` (ประธาน) หรือ `member` (กรรมการ) |

**Responses**
- **201**
  ```json
  { "status": "success", "message": "มอบหมายกรรมการสำเร็จ", "data": { "id": 14 } }
  ```
- **400** มีประธานแล้ว:
  ```json
  { "status": "error", "message": "ผู้รับการประเมินคนนี้มีประธานกรรมการแล้ว", "data": null }
  ```
- **400** id ไม่ตรงบทบาท:
  ```json
  { "status": "error", "message": "ผู้ใช้ที่เลือกไม่ใช่กรรมการ", "data": null }
  ```
- **400** มอบหมายคู่นี้ไปแล้ว:
  ```json
  { "status": "error", "message": "ข้อมูลซ้ำกับที่มีอยู่แล้ว", "data": null }
  ```

#### PUT /api/assignments/{id}
เปลี่ยนบทบาทกรรมการ
- **Path:** `id`
- **Body (JSON):** `committee_role`* (`chair` / `member`)

**Responses**
- **200**
  ```json
  { "status": "success", "message": "เปลี่ยนบทบาทกรรมการสำเร็จ", "data": null }
  ```
- **400** มีประธานคนอื่นอยู่แล้ว:
  ```json
  { "status": "error", "message": "ผู้รับการประเมินคนนี้มีประธานกรรมการแล้ว", "data": null }
  ```
- **404**
  ```json
  { "status": "error", "message": "ไม่พบการมอบหมาย", "data": null }
  ```

#### DELETE /api/assignments/{id}
ยกเลิกการมอบหมาย คะแนนที่กรรมการคนนี้ให้ไว้ถูกลบตาม

**Path:** `id`

**Responses**
- **200**
  ```json
  { "status": "success", "message": "ยกเลิกการมอบหมายสำเร็จ", "data": null }
  ```
- **404**
  ```json
  { "status": "error", "message": "ไม่พบการมอบหมาย", "data": null }
  ```

### Self evaluations (ผู้รับการประเมิน)
ทุก endpoint ในกลุ่มนี้ทำกับข้อมูลของผู้ที่ login อยู่เท่านั้น (ใช้ id จาก token)

#### GET /api/self-evaluations
แบบประเมินตนเอง ข้อมูลเป็น หัวข้อ > ตัวชี้วัด แต่ละตัวชี้วัดมี:
- `score`: คะแนนที่กรอก
- `evidences`: รายละเอียด/หลักฐาน
- `progress`: ความคืบหน้า (%)

**Responses**
- **200**
  ```json
  {
    "status": "success",
    "message": "สำเร็จ",
    "data": {
      "topics": [
        {
          "id": 1, "title": "ด้านการจัดการเรียนการสอน", "start_date": "2026-11-01", "end_date": "2026-12-31", "is_open": 1,
          "indicators": [
            {
              "id": 1, "name": "การจัดทำแผนการจัดการเรียนรู้", "weight": 20,
              "score_type": "scale_4", "evidence_type": "file", "score": 4,
              "evidences": [
                {
                  "id": 1, "self_evaluation_id": 1,
                  "description": "แผนการจัดการเรียนรู้วิชาการเขียนโปรแกรมเว็บ",
                  "file_path": "1762500000000-a1b2c3d4e5f6.pdf",
                  "file_name": "แผนการสอน.pdf", "url": null
                }
              ],
              "progress": 100
            }
          ]
        }
      ],
      "summary": { "indicator_count": 6, "filled": 6, "progress": 100 }
    }
  }
  ```

#### PUT /api/self-evaluations/{indicatorId}
กรอกหรือแก้คะแนนประเมินตนเอง ทำได้เฉพาะช่วงที่หัวข้อเปิดอยู่
- **Path:** `indicatorId` รหัสตัวชี้วัด
- **Body (JSON):** `score`* number
  - ตัวชี้วัดแบบ `scale_4`: 1-4
  - ตัวชี้วัดแบบ `yes_no`: 1 = มี, 0 = ไม่มี

**ตัวอย่าง Body**
```json
{ "score": 3 }
```

**Responses**
- **200**
  ```json
  { "status": "success", "message": "บันทึกคะแนนสำเร็จ", "data": null }
  ```
- **400** คะแนนไม่ตรงรูปแบบ:
  ```json
  { "status": "error", "message": "คะแนนต้องเป็น 1 (มี) หรือ 0 (ไม่มี)", "data": null }
  ```
- **400** หัวข้อปิดแล้ว:
  ```json
  { "status": "error", "message": "หัวข้อนี้ไม่อยู่ในช่วงเวลาการประเมิน", "data": null }
  ```
- **404**
  ```json
  { "status": "error", "message": "ไม่พบตัวชี้วัด", "data": null }
  ```

#### POST /api/self-evaluations/{indicatorId}/evidences
เพิ่มรายละเอียดประกอบ พร้อมอัปโหลดไฟล์หรือแนบ URL (เลือกอย่างใดอย่างหนึ่ง หรือไม่แนบก็ได้ตามชนิดหลักฐานของตัวชี้วัด)

**Path:** `indicatorId`

**Body (multipart/form-data)**
| ช่อง | คำอธิบาย |
|---|---|
| `description`* | รายละเอียดประกอบ ไม่เกิน 1000 ตัว |
| `file` | ไฟล์ PDF / JPG / PNG ไม่เกิน 10MB |
| `url` | ลิงก์หลักฐาน ต้องขึ้นต้นด้วย `http://` หรือ `https://` |

**Responses**
- **201**
  ```json
  { "status": "success", "message": "เพิ่มรายละเอียดประกอบสำเร็จ", "data": { "id": 8 } }
  ```
- **400** ชนิดไฟล์ไม่ถูกต้อง:
  ```json
  { "status": "error", "message": "รองรับเฉพาะไฟล์ PDF, JPG และ PNG", "data": null }
  ```
- **400** ไฟล์ใหญ่เกิน:
  ```json
  { "status": "error", "message": "ไฟล์ต้องมีขนาดไม่เกิน 10MB", "data": null }
  ```
- **400** แนบไม่ตรงชนิดหลักฐาน:
  ```json
  { "status": "error", "message": "ตัวชี้วัดนี้ต้องแนบหลักฐานเป็นไฟล์", "data": null }
  ```
- **400** หัวข้อปิดแล้ว:
  ```json
  { "status": "error", "message": "หัวข้อนี้ไม่อยู่ในช่วงเวลาการประเมิน", "data": null }
  ```
- **404**
  ```json
  { "status": "error", "message": "ไม่พบตัวชี้วัด", "data": null }
  ```

### Evidences (ไฟล์หลักฐาน)

#### GET /api/evidences/{id}/file
ดาวน์โหลดไฟล์หลักฐาน ได้ไฟล์จริงพร้อมชื่อเดิม ไม่ใช่ JSON

**Path:** `id` รหัสรายละเอียดประกอบ

**ใครดาวน์โหลดได้**
- hr: ทุกไฟล์
- ผู้รับการประเมิน: เฉพาะของตัวเอง
- กรรมการ: เฉพาะของผู้ที่ได้รับมอบหมาย

**Responses**
- **200**: ไฟล์ (`Content-Disposition: attachment`)
- **403**
  ```json
  { "status": "error", "message": "ไม่มีสิทธิ์ดาวน์โหลดไฟล์นี้", "data": null }
  ```
- **404** ไม่มีรายการนี้ หรือรายการนี้ไม่มีไฟล์:
  ```json
  { "status": "error", "message": "ไม่พบไฟล์", "data": null }
  ```

#### DELETE /api/evidences/{id}
ลบรายละเอียดประกอบของตัวเอง (ไฟล์ถูกลบตาม) ทำได้เฉพาะช่วงที่หัวข้อเปิด

**Path:** `id`

**Responses**
- **200**
  ```json
  { "status": "success", "message": "ลบรายละเอียดประกอบสำเร็จ", "data": null }
  ```
- **400** หัวข้อปิดแล้ว:
  ```json
  { "status": "error", "message": "หัวข้อนี้ไม่อยู่ในช่วงเวลาการประเมิน", "data": null }
  ```
- **404** ไม่พบ หรือไม่ใช่ของตัวเอง:
  ```json
  { "status": "error", "message": "ไม่พบรายละเอียดประกอบ", "data": null }
  ```

### Committee (กรรมการ)
ทุก endpoint ในกลุ่มนี้เห็นเฉพาะงานที่ได้รับมอบหมายของกรรมการที่ login อยู่ ถ้าขอ `id` ของกรรมการคนอื่นจะได้ 404

#### GET /api/committee/assignments
รายชื่อผู้รับการประเมินที่ต้องประเมิน

**Responses**
- **200**
  - `scored_count`: ตัวชี้วัดที่กรรมการให้คะแนนแล้ว
  - `self_count`: ตัวชี้วัดที่ผู้รับการประเมินกรอกแล้ว
  ```json
  {
    "status": "success",
    "message": "สำเร็จ",
    "data": [
      {
        "id": 4, "evaluatee_id": 6, "committee_role": "chair", "status": "pending", "confirmed_at": null,
        "full_name": "มาลี ศรีสุข", "position": "ครู", "department": "แผนกเทคโนโลยีสารสนเทศ",
        "scored_count": 0, "self_count": 3, "indicator_count": 6
      }
    ]
  }
  ```

#### GET /api/committee/assignments/{id}
ข้อมูลสำหรับประเมินผู้รับการประเมิน 1 คน

**Path:** `id` รหัสการมอบหมาย

**ข้อมูลที่ได้**
- ข้อมูลผู้รับการประเมิน
- หัวข้อ > ตัวชี้วัด แต่ละตัวมี:
  - `self_score`: คะแนนตนเอง
  - `evidences`: หลักฐาน
  - `score`: คะแนนที่กรรมการให้
  - `weighted_score`: คะแนนถ่วงน้ำหนัก
- `summary`: ตารางสรุป

**Responses**
- **200**
  ```json
  {
    "status": "success",
    "message": "สำเร็จ",
    "data": {
      "assignment": { "id": 1, "committee_id": 2, "evaluatee_id": 5, "committee_role": "chair", "status": "draft", "summary_comment": "ผลงานดีมาก", "signature": null, "confirmed_at": null },
      "evaluatee": { "id": 5, "full_name": "สมชาย รักเรียน", "email": "teach1@school.ac.th", "phone": "0810000005", "position": "ครู", "department": "แผนกเทคโนโลยีสารสนเทศ" },
      "topics": [
        {
          "id": 1, "title": "ด้านการจัดการเรียนการสอน",
          "indicators": [
            {
              "id": 1, "name": "การจัดทำแผนการจัดการเรียนรู้", "weight": 20, "score_type": "scale_4",
              "self_score": 4,
              "evidences": [{ "id": 1, "description": "แผนการจัดการเรียนรู้", "file_name": "แผนการสอน.pdf", "url": null }],
              "score": 4, "weighted_score": 20
            }
          ]
        }
      ],
      "summary": { "indicator_count": 6, "scored": 6, "total": 91.25, "total_weight": 100, "percent": 91.25 }
    }
  }
  ```
- **404**
  ```json
  { "status": "error", "message": "ไม่พบงานที่ได้รับมอบหมาย", "data": null }
  ```

#### PUT /api/committee/assignments/{id}/scores
บันทึกร่างคะแนนและความเห็นสรุป
- ให้คะแนนไม่ครบก็บันทึกได้ และแก้ได้จนกว่าจะยืนยัน
- บันทึกทุกคะแนนพร้อมกันใน transaction
- สถานะเปลี่ยนเป็น `draft`

**Path:** `id`

**Body (JSON)**
| ช่อง | ชนิด | คำอธิบาย |
|---|---|---|
| `scores`* | array | รายการ `{ indicator_id, score }` (score ตามรูปแบบตัวชี้วัด: 1-4 หรือ 0/1) |
| `summary_comment` | string | ความเห็นสรุป ไม่เกิน 2000 ตัว |

**ตัวอย่าง Body**
```json
{
  "scores": [{ "indicator_id": 1, "score": 4 }, { "indicator_id": 3, "score": 1 }],
  "summary_comment": "ผลงานดีมาก ควรพัฒนาด้านสื่อการสอน"
}
```

**Responses**
- **200**
  ```json
  { "status": "success", "message": "บันทึกร่างสำเร็จ", "data": null }
  ```
- **400** คะแนนไม่ตรงรูปแบบ:
  ```json
  { "status": "error", "message": "คะแนนของ \"การจัดทำแผนการจัดการเรียนรู้\" ไม่ถูกต้อง", "data": null }
  ```
- **400** ยืนยันแล้ว:
  ```json
  { "status": "error", "message": "ยืนยันผลแล้ว แก้ไขไม่ได้", "data": null }
  ```
- **404**
  ```json
  { "status": "error", "message": "ไม่พบงานที่ได้รับมอบหมาย", "data": null }
  ```

#### PUT /api/committee/assignments/{id}/confirm
ลงลายเซ็นและยืนยันผล หลังจากนี้แก้ไขไม่ได้
- ต้องให้คะแนนครบทุกตัวชี้วัดและบันทึกความเห็นสรุปแล้ว
- **Path:** `id`
- **Body (JSON):** `signature`* string รูปลายเซ็น PNG แบบ data URL จาก `canvas.toDataURL()` ไม่เกิน 1MB

**ตัวอย่าง Body**
```json
{ "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." }
```

**Responses**
- **200**
  ```json
  { "status": "success", "message": "ยืนยันและส่งผลการประเมินสำเร็จ", "data": null }
  ```
- **400** ยังไม่ลงลายเซ็น:
  ```json
  { "status": "error", "message": "กรุณาลงลายเซ็น", "data": [{ "field": "signature", "message": "กรุณาลงลายเซ็น" }] }
  ```
- **400** ให้คะแนนไม่ครบ:
  ```json
  { "status": "error", "message": "ยังให้คะแนนไม่ครบ (4/6 ตัวชี้วัด)", "data": null }
  ```
- **400** ไม่มีความเห็นสรุป:
  ```json
  { "status": "error", "message": "กรุณาบันทึกความเห็นสรุปก่อนยืนยัน", "data": null }
  ```
- **400** ยืนยันไปแล้ว:
  ```json
  { "status": "error", "message": "ยืนยันผลไปแล้ว", "data": null }
  ```
- **404**
  ```json
  { "status": "error", "message": "ไม่พบงานที่ได้รับมอบหมาย", "data": null }
  ```

### Reports (รายงานและ Dashboard)

#### GET /api/reports/overview
ข้อมูล Dashboard ของ hr

**ข้อมูลที่ได้**
- จำนวนผู้ใช้ / หัวข้อ / ตัวชี้วัด
- สถานะการประเมินของกรรมการ
- ความคืบหน้าการบันทึก
- ค่าเฉลี่ย / สูงสุด / ต่ำสุด ของคะแนน
- ค่าเฉลี่ยรายหัวข้อ
- อันดับ 5 คนแรก
- `issues`: ผลตรวจความถูกต้องของข้อมูล (ว่าง = ข้อมูลครบ)

**Responses**
- **200**
  ```json
  {
    "status": "success",
    "message": "สำเร็จ",
    "data": {
      "counts": { "evaluatees": 5, "committees": 3, "topics": 2, "open_topics": 2, "indicators": 6 },
      "assignments": { "total": 13, "pending": 11, "draft": 1, "confirmed": 1 },
      "progress": { "average": 26.67, "completed": 1, "fully_evaluated": 0 },
      "scores": { "evaluated": 1, "average": 91.25, "max": 91.25, "min": 91.25 },
      "topics": [
        { "id": 1, "title": "ด้านการจัดการเรียนการสอน", "is_open": 1, "indicator_count": 3, "total_weight": 50, "avg_percent": 92.5 }
      ],
      "ranking": [
        { "id": 5, "full_name": "สมชาย รักเรียน", "progress": 100, "confirmed_count": 1, "committee_total": 91.25, "committee_percent": 91.25 }
      ],
      "issues": ["น้ำหนักรวมของตัวชี้วัดทั้งหมดเท่ากับ 110 (ควรเท่ากับ 100)", "ธนพล บุญมี ยังไม่มีประธานกรรมการ"]
    }
  }
  ```

#### GET /api/reports/evaluatees
สรุปผลรายผู้รับการประเมิน (hr)

**Query:** `sort` (ไม่บังคับ)
- `score`: คะแนนมาก-น้อย
- `progress`: % การบันทึกมาก-น้อย
- `name`: ชื่อ ก-ฮ

**Responses**
- **200**: `committee_total` และ `committee_percent` เป็น `null` ถ้ายังไม่มีกรรมการยืนยัน
  ```json
  {
    "status": "success",
    "message": "สำเร็จ",
    "data": [
      {
        "id": 5, "username": "teach1", "full_name": "สมชาย รักเรียน", "position": "ครู", "department": "แผนกเทคโนโลยีสารสนเทศ",
        "total_weight": 100, "indicator_count": 6, "filled": 6, "progress": 100, "self_total": 91.25,
        "committee_count": 3, "confirmed_count": 1, "committee_total": 91.25, "committee_percent": 91.25
      }
    ]
  }
  ```

#### GET /api/reports/evaluatees/{id}
รายงานผลการประเมินรายบุคคล

**Path:** `id` รหัสผู้รับการประเมิน

**ใครดูได้**
- hr: ทุกคน
- ผู้รับการประเมิน: เฉพาะของตัวเอง และเห็นเฉพาะผลของกรรมการที่ยืนยันแล้ว
- กรรมการ: เฉพาะคนที่ได้รับมอบหมาย

**Responses**
- **200**: `rows[].scores` คือคะแนนของกรรมการแต่ละคน key เป็นรหัสการมอบหมาย
  ```json
  {
    "status": "success",
    "message": "สำเร็จ",
    "data": {
      "evaluatee": { "id": 5, "username": "teach1", "full_name": "สมชาย รักเรียน", "position": "ครู", "department": "แผนกเทคโนโลยีสารสนเทศ" },
      "assignments": [
        { "id": 1, "committee_name": "ประเสริฐ วงศ์ดี", "committee_role": "chair", "status": "confirmed", "summary_comment": "ผลงานดีมาก", "signature": "data:image/png;base64,...", "confirmed_at": "2026-11-05 10:00:00" }
      ],
      "rows": [
        {
          "id": 1, "topic_title": "ด้านการจัดการเรียนการสอน", "name": "การจัดทำแผนการจัดการเรียนรู้", "weight": 20,
          "score_type": "scale_4", "self_score": 4, "evidence_count": 1, "progress": 100,
          "scores": { "1": 4, "2": 3 }, "avg_score": 4, "self_weighted": 20, "committee_weighted": 20
        }
      ],
      "summary": {
        "total_weight": 100, "indicator_count": 6, "filled": 6, "progress": 100, "self_total": 91.25,
        "committee_count": 3, "confirmed_count": 1, "committee_total": 91.25, "committee_percent": 91.25
      }
    }
  }
  ```
- **403** ผู้รับการประเมินขอดูของคนอื่น:
  ```json
  { "status": "error", "message": "ดูได้เฉพาะผลของตนเอง", "data": null }
  ```
- **403** กรรมการขอดูคนที่ไม่ได้รับมอบหมาย:
  ```json
  { "status": "error", "message": "ไม่ได้รับมอบหมายให้ประเมินผู้นี้", "data": null }
  ```
- **404**
  ```json
  { "status": "error", "message": "ไม่พบผู้รับการประเมิน", "data": null }
  ```

#### GET /api/reports/committees
ติดตามสถานะการประเมินของกรรมการแต่ละคน (hr)
- **200**
  ```json
  {
    "status": "success",
    "message": "สำเร็จ",
    "data": [
      { "id": 2, "full_name": "ประเสริฐ วงศ์ดี", "position": "รองผู้อำนวยการ", "department": "ฝ่ายวิชาการ", "total": 4, "pending": 3, "draft": 0, "confirmed": 1 }
    ]
  }
  ```

#### GET /api/reports/committees/{id}
สรุปการประเมินของกรรมการ 1 คน เป็นตาราง ตัวชี้วัด x ผู้รับการประเมิน (hr)

**Path:** `id` รหัสผู้ใช้ที่เป็นกรรมการ

**Responses**
- **200**: `rows[].scores` มี key เป็นรหัสตัวชี้วัด
  ```json
  {
    "status": "success",
    "message": "สำเร็จ",
    "data": {
      "committee": { "id": 2, "full_name": "ประเสริฐ วงศ์ดี", "position": "รองผู้อำนวยการ", "department": "ฝ่ายวิชาการ" },
      "indicators": [{ "id": 1, "topic_title": "ด้านการจัดการเรียนการสอน", "name": "การจัดทำแผนการจัดการเรียนรู้", "weight": 20, "score_type": "scale_4" }],
      "rows": [
        { "id": 1, "evaluatee_id": 5, "evaluatee_name": "สมชาย รักเรียน", "committee_role": "chair", "status": "confirmed", "summary_comment": "ผลงานดีมาก", "confirmed_at": "2026-11-05 10:00:00", "scores": { "1": 4 }, "total": 91.25 }
      ]
    }
  }
  ```
- **404**
  ```json
  { "status": "error", "message": "ไม่พบกรรมการ", "data": null }
  ```

### Backups (สำรองและกู้คืนข้อมูล, hr เท่านั้น)

**วิธีทำงาน**
- backend เรียก `mysqldump` (สำรอง) และ `mysql` (กู้คืน) ได้ 2 แบบ ตามที่รัน:
  - รันใน Docker: image ของ backend ติดตั้ง mysql-client ไว้ เรียกตรงไปที่ service `mysql`
  - รันบนเครื่อง (`npm run dev`): สั่ง `docker exec` ไปที่ container ที่ตั้งชื่อไว้ใน `DB_CONTAINER`
- ไฟล์สำรองจากทั้ง 2 แบบใช้กู้คืนสลับกันได้
- ไฟล์สำรองเก็บที่ `backend/backups/`
- ก่อนกู้คืนทุกครั้ง ระบบสำรองข้อมูลปัจจุบันไว้เป็นไฟล์ `...-before-restore.sql` อัตโนมัติ
- **ข้อจำกัด:** สำรองเฉพาะฐานข้อมูล ไม่รวมไฟล์หลักฐานใน `backend/uploads/`

#### GET /api/backups
รายการไฟล์สำรอง ใหม่สุดก่อน
- **200**
  ```json
  {
    "status": "success",
    "message": "สำเร็จ",
    "data": [{ "name": "backup-2026-11-07-14-30-00.sql", "size": 48211, "created_at": "2026-11-07T07:30:00.000Z" }]
  }
  ```

#### POST /api/backups
สำรองข้อมูลตอนนี้ (ไม่มี body)
- **201**
  ```json
  { "status": "success", "message": "สำรองข้อมูลสำเร็จ", "data": { "name": "backup-2026-11-07-14-30-00.sql" } }
  ```
- **500** เช่น container ไม่ทำงาน:
  ```json
  { "status": "error", "message": "สำรองข้อมูลไม่สำเร็จ: Error response from daemon: ...", "data": null }
  ```

#### GET /api/backups/{name}/download
ดาวน์โหลดไฟล์สำรอง

**Path:** `name` ชื่อไฟล์ เช่น `backup-2026-11-07-14-30-00.sql`

**Responses**
- **200**: ไฟล์ `.sql`
- **404** ไม่มีไฟล์ หรือชื่อไม่ตรงรูปแบบ:
  ```json
  { "status": "error", "message": "ไม่พบไฟล์สำรอง", "data": null }
  ```

#### POST /api/backups/{name}/restore
กู้คืนจากไฟล์สำรองที่อยู่บน server

**Path:** `name`

**Responses**
- **200**
  ```json
  {
    "status": "success",
    "message": "กู้คืนข้อมูลสำเร็จ (ข้อมูลก่อนกู้คืนถูกเก็บไว้ที่ backup-2026-11-07-14-35-10-before-restore.sql)",
    "data": { "before": "backup-2026-11-07-14-35-10-before-restore.sql" }
  }
  ```
- **404**
  ```json
  { "status": "error", "message": "ไม่พบไฟล์สำรอง", "data": null }
  ```
- **500**
  ```json
  { "status": "error", "message": "กู้คืนข้อมูลไม่สำเร็จ: ...", "data": null }
  ```

#### POST /api/backups/restore
กู้คืนจากไฟล์ `.sql` ที่อัปโหลด (ไฟล์ที่ดาวน์โหลดจากระบบนี้)

**Body (multipart/form-data):** `file`* ไฟล์ `.sql`

**Responses**
- **200**: เหมือน `POST /api/backups/{name}/restore`
- **400** ไม่ได้เลือกไฟล์:
  ```json
  { "status": "error", "message": "กรุณาเลือกไฟล์ .sql", "data": null }
  ```
- **400** ไม่ใช่ไฟล์ .sql:
  ```json
  { "status": "error", "message": "รองรับเฉพาะไฟล์ .sql", "data": null }
  ```
- **400** ไม่ใช่ไฟล์สำรองของระบบ:
  ```json
  { "status": "error", "message": "ไฟล์นี้ไม่ใช่ไฟล์สำรองของระบบประเมินบุคลากร", "data": null }
  ```

#### DELETE /api/backups/{name}
ลบไฟล์สำรอง

**Path:** `name`

**Responses**
- **200**
  ```json
  { "status": "success", "message": "ลบไฟล์สำรองสำเร็จ", "data": null }
  ```
- **404**
  ```json
  { "status": "error", "message": "ไม่พบไฟล์สำรอง", "data": null }
  ```
