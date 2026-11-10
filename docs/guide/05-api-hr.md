# บทที่ 05: API ของงานบุคลากร

## เป้าหมาย

เรียนจบบทนี้แล้ว นักเรียนจะสร้าง API ที่งานบุคลากร (hr) ใช้ได้ครบ
- จัดการผู้ใช้: ค้นหา เพิ่ม แก้ ลบ รีเซ็ตรหัส นำเข้าจากไฟล์ CSV
- จัดการตัวชี้วัด
- มอบหมายกรรมการ (ประธาน 1 คน + กรรมการร่วม)

🏆 ได้คะแนนข้อ (ฝั่ง backend)

| กลุ่ม | ข้อ |
|---|---|
| ผู้ใช้ | 5.1.5 เพิ่มผู้รับการประเมิน, 5.1.6 เพิ่มกรรมการ, 5.1.7 รีเซ็ตรหัส |
| ตัวชี้วัด | 5.1.3 เพิ่มตัวชี้วัด, 5.1.4 รูปแบบการประเมิน |
| กรรมการ | 5.1.8 มอบหมายกรรมการ, 5.1.9 บทบาทกรรมการ |
| API ทั่วไป | 6.1-6.5 |

⏱️ ครั้งแรกที่เรียน: ประมาณ **5 ชั่วโมง** | วันแข่ง (เมื่อคล่องแล้ว): **50 นาที** (ไม่รวมนำเข้า CSV)

### บทนี้แบ่งเป็นขั้นเล็กๆ

| ภาค | ทำอะไร | จำนวนขั้น |
|---|---|---|
| ภาค ก (5.1) | ภาพรวม API ของ hr | 1 ขั้น |
| ภาค ข (5.2-5.7) | เขียนโค้ดทีละขั้น ทดสอบทุกขั้น | 25 ขั้น |

### ไฟล์ที่จะสร้าง/แก้ในบทนี้

```
backend/
├── schemas/
│   ├── user.js             ← ขั้น 5.2  กฎของผู้ใช้
│   ├── indicator.js        ← ขั้น 5.2  กฎของตัวชี้วัด
│   └── assignment.js       ← ขั้น 5.2  กฎของการมอบหมาย
├── routes/
│   ├── users.js            ← ขั้น 5.3-5.4  API ผู้ใช้ + นำเข้า CSV
│   ├── indicators.js       ← ขั้น 5.5  API ตัวชี้วัด
│   └── assignments.js      ← ขั้น 5.6  API มอบหมายกรรมการ
└── app.js                  ← (แก้) ต่อ route ใหม่ + รับไฟล์อัปโหลด
```

> 💡 **ก่อนเริ่มบทนี้** ต้องทำบท 04 เสร็จ และตั้ง token ของ hr ไว้ในตัวแปร `{{token}}` ของ Thunder Client (บท 04 ขั้น 4.8.1) **ทุกการทดสอบในบทนี้ใช้ token ของ hr** เว้นแต่บอกไว้

---

# ภาค ก: ภาพรวม

## 5.1 API ที่จะสร้าง

### ขั้นที่ 5.1.1 รายการ API ของ hr

> 🎯 **ขั้นนี้จะได้:** รู้ว่าจะสร้าง API อะไรบ้าง และหน้าเว็บไหนจะเรียกใช้

| Method | URL | ทำอะไร | หน้าเว็บที่เรียก (บท 08) |
|---|---|---|---|
| GET | `/api/users?role=&q=` | ค้นหาผู้ใช้ กรองบทบาท | จัดการผู้ใช้ |
| GET | `/api/users/:id` | ดูผู้ใช้ 1 คน | - |
| POST | `/api/users` | เพิ่มผู้ใช้ + สุ่มรหัสชั่วคราว | ฟอร์มเพิ่มผู้ใช้ |
| POST | `/api/users/import` | นำเข้าผู้ใช้จากไฟล์ CSV | ปุ่มนำเข้า |
| PUT | `/api/users/:id` | แก้ผู้ใช้ | ฟอร์มแก้ผู้ใช้ |
| DELETE | `/api/users/:id` | ลบผู้ใช้ | ปุ่มลบ |
| PUT | `/api/users/:id/reset-password` | รีเซ็ตรหัส | ปุ่มรีเซ็ตรหัส |
| GET | `/api/indicators?topic_id=` | ดูตัวชี้วัด | - |
| GET | `/api/indicators/:id` | ดูตัวชี้วัด 1 ตัว | - |
| POST / PUT / DELETE | `/api/indicators(/:id)` | เพิ่ม/แก้/ลบตัวชี้วัด | หน้าหัวข้อการประเมิน |
| GET | `/api/assignments` | ดูการมอบหมาย + สถานะ | มอบหมายกรรมการ |
| POST | `/api/assignments` | มอบหมายกรรมการ | ฟอร์มมอบหมาย |
| PUT | `/api/assignments/:id` | เปลี่ยนบทบาท (ประธาน/ร่วม) | ปุ่มเปลี่ยนบทบาท |
| DELETE | `/api/assignments/:id` | ยกเลิกการมอบหมาย | ปุ่มลบ |

📖 ทุก route ใช้ **4 แพตเทิร์นจากบท 03** (อ่านทั้งหมด / อ่าน 1 / เพิ่ม / แก้-ลบ) + **ด่านจากบท 04** (verifyToken, requireRole, validate) สิ่งที่ใหม่ในบทนี้คือ "กฎเฉพาะของงาน" เช่น ห้ามลบตัวเอง, ประธานมีได้คนเดียว

---

# ภาค ข: เขียนโค้ดทีละขั้น

## 5.2 กฎตรวจข้อมูล (schemas)

### ขั้นที่ 5.2.1 กฎของ username และชื่อ

> 🎯 **ขั้นนี้จะได้:** ส่วนแรกของ userSchema

📖 **ทบทวน (ไม่ต้องพิมพ์):** `backend/schemas/user.js` พิมพ์ไว้แล้วในบท 04 ขั้น 4.4.4 ขั้นนี้อธิบายทีละส่วน

```js
import { z } from "zod";
import { requiredText, optionalText } from "./common.js";

// hr เพิ่มได้เฉพาะผู้รับการประเมินและกรรมการ
export const userSchema = z.object({
  username: requiredText("กรุณากรอกชื่อผู้ใช้", 50)
    .min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร")
    .regex(/^[a-zA-Z0-9_.]+$/, "ชื่อผู้ใช้ใช้ได้เฉพาะ a-z, 0-9, _ และ ."),
  full_name: requiredText("กรุณากรอกชื่อ-สกุล", 100),
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 6 | username บังคับ ไม่เกิน 50 ตัว (ตรงกับ `VARCHAR(50)`) | ชื่อที่ใช้ login |
| 7 | ต่ออีก: อย่างน้อย 3 ตัว | กันชื่อสั้นเกินไป |
| 8 | ต่ออีก: ใช้ได้เฉพาะอังกฤษ ตัวเลข `_` และ `.` | กัน username ภาษาไทยหรือมีช่องว่าง ที่พิมพ์ login ยาก |
| 9 | ชื่อ-สกุลบังคับ ไม่เกิน 100 ตัว | แสดงในทุกหน้าและรายงาน |

🧩 **Syntax ใหม่: Regular Expression (regex) รูปแบบข้อความ**

```syntax
[s:/][s:^][v:รูปแบบ][s:$][s:/]
```

| ส่วน | แปลว่า |
|---|---|
| `/ … /` | ครอบ regex (ไม่ใช่ `" "`) |
| `^` | เริ่มต้นข้อความ |
| `$` | จบข้อความ |
| `[a-zA-Z0-9_.]` | ตัวอักษร 1 ตัว ที่เป็น a-z หรือ A-Z หรือ 0-9 หรือ `_` หรือ `.` |
| `+` | ตัวก่อนหน้ามีได้ **1 ตัวขึ้นไป** |
| `\d` | ตัวเลข 0-9 (ใช้ในขั้น 5.2.2) |
| `{8,9}` | ตัวก่อนหน้ามี 8 ถึง 9 ตัว |

อ่าน `/^[a-zA-Z0-9_.]+$/` = "ตั้งแต่ต้นจนจบ ประกอบด้วยตัวอักษรที่อนุญาตอย่างน้อย 1 ตัว ห้ามมีตัวอื่นปน"

| ข้อความ | ผ่านไหม |
|---|---|
| `teach1` | ✅ |
| `som.chai_2` | ✅ |
| `ครู1` | ❌ มีภาษาไทย |
| `teach 1` | ❌ มีช่องว่าง |

> 💡 regex ไม่ต้องจำทั้งหมด จำแค่ 2 ตัวที่ใช้ในระบบนี้ (username และเบอร์โทร) ก็พอ

### ขั้นที่ 5.2.2 กฎของอีเมลและเบอร์โทร (ว่างได้ แต่ถ้ากรอกต้องถูก)

> 🎯 **ขั้นนี้จะได้:** ช่องไม่บังคับ ที่ตรวจรูปแบบเมื่อกรอก

📖 **ทบทวน (ไม่ต้องพิมพ์):** ส่วนนี้อยู่ต่อจาก `full_name` ใน `schemas/user.js`

```js
  email: z
    .union([z.literal(""), z.email("รูปแบบอีเมลไม่ถูกต้อง").max(100)])
    .nullish()
    .transform((v) => v || null),
  phone: z
    .union([z.literal(""), z.string().regex(/^0\d{8,9}$/, "เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก ขึ้นต้นด้วย 0")])
    .nullish()
    .transform((v) => v || null),
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | ค่าต้องเป็น **ข้อความว่าง** หรือ **อีเมลที่ถูกรูปแบบ** (ไม่เกิน 100 ตัว) | ไม่กรอกก็ได้ แต่ถ้ากรอกต้องถูก |
| 3 | ไม่ส่งมาเลยหรือเป็น null ก็ได้ | ฟอร์มบางแบบไม่ส่งช่องนี้ |
| 4 | ค่าว่างแปลงเป็น null | **สำคัญ** email เป็น UNIQUE ถ้าเก็บ `""` หลายคน จะชนกันว่าซ้ำ แต่ NULL หลายคนไม่ชน |
| 6 | เบอร์โทร: ว่าง หรือ ขึ้นต้นด้วย 0 ตามด้วยตัวเลข 8-9 ตัว (รวม 9-10 หลัก) | รับได้ทั้งเบอร์บ้าน `021234567` และมือถือ `0812345678` |
| 7-8 | เหมือนอีเมล | - |

🧩 **Syntax ใหม่: `z.union` และ `z.literal` (อย่างใดอย่างหนึ่ง)**

```syntax
[p:z][s:.][p:union][s:(][s:\[][n:กฎ1][s:,] [n:กฎ2][s:\]][s:)]
```

- `union` = ผ่านกฎใดกฎหนึ่งก็พอ
- `z.literal("")` = ต้องเป็นค่านี้เป๊ะ (ข้อความว่าง)
- รวมกันได้ความหมาย "**ว่างได้ แต่ถ้ากรอกต้องเป็นอีเมล**"

> 💡 ทำไมไม่ใช้ `optionalText` (บท 04)? เพราะ optionalText ไม่ได้ตรวจรูปแบบ ช่องที่ต้องตรวจรูปแบบด้วยจึงเขียนแบบนี้

### ขั้นที่ 5.2.3 กฎของตำแหน่ง แผนก บทบาท และ schema แบบตัดช่อง

> 🎯 **ขั้นนี้จะได้:** userSchema ครบ และ schema สำหรับ "แก้ไข" กับ "แก้ข้อมูลตัวเอง"

📖 **ทบทวน (ไม่ต้องพิมพ์):** ส่วนนี้เป็น 3 บรรทัดสุดท้ายของ `userSchema`

```js
  position: optionalText(100),
  department: optionalText(100),
  role: z.enum(["evaluatee", "committee"], { error: "บทบาทต้องเป็นผู้รับการประเมินหรือกรรมการ" }),
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1-2 | ตำแหน่ง แผนก ไม่บังคับ | ข้อมูลประกอบ |
| 3 | บทบาทต้องเป็น `evaluatee` หรือ `committee` เท่านั้น | **hr สร้าง hr ด้วยกันไม่ได้** (กันการสร้างผู้ดูแลเพิ่มโดยไม่ตั้งใจ) |

⌨️ **พิมพ์โค้ด:** เพิ่มต่อท้ายไฟล์ `schemas/user.js` (ใต้ `});` ตัวสุดท้าย)

```js
// แก้ไข: เปลี่ยนบทบาทไม่ได้
export const userUpdateSchema = userSchema.omit({ role: true });

// ผู้ใช้แก้ข้อมูลตัวเอง: แก้ username ไม่ได้
export const profileSchema = userSchema.omit({ role: true, username: true });
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | schema สำหรับ **แก้ไขผู้ใช้**: เหมือนเดิมแต่ตัดช่อง role | hr เปลี่ยนบทบาทผู้ใช้ไม่ได้ (คะแนนเดิมจะผิดความหมาย) |
| 5 | schema สำหรับ **ผู้ใช้แก้ข้อมูลตัวเอง**: ตัดทั้ง role และ username | ใช้ในบท 06 (หน้าโปรไฟล์) |

🧩 **Syntax ใหม่: `z.enum` และ `.omit()`**

```syntax
[p:z][s:.][p:enum][s:(][s:\[][v:"ค่า1"][s:,] [v:"ค่า2"][s:\]][s:,] [s:{] [p:error][s::] [v:"ข้อความ error"] [s:}][s:)]
[n:schemaเดิม][s:.][p:omit][s:(][s:{] [n:ชื่อช่อง][s::] [v:true] [s:}][s:)]
```

- `z.enum([...])` = ต้องเป็นค่าใดค่าหนึ่งในรายการ (ตรงกับ ENUM ในฐานข้อมูล)
- `.omit({ ชื่อ: true })` = ใช้ schema เดิมแต่ตัดช่องนั้นออก **ไม่ต้องเขียนใหม่ทั้งหมด** แก้กฎที่เดียวมีผลทุก schema

<details>
<summary>📄 ไฟล์ schemas/user.js ทั้งไฟล์ (กดดูไว้เทียบ)</summary>

ไฟล์จริงในโปรเจกต์: [backend/schemas/user.js](../../backend/schemas/user.js) = ขั้น 5.2.1-5.2.3 ต่อกัน

</details>

### ขั้นที่ 5.2.4 กฎของตัวชี้วัด

> 🎯 **ขั้นนี้จะได้:** indicatorSchema ใช้ตรวจตอนเพิ่ม/แก้ตัวชี้วัด

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/schemas/indicator.js`

```js
import { z } from "zod";
import { requiredText, optionalText, idField } from "./common.js";

export const indicatorSchema = z.object({
  topic_id: idField("กรุณาเลือกหัวข้อ"),
  name: requiredText("กรุณากรอกชื่อตัวชี้วัด", 200),
  description: optionalText(2000),
  weight: z.coerce
    .number({ error: "น้ำหนักต้องเป็นตัวเลข" })
    .positive("น้ำหนักต้องมากกว่า 0")
    .max(100, "น้ำหนักต้องไม่เกิน 100"),
  score_type: z.enum(["yes_no", "scale_4"], { error: "กรุณาเลือกรูปแบบการประเมิน" }),
  evidence_type: z.enum(["none", "file", "url", "any"], { error: "กรุณาเลือกหลักฐานที่ต้องแนบ" }),
  evidence_note: optionalText(255),
});
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5 | หัวข้อต้องเป็น id (จำนวนเต็มบวก) | ตัวชี้วัดต้องอยู่ในหัวข้อ (ถ้า id ไม่มีอยู่จริง ฐานข้อมูลจับได้ด้วย FK) |
| 6-7 | ชื่อบังคับ คำอธิบายไม่บังคับ | - |
| 8-9 | **แปลงเป็นตัวเลขก่อน** แล้วตรวจ | ช่องตัวเลขในฟอร์ม HTML ส่งมาเป็นข้อความ `"20"` |
| 10-11 | มากกว่า 0 และไม่เกิน 100 | น้ำหนักต้องสมเหตุสมผล (ตรงกับ CHECK ในฐานข้อมูล) |
| 12 | รูปแบบคะแนน 2 แบบ | เกณฑ์ 5.1.4 |
| 13 | ชนิดหลักฐาน 4 แบบ | ระบบใช้บังคับตอนแนบหลักฐาน (บท 06) |
| 14 | คำแนะนำหลักฐาน ไม่บังคับ | - |

> 🧩 syntax ทั้งหมดสอนไปแล้ว (`z.coerce.number()` บท 04 ขั้น 4.3.1, `z.enum` ขั้น 5.2.3)

### ขั้นที่ 5.2.5 กฎของการมอบหมายกรรมการ

> 🎯 **ขั้นนี้จะได้:** schema 2 ตัว: มอบหมายใหม่ และเปลี่ยนบทบาท

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/schemas/assignment.js`

```js
import { z } from "zod";
import { idField } from "./common.js";

const committeeRole = z.enum(["chair", "member"], { error: "บทบาทกรรมการต้องเป็นประธานหรือกรรมการร่วม" });

export const assignmentSchema = z.object({
  committee_id: idField("กรุณาเลือกกรรมการ"),
  evaluatee_id: idField("กรุณาเลือกผู้รับการประเมิน"),
  committee_role: committeeRole,
});

export const assignmentRoleSchema = z.object({ committee_role: committeeRole });
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4 | เก็บกฎบทบาทกรรมการไว้ในตัวแปร (ไม่ export) | ใช้ซ้ำใน 2 schema ข้างล่าง |
| 6-10 | มอบหมายใหม่: ต้องมีกรรมการ ผู้รับประเมิน และบทบาท | `POST /api/assignments` |
| 12 | เปลี่ยนบทบาท: มีแค่ช่องบทบาท | `PUT /api/assignments/:id` |

> 💡 schema ตรวจได้แค่ว่า id เป็นตัวเลข แต่ **ไม่รู้ว่า id นั้นเป็นกรรมการจริงไหม** ส่วนนี้ต้องตรวจในโค้ด route (ขั้น 5.6.3)

## 5.3 API ผู้ใช้

### ขั้นที่ 5.3.1 ส่วนหัวไฟล์ users.js และต่อเข้า app

> 🎯 **ขั้นนี้จะได้:** ไฟล์ users.js ที่ทุก route เฉพาะ hr และต่อกับ app แล้ว

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/routes/users.js`

```js
import { Router } from "express";
import crypto from "node:crypto";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { hashPassword } from "../utils/password.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { userSchema, userUpdateSchema } from "../schemas/user.js";

const router = Router();
router.use(verifyToken, requireRole("hr")); // ทุก route ในไฟล์นี้เฉพาะ hr

const USER_FIELDS = "id, username, full_name, email, phone, position, department, role, must_change_password, created_at";

// รหัสผ่านชั่วคราว 6 หลัก (ผู้ใช้ต้องเปลี่ยนตอน login ครั้งแรก)
const tempPassword = () => crypto.randomInt(100000, 1000000).toString();

// (route ต่างๆ จะเขียนตรงนี้)

export default router;
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | ดึง crypto | สุ่มรหัสชั่วคราวในบรรทัด 16 |
| 11 | ทุก route ในไฟล์นี้: ต้อง login และเป็น hr | แบบ 1 ของบท 04 ขั้น 4.5.3 (จัดการผู้ใช้เป็นงานของ hr อย่างเดียว) |
| 13 | รายชื่อคอลัมน์ที่จะส่งกลับ **ไม่มี `password_hash`** | **ห้ามใช้ `SELECT *` กับตาราง users** เพราะจะส่ง hash ออกไปด้วย |
| 16 | ฟังก์ชันสุ่มเลข 6 หลัก (100000 ถึง 999999) เป็นข้อความ | รหัสชั่วคราวตอนเพิ่มผู้ใช้และรีเซ็ตรหัส |

> 💡 **ทำไมใช้ `crypto.randomInt` ไม่ใช้ `Math.random()`?** crypto สุ่มแบบเดายาก (ปลอดภัย) เหมาะกับรหัสผ่าน ส่วน `randomInt(min, max)` ได้เลขตั้งแต่ min ถึง **max - 1** จึงใส่ 1000000 เพื่อให้ได้ถึง 999999

⌨️ **แก้โค้ด:** เปิด `backend/app.js` เพิ่ม import

```js
import userRoutes from "./routes/users.js";
```

และเพิ่มบรรทัดนี้ **ใต้** `app.use("/api/auth", authRoutes);`

```js
app.use("/api/users", userRoutes);
```

✅ **ลองเลย:** กดบันทึก terminal ต้องไม่มี error สีแดง

### ขั้นที่ 5.3.2 GET รายชื่อผู้ใช้ (ค้นหา + กรองบทบาท)

> 🎯 **ขั้นนี้จะได้:** `GET /api/users?role=evaluatee&q=สมชาย` กรองได้ทั้ง 2 แบบ หรือไม่กรองเลยก็ได้

📖 **ปัญหา:** ผู้ใช้อาจส่ง role มาหรือไม่ส่ง, q มาหรือไม่ส่ง → SQL ต้องเปลี่ยนตามสิ่งที่ส่งมา
**วิธีแก้:** เริ่มจาก SQL พื้นฐาน แล้วค่อย "ต่อ" เงื่อนไขทีละอัน

| ส่งมา | SQL ที่ต้องได้ |
|---|---|
| ไม่ส่งอะไร | `SELECT … FROM users WHERE 1 = 1 ORDER BY id` |
| `?role=evaluatee` | `… WHERE 1 = 1 AND role = ? ORDER BY id` |
| `?role=evaluatee&q=สม` | `… WHERE 1 = 1 AND role = ? AND (full_name LIKE ? OR username LIKE ?) ORDER BY id` |

⌨️ **พิมพ์โค้ด:** ใน `routes/users.js` พิมพ์แทนบรรทัด `// (route ต่างๆ จะเขียนตรงนี้)`

```js
// GET /api/users?role=evaluatee&q=สมชาย
router.get("/", async (req, res) => {
  const { role, q } = req.query;
  let sql = `SELECT ${USER_FIELDS} FROM users WHERE 1 = 1`;
  const params = [];
  if (role) {
    sql += " AND role = ?";
    params.push(role);
  }
  if (q) {
    sql += " AND (full_name LIKE ? OR username LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  const [rows] = await pool.query(sql + " ORDER BY id", params);
  ok(res, rows);
});
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | แกะ role และ q จาก query string (หลัง `?` ใน URL) | ค่าที่หน้าเว็บส่งมาจากช่องค้นหาและตัวกรอง |
| 4 | เริ่ม SQL ด้วย `WHERE 1 = 1` เก็บใน `let` (เปลี่ยนค่าได้) | `1 = 1` จริงเสมอ ทำให้ต่อ `AND …` ได้เลย ไม่ต้องคิดว่าเป็นเงื่อนไขแรกหรือไม่ |
| 5 | array ว่างไว้เก็บค่าแทน `?` | ค่าต้องเรียงตามลำดับ `?` ที่ต่อเข้าไป |
| 6-9 | ถ้าส่ง role มา: ต่อ SQL และเพิ่มค่าลง array | กรองบทบาท (แท็บ "ผู้รับการประเมิน / กรรมการ") |
| 10-13 | ถ้าส่ง q มา: ค้นในชื่อ **หรือ** username | ช่องค้นหา พิมพ์ส่วนหนึ่งของชื่อก็เจอ |
| 12 | `?` 2 ตัว จึงเพิ่มค่า 2 ค่า | ค่าเดียวกันแต่ใช้กับ 2 คอลัมน์ |
| 14 | ต่อ `ORDER BY id` แล้วสั่ง query | เรียงตามลำดับที่เพิ่ม |

🧩 **Syntax ใหม่ 1: `let` และ `+=`**

```syntax
[k:let] [n:ชื่อ] [s:=] [v:ค่าเริ่มต้น][s:;]
[n:ชื่อ] [s:+=] [v:ค่าที่ต่อเพิ่ม][s:;]
```

- `let` = ตัวแปรที่ **เปลี่ยนค่าได้** (ต่างจาก `const`) ใช้เพราะ sql จะถูกต่อเพิ่ม
- `sql += " AND role = ?"` = `sql = sql + " AND role = ?"` (ต่อข้อความท้ายเดิม)
- ข้อความที่ต่อ **ขึ้นต้นด้วยช่องว่าง** `" AND …"` ไม่งั้นจะติดกันเป็น `1 = 1AND`

🧩 **Syntax ใหม่ 2: `.push()` (เพิ่มของท้าย array)**

```syntax
[n:array][s:.][p:push][s:(][v:ค่า1][s:,] [v:ค่า2][s:)][s:;]
```

```js
const params = [];
params.push("evaluatee");        // ["evaluatee"]
params.push("%สม%", "%สม%");     // ["evaluatee", "%สม%", "%สม%"]
```

> 💡 `const params = []` แล้ว push ได้ ทั้งที่เป็น const เพราะ const ห้าม "เปลี่ยนเป็น array อื่น" แต่ไม่ห้าม "เพิ่มของใน array เดิม"

🧩 **Syntax ใหม่ 3 (SQL): `LIKE` ค้นหาบางส่วน**

```syntax
[n:คอลัมน์] [k:LIKE] [v:'%คำ%']
```

| รูปแบบ | ตรงกับ |
|---|---|
| `'%สม%'` | มีคำว่า "สม" ตรงไหนก็ได้ เช่น "สมชาย", "อุดมสม" |
| `'สม%'` | ขึ้นต้นด้วย "สม" |
| `'%สม'` | ลงท้ายด้วย "สม" |

- `%` = "อะไรก็ได้กี่ตัวก็ได้"
- เราใส่ `%` ในค่า (`` `%${q}%` ``) แล้วส่งผ่าน `?` **ยังปลอดภัยจาก SQL Injection**
- `(A OR B)` ต้องมีวงเล็บ ไม่งั้นจะไปรวมกับ `AND role = ?` ผิดความหมาย

▶️ **ทดสอบ:** (token ของ hr)

| URL | ต้องได้ |
|---|---|
| `GET http://localhost:5000/api/users` | 200, 6 คน, **ไม่มี password_hash** |
| `GET http://localhost:5000/api/users?role=evaluatee` | 200, 2 คน |
| `GET http://localhost:5000/api/users?q=สมชาย` | 200, 1 คน (สมชาย รักเรียน) |
| `GET http://localhost:5000/api/users?role=committee&q=comm` | 200, 3 คน |

✅ **ลองด้วย token ของ teach1:** ต้องได้ **403** (ไม่ใช่ hr)

### ขั้นที่ 5.3.3 GET ผู้ใช้ 1 คน

> 🎯 **ขั้นนี้จะได้:** `GET /api/users/:id`

⌨️ **พิมพ์โค้ด:** เพิ่มต่อจาก route GET `/`

```js
// GET /api/users/:id
router.get("/:id", async (req, res) => {
  const [rows] = await pool.query(`SELECT ${USER_FIELDS} FROM users WHERE id = ?`, [req.params.id]);
  if (!rows[0]) return fail(res, 404, "ไม่พบผู้ใช้");
  ok(res, rows[0]);
});
```

> 🧩 แพตเทิร์นที่ 2 ของบท 03 (อ่าน 1 รายการ) ทุกบรรทัดสอนไปแล้ว ต่างแค่ใช้ `USER_FIELDS` แทน `*`

✅ **ลองเลย:** `GET /api/users/5` → teach1 / `GET /api/users/999` → **404** "ไม่พบผู้ใช้"

### ขั้นที่ 5.3.4 POST เพิ่มผู้ใช้ + สุ่มรหัสชั่วคราว

> 🎯 **ขั้นนี้จะได้:** hr เพิ่มผู้รับการประเมินและกรรมการได้ (เกณฑ์ 5.1.5, 5.1.6)

⌨️ **พิมพ์โค้ด:** เพิ่มต่อจาก route GET `/:id`

```js
// POST /api/users  body: { username, full_name, email, phone, position, department, role }
router.post("/", validate(userSchema), async (req, res) => {
  const u = req.body;
  const password = tempPassword();
  const [result] = await pool.query(
    "INSERT INTO users (username, password_hash, full_name, email, phone, position, department, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [u.username, await hashPassword(password), u.full_name, u.email, u.phone, u.position, u.department, u.role]
  );
  ok(res, { id: result.insertId, username: u.username, temp_password: password }, "เพิ่มผู้ใช้สำเร็จ", 201);
});
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | ตรวจข้อมูลด้วย userSchema ก่อน | ข้อมูลผิด → 400 พร้อมรายการช่อง |
| 3 | เก็บ body ไว้ในตัวแปรชื่อสั้น `u` | พิมพ์ `u.username` สั้นกว่า `req.body.username` |
| 4 | สุ่มรหัสชั่วคราว | - |
| 5-8 | INSERT 8 คอลัมน์ ช่อง password_hash ใส่ hash ของรหัสชั่วคราว | **เก็บแค่ hash** รหัสจริงไม่ลงฐานข้อมูล |
| 9 | ตอบ 201 พร้อม id, username และ **รหัสชั่วคราว** | hr ต้องเอารหัสไปแจ้งผู้ใช้ (แสดงครั้งเดียว ดูย้อนหลังไม่ได้) |

> 💡 **ทำไมไม่ต้องตั้ง `must_change_password`?** ค่าเริ่มต้นในตารางเป็น TRUE อยู่แล้ว (บท 02 ขั้น 2.4.2) ผู้ใช้ใหม่จึงถูกบังคับเปลี่ยนรหัสอัตโนมัติ
> 💡 **username ซ้ำ** ไม่ต้องเช็กเอง: MySQL โยน `ER_DUP_ENTRY` → error handler (บท 03 ขั้น 3.9.6) ตอบ 400 "ข้อมูลซ้ำกับที่มีอยู่แล้ว"

▶️ **ทดสอบ:** POST `http://localhost:5000/api/users`

```json
{ "username": "teach6", "full_name": "ครูใหม่", "role": "evaluatee" }
```

✅ **ต้องเห็น:** **201** พร้อม `temp_password` เป็นเลข 6 หลัก (จดไว้ ใช้ทดสอบ login)

✅ **ส่งซ้ำอีกครั้ง:** **400** "ข้อมูลซ้ำกับที่มีอยู่แล้ว"

✅ **ส่งข้อมูลผิด:** `{ "username": "ab", "full_name": "x", "email": "abc", "role": "evaluatee" }` → **400** และ `data` มี 2 รายการ (username สั้นไป, อีเมลผิด)

✅ **login ด้วย teach6 + รหัสชั่วคราว:** ได้ 200 และ `must_change_password: true`

### ขั้นที่ 5.3.5 PUT แก้ไขผู้ใช้

> 🎯 **ขั้นนี้จะได้:** แก้ข้อมูลผู้ใช้ได้ (ยกเว้นบทบาท)

⌨️ **พิมพ์โค้ด:** เพิ่มต่อจาก route POST

```js
// PUT /api/users/:id  body: เหมือน POST แต่ไม่มี role
router.put("/:id", validate(userUpdateSchema), async (req, res) => {
  const u = req.body;
  const [result] = await pool.query(
    "UPDATE users SET username = ?, full_name = ?, email = ?, phone = ?, position = ?, department = ? WHERE id = ?",
    [u.username, u.full_name, u.email, u.phone, u.position, u.department, req.params.id]
  );
  if (!result.affectedRows) return fail(res, 404, "ไม่พบผู้ใช้");
  ok(res, null, "แก้ไขผู้ใช้สำเร็จ");
});
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | ใช้ `userUpdateSchema` (ไม่มี role) | ส่ง role มาก็ไม่ถูกใช้ เพราะ Zod ตัดช่องที่ไม่รู้จักทิ้ง |
| 5 | UPDATE 6 คอลัมน์ ไม่แตะ role และ password | แก้ได้เฉพาะข้อมูลทั่วไป |
| 6 | ค่า 7 ตัว (id อยู่ท้าย) | - |

> 🧩 แพตเทิร์นที่ 4 ของบท 03 ไม่มี syntax ใหม่

✅ **ลองเลย:** PUT `/api/users/(id ของ teach6)` body `{ "username": "teach6", "full_name": "ครูใหม่ แก้แล้ว" }` → 200 แล้ว GET ดูชื่อต้องเปลี่ยน

### ขั้นที่ 5.3.6 DELETE ลบผู้ใช้ (ห้ามลบตัวเองและ hr)

> 🎯 **ขั้นนี้จะได้:** ลบผู้ใช้ได้อย่างปลอดภัย

⌨️ **พิมพ์โค้ด:** เพิ่มต่อจาก route PUT

```js
// DELETE /api/users/:id  (ข้อมูลการประเมินของผู้ใช้จะถูกลบตาม)
router.delete("/:id", async (req, res) => {
  if (Number(req.params.id) === req.user.id) return fail(res, 400, "ลบบัญชีของตัวเองไม่ได้");
  const [result] = await pool.query("DELETE FROM users WHERE id = ? AND role <> 'hr'", [req.params.id]);
  if (!result.affectedRows) return fail(res, 404, "ไม่พบผู้ใช้");
  ok(res, null, "ลบผู้ใช้สำเร็จ");
});
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | ถ้า id ที่จะลบ = id ของคนที่ login อยู่ ตอบ 400 | กัน hr ลบตัวเองจนเข้าระบบไม่ได้ |
| 4 | ลบเฉพาะแถวที่ **ไม่ใช่ hr** | กันลบบัญชี hr (ถ้าเป็น hr จะลบ 0 แถว) |
| 5 | ลบ 0 แถว = ไม่พบ (หรือเป็น hr) ตอบ 404 | - |

🧩 **Syntax ใหม่: `Number()` และ `<>`**

| เขียน | ทำอะไร |
|---|---|
| `Number("5")` | แปลงข้อความเป็นตัวเลข → `5` |
| `Number(req.params.id) === req.user.id` | ต้องแปลงก่อน เพราะ `req.params.id` เป็นข้อความ `"1"` แต่ `req.user.id` เป็นตัวเลข `1` และ `"1" === 1` ได้ **false** |
| `role <> 'hr'` (SQL) | ไม่เท่ากับ (เหมือน `!==` ของ JavaScript) |

> 💡 ลบผู้ใช้แล้ว การมอบหมาย คะแนน หลักฐานของคนนั้นถูกลบตาม เพราะ `ON DELETE CASCADE` (บท 02)

✅ **ลองเลย:**
- DELETE `/api/users/1` (hr ลบตัวเอง) → **400** "ลบบัญชีของตัวเองไม่ได้"
- DELETE `/api/users/(id ของ teach6)` → 200

### ขั้นที่ 5.3.7 รีเซ็ตรหัสผ่าน

> 🎯 **ขั้นนี้จะได้:** hr รีเซ็ตรหัสให้ผู้ใช้ที่ลืมรหัสได้ (เกณฑ์ 5.1.7)

⌨️ **พิมพ์โค้ด:** เพิ่มต่อจาก route DELETE (ก่อน `export default router;`)

```js
// PUT /api/users/:id/reset-password  สุ่มรหัสชั่วคราว และบังคับเปลี่ยนตอน login
router.put("/:id/reset-password", async (req, res) => {
  const [rows] = await pool.query("SELECT id, role FROM users WHERE id = ?", [req.params.id]);
  if (!rows[0]) return fail(res, 404, "ไม่พบผู้ใช้");
  if (rows[0].role === "hr") return fail(res, 400, "รีเซ็ตได้เฉพาะผู้รับการประเมินและกรรมการ");
  const password = tempPassword();
  await pool.query("UPDATE users SET password_hash = ?, must_change_password = TRUE WHERE id = ?", [
    await hashPassword(password),
    req.params.id,
  ]);
  ok(res, { temp_password: password }, "รีเซ็ตรหัสผ่านสำเร็จ");
});
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | URL `/:id/reset-password` ใช้ **PUT** | เป็นการ "แก้" รหัสของผู้ใช้ที่มีอยู่ ไม่ได้สร้างข้อมูลใหม่ (RESTful) |
| 3-4 | หาผู้ใช้ ไม่พบตอบ 404 | - |
| 5 | ห้ามรีเซ็ตรหัสของ hr | - |
| 6-10 | สุ่มรหัสใหม่ เก็บ hash และตั้ง `must_change_password = TRUE` | ผู้ใช้ต้องเปลี่ยนรหัสอีกครั้งตอน login |
| 11 | ส่งรหัสชั่วคราวกลับ | hr แจ้งผู้ใช้ |

✅ **ลองเลย:** POST `/api/users` เพิ่ม `{ "username": "teach7", "full_name": "ครูทดสอบ", "role": "evaluatee" }` แล้ว PUT `/api/users/(id ของ teach7)/reset-password` → 200 พร้อม `temp_password` ใหม่ เสร็จแล้ว DELETE `/api/users/(id ของ teach7)`

> ❗ อย่าทดสอบรีเซ็ตกับบัญชี `teach1`-`teach2` หรือ `comm1`-`comm3` เพราะรหัสจะไม่ใช่ `123456` อีก

## 5.4 นำเข้าผู้ใช้จากไฟล์ CSV (เสริม)

> 🏃 **ลำดับความสำคัญต่ำ** ไม่มีในเกณฑ์โดยตรง (แต่ช่วยข้อ 5.1.5-5.1.6 ให้ใช้งานดีขึ้น) ข้ามได้ถ้าเวลาไม่พอในวันแข่ง **แต่ขั้น 5.4.1 ต้องทำ** เพราะบท 06 ใช้รับไฟล์หลักฐาน

### ขั้นที่ 5.4.1 ให้ server รับไฟล์อัปโหลดได้

> 🎯 **ขั้นนี้จะได้:** API ทุกตัวรับไฟล์จากฟอร์มได้ (ใช้ทั้ง CSV และไฟล์หลักฐานในบท 06)

⌨️ **แก้โค้ด:** เปิด `backend/app.js`
1. เพิ่ม import ใต้ `import cors from "cors";`

```js
import fileUpload from "express-fileupload";
```

2. เพิ่มด่านนี้ **ต่อจาก** `app.use(express.json({ limit: "5mb" }));`

```js
app.use(
  fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // ไฟล์ไม่เกิน 10MB
    abortOnLimit: true,
    defParamCharset: "utf8", // ชื่อไฟล์ภาษาไทยไม่เพี้ยน
    limitHandler: (req, res) => fail(res, 400, "ไฟล์ต้องมีขนาดไม่เกิน 10MB"),
  })
);
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1-2 | ติดตั้งด่านรับไฟล์ พร้อมตัวเลือก | หลังจากนี้ไฟล์อยู่ใน `req.files.ชื่อช่อง` ช่องข้อความอื่นอยู่ใน `req.body` |
| 3 | จำกัดขนาด 10 × 1024 × 1024 ไบต์ = 10 MB | กันไฟล์ใหญ่เกินจนเครื่องเต็ม (เกณฑ์ 5.2.4 กำหนดขนาด) |
| 4 | ถ้าเกินขนาด หยุดรับทันที | ไม่เสียเวลารับไฟล์ที่ใช้ไม่ได้ |
| 5 | อ่านชื่อไฟล์เป็น UTF-8 | ชื่อไฟล์ภาษาไทย เช่น `แผนการสอน.pdf` ไม่กลายเป็นตัวแปลก |
| 6 | เมื่อเกินขนาด ตอบ 400 รูปแบบเดียวกับระบบ | ผู้ใช้เห็นข้อความภาษาไทย |

> 🧩 syntax ใหม่: `10 * 1024 * 1024` = การคูณ (`*`) เขียนแบบนี้อ่านเข้าใจง่ายกว่าพิมพ์ `10485760`

### ขั้นที่ 5.4.2 อ่านไฟล์ CSV และแยกบรรทัด

> 🎯 **ขั้นนี้จะได้:** ส่วนแรกของ `POST /api/users/import` อ่านหัวตารางได้

📖 **ไฟล์ CSV** คือตารางในรูปข้อความ 1 บรรทัด = 1 แถว คั่นช่องด้วย `,` บรรทัดแรกเป็นหัวตาราง ไฟล์ตัวอย่างอยู่ที่ [frontend/public/users-template.csv](../../frontend/public/users-template.csv)

```text
username,full_name,role,email,phone,position,department
teach10,ครูตัวอย่าง หนึ่ง,evaluatee,teach10@school.ac.th,0812345678,ครู,แผนกเทคโนโลยีสารสนเทศ
comm10,กรรมการตัวอย่าง สอง,committee,comm10@school.ac.th,,หัวหน้าแผนก,แผนกคอมพิวเตอร์ธุรกิจ
```

⌨️ **พิมพ์โค้ด:** ใน `routes/users.js` เพิ่ม **ต่อจาก route POST `/`** (ก่อน route PUT `/:id`)

```js
// POST /api/users/import  form-data: file (ไฟล์ .csv)
// หัวตาราง: username,full_name,role,email,phone,position,department
router.post("/import", async (req, res) => {
  const file = req.files?.file;
  if (!file) return fail(res, 400, "กรุณาเลือกไฟล์ CSV");
  if (!file.name.toLowerCase().endsWith(".csv")) return fail(res, 400, "รองรับเฉพาะไฟล์ .csv");

  // แยกบรรทัด ตัด BOM และบรรทัดว่าง
  const lines = file.data.toString("utf8").replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const headers = lines[0]?.split(",").map((h) => h.trim());
  if (!headers?.includes("username") || lines.length < 2) {
    return fail(res, 400, "ไฟล์ต้องมีหัวตารางและข้อมูลอย่างน้อย 1 แถว");
  }
  // (ขั้น 5.4.3 จะเขียนต่อตรงนี้)
});
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4 | หยิบไฟล์จากช่องชื่อ `file` (ถ้าไม่มี req.files ได้ undefined ไม่ error) | ไฟล์ที่หน้าเว็บส่งมา |
| 5 | ไม่มีไฟล์ ตอบ 400 | - |
| 6 | ชื่อไฟล์ (ตัวเล็กทั้งหมด) ไม่ลงท้าย `.csv` ตอบ 400 | กันคนอัปโหลดไฟล์ชนิดอื่น |
| 9 | เนื้อไฟล์ → ข้อความ → ตัด BOM → แยกบรรทัด → ทิ้งบรรทัดว่าง | ได้ array ของบรรทัด |
| 10 | บรรทัดแรก แยกด้วย `,` แล้วตัดช่องว่าง | ได้รายชื่อหัวตาราง เช่น `["username", "full_name", …]` |
| 11-13 | ไม่มีหัว `username` หรือมีแค่หัวตาราง ตอบ 400 | กันไฟล์ผิดรูปแบบ |

🧩 **Syntax ใหม่ 1: `?.` (ถ้ามีค่อยหยิบ)**

```syntax
[n:ของ][s:?.][n:ช่อง]
```

- `req.files?.file` = "ถ้า `req.files` มี ค่อยหยิบ `.file` ถ้าไม่มี ได้ `undefined`" (ไม่ error)
- ถ้าเขียน `req.files.file` ตอนไม่มีการส่งไฟล์ จะ error `Cannot read properties of undefined`

🧩 **Syntax ใหม่ 2: เรียกคำสั่งของข้อความต่อกันยาว**

| คำสั่ง | ทำอะไร | ตัวอย่าง |
|---|---|---|
| `.toString("utf8")` | ข้อมูลไบต์ → ข้อความ | เนื้อไฟล์ |
| `.toLowerCase()` | ตัวเล็กทั้งหมด | `"A.CSV"` → `"a.csv"` |
| `.endsWith(".csv")` | ลงท้ายด้วยไหม | true/false |
| `.replace(/^﻿/, "")` | แทนที่สิ่งที่ตรง regex ด้วยข้อความว่าง | ตัด BOM = ตัวอักษรล่องหนที่ Excel ใส่ต้นไฟล์ UTF-8 (มองไม่เห็นในกล่องโค้ด แต่มีอยู่ใน regex) |
| `.split(/\r?\n/)` | แยกด้วยการขึ้นบรรทัด | `\r?\n` = Windows (`\r\n`) หรือ Linux (`\n`) ก็ได้ |
| `.filter((l) => l.trim())` | เก็บเฉพาะบรรทัดที่ไม่ว่าง | บรรทัดว่างท้ายไฟล์ถูกทิ้ง |

> 💡 **วิธีพิมพ์ BOM ใน regex:** พิมพ์ `/^\uFEFF/` แทนได้ (`\uFEFF` คือรหัสของ BOM) ทำงานเหมือนกันและมองเห็นชัดกว่า

### ขั้นที่ 5.4.3 ตรวจข้อมูลทุกแถวก่อนบันทึก

> 🎯 **ขั้นนี้จะได้:** แต่ละแถวถูกตรวจด้วย userSchema ตัวเดียวกับการเพิ่มทีละคน ถ้ามีแถวผิด ไม่บันทึกเลย

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 5.4.3 จะเขียนต่อตรงนี้)`

```js

  // ตรวจทุกแถวก่อน ถ้ามีแถวผิดไม่บันทึกเลย
  const users = [];
  const errors = [];
  lines.slice(1).forEach((line, i) => {
    const values = line.split(",").map((v) => v.trim());
    const row = Object.fromEntries(headers.map((h, j) => [h, values[j] ?? ""]));
    const result = userSchema.safeParse(row);
    if (result.success) users.push(result.data);
    else errors.push({ row: i + 2, message: result.error.issues[0].message });
  });
  if (errors.length) return fail(res, 400, `ข้อมูลไม่ถูกต้อง ${errors.length} แถว`, errors);
  // (ขั้น 5.4.4 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3-4 | array เก็บแถวที่ผ่าน และ error | - |
| 5 | วนทุกบรรทัด **ยกเว้นบรรทัดแรก** (หัวตาราง) ได้ทั้งบรรทัด และลำดับ `i` | - |
| 6 | แยกค่าในบรรทัดด้วย `,` | `["teach10", "ครูตัวอย่าง หนึ่ง", …]` |
| 7 | จับคู่หัวตารางกับค่า เป็น object | `{ username: "teach10", full_name: "…", … }` ส่งให้ Zod ตรวจได้ |
| 8 | ตรวจด้วย userSchema | **กฎเดียวกับเพิ่มทีละคน** |
| 9 | ผ่าน → เก็บข้อมูลที่ตรวจแล้ว | - |
| 10 | ไม่ผ่าน → เก็บเลขแถว (`i + 2` = แถวใน Excel เพราะ i เริ่ม 0 และมีหัวตาราง 1 แถว) และข้อความ | ผู้ใช้รู้ว่าแก้แถวไหน |
| 12 | มี error แม้แถวเดียว ตอบ 400 พร้อมรายการ แล้วจบ | **ไม่บันทึกครึ่งๆ กลางๆ** แก้ไฟล์แล้วนำเข้าใหม่ทั้งไฟล์ได้ |

🧩 **Syntax ใหม่ 1: `.slice(1)` กับ array และ `.forEach()`**

```syntax
[n:array][s:.][p:slice][s:(][v:1][s:)][s:.][p:forEach][s:(][s:(][n:ตัวนั้น][s:,] [n:ลำดับ][s:)] [s:=>] [s:{] [s:...] [s:}][s:)][s:;]
```

- `.slice(1)` กับ array = ตัดตัวแรกทิ้ง (เหมือนกับข้อความในบท 04)
- `.forEach(…)` = วนทีละตัวเหมือน `for…of` แต่ได้ **ลำดับ** (`i` = 0, 1, 2, …) มาด้วย

🧩 **Syntax ใหม่ 2: `Object.fromEntries` (สร้าง object จากคู่ชื่อ-ค่า)**

```js
Object.fromEntries([["username", "teach10"], ["role", "evaluatee"]]);
// { username: "teach10", role: "evaluatee" }
```

- `headers.map((h, j) => [h, values[j] ?? ""])` สร้างคู่ `[ชื่อหัวตาราง, ค่าช่องเดียวกัน]` ทุกคอลัมน์
- `?? ""` = ถ้าแถวนั้นมีค่าไม่ครบ ใช้ข้อความว่าง
- `.map()` ส่ง **ลำดับ** เป็นพารามิเตอร์ตัวที่ 2 ได้เหมือน forEach (`j`)

🧩 **Syntax ใหม่ 3: `if … else` แบบบรรทัดเดียว**

```syntax
[k:if] [s:(][v:เงื่อนไข][s:)] [n:ทำเมื่อจริง][s:;]
[k:else] [n:ทำเมื่อเท็จ][s:;]
```

### ขั้นที่ 5.4.4 บันทึกทุกแถวในคำสั่งเดียว

> 🎯 **ขั้นนี้จะได้:** นำเข้าผู้ใช้หลายคนพร้อมรหัสชั่วคราวของแต่ละคน

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 5.4.4 จะเขียนต่อตรงนี้)`

```js

  // INSERT ทีเดียวทุกแถว (ถ้าซ้ำจะ error ทั้งก้อน ไม่มีแถวไหนถูกบันทึก)
  const created = [];
  const values = [];
  for (const u of users) {
    const password = tempPassword();
    created.push({ username: u.username, full_name: u.full_name, temp_password: password });
    values.push([u.username, await hashPassword(password), u.full_name, u.email, u.phone, u.position, u.department, u.role]);
  }
  await pool.query(
    "INSERT INTO users (username, password_hash, full_name, email, phone, position, department, role) VALUES ?",
    [values]
  );
  ok(res, created, `นำเข้าผู้ใช้สำเร็จ ${created.length} คน`, 201);
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | รายการที่จะตอบกลับ (ชื่อ + รหัสชั่วคราว) | hr เอาไปแจ้งผู้ใช้ทุกคน |
| 4 | รายการค่าที่จะ INSERT | - |
| 5-9 | วนทีละคน: สุ่มรหัส, เก็บข้อมูลตอบกลับ, เก็บแถวที่จะ INSERT (array 8 ค่า) | ใช้ `for…of` เพราะข้างในมี `await` (forEach ใช้ await ไม่ได้) |
| 10-13 | INSERT ทุกแถวในคำสั่งเดียว | ถ้ามี username ซ้ำแม้คนเดียว **ทั้งคำสั่งล้มเหลว ไม่มีใครถูกเพิ่ม** (ได้ 400 "ข้อมูลซ้ำ") |
| 14 | ตอบ 201 พร้อมรายชื่อและรหัส | - |

🧩 **Syntax ใหม่ (mysql2): `VALUES ?` เพิ่มหลายแถวพร้อมกัน**

```syntax
[n:pool][s:.][p:query][s:(][v:"INSERT INTO ตาราง (คอลัมน์...) VALUES ?"][s:,] [s:\[][n:arrayของแถว][s:\]][s:)]
```

- `?` ตัวเดียว + ส่ง `[values]` (array ที่ข้างในเป็น array ของแถว)
- mysql2 แปลงเป็น `VALUES (...), (...), (...)` ให้เอง
- **ระวัง:** ต้องครอบ `[values]` อีกชั้น ถ้าส่ง `values` เฉยๆ จะผิด

▶️ **ทดสอบ:** Thunder Client → POST `http://localhost:5000/api/users/import`
1. แท็บ **Body** เลือก **Form**
2. ติ๊ก **Files** (มุมขวา)
3. ช่องชื่อ `file` เลือกไฟล์ `frontend/public/users-template.csv`
4. Send

✅ **ต้องเห็น:** **201** "นำเข้าผู้ใช้สำเร็จ 2 คน" พร้อมรหัสชั่วคราว 2 คน เสร็จแล้ว DELETE 2 บัญชีนี้ (`GET /api/users?q=10` ดู id) เพราะบท 08 จะนำเข้าไฟล์เดิมอีกครั้ง

✅ **Send ซ้ำ:** **400** "ข้อมูลซ้ำกับที่มีอยู่แล้ว" (ไม่มีใครถูกเพิ่มซ้ำ)

<details>
<summary>📄 ไฟล์ routes/users.js ทั้งไฟล์ (กดดูไว้เทียบ)</summary>

ไฟล์จริงในโปรเจกต์: [backend/routes/users.js](../../backend/routes/users.js) ลำดับ route ในไฟล์: GET `/` → GET `/:id` → POST `/` → POST `/import` → PUT `/:id` → DELETE `/:id` → PUT `/:id/reset-password`

</details>

> 💡 **ลำดับ route สำคัญไหม?** `/import` เป็น POST ส่วน `/:id` เป็น GET/PUT/DELETE จึงไม่ชนกัน แต่ถ้าเป็น method เดียวกัน route `/:id` ที่อยู่ก่อนจะจับคำว่า `import` เป็น id ไปก่อน **ฝึกวาง path ตายตัวไว้ก่อน path ที่มีตัวแปรเสมอ**

## 5.5 API ตัวชี้วัด

### ขั้นที่ 5.5.1 ส่วนหัวไฟล์ และ GET

> 🎯 **ขั้นนี้จะได้:** ดูตัวชี้วัดทั้งหมด หรือกรองตามหัวข้อ และดูทีละตัว

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/routes/indicators.js`

```js
import { Router } from "express";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { indicatorSchema } from "../schemas/indicator.js";

const router = Router();
router.use(verifyToken);

// GET /api/indicators?topic_id=1
router.get("/", requireRole("hr", "evaluatee", "committee"), async (req, res) => {
  const { topic_id } = req.query;
  const [rows] = topic_id
    ? await pool.query("SELECT * FROM indicators WHERE topic_id = ? ORDER BY id", [topic_id])
    : await pool.query("SELECT * FROM indicators ORDER BY id");
  ok(res, rows);
});

// GET /api/indicators/:id
router.get("/:id", requireRole("hr", "evaluatee", "committee"), async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM indicators WHERE id = ?", [req.params.id]);
  if (!rows[0]) return fail(res, 404, "ไม่พบตัวชี้วัด");
  ok(res, rows[0]);
});

// (ขั้น 5.5.2 จะเขียนต่อตรงนี้)

export default router;
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 9 | ทุก route ต้อง login (แบบ 2 ของบท 04) | สิทธิ์ต่างกันแต่ละ route |
| 12 | GET ทุกบทบาทดูได้ | ผู้รับประเมินและกรรมการต้องเห็นตัวชี้วัด |
| 14-16 | ถ้าส่ง topic_id มา ดึงเฉพาะหัวข้อนั้น ไม่งั้นดึงทั้งหมด | กรองตามหัวข้อ |
| 21-25 | แพตเทิร์นอ่าน 1 รายการ | - |

> 🧩 syntax ใหม่: ternary (บท 04 ขั้น 4.5.1) ใช้กับ `await` ได้ แต่ละฝั่งมี `await` ของตัวเอง (บรรทัด 14-16 เขียนแยกบรรทัดให้อ่านง่าย ขึ้นต้นบรรทัดด้วย `?` และ `:`)

⌨️ **แก้โค้ด:** เปิด `app.js` เพิ่ม `import indicatorRoutes from "./routes/indicators.js";` และเพิ่ม **ใต้** `app.use("/api/topics", topicRoutes);`

```js
app.use("/api/indicators", indicatorRoutes);
```

✅ **ลองเลย:** `GET /api/indicators?topic_id=2` → 200 และ `data` เป็น `[]` เพราะยังไม่มีตัวชี้วัด (ขั้น 5.5.2 จะเพิ่ม)

### ขั้นที่ 5.5.2 POST เพิ่มตัวชี้วัด

> 🎯 **ขั้นนี้จะได้:** hr เพิ่มตัวชี้วัดในหัวข้อได้ (เกณฑ์ 5.1.3)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 5.5.2 จะเขียนต่อตรงนี้)`

```js
// POST /api/indicators  body: { topic_id, name, description, weight, score_type, evidence_type, evidence_note }
router.post("/", requireRole("hr"), validate(indicatorSchema), async (req, res) => {
  const i = req.body;
  const [result] = await pool.query(
    "INSERT INTO indicators (topic_id, name, description, weight, score_type, evidence_type, evidence_note) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [i.topic_id, i.name, i.description, i.weight, i.score_type, i.evidence_type, i.evidence_note]
  );
  ok(res, { id: result.insertId }, "เพิ่มตัวชี้วัดสำเร็จ", 201);
});

// (ขั้น 5.5.3 จะเขียนต่อตรงนี้)
```

> 🧩 แพตเทิร์นที่ 3 (เพิ่ม) ไม่มี syntax ใหม่ ตั้งชื่อตัวแปรสั้น `i` (indicator) แบบเดียวกับ `u` ของผู้ใช้

⌨️ **ทำตาม:** POST `/api/indicators` เพิ่มตัวชี้วัดจริง 6 ตัว **ตามลำดับนี้** (token ของ hr) ใช้ต่อทั้งคู่มือ น้ำหนักรวม 100

| id | body |
|---|---|
| 1 | `{"topic_id":1,"name":"การจัดทำแผนการจัดการเรียนรู้","description":"มีแผนการจัดการเรียนรู้ครบทุกรายวิชาที่สอน","weight":20,"score_type":"scale_4","evidence_type":"file","evidence_note":"ไฟล์ PDF แผนการจัดการเรียนรู้"}` |
| 2 | `{"topic_id":1,"name":"การใช้สื่อและเทคโนโลยีในการสอน","description":"ใช้สื่อดิจิทัลหรือแพลตฟอร์มออนไลน์ประกอบการสอน","weight":15,"score_type":"scale_4","evidence_type":"any","evidence_note":"ภาพกิจกรรม หรือ URL สื่อการสอน"}` |
| 3 | `{"topic_id":1,"name":"การทำวิจัยในชั้นเรียน","description":"มีงานวิจัยในชั้นเรียนอย่างน้อย 1 เรื่องต่อปีการศึกษา","weight":15,"score_type":"yes_no","evidence_type":"file","evidence_note":"ไฟล์ PDF รายงานวิจัย"}` |
| 4 | `{"topic_id":2,"name":"การเข้ารับการอบรมพัฒนาตนเอง","description":"เข้ารับการอบรมอย่างน้อย 20 ชั่วโมงต่อปี","weight":10,"score_type":"yes_no","evidence_type":"any","evidence_note":"เกียรติบัตร หรือ URL หลักฐานการอบรม"}` |
| 5 | `{"topic_id":2,"name":"การปฏิบัติตามระเบียบวินัย","description":"มาปฏิบัติงานตรงเวลาและปฏิบัติตามระเบียบของสถานศึกษา","weight":20,"score_type":"scale_4","evidence_type":"none"}` |
| 6 | `{"topic_id":2,"name":"การมีส่วนร่วมในกิจกรรมสถานศึกษา","description":"เข้าร่วมกิจกรรมของสถานศึกษาและชุมชน","weight":20,"score_type":"scale_4","evidence_type":"url","evidence_note":"URL ภาพกิจกรรม"}` |

✅ **ลองเลย:**
- `GET /api/indicators?topic_id=2` → 3 ตัว (id 4, 5, 6)
- POST `{ "topic_id": 1, "name": "ทดสอบ", "weight": 5, "score_type": "scale_4", "evidence_type": "none" }` → **201** (ตัวนี้เป็นตัวทดสอบ ขั้น 5.5.3 จะลบ)
- POST เดิมแต่ `"weight": 0` → **400** "น้ำหนักต้องมากกว่า 0"
- POST เดิมแต่ `"topic_id": 999` → **400** "ไม่พบข้อมูลที่อ้างอิง" (FK + error handler บท 03)

### ขั้นที่ 5.5.3 PUT แก้ตัวชี้วัด (แบบพื้นฐาน)

> 🎯 **ขั้นนี้จะได้:** แก้ตัวชี้วัดได้

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 5.5.3 จะเขียนต่อตรงนี้)`

```js
// PUT /api/indicators/:id
router.put("/:id", requireRole("hr"), validate(indicatorSchema), async (req, res) => {
  const i = req.body;
  // (ขั้น 5.5.4 จะเพิ่มการตรวจตรงนี้)
  const [result] = await pool.query(
    "UPDATE indicators SET topic_id = ?, name = ?, description = ?, weight = ?, score_type = ?, evidence_type = ?, evidence_note = ? WHERE id = ?",
    [i.topic_id, i.name, i.description, i.weight, i.score_type, i.evidence_type, i.evidence_note, req.params.id]
  );
  if (!result.affectedRows) return fail(res, 404, "ไม่พบตัวชี้วัด");
  ok(res, null, "แก้ไขตัวชี้วัดสำเร็จ");
});

// DELETE /api/indicators/:id
router.delete("/:id", requireRole("hr"), async (req, res) => {
  const [result] = await pool.query("DELETE FROM indicators WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) return fail(res, 404, "ไม่พบตัวชี้วัด");
  ok(res, null, "ลบตัวชี้วัดสำเร็จ");
});
```

> 🧩 แพตเทิร์นที่ 4 (แก้/ลบ) 2 route ไม่มี syntax ใหม่

✅ **ลองเลย:** PUT ตัวชี้วัดที่เพิ่มในขั้น 5.5.2 เปลี่ยนชื่อ → 200 / DELETE ตัวเดิม → 200

### ขั้นที่ 5.5.4 ห้ามเปลี่ยนรูปแบบคะแนน เมื่อมีคนให้คะแนนแล้ว

> 🎯 **ขั้นนี้จะได้:** กันข้อมูลคะแนนผิดความหมาย

📖 **ปัญหา:** ตัวชี้วัดแบบสเกล 1-4 มีคนให้คะแนน 3 ไปแล้ว ถ้า hr เปลี่ยนเป็นแบบมี/ไม่มี (ใช้ 0/1) คะแนน 3 จะไม่มีความหมาย และคำนวณผลผิด

⌨️ **พิมพ์โค้ด:** ใน route PUT พิมพ์แทนบรรทัด `// (ขั้น 5.5.4 จะเพิ่มการตรวจตรงนี้)`

```js
  const [[old]] = await pool.query("SELECT score_type FROM indicators WHERE id = ?", [req.params.id]);
  if (!old) return fail(res, 404, "ไม่พบตัวชี้วัด");

  // มีคะแนนแล้ว ห้ามเปลี่ยนรูปแบบการประเมิน (คะแนนเดิมจะผิดความหมาย)
  if (old.score_type !== i.score_type) {
    const [[{ n }]] = await pool.query(
      `SELECT (SELECT COUNT(*) FROM self_evaluations WHERE indicator_id = ? AND score IS NOT NULL)
            + (SELECT COUNT(*) FROM committee_scores WHERE indicator_id = ?) AS n`,
      [req.params.id, req.params.id]
    );
    if (n) return fail(res, 400, "ตัวชี้วัดนี้มีการให้คะแนนแล้ว เปลี่ยนรูปแบบการประเมินไม่ได้");
  }

```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | ดึงรูปแบบคะแนนเดิม เก็บแถวแรกใน `old` | เทียบกับค่าใหม่ |
| 2 | ไม่พบ ตอบ 404 | - |
| 5 | ถ้ารูปแบบเปลี่ยน (ถ้าไม่เปลี่ยน ข้ามไปเลย) | ไม่ต้องนับคะแนนถ้าไม่จำเป็น |
| 6-10 | นับคะแนนตนเองที่กรอกแล้ว + คะแนนกรรมการ ของตัวชี้วัดนี้ รวมเป็น `n` | รู้ว่ามีใครให้คะแนนแล้วหรือยัง |
| 11 | มีคะแนน (n ไม่ใช่ 0) ตอบ 400 | ห้ามเปลี่ยน |

🧩 **Syntax ใหม่ 1: แกะ array 2 ชั้น `[[old]]`**

```syntax
[k:const] [s:\[\[][n:แถวแรก][s:\]\]] [s:=] [k:await] [n:pool][s:.][p:query][s:(][s:...][s:)][s:;]
```

| เขียน | ได้ |
|---|---|
| `const [rows] = …` | `rows` = array ของแถว (บท 03) |
| `const [[old]] = …` | `old` = **แถวแรก** เลย (แกะ 2 ชั้น: ชั้นนอก = ผลของ query, ชั้นใน = แถว) |
| `const [[{ n }]] = …` | `n` = **ค่าคอลัมน์ n ของแถวแรก** (แกะ 3 ชั้น: query → แถวแรก → ช่อง n) |

ไม่มีแถว → `old` เป็น `undefined` (ไม่ error) จึงตรวจ `if (!old)` ได้

🧩 **Syntax ใหม่ 2 (SQL): subquery และ `IS NOT NULL`**

```syntax
[k:SELECT] [s:(][k:SELECT COUNT(*)] [k:FROM] [n:ตาราง1] [k:WHERE] [s:...][s:)] [s:+] [s:(][k:SELECT COUNT(*)] [k:FROM] [n:ตาราง2] [k:WHERE] [s:...][s:)] [k:AS] [n:n]
```

- `(SELECT …)` ในวงเล็บ = query ย่อย ได้ค่าเดียว เอามาบวกกันได้
- `COUNT(*)` = นับจำนวนแถว
- `score IS NOT NULL` = คะแนนไม่ว่าง (ใน SQL ต้องใช้ `IS NULL` / `IS NOT NULL` ใช้ `= NULL` ไม่ได้)
- SQL ยาวหลายบรรทัด ใช้ backtick `` ` `` ครอบ (ขึ้นบรรทัดใหม่ได้ ส่วน `" "` ขึ้นบรรทัดใหม่ไม่ได้)

✅ **ลองเลย:** ขั้นนี้ยังทดสอบไม่ได้ เพราะยังไม่มีใครให้คะแนน กดบันทึกแล้ว terminal ต้องไม่มี error จะได้ทดสอบจริงในบท 06 ขั้น 6.7.9

> 🏃 **ฉบับย่อสำหรับวันแข่ง:** ข้ามขั้นนี้ได้ถ้าเวลาไม่พอ

<details>
<summary>📄 ไฟล์ routes/indicators.js ทั้งไฟล์ (กดดูไว้เทียบ)</summary>

ไฟล์จริงในโปรเจกต์: [backend/routes/indicators.js](../../backend/routes/indicators.js)

</details>

## 5.6 API มอบหมายกรรมการ

### ขั้นที่ 5.6.1 GET รายการมอบหมาย พร้อมชื่อและความคืบหน้า

> 🎯 **ขั้นนี้จะได้:** ดูว่าใครเป็นกรรมการของใคร สถานะอะไร ให้คะแนนไปกี่ข้อ (เกณฑ์ 5.1.11 ติดตามสถานะ)

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/routes/assignments.js`

```js
import { Router } from "express";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { assignmentSchema, assignmentRoleSchema } from "../schemas/assignment.js";

const router = Router();
router.use(verifyToken, requireRole("hr"));

// GET /api/assignments?evaluatee_id=5&committee_id=2
// พร้อมชื่อ และจำนวนตัวชี้วัดที่กรรมการให้คะแนนแล้ว (ใช้ติดตามสถานะ)
router.get("/", async (req, res) => {
  const { evaluatee_id, committee_id } = req.query;
  let sql = `
    SELECT a.id, a.committee_id, a.evaluatee_id, a.committee_role, a.status, a.confirmed_at,
           c.full_name AS committee_name, e.full_name AS evaluatee_name,
           (SELECT COUNT(*) FROM committee_scores s WHERE s.assignment_id = a.id) AS scored_count
    FROM assignments a
    JOIN users c ON c.id = a.committee_id
    JOIN users e ON e.id = a.evaluatee_id
    WHERE 1 = 1`;
  const params = [];
  if (evaluatee_id) {
    sql += " AND a.evaluatee_id = ?";
    params.push(evaluatee_id);
  }
  if (committee_id) {
    sql += " AND a.committee_id = ?";
    params.push(committee_id);
  }
  const [rows] = await pool.query(sql + " ORDER BY a.evaluatee_id, a.committee_role, a.id", params);
  ok(res, rows);
});

// (ขั้น 5.6.2 จะเขียนต่อตรงนี้)

export default router;
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 9 | ทั้งไฟล์เฉพาะ hr | - |
| 16 | เลือกคอลัมน์ของการมอบหมาย (`a.` = ของตาราง assignments) | - |
| 17 | ชื่อกรรมการ (จากตาราง users ชื่อเล่น `c`) และชื่อผู้รับประเมิน (users ชื่อเล่น `e`) | หน้าเว็บโชว์ชื่อ ไม่ใช่แค่ id |
| 18 | นับคะแนนที่กรรมการคู่นี้ให้แล้ว | โชว์ความคืบหน้า เช่น "2/6 ข้อ" |
| 19 | จากตาราง assignments ชื่อเล่น `a` | - |
| 20-21 | **JOIN ตาราง users 2 ครั้ง** คนละชื่อเล่น | ตารางเดียวกันใช้ 2 บทบาท (กรรมการ / ผู้รับประเมิน) |
| 22-31 | ต่อเงื่อนไขกรองแบบขั้น 5.3.2 | กรองตามผู้รับประเมินหรือกรรมการ |
| 32 | เรียงตามผู้รับประเมิน แล้วบทบาท (chair ก่อน member) | หน้าเว็บจัดกลุ่มตามผู้รับประเมินได้ง่าย |

🧩 **Syntax ใหม่ (SQL): JOIN และชื่อเล่นตาราง**

```syntax
[k:FROM] [n:ตารางหลัก] [n:ชื่อเล่น1]
[k:JOIN] [n:ตารางที่เชื่อม] [n:ชื่อเล่น2] [k:ON] [n:ชื่อเล่น2][s:.][n:id] [s:=] [n:ชื่อเล่น1][s:.][n:FK]
```

- `JOIN … ON …` = เอาแถวของ 2 ตารางมาต่อกัน ตรงที่เงื่อนไข ON เป็นจริง
- **ชื่อเล่น** (เช่น `a`, `c`, `e`) ตั้งเอง ใช้แทนชื่อตารางยาวๆ และจำเป็นเมื่อ JOIN ตารางเดียวกัน 2 ครั้ง
- `c.full_name AS committee_name` = ตั้งชื่อคอลัมน์ผลลัพธ์ใหม่ เพราะทั้ง `c` และ `e` มี `full_name` ถ้าไม่ตั้งจะชนกัน

```text
assignments (a)                users (c)               users (e)
┌────┬──────────────┬──────────────┐    ┌────┬─────────┐       ┌────┬─────────┐
│ id │ committee_id │ evaluatee_id │    │ id │full_name│       │ id │full_name│
│ 1  │      2  ─────┼──────────────┼───▶│ 2  │ประเสริฐ  │       │ 5  │ สมชาย   │
│    │              │      5  ─────┼────┼────┼─────────┼──────▶│    │         │
└────┴──────────────┴──────────────┘    └────┴─────────┘       └────┴─────────┘
```

> 💡 SQL ยาว ใช้ backtick และขึ้นบรรทัดใหม่จัดย่อหน้าให้อ่านง่าย ช่องว่างและการขึ้นบรรทัดใน SQL ไม่มีผลกับการทำงาน

⌨️ **แก้โค้ด:** เปิด `app.js` เพิ่ม `import assignmentRoutes from "./routes/assignments.js";` และเพิ่ม **ใต้** `app.use("/api/indicators", indicatorRoutes);`

```js
app.use("/api/assignments", assignmentRoutes);
```

✅ **ลองเลย:** `GET /api/assignments` → 200 และ `data` เป็น `[]` เพราะยังไม่ได้มอบหมาย (ขั้น 5.6.3 จะเพิ่ม)

### ขั้นที่ 5.6.2 ฟังก์ชันตรวจว่ามีประธานแล้วหรือยัง

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชันช่วยที่ใช้ทั้งตอนมอบหมายและตอนเปลี่ยนบทบาท

📖 กฎของงาน: **ผู้รับการประเมิน 1 คน มีประธานกรรมการได้คนเดียว**

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 5.6.2 จะเขียนต่อตรงนี้)`

```js
// ผู้รับประเมิน 1 คน มีประธานได้คนเดียว
async function hasOtherChair(evaluateeId, exceptId = 0) {
  const [rows] = await pool.query(
    "SELECT id FROM assignments WHERE evaluatee_id = ? AND committee_role = 'chair' AND id <> ?",
    [evaluateeId, exceptId]
  );
  return rows.length > 0;
}

// (ขั้น 5.6.3 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | ฟังก์ชันรับ id ผู้รับประเมิน และ id ที่ให้ข้าม (ไม่ส่ง = 0) | - |
| 3-6 | หาการมอบหมายที่เป็นประธานของคนนี้ **ยกเว้นแถว exceptId** | ตอนเปลี่ยนบทบาทแถวที่เป็นประธานอยู่แล้ว ต้องไม่นับตัวเอง ไม่งั้นจะคิดว่ามีประธานซ้ำ |
| 7 | มีอย่างน้อย 1 แถว = มีประธานแล้ว (true) | - |

> 🧩 syntax ใหม่: `.length` = จำนวนตัวใน array (`[].length` = 0, `[a, b].length` = 2) ส่วน `exceptId = 0` คือค่าเริ่มต้นของพารามิเตอร์ (บท 03 ขั้น 3.8.1) ใช้ 0 เพราะไม่มีแถวไหน id เป็น 0

### ขั้นที่ 5.6.3 POST มอบหมายกรรมการ (ตรวจบทบาทจริงของผู้ใช้)

> 🎯 **ขั้นนี้จะได้:** มอบหมายกรรมการได้ โดยกันข้อมูลผิดทุกกรณี (เกณฑ์ 5.1.8, 5.1.9)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 5.6.3 จะเขียนต่อตรงนี้)`

```js
// POST /api/assignments  body: { committee_id, evaluatee_id, committee_role }
router.post("/", validate(assignmentSchema), async (req, res) => {
  const { committee_id, evaluatee_id, committee_role } = req.body;

  // ตรวจว่า id ตรงกับ role จริง
  const [users] = await pool.query("SELECT id, role FROM users WHERE id IN (?, ?)", [committee_id, evaluatee_id]);
  const roleOf = (id) => users.find((u) => u.id === id)?.role;
  if (roleOf(committee_id) !== "committee") return fail(res, 400, "ผู้ใช้ที่เลือกไม่ใช่กรรมการ");
  if (roleOf(evaluatee_id) !== "evaluatee") return fail(res, 400, "ผู้ใช้ที่เลือกไม่ใช่ผู้รับการประเมิน");
  if (committee_role === "chair" && (await hasOtherChair(evaluatee_id))) {
    return fail(res, 400, "ผู้รับการประเมินคนนี้มีประธานกรรมการแล้ว");
  }

  const [result] = await pool.query(
    "INSERT INTO assignments (committee_id, evaluatee_id, committee_role) VALUES (?, ?, ?)",
    [committee_id, evaluatee_id, committee_role]
  );
  ok(res, { id: result.insertId }, "มอบหมายกรรมการสำเร็จ", 201);
});

// (ขั้น 5.6.4 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 6 | ดึงบทบาทของผู้ใช้ 2 คนในคำสั่งเดียว | - |
| 7 | ฟังก์ชันสั้น: หาผู้ใช้ตาม id แล้วเอาบทบาท (ไม่พบ = undefined) | ใช้ 2 ครั้งในบรรทัด 8-9 |
| 8 | committee_id ต้องเป็นกรรมการจริง | กันคนส่ง id ของครูมาเป็นกรรมการ (Zod รู้แค่ว่าเป็นตัวเลข) |
| 9 | evaluatee_id ต้องเป็นผู้รับประเมินจริง | - |
| 10-12 | ถ้าจะตั้งเป็นประธาน และมีประธานอยู่แล้ว ตอบ 400 | ประธานมีได้คนเดียว |
| 14-17 | INSERT (status ใช้ค่าเริ่มต้น `pending`) | - |

🧩 **Syntax ใหม่ 1: `.find()` (หาตัวแรกที่ตรงเงื่อนไข)**

```syntax
[n:array][s:.][p:find][s:(][s:(][n:แต่ละตัว][s:)] [s:=>] [v:เงื่อนไข][s:)]
```

```js
[{ id: 2, role: "committee" }, { id: 5, role: "evaluatee" }].find((u) => u.id === 5);
// { id: 5, role: "evaluatee" }
```

| | `.filter()` (บท 03) | `.find()` |
|---|---|---|
| ได้ | array ของ **ทุกตัว** ที่ตรง | **ตัวแรก** ที่ตรง (ไม่ใช่ array) |
| ไม่เจอ | `[]` | `undefined` |

- `…find(…)?.role` = เจอแล้วค่อยเอา role ถ้าไม่เจอได้ undefined ไม่ error (`?.` ขั้น 5.4.2)

🧩 **Syntax ใหม่ 2: `&&` (และ)**

```syntax
[k:if] [s:(][v:เงื่อนไข1] [s:&&] [v:เงื่อนไข2][s:)] [s:...]
```

- จริง **ทั้งคู่** ถึงจะเข้า if
- ถ้าเงื่อนไขแรกเป็นเท็จ จะ **ไม่ทำเงื่อนไขที่สองเลย** (ไม่เรียก hasOtherChair ถ้าไม่ได้ตั้งเป็นประธาน ประหยัดการ query)

🧩 **Syntax ใหม่ 3 (SQL): `IN (…)`**

- `WHERE id IN (?, ?)` = id เป็นค่าใดค่าหนึ่งในรายการ (เหมือน `id = ? OR id = ?`)

> 💡 **มอบหมายซ้ำ** ไม่ต้องเช็กเอง: `UNIQUE (committee_id, evaluatee_id)` (บท 02 ขั้น 2.4.5) ทำให้ได้ 400 "ข้อมูลซ้ำกับที่มีอยู่แล้ว"

⌨️ **ทำตาม:** POST `/api/assignments` มอบหมายกรรมการจริง 6 รายการ **ตามลำดับนี้** แต่ละรายการต้องได้ **201** และใช้ต่อทั้งคู่มือ

| id | body | ความหมาย |
|---|---|---|
| 1 | `{"committee_id":2,"evaluatee_id":5,"committee_role":"chair"}` | comm1 เป็นประธานของ teach1 |
| 2 | `{"committee_id":3,"evaluatee_id":5,"committee_role":"member"}` | comm2 เป็นกรรมการร่วมของ teach1 |
| 3 | `{"committee_id":4,"evaluatee_id":5,"committee_role":"member"}` | comm3 เป็นกรรมการร่วมของ teach1 |
| 4 | `{"committee_id":2,"evaluatee_id":6,"committee_role":"chair"}` | comm1 เป็นประธานของ teach2 |
| 5 | `{"committee_id":3,"evaluatee_id":6,"committee_role":"member"}` | comm2 เป็นกรรมการร่วมของ teach2 |
| 6 | `{"committee_id":4,"evaluatee_id":6,"committee_role":"member"}` | comm3 เป็นกรรมการร่วมของ teach2 |

✅ **ลองเลย:**

| body | ต้องได้ |
|---|---|
| `{"committee_id":3,"evaluatee_id":6,"committee_role":"chair"}` | **400** "ผู้รับการประเมินคนนี้มีประธานกรรมการแล้ว" (teach2 มี comm1 เป็นประธาน) |
| `{"committee_id":5,"evaluatee_id":6,"committee_role":"member"}` | **400** "ผู้ใช้ที่เลือกไม่ใช่กรรมการ" (id 5 คือครู) |
| `{"committee_id":4,"evaluatee_id":5,"committee_role":"member"}` | **400** "ข้อมูลซ้ำกับที่มีอยู่แล้ว" (มอบหมายไว้แล้ว) |

`GET /api/assignments?evaluatee_id=5` → 3 แถว มี `committee_name` สถานะ `pending` ทุกแถว และ `scored_count` เป็น 0

### ขั้นที่ 5.6.4 PUT เปลี่ยนบทบาท และ DELETE ยกเลิกการมอบหมาย

> 🎯 **ขั้นนี้จะได้:** API มอบหมายครบ 4 ตัว

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 5.6.4 จะเขียนต่อตรงนี้)`

```js
// PUT /api/assignments/:id  body: { committee_role }  เปลี่ยนบทบาทกรรมการ
router.put("/:id", validate(assignmentRoleSchema), async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM assignments WHERE id = ?", [req.params.id]);
  if (!rows[0]) return fail(res, 404, "ไม่พบการมอบหมาย");
  if (req.body.committee_role === "chair" && (await hasOtherChair(rows[0].evaluatee_id, rows[0].id))) {
    return fail(res, 400, "ผู้รับการประเมินคนนี้มีประธานกรรมการแล้ว");
  }
  await pool.query("UPDATE assignments SET committee_role = ? WHERE id = ?", [req.body.committee_role, req.params.id]);
  ok(res, null, "เปลี่ยนบทบาทกรรมการสำเร็จ");
});

// DELETE /api/assignments/:id  (คะแนนที่กรรมการคนนี้ให้ไว้ถูกลบตาม)
router.delete("/:id", async (req, res) => {
  const [result] = await pool.query("DELETE FROM assignments WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) return fail(res, 404, "ไม่พบการมอบหมาย");
  ok(res, null, "ยกเลิกการมอบหมายสำเร็จ");
});
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3-4 | หาการมอบหมาย ไม่พบตอบ 404 | ต้องรู้ evaluatee_id ของแถวนี้ |
| 5 | ถ้าจะเปลี่ยนเป็นประธาน ตรวจประธานคนอื่น **โดยยกเว้นแถวนี้** (ส่ง `rows[0].id` เป็น exceptId) | เปลี่ยนประธานคนเดิมเป็นประธาน (ไม่เปลี่ยนอะไร) จะไม่ถูกปฏิเสธผิดๆ |
| 8 | แก้บทบาท | - |
| 13-17 | ลบการมอบหมาย | คะแนนของกรรมการคนนี้ถูกลบตาม (CASCADE) |

✅ **ลองเลย:**
- PUT `/api/assignments/2` body `{"committee_role":"chair"}` → **400** (assignment 2 คือ comm2 ของ teach1 ซึ่งมี comm1 เป็นประธานแล้ว)
- PUT `/api/assignments/1` body `{"committee_role":"chair"}` → 200 (เป็นประธานอยู่แล้ว ไม่ถูกปฏิเสธ)

<details>
<summary>📄 ไฟล์ routes/assignments.js ทั้งไฟล์ (กดดูไว้เทียบ)</summary>

ไฟล์จริงในโปรเจกต์: [backend/routes/assignments.js](../../backend/routes/assignments.js)

</details>

## 5.7 ทดสอบรวม

### ขั้นที่ 5.7.1 ทดสอบทั้งบท

> 🎯 **ขั้นนี้จะได้:** มั่นใจว่า API ของ hr ทำงานครบ

> 💡 ใช้ token ของ hr ไม่ต้องรีเซ็ตฐานข้อมูล

| # | Method + URL | Body | ต้องได้ |
|---|---|---|---|
| 1 | GET `/api/users?role=evaluatee` | - | 200, 2 คน, **ไม่มี password_hash** |
| 2 | GET `/api/users?q=สมชาย` | - | 200, 1 คน |
| 3 | POST `/api/users` | `{"username":"teach6","full_name":"ครูใหม่","role":"evaluatee"}` | 201 + `temp_password` |
| 4 | POST `/api/users` ซ้ำข้อ 3 | เหมือนข้อ 3 | 400 "ข้อมูลซ้ำกับที่มีอยู่แล้ว" |
| 5 | POST `/api/users` | `{"username":"ab","full_name":"x","email":"abc","role":"evaluatee"}` | 400 + data มี 2 ช่องที่ผิด |
| 6 | login ด้วย teach6 + รหัสชั่วคราว | - | 200, `must_change_password: true` |
| 7 | PUT `/api/users/(id ของ teach6)/reset-password` | - | 200 + รหัสใหม่ |
| 8 | DELETE `/api/users/1` (ตัวเอง) | - | 400 "ลบบัญชีของตัวเองไม่ได้" |
| 9 | POST `/api/indicators` | `{"topic_id":1,"name":"ทดสอบ","weight":0,"score_type":"scale_4","evidence_type":"none"}` | 400 "น้ำหนักต้องมากกว่า 0" |
| 10 | POST `/api/assignments` | `{"committee_id":3,"evaluatee_id":6,"committee_role":"chair"}` | 400 "มีประธานกรรมการแล้ว" |
| 11 | POST `/api/assignments` | `{"committee_id":5,"evaluatee_id":6,"committee_role":"member"}` | 400 "ไม่ใช่กรรมการ" |
| 12 | GET `/api/users` ด้วย token ของ teach1 | - | 403 |
| 13 | DELETE `/api/users/(id ของ teach6)` | - | 200 ลบบัญชีทดสอบ |

✅ **ผ่านเมื่อ:** ครบ 13 ข้อ กด Save เข้า Collection `Eva` (หลักฐานข้อ 7.2 Insert, 7.3 Update, 7.6 ทดสอบ API)

---

## ❗ ปัญหาที่พบบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| ผลลัพธ์มี `password_hash` | ใช้ `SELECT *` กับ users | ใช้ `USER_FIELDS` |
| ค้นหาเจอทุกคน หรือ error SQL | ลืมช่องว่างหน้า `" AND …"` | ข้อความที่ต่อต้องขึ้นต้นด้วยช่องว่าง |
| `ER_PARSE_ERROR` ตอนกรอง | จำนวน `?` ไม่เท่ากับค่าใน params | ทุกครั้งที่ต่อ `?` ต้อง `push` ค่าให้ครบ |
| ค้นหาภาษาไทยไม่เจอ | ส่ง query ภาษาไทยผ่าน curl บน Windows | ทดสอบด้วย Thunder Client |
| ลบตัวเองได้ | เทียบ `req.params.id === req.user.id` โดยไม่แปลง | ใช้ `Number(req.params.id)` |
| `req.files` เป็น undefined | ไม่ได้ใส่ `fileUpload()` ใน app.js หรือไม่ได้ส่งแบบ form-data | ตรวจ app.js และ Thunder Client เลือก Body → Form ติ๊ก Files |
| CSV ภาษาไทยเพี้ยน | ไฟล์ไม่ได้บันทึกเป็น UTF-8 | บันทึกจาก Excel เลือก "CSV UTF-8" |
| CSV error "ไฟล์ต้องมีหัวตาราง…" ทั้งที่มี | หัวตารางเป็นภาษาไทย หรือมี BOM ที่ไม่ได้ตัด | ใช้หัวตารางภาษาอังกฤษตามไฟล์ตัวอย่าง และตรวจ `.replace(/^\uFEFF/, "")` |
| `await is only valid in async functions` ในการนำเข้า | ใช้ `await` ใน `forEach` | ใช้ `for (const u of users)` |
| ประธานซ้ำได้ตอนแก้ / แก้ประธานเดิมไม่ได้ | ส่ง `exceptId` ผิด | `hasOtherChair(rows[0].evaluatee_id, rows[0].id)` |

---

⬅️ [บทที่ 04](04-auth.md) | ➡️ [บทที่ 06: API ของผู้รับการประเมินและกรรมการ](06-api-evaluatee-committee.md)
