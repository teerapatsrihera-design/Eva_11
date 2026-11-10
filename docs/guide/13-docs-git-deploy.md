# บทที่ 13: เอกสาร API, Git และ Deploy

## เป้าหมาย

เรียนจบบทนี้แล้ว นักเรียนจะ
- เขียนเอกสาร API ใน README.md ให้ได้คะแนนครบ
- ใช้ Git บันทึกงาน และ push ขึ้น GitLab ของกรรมการ
- แพ็กทั้งระบบด้วย Docker แล้ว deploy บนเครื่องแม่ข่าย
- เตรียมเครื่องให้ทำงานได้แม้ไม่มีอินเทอร์เน็ต

🏆 ได้คะแนน 16 คะแนน

| ส่วน | ข้อ | คะแนน | อยู่ที่ |
|---|---|---|---|
| 4 | 4.1-4.5 ออกแบบ RESTful API (เอกสาร) | 5 | 13.2 |
| 6 | 6.9 คำอธิบาย API, 6.10 ระบุ parameter | 2 | 13.2 |
| 7 | 7.8 ใช้งาน GitLab Server | 2 | 13.3 |
| 7 | 7.9 แสดงผลบนเครื่องแม่ข่าย | 2 | 13.4, 13.5 |

⏱️ ครั้งแรกที่เรียน: ประมาณ **3 ชั่วโมง** | วันแข่ง: README **30 นาที** (ทยอยเขียนระหว่างทำ), Git **5 นาที**, Deploy **15 นาที**

### บทนี้แบ่งเป็นขั้นเล็กๆ

| ภาค | ทำอะไร | จำนวนขั้น |
|---|---|---|
| ภาค ก (13.1) | กรรมการตรวจอะไร และระบบรันได้กี่แบบ | 2 ขั้น |
| ภาค ข (13.2-13.6) | เขียนเอกสาร ใช้ Git และ deploy | 17 ขั้น |

### ไฟล์ที่จะสร้าง/แก้ในบทนี้

```
C:\Eva_Learn\
├── README.md                 ← ขั้น 13.2  เอกสาร API
├── docker-compose.yml        ← ขั้น 13.4.3-13.4.5  (แก้) เพิ่ม healthcheck, backend, frontend
├── backend/
│   ├── .dockerignore         ← ขั้น 13.4.1
│   └── Dockerfile            ← ขั้น 13.4.1
└── frontend/
    ├── .dockerignore         ← ขั้น 13.4.2
    └── Dockerfile            ← ขั้น 13.4.2
```

---

# ภาค ก: ภาพรวม

## 13.1 สิ่งที่ต้องรู้ก่อน

### ขั้นที่ 13.1.1 กรรมการตรวจเอกสาร API อะไรบ้าง

> 🎯 **ขั้นนี้จะได้:** รู้ว่าต้องมีอะไรใน README ถึงได้ 7 คะแนน

| เกณฑ์ | ต้องมีในเอกสาร |
|---|---|
| 4.1 | ใช้ GET/POST/PUT/DELETE ถูกความหมาย |
| 4.2 | ชื่อ endpoint สื่อความหมาย สอดคล้องกัน (เช่น `/api/users`, `/api/users/{id}`) |
| 4.3 | **ตัวอย่าง Response Body ตาม Status Code** |
| 4.4 | **กรณี Error เช่น 401, 404** |
| 4.5 | แนวทางความปลอดภัย (JWT, ตรวจสิทธิ์) |
| 6.9 | คำอธิบายแต่ละ API |
| 6.10 | **ระบุ parameter: query, path, body** |

ดูตัวอย่างเต็มได้ที่ [README.md ของโปรเจกต์](../../README.md)

### ขั้นที่ 13.1.2 ระบบรันได้ 2 แบบ

> 🎯 **ขั้นนี้จะได้:** เข้าใจว่าทำไมค่าตั้งค่าบางตัวต่างกันระหว่างตอนพัฒนากับตอน deploy

```text
แบบพัฒนา (บท 01-12)                       แบบ deploy (บทนี้)
──────────────────────                    ──────────────────────
Docker: mysql                             Docker: mysql + backend + frontend
บนเครื่อง: npm run dev (backend)          ไม่ต้องลง Node.js บนเครื่องแม่ข่าย
บนเครื่อง: npm run dev (frontend)         สั่งคำสั่งเดียว docker compose up -d --build
```

| ค่า | แบบพัฒนา | แบบ deploy | เพราะ |
|---|---|---|---|
| `DB_HOST` | `localhost` | `mysql` | ในเครือข่ายของ Docker กล่องเรียกกันด้วย **ชื่อ service** |
| `API_URL` (frontend) | `http://localhost:5000` | `http://backend:5000` | เหตุผลเดียวกัน (บท 07 ขั้น 7.4.1) |
| `DB_CONTAINER` (backup) | `eva_mysql` | ว่าง | กล่อง backend ลง mysql-client เอง ไม่ต้อง `docker exec` (บท 11 ขั้น 11.1.3) |

> 💡 "localhost" ข้างในกล่อง = ตัวกล่องเอง ไม่ใช่เครื่องเรา นี่คือสาเหตุที่ backend ในกล่องใช้ `localhost` ต่อ MySQL ไม่ได้

---

# ภาค ข: ลงมือทำ

## 13.2 เอกสาร API ใน README.md (เกณฑ์ 4.1-4.5, 6.9, 6.10)

### ขั้นที่ 13.2.1 โครงเอกสาร

> 🎯 **ขั้นนี้จะได้:** หัวข้อหลักของ README ครบ

⌨️ **พิมพ์:** สร้างไฟล์ `README.md` ที่โฟลเดอร์หลัก (ถ้ามีแล้วให้แก้)

```markdown
# ระบบประเมินบุคลากร
## วิธีรัน
## API: หลักการออกแบบ          ← 4.1, 4.2 + รูปแบบ response + ตาราง status code
## API: ความปลอดภัย            ← 4.5
## API: รายการ Endpoint ทั้งหมด  ← ตารางสรุป
## API: รายละเอียดแต่ละ Endpoint ← 6.9, 6.10, 4.3, 4.4
```

| หัวข้อ | เขียนอะไร |
|---|---|
| วิธีรัน | คำสั่งในขั้น 13.4.6 และ 13.5.1 |
| หลักการออกแบบ | ขั้น 13.2.2 |
| ความปลอดภัย | ขั้น 13.2.3 |
| รายการ Endpoint | ขั้น 13.2.4 |
| รายละเอียด | ขั้น 13.2.5 |

> 💡 `#` = หัวข้อใหญ่, `##` = หัวข้อรอง (Markdown) VS Code กด `Ctrl+Shift+V` ดูตัวอย่างหน้าตาได้

### ขั้นที่ 13.2.2 หลักการออกแบบ (เขียนครั้งเดียว ใช้ได้ทุก endpoint)

> 🎯 **ขั้นนี้จะได้:** เกณฑ์ 4.1-4.4 ในส่วนเดียว

⌨️ **พิมพ์:** ใต้หัวข้อ `## API: หลักการออกแบบ`

````markdown
**Base URL:** `http://localhost:5000/api`

**รูปแบบ Response:** ทุก endpoint ตอบรูปแบบเดียวกัน
```json
{ "status": "success", "message": "ข้อความอธิบาย", "data": { } }
```

| Code | ความหมาย | ตัวอย่างกรณี |
|---|---|---|
| 200 | สำเร็จ | อ่าน / แก้ไข / ลบสำเร็จ |
| 201 | สร้างข้อมูลใหม่สำเร็จ | POST /users |
| 400 | ข้อมูลไม่ถูกต้อง | ไม่กรอกช่องบังคับ, อีเมลผิด |
| 401 | ยังไม่ login / token ผิด | ไม่ส่ง Authorization |
| 403 | ไม่มีสิทธิ์ | ผู้รับการประเมินเรียก /users |
| 404 | ไม่พบข้อมูล | GET /users/999 |
| 500 | ระบบผิดพลาด | ฐานข้อมูลล่ม |

401 ไม่ได้ส่ง token:
```json
{ "status": "error", "message": "กรุณาเข้าสู่ระบบ", "data": null }
```
````

| ส่วน | ได้เกณฑ์ |
|---|---|
| Base URL + รูปแบบ response เดียว | 4.1, 4.2 |
| ตาราง status code | 4.3 |
| ตัวอย่าง error 401 (เขียนเพิ่ม 403, 404 แบบเดียวกัน) | 4.4 |

> 💡 **ทริคประหยัดเวลา:** เขียนตัวอย่าง error (400/401/403/404/500) ไว้ครั้งเดียวในส่วนนี้ แล้วในแต่ละ endpoint เขียนเฉพาะ response ที่เป็นของ endpoint นั้น
> 💡 ข้อความ error ใช้ของจริงจากระบบ: 401 ไม่มี token = "กรุณาเข้าสู่ระบบ", token ผิด = "Token ไม่ถูกต้องหรือหมดอายุ", 403 = "ไม่มีสิทธิ์เข้าถึง" (บท 04 ขั้น 4.5)

### ขั้นที่ 13.2.3 ความปลอดภัย (เกณฑ์ 4.5)

> 🎯 **ขั้นนี้จะได้:** รายการมาตรการความปลอดภัย

⌨️ **พิมพ์:** ใต้หัวข้อ `## API: ความปลอดภัย` เป็นข้อๆ (สรุปจากบท 04 หัวข้อ 4.9)

1. JWT ลงนามด้วย `JWT_SECRET` มีวันหมดอายุ (`JWT_EXPIRES_IN`)
2. ส่ง `Authorization: Bearer <token>` ทุก request
3. `verifyToken` ทุก endpoint ยกเว้น login → 401
4. `requireRole(...)` ตรวจบทบาท → 403
5. ตรวจความเป็นเจ้าของข้อมูล (ใช้ id จาก token ไม่เชื่อ id ที่ส่งมา)
6. รหัสผ่านเก็บเป็น hash (scrypt + salt)
7. Validate ทุก body ด้วย Zod และใช้ `?` ใน SQL (กัน SQL Injection)
8. ไฟล์อัปโหลด: จำกัดชนิดและขนาด, ตั้งชื่อสุ่ม, ดาวน์โหลดผ่าน API ที่ตรวจสิทธิ์

### ขั้นที่ 13.2.4 ตารางรายการ Endpoint ทั้งหมด

> 🎯 **ขั้นนี้จะได้:** ตารางเดียวเห็นภาพรวมทุก API

⌨️ **พิมพ์:** ใต้หัวข้อ `## API: รายการ Endpoint ทั้งหมด`

```markdown
| Method | Endpoint | สิทธิ์ | คำอธิบาย |
|---|---|---|---|
| POST | `/api/auth/login` | ไม่ต้อง login | เข้าสู่ระบบ รับ JWT token |
| GET | `/api/topics` | ทุกบทบาท | หัวข้อทั้งหมด พร้อมตัวชี้วัด |
| POST | `/api/topics` | hr | เพิ่มหัวข้อ |
| ... | | | |
```

| คอลัมน์ | ได้เกณฑ์ |
|---|---|
| Method + Endpoint | 4.1, 4.2 (เห็นว่าใช้ method ถูกความหมาย ชื่อสอดคล้องกัน) |
| สิทธิ์ | 4.5 |
| คำอธิบาย | 6.9 |

> 💡 คัดลอกรายการ route จากไฟล์ใน `backend/routes/` ทีละไฟล์ จะไม่ตกหล่น (ทั้งระบบมีประมาณ 45 endpoint)

### ขั้นที่ 13.2.5 รายละเอียด 1 endpoint (แม่แบบ)

> 🎯 **ขั้นนี้จะได้:** แม่แบบที่ใช้ซ้ำได้ทุก endpoint

⌨️ **พิมพ์:** ใต้หัวข้อ `## API: รายละเอียดแต่ละ Endpoint`

````markdown
#### POST /api/topics
เพิ่มหัวข้อการประเมิน (hr)

**Body (JSON)**
| ช่อง | ชนิด | คำอธิบาย |
|---|---|---|
| `title`* | string | ชื่อหัวข้อ ไม่เกิน 200 ตัว |
| `description` | string | คำอธิบาย |
| `start_date`* | string | วันเริ่ม `YYYY-MM-DD` |
| `end_date`* | string | วันสิ้นสุด ต้องไม่ก่อนวันเริ่ม |

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
````

| ส่วน | ได้เกณฑ์ |
|---|---|
| บรรทัดใต้ชื่อ endpoint | 6.9 คำอธิบาย |
| ตาราง Body (`*` = บังคับ) | 6.10 parameter แบบ body |
| Responses ตาม status code | 4.3, 4.4 |

💡 **ระบุ parameter ให้ครบ 3 แบบ (เกณฑ์ 6.10)**

| แบบ | ตัวอย่างในระบบ | เขียนในเอกสาร |
|---|---|---|
| **Path** | `/api/topics/{id}` | `id` รหัสหัวข้อ |
| **Query** | `/api/users?role=evaluatee&q=สม` | `role` กรองบทบาท, `q` ค้นหาชื่อ |
| **Body** | POST/PUT | ตารางช่อง + ชนิด + บังคับ (`*`) |

💡 **ทริคเก็บตัวอย่าง response จริง:** ยิงใน Thunder Client แล้วคัดลอก response มาวาง ได้ข้อความตรงกับระบบ 100%

> 🏃 **วันแข่งเวลาน้อย:** เขียนหลักการ + ความปลอดภัย + ตารางรวมให้ครบก่อน แล้วเขียนรายละเอียดเต็มอย่างน้อย 1 endpoint ต่อแบบ (GET มี query, GET มี path, POST, PUT, DELETE) แล้วค่อยเติม

## 13.3 Git และ GitLab (เกณฑ์ 7.8)

### ขั้นที่ 13.3.1 คำสั่งที่ใช้ทุกวัน

> 🎯 **ขั้นนี้จะได้:** บันทึกงานเป็นระยะ (เริ่ม `git init` ไว้แล้วในบท 01)

```bash
git status                       # ดูว่าแก้ไฟล์ไหนบ้าง
git add .                        # เลือกไฟล์ทั้งหมดที่แก้
git commit -m "Add topics CRUD"  # บันทึกพร้อมข้อความ
git log --oneline                # ดูประวัติ
```

| คำสั่ง | ทำอะไร | เปรียบเทียบ |
|---|---|---|
| `git add .` | เลือกไฟล์ที่จะบันทึก (`.` = ทุกไฟล์ในโฟลเดอร์นี้) | หยิบของใส่กล่อง |
| `git commit -m "…"` | บันทึกพร้อมข้อความ | ปิดกล่อง เขียนป้ายว่าข้างในคืออะไร |
| `git log --oneline` | ดูประวัติ 1 บรรทัดต่อ commit | ดูรายการกล่องที่เก็บไว้ |

💡 **commit บ่อยๆ ทุกครั้งที่ทำงานเสร็จ 1 ชิ้น** เช่น "Login เสร็จ", "หน้าหัวข้อเสร็จ" ถ้าพังจะย้อนกลับได้ใกล้ที่สุด

💡 **ข้อความ commit** เขียนภาษาอังกฤษสั้นๆ บอกว่าทำอะไร
- ✅ `Add JWT login and role guard`
- ✅ `Fix progress calculation`
- ❌ `update`, `aaa`, `แก้`

### ขั้นที่ 13.3.2 ย้อนกลับเมื่อทำพัง

> 🎯 **ขั้นนี้จะได้:** ยกเลิกการแก้ที่ทำให้โค้ดพัง

```bash
git diff                 # ดูว่าแก้อะไรไป (บรรทัด + เพิ่ม, - ลบ)
git restore ชื่อไฟล์       # ยกเลิกการแก้ไฟล์นั้น กลับไปเหมือน commit ล่าสุด
```

> ⚠️ `git restore` ลบการแก้ที่ยังไม่ commit **ทิ้งถาวร** ตรวจด้วย `git diff` ก่อนเสมอ

### ขั้นที่ 13.3.3 ทำงานเป็นทีม 3 คน (แยกตามเส้น API)

> 🎯 **ขั้นนี้จะได้:** รวมงานกับเพื่อนโดยไม่ชนกัน

ทุกคนเขียนทั้ง frontend และ backend ของเส้น API ที่ตัวเองรับผิดชอบ (ดูว่าเส้นไหนใช้ไฟล์ไหนใน [แผนที่ API](../api-map/shared.html) ทุกคนอ่านไฟล์ส่วนกลาง shared.html ก่อน แล้วค่อยเปิดไฟล์ของตัวเอง)

| คนที่ | ส่วนกลาง (ทำชั่วโมงแรก) | เส้น API ของตัวเอง | แผนที่ API |
|---|---|---|---|
| 1 | backend ส่วนกลาง + Field, Modal, Layout, StatusBadge | งานบุคลากร | [person-1-hr.html](../api-map/person-1-hr.html) |
| 2 | schema.sql + หน้า login, register, change-password + `utils/dataCheck.js` | ข้อมูลส่วนตัว + ประเมินตนเอง + หลักฐาน + สำรอง/กู้คืน + Dashboard | [person-2-evaluatee.html](../api-map/person-2-evaluatee.html) |
| 3 | frontend lib (api, auth, validate, format, constants) + `utils/score.js` | กรรมการ + รายงาน | [person-3-committee.html](../api-map/person-3-committee.html) |

1. **ทำส่วนกลางให้จบก่อนแยกกันทำ** ทุกคนทำส่วนกลางคนละชิ้นพร้อมกัน แล้ว push ให้ทุกคน pull ไปใช้ (ลำดับเวลาในบท 14 ขั้น 14.2.2)
2. หลังจากนั้นแต่ละคนแก้ไฟล์ของเส้นตัวเอง ถ้าต้องแก้ไฟล์ส่วนกลาง ให้บอกเจ้าของชิ้นนั้นก่อน แล้ว push ทันที (เช่น ผูก route ใหม่ใน `app.js` หรือเพิ่มเมนูใน `Layout.js` บอกคนที่ 1)
3. ถ้า pull แล้วขึ้น `CONFLICT` ให้เปิดไฟล์นั้นใน VS Code เลือกเก็บทั้งสองส่วน (Accept Both) แล้ว `git add .` และ `git commit`

```bash
git pull                 # ดึงงานล่าสุดของเพื่อนก่อนเริ่ม
# ... ทำงาน ...
git add .
git commit -m "Add committee page"
git pull                 # ดึงอีกรอบก่อน push (เผื่อเพื่อน push ไปแล้ว)
git push
```

### ขั้นที่ 13.3.4 Push ขึ้น GitLab ของกรรมการ (เกณฑ์ 7.8)

> 🎯 **ขั้นนี้จะได้:** โค้ดอยู่บน GitLab ของสนามแข่ง

1. เข้า GitLab ของสนามแข่ง → **New project** → **Create blank project**
2. คัดลอก URL ของ project (เช่น `http://gitlab.local/team01/eva.git`)
3. ตรวจก่อน: `git status` ต้อง **ไม่มี** `.env`, `node_modules/`, `uploads/`, `backups/` (ถ้ามี ตรวจ `.gitignore` บท 01)
4. ที่โฟลเดอร์โปรเจกต์

```bash
git remote add origin http://<gitlab-server>/<group>/<project>.git
git push -u origin master
```

| ส่วน | ความหมาย |
|---|---|
| `remote add origin <URL>` | จำที่อยู่ GitLab ไว้ในชื่อ `origin` (ทำครั้งเดียว) |
| `push -u origin master` | ส่ง branch `master` ขึ้นไป, `-u` = จำไว้ ครั้งต่อไปพิมพ์แค่ `git push` |

- ถ้ากรรมการให้ใช้ branch `main`: `git push -u origin master:main`
- ถ้าถาม username/password ใช้บัญชีที่กรรมการให้

✅ **ลองเลย:** เปิดหน้า project ใน GitLab ต้องเห็นไฟล์ครบ และ **ไม่มี** `.env`

> ⚠️ **ถ้าเผลอ commit `.env` ไปแล้ว:** `git rm --cached .env` แล้ว commit ใหม่ และเปลี่ยนรหัสผ่าน/JWT_SECRET ทันที (เพราะยังอยู่ในประวัติ)

## 13.4 แพ็กทั้งระบบด้วย Docker (เกณฑ์ 7.9)

📖 **Dockerfile** = สูตรสร้าง image ของโปรแกรมเรา (เหมือนบท 01 ที่ใช้ image `mysql:8.4` สำเร็จรูป แต่คราวนี้เราสร้างเอง)

### ขั้นที่ 13.4.1 Dockerfile ของ backend

> 🎯 **ขั้นนี้จะได้:** สูตรสร้างกล่อง backend ที่มี Node.js และ mysql-client

⌨️ **พิมพ์:** สร้างไฟล์ `backend/.dockerignore` (ไฟล์ที่ **ไม่** ส่งเข้ากล่อง)

```text
node_modules
uploads
backups
tests
.env
```

| บรรทัด | เพราะ |
|---|---|
| `node_modules` | กล่องลงใหม่เองด้วย `npm ci` (ของ Windows ใช้ใน Linux ไม่ได้บางตัว) |
| `uploads`, `backups` | ข้อมูล ไม่ใช่โค้ด (compose ต่อโฟลเดอร์ให้ทีหลัง) |
| `tests` | ไม่ใช้ตอนรันจริง |
| `.env` | **รหัสผ่านต้องไม่อยู่ใน image** (compose ส่งค่าให้แทน) |

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/Dockerfile` (ไม่มีนามสกุล)

```dockerfile
FROM node:24-alpine
# mysql-client ใช้ทำ Backup/Restore, tzdata ให้เวลาเป็นเวลาไทย
RUN apk add --no-cache mysql-client tzdata
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | เริ่มจาก image ที่มี Node.js 24 (`alpine` = Linux ขนาดเล็ก) | - |
| 3 | ลงโปรแกรมของ Linux: `mysql-client` (มี mysqldump) และข้อมูลเขตเวลา | Backup/Restore (บท 11) และเวลาไทย |
| 4 | โฟลเดอร์ทำงานในกล่อง = `/app` | คำสั่งถัดไปทำในโฟลเดอร์นี้ |
| 5 | คัดลอก `package.json` และ `package-lock.json` **ก่อน** | ดูหมายเหตุด้านล่าง |
| 6 | ลง package ตาม lock file เป๊ะ ไม่ลง devDependencies (nodemon) | กล่องเล็กลง |
| 7 | คัดลอกโค้ดทั้งหมด (ยกเว้นใน .dockerignore) | - |
| 8 | บอกว่าโปรแกรมใช้ port 5000 | - |
| 9 | คำสั่งเริ่มโปรแกรมเมื่อเปิดกล่อง | ใช้ `node` ไม่ใช่ `nodemon` (ไม่ต้องรีสตาร์ตเมื่อแก้ไฟล์) |

🧩 **Syntax ของ Dockerfile**

```syntax
[k:FROM] [p:node:24-alpine]
[k:RUN] [v:คำสั่ง shell ตอนสร้าง image]
[k:COPY] [v:ต้นทางในเครื่อง] [v:ปลายทางในกล่อง]
[k:CMD] [s:\[][v:"โปรแกรม"][s:,] [v:"ไฟล์"][s:\]]
```

| คำ | สี | ความหมาย |
|---|---|---|
| `FROM` `RUN` `WORKDIR` `COPY` `EXPOSE` `CMD` `ENV` | 🔵 | คำสั่งของ Dockerfile เขียนตัวใหญ่ทั้งหมด |
| `RUN` | 🔵 | ทำ **ตอนสร้าง** image (ลงโปรแกรม, build) |
| `CMD` | 🔵 | ทำ **ตอนเปิด** กล่อง (มีได้อันเดียว) |

**จำ:** ทำไม `COPY package*.json` + `npm ci` **ก่อน** `COPY . .`? Docker จำผลแต่ละบรรทัดไว้ (cache) ถ้าแก้แค่โค้ดแต่ไม่แก้ package.json บรรทัด 5-6 ใช้ของเดิม ไม่ต้องโหลด package ใหม่ **build เร็ว และ build ได้แม้ไม่มีเน็ต**

### ขั้นที่ 13.4.2 Dockerfile ของ frontend

> 🎯 **ขั้นนี้จะได้:** สูตรสร้างกล่องหน้าเว็บ (build แล้วรันแบบ production)

⌨️ **พิมพ์:** สร้างไฟล์ `frontend/.dockerignore`

```text
node_modules
.next
.env*
```

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/Dockerfile`

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# ที่อยู่ backend ใน network ของ Docker (ใช้ใน rewrites ของ next.config.mjs)
ENV API_URL=http://backend:5000
# ไม่ส่งสถิติการใช้งานของ Next.js (build ตอนออฟไลน์ได้ไม่ต้องรอเน็ต)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4 | `npm ci` ลงทุก package (รวม devDependencies) | ต้องใช้ tailwind, eslint ตอน build |
| 7 | ตั้งตัวแปร `API_URL` | rewrites ส่ง `/api/...` ไปกล่อง backend (บท 07 ขั้น 7.4.1) |
| 9 | ปิดการส่งสถิติของ Next.js | build ในห้องไม่มีเน็ตไม่ค้าง |
| 10 | build แบบ production (`.next`) | เปิดเร็วกว่า `npm run dev` มาก |
| 12 | `npm start` = `next start` เปิดหน้าเว็บที่ build แล้ว | - |

> 🧩 syntax ใหม่: `ENV ชื่อ=ค่า` = ตั้งตัวแปรสภาพแวดล้อมในกล่อง (เหมือนค่าใน `.env`)

### ขั้นที่ 13.4.3 docker-compose: ใส่คำอธิบาย และ healthcheck ให้ MySQL

> 🎯 **ขั้นนี้จะได้:** backend รอจน MySQL พร้อมจริงก่อนเริ่ม

⌨️ **แก้โค้ด:** เปิด `docker-compose.yml` (บท 01 ขั้น 1.5.2-1.5.3) เพิ่ม 3 บรรทัดนี้ **บนสุดของไฟล์**

```yaml
# รันทั้งระบบ (deploy):        docker compose up -d --build
# รันเฉพาะฐานข้อมูล (พัฒนา):  docker compose up -d mysql   แล้วรัน backend/frontend ด้วย npm run dev
# ค่าต่างๆ อ่านจากไฟล์ .env
```

แล้วเพิ่มส่วนนี้ **ต่อจากบรรทัด `- ./backend/sql:/docker-entrypoint-initdb.d`** (ย่อหน้า 4 ช่อง เท่ากับ `volumes:` ของ mysql) และอยู่ **ก่อน** `volumes:` ล่างสุด

```yaml
    # backend รอจนฐานข้อมูลพร้อมจริงก่อนเริ่ม
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h 127.0.0.1 -uroot -p$$MYSQL_ROOT_PASSWORD --silent"]
      interval: 5s
      retries: 30
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | กำหนดวิธีตรวจว่ากล่องนี้ "พร้อมใช้" | - |
| 3 | สั่ง `mysqladmin ping` ในกล่อง ตอบได้ = พร้อม | กล่องเปิดแล้ว ≠ MySQL พร้อม (ครั้งแรกใช้เวลาสร้างตารางหลายวินาที) |
| 3 | `$$` = เครื่องหมาย `$` ตัวจริง | `$` ตัวเดียว compose จะแทนค่าจาก `.env` ก่อน `$$` ให้กล่องแทนเอง |
| 4-5 | ตรวจทุก 5 วินาที สูงสุด 30 ครั้ง | รอได้ถึง 2.5 นาที |

### ขั้นที่ 13.4.4 docker-compose: กล่อง backend

> 🎯 **ขั้นนี้จะได้:** กล่อง backend ที่ต่อ MySQL ในเครือข่ายของ Docker

⌨️ **พิมพ์โค้ด:** เว้น 1 บรรทัดต่อจาก healthcheck แล้วพิมพ์ (ย่อหน้า 2 ช่อง เท่ากับ `mysql:`)

```yaml
  backend:
    build: ./backend
    restart: unless-stopped
    environment:
      DB_HOST: mysql # ชื่อ service ด้านบน
      DB_PORT: 3306
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      DB_CONTAINER: "" # ว่าง = Backup เรียก mysqldump ตรงๆ ไม่ใช้ docker exec
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}
      TZ: Asia/Bangkok
    ports:
      - "${PORT}:5000"
    volumes:
      # ไฟล์หลักฐานและไฟล์สำรองเก็บไว้บนเครื่อง ไม่หายเมื่อสร้าง container ใหม่
      - ./backend/uploads:/app/uploads
      - ./backend/backups:/app/backups
    depends_on:
      mysql:
        condition: service_healthy
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | สร้าง image จาก `backend/Dockerfile` (แทน `image:` สำเร็จรูป) | - |
| 4-13 | ตัวแปรสภาพแวดล้อมของกล่อง (แทนไฟล์ `.env` ที่ไม่ได้ส่งเข้ากล่อง) | - |
| 5 | `DB_HOST: mysql` = ชื่อ service | ขั้น 13.1.2 |
| 6 | port **ในกล่อง** MySQL เสมอ 3306 | ไม่ใช่ `${DB_PORT}` ของเครื่องเรา |
| 10 | `DB_CONTAINER` ว่าง | backup เรียก mysqldump ในกล่องตัวเอง (บท 11 ขั้น 11.4.2) |
| 15 | เปิด port ให้เครื่องเรา = ค่า `PORT` (5000) | Thunder Client ยิงได้เหมือนเดิม |
| 18-19 | ต่อโฟลเดอร์ในเครื่อง ↔ ในกล่อง | ลบกล่องสร้างใหม่ ไฟล์หลักฐานและไฟล์สำรองไม่หาย |
| 20-22 | เปิดหลัง mysql **ผ่าน healthcheck** แล้วเท่านั้น | backend ไม่ error "ต่อฐานข้อมูลไม่ได้" ตอนเปิดพร้อมกัน |

### ขั้นที่ 13.4.5 docker-compose: กล่อง frontend

> 🎯 **ขั้นนี้จะได้:** docker-compose.yml ฉบับสมบูรณ์

⌨️ **พิมพ์โค้ด:** เว้น 1 บรรทัดต่อจากกล่อง backend แล้วพิมพ์ (ต้องอยู่ **ก่อน** `volumes:` ล่างสุด)

```yaml
  frontend:
    build: ./frontend
    restart: unless-stopped
    ports:
      - "${WEB_PORT}:3000"
    depends_on:
      - backend
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | สร้างจาก `frontend/Dockerfile` | - |
| 5 | เปิดหน้าเว็บที่ port `WEB_PORT` (3000) | - |
| 6-7 | เปิดหลัง backend | - |

📄 ไฟล์ฉบับสมบูรณ์: [docker-compose.yml](../../docker-compose.yml)

### ขั้นที่ 13.4.6 รันทั้งระบบ

> 🎯 **ขั้นนี้จะได้:** ทั้งระบบเปิดด้วยคำสั่งเดียว

⌨️ **ทำ:** หยุด `npm run dev` ทั้ง 2 หน้าต่างก่อน (port ชนกัน) แล้วสั่งที่โฟลเดอร์หลัก

```bash
docker compose up -d --build
docker compose ps
```

| ส่วน | ความหมาย |
|---|---|
| `--build` | สร้าง image ใหม่จาก Dockerfile (ทุกครั้งที่แก้โค้ด) |
| `-d` | รันเบื้องหลัง ปิด Terminal ได้ |
| `ps` | ดูสถานะทุกกล่อง |

✅ **ผ่านเมื่อ:**
1. เห็น 3 กล่องสถานะ Up (mysql เป็น healthy)
2. เปิด http://localhost:3000 login ได้ ใช้งานได้ครบทุกเมนู
3. เปิดจากเครื่องอื่นในวงแลน `http://<IP เครื่อง>:3000` ได้ (ดู IP ด้วย `ipconfig`)
4. หน้าสำรองข้อมูล → สำรองได้ (ทดสอบ mysql-client ในกล่อง)

> ⚠️ อยากกลับไปพัฒนาแบบ `npm run dev` ให้หยุดกล่องก่อน: `docker compose stop backend frontend`

## 13.5 Deploy บนเครื่องแม่ข่าย (เกณฑ์ 7.9)

### ขั้นที่ 13.5.1 clone แล้วรัน

> 🎯 **ขั้นนี้จะได้:** ระบบรันบนเครื่องของกรรมการ

```bash
git clone http://<gitlab-server>/<group>/<project>.git eva
cd eva
copy .env.example .env
docker compose up -d --build
```

| บรรทัด | ทำอะไร |
|---|---|
| 1 | ดึงโค้ดจาก GitLab ลงโฟลเดอร์ `eva` |
| 3 | สร้าง `.env` จากแม่แบบ (Linux/Mac ใช้ `cp`) **แล้วแก้รหัสผ่านและ JWT_SECRET** |
| 4 | สร้างและรันทั้งระบบ |

ฐานข้อมูลสร้างตารางเปล่าให้อัตโนมัติ (ไฟล์ใน `backend/sql/` บท 02) แล้วเปิด `http://<IP เครื่องแม่ข่าย>:3000` จากนั้นสมัครบัญชีแรกที่ `/register` แล้วเปลี่ยนเป็น hr ใน DB (บท 04 ขั้น 4.4.5)

**คำสั่งที่ใช้บ่อย**

| ทำอะไร | คำสั่ง |
|---|---|
| ดูสถานะ | `docker compose ps` |
| ดู log (หา error) | `docker compose logs -f backend` |
| อัปเดตเป็นโค้ดล่าสุด | `git pull` แล้ว `docker compose up -d --build` |
| หยุดระบบ (ข้อมูลยังอยู่) | `docker compose down` |
| ลบทุกอย่างรวมฐานข้อมูล เริ่มใหม่ | `docker compose down -v` |

> 💡 ฐานข้อมูลสร้างอัตโนมัติ **แค่ครั้งแรก** (volume ยังว่าง) ถ้าแก้ schema.sql แล้วอยากให้มีผล ต้อง `down -v` ก่อน ซึ่งจะ**ลบข้อมูลทั้งหมด**

## 13.6 เตรียมเครื่องสำหรับทำงานออฟไลน์

### ขั้นที่ 13.6.1 โหลดทุกอย่างเก็บไว้ตอนมีเน็ต

> 🎯 **ขั้นนี้จะได้:** พัฒนาและ deploy ได้แม้ห้องแข่งไม่มีอินเทอร์เน็ต

**ทำตอนมีเน็ต** (ที่โฟลเดอร์หลัก)

```bash
docker pull mysql:8.4
docker pull node:24-alpine
cd backend  && npm install && cd ..
cd frontend && npm install && cd ..
docker compose build
docker images
```

| คำสั่ง | ทำอะไร |
|---|---|
| `docker pull` | โหลด image สำเร็จรูปเก็บไว้ |
| `npm install` | โหลด package ลง `node_modules` สำหรับ `npm run dev` |
| `docker compose build` | build 1 ครั้ง เก็บ cache ส่วนที่ต้องโหลดจากเน็ต (`apk add`, `npm ci`) |
| `docker images` | ต้องเห็น `mysql:8.4`, `node:24-alpine`, `eva_learn-backend`, `eva_learn-frontend` (ชื่อขึ้นต้นตามชื่อโฟลเดอร์โปรเจกต์) |

**ตอนออฟไลน์**
- พัฒนา: `docker compose up -d mysql` + `npm run dev` ใช้ได้ปกติ
- รันทั้งระบบหลังแก้โค้ด: `docker compose up -d --build` ใช้ได้ (ดึงส่วนที่ต้องใช้เน็ตจาก cache)

**ห้ามทำตอนออฟไลน์** (cache หรือ image จะหาย โหลดใหม่ไม่ได้)
- `docker system prune`, `docker builder prune`, `docker image prune -a`
- `docker compose build --no-cache` หรือ `--pull`
- แก้ `package.json` / ลง npm package ใหม่
- แก้บรรทัดใน Dockerfile ที่อยู่ **ก่อน** `COPY . .`

**สำรอง image เป็นไฟล์** (ไม่บังคับ ไฟล์ประมาณ 0.6 GB)

```bash
docker save -o eva-images.tar mysql:8.4 node:24-alpine eva_learn-backend eva_learn-frontend
docker load -i eva-images.tar
```

- `docker save` = เก็บ image ทั้งหมดเป็นไฟล์เดียว
- `docker load` = นำกลับมา หรือนำไปลงเครื่องอื่นที่ไม่มีเน็ต

> ⚠️ **ถามกรรมการก่อนวันแข่ง**
> - เครื่องแม่ข่ายมีเน็ตตอน build ไหม
> - ติดตั้ง npm package ในห้องแข่งได้อย่างไร
> - GitLab URL และชื่อ branch
> - port ที่ใช้ได้

---

## ❗ ปัญหาที่พบบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| `git push` ถาม username/password | GitLab ต้องยืนยันตัวตน | ใช้บัญชีที่กรรมการให้ |
| `rejected ... fetch first` | เพื่อน push ไปก่อน | `git pull` แล้ว push ใหม่ |
| backend ใน Docker ต่อ DB ไม่ได้ | `DB_HOST` เป็น localhost | ต้องเป็น `mysql` (ชื่อ service) |
| หน้าเว็บใน Docker เรียก API ไม่ได้ | `API_URL` ผิด | ตรวจ `ENV API_URL=http://backend:5000` ใน Dockerfile |
| `port is already allocated` | `npm run dev` รันอยู่ | หยุด dev ก่อน หรือแก้ port ใน `.env` |
| เครื่องอื่นเปิดเว็บไม่ได้ | Windows Firewall บล็อก | อนุญาต port 3000 และ 5000 |
| build ค้างที่ `npm ci` | ไม่มีเน็ตและไม่มี cache | build ตอนมีเน็ตไว้ก่อน (ขั้น 13.6.1) |
| สำรองข้อมูลใน Docker ได้ 500 "spawn mysqldump ENOENT" | Dockerfile ของ backend ไม่ได้ลง mysql-client | ตรวจบรรทัด `RUN apk add` (ขั้น 13.4.1) |
| แก้ schema.sql แล้วตารางไม่เปลี่ยน | ฐานข้อมูลสร้างแค่ครั้งแรก | `docker compose down -v` แล้ว up ใหม่ (ข้อมูลหายทั้งหมด) |
| `yaml: line X` | ย่อหน้าผิด หรือใช้ Tab | ย่อหน้าด้วยช่องว่าง 2 ช่องต่อชั้น |

---

⬅️ [บทที่ 12](12-testing.md) | ➡️ [บทที่ 14: วันแข่ง](14-competition-day.md)
