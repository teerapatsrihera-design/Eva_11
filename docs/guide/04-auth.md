# บทที่ 04: Login, JWT และการตรวจสิทธิ์

## เป้าหมาย

เรียนจบบทนี้แล้ว นักเรียนจะ
- เก็บรหัสผ่านเป็น hash ด้วย `crypto.scrypt` (ไม่ใช้ bcrypt ตามที่โจทย์กำหนด)
- เข้าใจว่าระบบ "จำ" ได้อย่างไรว่าใคร login อยู่ (JWT)
- สร้าง API สมัครสมาชิก, login และเปลี่ยนรหัสผ่าน
- ตรวจข้อมูลที่ส่งเข้ามาด้วย Zod
- ป้องกัน API ไม่ให้คนที่ไม่มีสิทธิ์เรียกได้ (middleware)

🏆 ได้คะแนนข้อ: 6.6 Login ด้วย JWT, 6.12 API ปลอดภัย ตรวจสิทธิ์, 4.5 แนวทางความปลอดภัย, 6.7 ตรวจข้อมูลไม่ครบ, 7.4 Validate, 5.2.1 บังคับเปลี่ยนรหัส (ฝั่ง backend)

⏱️ ครั้งแรกที่เรียน: ประมาณ **4 ชั่วโมง** | วันแข่ง (เมื่อคล่องแล้ว): **40 นาที**

### บทนี้แบ่งเป็นขั้นเล็กๆ

| ภาค | ทำอะไร | จำนวนขั้น |
|---|---|---|
| ภาค ก (4.1) | แนวคิด login, JWT, การตรวจข้อมูล | 3 ขั้น |
| ภาค ข (4.2-4.9) | เขียนโค้ดทีละขั้น ทดสอบทุกขั้น | 23 ขั้น |

### ไฟล์ที่จะสร้าง/แก้ในบทนี้

```
backend/
├── utils/password.js       ← ขั้น 4.2  hash และตรวจรหัสผ่าน
├── schemas/
│   ├── common.js           ← ขั้น 4.3  กฎตรวจข้อมูลที่ใช้ซ้ำ
│   ├── auth.js             ← ขั้น 4.3, 4.4  กฎของ login / สมัครสมาชิก / เปลี่ยนรหัส
│   ├── user.js             ← ขั้น 4.4  กฎของข้อมูลผู้ใช้
│   └── topic.js            ← ขั้น 4.3  กฎของหัวข้อ
├── middleware/
│   ├── validate.js         ← ขั้น 4.3  ด่านตรวจข้อมูล
│   └── auth.js             ← ขั้น 4.5  ด่านตรวจ token และสิทธิ์
├── routes/
│   ├── auth.js             ← ขั้น 4.4, 4.6  สมัครสมาชิก, login และเปลี่ยนรหัส
│   └── topics.js           ← ขั้น 4.7  (แก้) ใส่ด่านตรวจ
└── app.js                  ← ขั้น 4.4  (แก้) ต่อ route auth
```

> 💡 **ก่อนเริ่มบทนี้** ต้องทำบท 03 เสร็จ: `npm run dev` ใน backend แล้วเปิด http://localhost:5000/api/health ได้ success

---

# ภาค ก: แนวคิด

## 4.1 Login ทำงานอย่างไร

### ขั้นที่ 4.1.1 ภาพรวมการ login

> 🎯 **ขั้นนี้จะได้:** เห็นภาพตั้งแต่กดปุ่มเข้าสู่ระบบ จนเรียก API อื่นได้

```text
 เบราว์เซอร์                                  Backend
     │  POST /api/auth/login                       │
     │  { username: "hr1", password: "123456" }     │
     │ ───────────────────────────────────────────▶│ 1. หา user จาก username
     │                                             │ 2. เทียบรหัสกับ hash (verifyPassword)
     │                                             │ 3. ถูก → เซ็น token ด้วย JWT_SECRET
     │  { token: "eyJhbGc...", user: {...} }       │
     │ ◀───────────────────────────────────────────│
     │ เก็บ token ไว้ใน localStorage (บท 07)        │
     │                                             │
     │  GET /api/users                             │
     │  Authorization: Bearer eyJhbGc...           │
     │ ───────────────────────────────────────────▶│ 4. verifyToken: ตรวจลายเซ็น token
     │                                             │ 5. requireRole("hr"): role ตรงไหม
     │  { status: "success", data: [...] }         │ 6. ผ่าน → ทำงาน
     │ ◀───────────────────────────────────────────│
```

📖 HTTP ไม่มีความจำ ทุกคำขอเป็นคำขอใหม่ backend ไม่รู้ว่าเป็นใคร
จึงต้อง **แนบบัตรผ่าน (token) มากับทุกคำขอ** ใน header `Authorization`

### ขั้นที่ 4.1.2 JWT คืออะไร

> 🎯 **ขั้นนี้จะได้:** เข้าใจว่า token มีอะไรอยู่ข้างใน และทำไมปลอมไม่ได้

📖 **JWT (JSON Web Token)** คือ "บัตรผ่าน" ที่ backend ออกให้ตอน login มี 3 ส่วนคั่นด้วยจุด

```text
eyJhbGciOiJIUzI1NiJ9 . eyJpZCI6NSwicm9sZSI6ImV2YWx1YXRlZSJ9 . Dvxw4K_IpOkq9sL5RIE
       header                     payload (ข้อมูล)                    signature (ลายเซ็น)
```

| ส่วน | มีอะไร | ใครอ่านได้ |
|---|---|---|
| header | ชนิดการเข้ารหัส | ทุกคน |
| payload | `{ id, role, full_name }` และเวลาหมดอายุ | **ทุกคนถอดอ่านได้** ห้ามใส่รหัสผ่านหรือข้อมูลลับ |
| signature | สร้างจาก payload + `JWT_SECRET` | ตรวจได้เฉพาะคนที่มี `JWT_SECRET` (backend) |

- ถ้ามีคนแก้ payload (เช่น เปลี่ยน role เป็น hr) ลายเซ็นจะไม่ตรง backend ตรวจเจอทันที
- เปรียบเหมือน **บัตรนักเรียนที่มีตราประทับ** ใครก็อ่านชื่อบนบัตรได้ แต่ปลอมตราประทับไม่ได้

### ขั้นที่ 4.1.3 ทำไม backend ต้องตรวจข้อมูลเอง

> 🎯 **ขั้นนี้จะได้:** เข้าใจว่าทำไมโจทย์บังคับตรวจข้อมูลทั้งสองฝั่ง

📖 หน้าเว็บตรวจฟอร์มแล้วก็จริง แต่ **ใครก็ยิง API ตรงได้** (เช่น ผ่าน Thunder Client) โดยไม่ผ่านหน้าเว็บ

| ตรวจที่ | เอาไว้ทำอะไร |
|---|---|
| หน้าเว็บ (บท 07) | บอกผู้ใช้ทันทีว่ากรอกผิดตรงไหน (สะดวก) |
| backend (บทนี้) | **กันข้อมูลผิดเข้าฐานข้อมูล** (ปลอดภัย) |

> 💡 **กฎ: backend ต้องไม่เชื่อข้อมูลที่ส่งมาเลย** ตรวจทุกครั้ง ด้วยเครื่องมือชื่อ **Zod**

---

# ภาค ข: เขียนโค้ดทีละขั้น

> 💡 syntax ที่สอนแล้วในบท 03 (import, const, async/await, arrow function, route, if, return ฯลฯ) จะไม่อธิบายซ้ำ ดูตารางสรุปที่บท 03 ขั้น 3.11.2

## 4.2 เก็บรหัสผ่านเป็น hash

### ขั้นที่ 4.2.1 ฟังก์ชัน hashPassword

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชันแปลงรหัสผ่านเป็น hash ไว้ใช้ตอนสร้างผู้ใช้และเปลี่ยนรหัส

📖 จำจากบท 02 ขั้น 2.5.1: hash = แปลงรหัสเป็นข้อความยาวที่ย้อนกลับไม่ได้ โดยผสม **salt** (ข้อความสุ่ม) ก่อน
เก็บเป็นรูป `"salt:hash"` เพราะตอนตรวจต้องรู้ salt เดิม

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/utils/password.js`

```js
import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);

// เก็บในรูป "salt:hash" (hex)
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | ดึงเครื่องมือเข้ารหัสที่มากับ Node.js | มีฟังก์ชัน `scrypt` และสุ่มข้อมูล ไม่ต้องติดตั้ง package (โจทย์ห้าม bcrypt) |
| 2 | ดึงฟังก์ชัน `promisify` | ใช้แปลงในบรรทัด 4 |
| 4 | แปลง `crypto.scrypt` (แบบเก่าที่ใช้ callback) ให้ใช้กับ `await` ได้ | เขียนโค้ดแบบ `await scrypt(...)` อ่านง่าย |
| 7 | สร้างฟังก์ชัน `hashPassword` รับรหัสผ่าน | ใช้ตอนเพิ่มผู้ใช้ (บท 05) และเปลี่ยนรหัส (ขั้น 4.6) |
| 8 | สุ่ม 16 ไบต์ แปลงเป็นตัวอักษรฐาน 16 (hex) ได้ 32 ตัว | salt ใหม่ทุกครั้ง รหัสเดียวกันจึงได้ hash ต่างกัน |
| 9 | hash รหัสผ่านผสม salt ได้ผลยาว 64 ไบต์ | ตัว hash จริง |
| 10 | ส่งกลับ `"salt:hash"` เป็นข้อความ | เก็บลงคอลัมน์ `password_hash` |

🧩 **Syntax ใหม่ 1: `export async function` (ฟังก์ชันแบบปกติ)**

```syntax
[k:export] [k:async] [k:function] [n:ชื่อฟังก์ชัน][s:(][n:พารามิเตอร์][s:)] [s:{]
  [v:คำสั่ง]
  [k:return] [v:ค่าที่ส่งกลับ][s:;]
[s:}]
```

| | แบบ arrow (บท 03) | แบบ `function` (บทนี้) |
|---|---|---|
| เขียน | `const ชื่อ = async (x) => { … }` | `async function ชื่อ(x) { … }` |
| ส่งค่ากลับ | ถ้ามี `{ }` ต้องใช้ `return` | ต้องใช้ `return` เสมอ |
| ใช้เมื่อ | ฟังก์ชันสั้น, ส่งเข้าไปในคำสั่งอื่น | ฟังก์ชันยาว มีชื่อชัดเจน |

ทั้งสองแบบทำงานเหมือนกัน ในโปรเจกต์นี้ใช้ทั้งคู่ จึงต้องอ่านออกทั้งสองแบบ

🧩 **Syntax ใหม่ 2: แปลงข้อมูลด้วย `.toString("hex")`**

```syntax
[n:ข้อมูลไบต์][s:.][p:toString][s:(][v:"hex"][s:)]
```

- ผลของ `randomBytes` และ `scrypt` เป็นข้อมูลไบต์ (อ่านไม่ออก) `.toString("hex")` แปลงเป็นตัวอักษร 0-9 a-f เก็บลงฐานข้อมูลได้
- 1 ไบต์ = 2 ตัวอักษร hex → salt 16 ไบต์ = 32 ตัว, hash 64 ไบต์ = 128 ตัว

### ขั้นที่ 4.2.2 ฟังก์ชัน verifyPassword

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชันตรวจว่ารหัสที่พิมพ์มา ตรงกับ hash ที่เก็บไว้ไหม

⌨️ **พิมพ์โค้ด:** เพิ่มต่อท้ายไฟล์ `backend/utils/password.js`

```js
export async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const test = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), test);
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | ฟังก์ชันรับรหัสที่ผู้ใช้พิมพ์ และค่าที่เก็บในฐานข้อมูล | ใช้ตอน login และตอนเปลี่ยนรหัส (ตรวจรหัสเดิม) |
| 2 | ตัดค่าที่เก็บด้วย `:` ได้ salt กับ hash | ต้องใช้ salt เดิมในการ hash ใหม่ |
| 3 | hash รหัสที่พิมพ์มาด้วย salt เดิม | ถ้ารหัสถูก จะได้ hash เหมือนที่เก็บไว้ทุกตัว |
| 4 | เทียบ hash 2 ตัว ได้ `true` หรือ `false` | `timingSafeEqual` ใช้เวลาเทียบเท่ากันทุกครั้ง กันคนร้ายเดาจากเวลาที่ใช้ |

🧩 **Syntax ใหม่: `.split()` + แกะ array 2 ช่อง**

```syntax
[k:const] [s:\[][n:ช่องที่1][s:,] [n:ช่องที่2][s:\]] [s:=] [n:ข้อความ][s:.][p:split][s:(][v:"ตัวคั่น"][s:)][s:;]
```

```js
"abc:xyz".split(":");                 // ["abc", "xyz"]
const [salt, hash] = "abc:xyz".split(":"); // salt = "abc", hash = "xyz"
```

- `split` เป็น 🟣 คำสั่งของข้อความ ตัดข้อความทุกจุดที่เจอตัวคั่น ได้ array
- แกะ array หลายช่อง: ตั้งชื่อเรียงตามลำดับ คั่นด้วย `,` (ต่อยอดจากบท 03 ขั้น 3.7.3)

> 💡 `Buffer.from(hash, "hex")` = แปลงข้อความ hex กลับเป็นข้อมูลไบต์ (กลับด้านของ `.toString("hex")`) เพื่อเทียบกับ `test` ที่เป็นไบต์

### ขั้นที่ 4.2.3 ทดสอบ password.js

> 🎯 **ขั้นนี้จะได้:** มั่นใจว่า hash และตรวจรหัสใช้ได้ และรู้วิธีสร้าง hash ใหม่เมื่อต้องการ

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ทดลอง `backend/try-password.js` (ใช้เสร็จแล้วลบ)

```js
import { hashPassword, verifyPassword } from "./utils/password.js";

const hash = await hashPassword("123456");
console.log(hash);
console.log(await verifyPassword("123456", hash));
console.log(await verifyPassword("654321", hash));
```

| บรรทัด | ทำอะไร |
|---|---|
| 3 | hash รหัส `123456` |
| 4 | พิมพ์ hash ที่ได้ |
| 5 | ตรวจด้วยรหัสถูก → ควรได้ `true` |
| 6 | ตรวจด้วยรหัสผิด → ควรได้ `false` |

▶️ **รัน:** (ในโฟลเดอร์ backend) `node try-password.js`

✅ **ต้องเห็น:** (hash แต่ละครั้งไม่เหมือนกัน เพราะ salt สุ่ม)

```text
ec4b4db3fa1d4824ab091bb997ab790e:3c756894316545bd0d7264e5...
true
false
```

> 💡 hash ที่พิมพ์ออกมาแต่ละครั้งไม่เหมือนกัน เพราะ salt ถูกสุ่มใหม่ทุกครั้ง แต่ `verifyPassword` ยังตรวจถูกต้อง

🧹 **เก็บกวาด:** ลบ `try-password.js`

## 4.3 ตรวจข้อมูลด้วย Zod

### ขั้นที่ 4.3.1 รู้จัก Zod

> 🎯 **ขั้นนี้จะได้:** เข้าใจวิธีเขียน "กฎ" แล้วเอาข้อมูลมาตรวจ

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ทดลอง `backend/try-zod.js`

```js
import { z } from "zod";

const schema = z.object({
  username: z.string().min(3, "ต้องมีอย่างน้อย 3 ตัว"),
});

const bad = schema.safeParse({ username: "ab" });
console.log(bad.success, bad.error.issues[0].message);

const good = schema.safeParse({ username: "teach1" });
console.log(good.success, good.data);
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | ดึง `z` (ตัวสร้างกฎ) จาก zod | - |
| 3-5 | สร้างกฎ (เรียกว่า **schema**): ข้อมูลต้องเป็น object ที่มีช่อง username เป็นข้อความ ยาวอย่างน้อย 3 ตัว | กำหนดว่าข้อมูลที่ถูกต้องหน้าตาเป็นยังไง |
| 7 | ตรวจข้อมูลที่ผิด (`"ab"` มี 2 ตัว) | - |
| 8 | พิมพ์ผลตรวจ และข้อความ error ตัวแรก | ข้อความนี้แหละที่จะส่งกลับไปให้ผู้ใช้ |
| 10 | ตรวจข้อมูลที่ถูก | - |
| 11 | พิมพ์ผลตรวจ และข้อมูลที่ผ่านการตรวจ | ใช้ข้อมูลนี้ต่อ (เพราะ Zod อาจแปลงค่าให้ด้วย) |

▶️ **รัน:** `node try-zod.js`

✅ **ต้องเห็น:**

```text
false ต้องมีอย่างน้อย 3 ตัว
true { username: 'teach1' }
```

🧩 **Syntax ใหม่: เขียนกฎด้วย Zod (เรียกคำสั่งต่อกันเป็นทอด)**

```syntax
[p:z][s:.][p:object][s:(][s:{]
  [n:ชื่อช่อง][s::] [p:z][s:.][p:ชนิด][s:()][s:.][p:กฎ1][s:(][v:ค่า][s:,] [v:"ข้อความ error"][s:)][s:.][p:กฎ2][s:(][s:...][s:)][s:,]
[s:}][s:)]
```

| ผลของ `safeParse` | ได้อะไร |
|---|---|
| `.success` | `true` = ผ่าน, `false` = ไม่ผ่าน |
| `.data` | ข้อมูลที่ผ่านการตรวจ (มีเฉพาะตอนผ่าน) |
| `.error.issues` | array รายการ error แต่ละตัวมี `path` (ช่องไหน) และ `message` (มีเฉพาะตอนไม่ผ่าน) |

กฎที่ใช้บ่อยในระบบนี้ (ทั้งหมดเป็น 🟣 ที่ Zod กำหนด)

| เขียน | ความหมาย |
|---|---|
| `z.string()` | ต้องเป็นข้อความ |
| `.trim()` | ตัดช่องว่างหัวท้าย (`"  "` กลายเป็น `""`) |
| `.min(1, "ข้อความ")` | อย่างน้อย 1 ตัว = **บังคับกรอก** |
| `.max(100, "...")` | ยาวไม่เกิน 100 |
| `.regex(/^0\d{8,9}$/, "...")` | ตรงรูปแบบ (เช่น เบอร์โทร) ใช้ในบท 05 |
| `z.email("...")` | รูปแบบอีเมล ใช้ในบท 05 |
| `z.enum(["a", "b"])` | เป็นค่าใดค่าหนึ่งในรายการ ใช้ในบท 05 |
| `z.coerce.number()` | แปลงข้อความเป็นตัวเลขก่อนตรวจ (`"20"` เป็น `20`) |
| `.nullish()` | เป็น null หรือไม่ส่งมาก็ได้ (ไม่บังคับ) |
| `.transform((v) => …)` | แปลงค่าหลังตรวจผ่าน |
| `.refine((d) => เงื่อนไข, { message, path })` | ตรวจหลายช่องพร้อมกัน (ขั้น 4.3.4) |

🧹 **เก็บกวาด:** ลบ `try-zod.js`

### ขั้นที่ 4.3.2 กฎที่ใช้ซ้ำทั้งระบบ (schemas/common.js)

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชันสร้างกฎที่ใช้บ่อย เขียนครั้งเดียวใช้ทุก schema

📖 ระบบมีช่องบังคับกรอกหลายสิบช่อง ถ้าเขียน `z.string().trim().min(1, …).max(…)` ทุกช่องจะยาวและพิมพ์ผิดง่าย จึงทำเป็นฟังก์ชัน

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/schemas/common.js`

```js
import { z } from "zod";

// ข้อความบังคับกรอก (กรณีไม่ส่งมาเลย หรือส่งค่าว่าง ได้ข้อความเดียวกัน)
export const requiredText = (msg, max = 255) =>
  z.string({ error: msg }).trim().min(1, msg).max(max, `ต้องไม่เกิน ${max} ตัวอักษร`);

// ข้อความไม่บังคับ: ค่าว่างเก็บเป็น null
export const optionalText = (max = 255) =>
  z.string().trim().max(max, `ต้องไม่เกิน ${max} ตัวอักษร`).nullish().transform((v) => v || null);
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4 | ฟังก์ชัน `requiredText` รับข้อความ error และความยาวสูงสุด (ไม่ส่ง = 255) | เรียกแบบ `requiredText("กรุณากรอกชื่อ", 100)` |
| 5 | ต้องเป็นข้อความ (ถ้าไม่ส่งมาเลย ใช้ข้อความ `msg`) → ตัดช่องว่าง → อย่างน้อย 1 ตัว → ไม่เกิน max | ช่องบังคับ เช่น ชื่อ, ชื่อหัวข้อ, username |
| 8 | ฟังก์ชัน `optionalText` รับความยาวสูงสุด | เรียกแบบ `optionalText(2000)` |
| 9 | ข้อความ ตัดช่องว่าง ไม่เกิน max ไม่ส่งมาก็ได้ แล้ว **แปลงค่าว่างเป็น null** | ช่องไม่บังคับ เช่น คำอธิบาย เบอร์โทร ฐานข้อมูลจะเก็บ NULL แทนข้อความว่าง |

🧩 **Syntax ใหม่: `v || null` (แปลงค่าว่างเป็น null)**

```syntax
[s:(][n:v][s:)] [s:=>] [n:v] [s:||] [v:null]
```

- `||` สอนแล้วในบท 03 ขั้น 3.9.1: "ถ้าซ้ายไม่มีค่า ใช้ขวา"
- ข้อความว่าง `""` นับว่า "ไม่มีค่า" (บท 03 ขั้น 3.10.5) → `"" || null` ได้ `null`
- ข้อความ `"ก"` มีค่า → `"ก" || null` ได้ `"ก"`

### ขั้นที่ 4.3.3 กฎของ id, วันที่ และรหัสผ่าน

> 🎯 **ขั้นนี้จะได้:** กฎที่เหลือใน common.js ครบไฟล์

⌨️ **พิมพ์โค้ด:** เพิ่มต่อท้าย `backend/schemas/common.js`

```js
// รหัส (id) ที่ต้องเป็นจำนวนเต็มบวก รับได้ทั้งตัวเลขและข้อความตัวเลข
export const idField = (msg) => z.coerce.number({ error: msg }).int(msg).positive(msg);

export const dateField = (msg) => z.iso.date({ error: msg });

export const passwordText = z
  .string({ error: "กรุณากรอกรหัสผ่านใหม่" })
  .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
  .max(50, "รหัสผ่านต้องไม่เกิน 50 ตัวอักษร");
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | แปลงเป็นตัวเลข → ต้องเป็นจำนวนเต็ม → ต้องมากกว่า 0 | ช่องที่เป็น id เช่น `topic_id`, `committee_id` (บท 05) รับได้ทั้ง `3` และ `"3"` เพราะฟอร์มบางแบบส่งมาเป็นข้อความ |
| 4 | ต้องเป็นวันที่รูปแบบ `YYYY-MM-DD` เช่น `2026-11-01` | วันเริ่ม-วันสิ้นสุดของหัวข้อ (ช่อง `<input type="date">` ส่งรูปแบบนี้) |
| 6-9 | รหัสผ่านใหม่ 6-50 ตัว | ใช้ตอนเปลี่ยนรหัส (ไม่ใช่ฟังก์ชัน เพราะใช้แบบเดียวทุกที่) |

> 🧩 syntax ใหม่: เขียนคำสั่งต่อกันหลายบรรทัดได้ โดยขึ้นบรรทัดใหม่ **ก่อนจุด** แล้วย่อหน้า (บรรทัด 6-9) อ่านง่ายกว่าเขียนยาวบรรทัดเดียว

<details>
<summary>📄 ไฟล์ schemas/common.js ทั้งไฟล์ (กดดูไว้เทียบ)</summary>

ไฟล์จริงในโปรเจกต์: [backend/schemas/common.js](../../backend/schemas/common.js) = ขั้น 4.3.2 + 4.3.3 ต่อกัน

</details>

### ขั้นที่ 4.3.4 schema ของ login, เปลี่ยนรหัส และหัวข้อ

> 🎯 **ขั้นนี้จะได้:** กฎตรวจข้อมูลของ 3 ฟอร์มแรก

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/schemas/auth.js`

```js
import { z } from "zod";
import { requiredText, passwordText } from "./common.js";

export const loginSchema = z.object({
  username: requiredText("กรุณากรอกชื่อผู้ใช้"),
  password: requiredText("กรุณากรอกรหัสผ่าน"),
});

export const changePasswordSchema = z.object({
  old_password: requiredText("กรุณากรอกรหัสผ่านเดิม"),
  new_password: passwordText,
});
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4-7 | login ต้องมี username และ password | ใช้กับ `POST /api/auth/login` |
| 9-12 | เปลี่ยนรหัสต้องมีรหัสเดิม และรหัสใหม่ 6-50 ตัว | ใช้กับ `PUT /api/auth/change-password` |

> 💡 ชื่อช่อง (`username`, `old_password` …) ต้อง **ตรงกับชื่อใน body** ที่หน้าเว็บส่งมา

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/schemas/topic.js`

```js
import { z } from "zod";
import { requiredText, optionalText, dateField } from "./common.js";

export const topicSchema = z
  .object({
    title: requiredText("กรุณากรอกชื่อหัวข้อ", 200),
    description: optionalText(2000),
    start_date: dateField("กรุณาเลือกวันเริ่มประเมิน"),
    end_date: dateField("กรุณาเลือกวันสิ้นสุดการประเมิน"),
  })
  .refine((d) => d.end_date >= d.start_date, {
    message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม",
    path: ["end_date"],
  });
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 6 | ชื่อหัวข้อบังคับ ไม่เกิน 200 ตัว | ตรงกับ `VARCHAR(200)` ในฐานข้อมูล (บท 02) ข้อความเกินจะถูกปฏิเสธก่อนถึงฐานข้อมูล |
| 7 | คำอธิบายไม่บังคับ ไม่เกิน 2000 ตัว | - |
| 8-9 | วันเริ่มและวันสิ้นสุด ต้องเป็นวันที่ | - |
| 11 | ตรวจข้ามช่อง: วันสิ้นสุดต้อง ≥ วันเริ่ม | ข้อความ error ภาษาไทยที่ชัดกว่า error จาก CHECK ของฐานข้อมูล |
| 12-13 | ข้อความ error และบอกว่าให้ไปแสดงที่ช่อง `end_date` | หน้าเว็บโชว์ข้อความใต้ช่องวันสิ้นสุด |

🧩 **Syntax ใหม่: `.refine()` (ตรวจหลายช่องพร้อมกัน)**

```syntax
[p:z][s:.][p:object][s:(][s:{] [s:...] [s:}][s:)][s:.][p:refine][s:(][s:(][n:d][s:)] [s:=>] [v:เงื่อนไขที่ต้องเป็นจริง][s:,] [s:{]
  [p:message][s::] [v:"ข้อความ error"][s:,]
  [p:path][s::] [s:\[][v:"ชื่อช่องที่จะแสดง error"][s:\]][s:,]
[s:}][s:)]
```

- `d` = ข้อมูลทั้ง object (ตั้งชื่อเอง) ใช้ `d.ชื่อช่อง` อ่านค่าแต่ละช่อง
- เงื่อนไขเป็น `true` = ผ่าน, `false` = ไม่ผ่าน
- `"2026-12-31" >= "2026-11-01"` เทียบข้อความได้ถูก เพราะรูปแบบ `YYYY-MM-DD` เรียงตามตัวอักษรตรงกับตามวันที่

### ขั้นที่ 4.3.5 ด่านตรวจข้อมูล (middleware/validate.js)

> 🎯 **ขั้นนี้จะได้:** ด่านที่ใส่หน้า route ได้เลย ถ้าข้อมูลผิดตอบ 400 ให้อัตโนมัติ

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/middleware/validate.js`

```js
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
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4 | ฟังก์ชัน `validate` รับ schema แล้ว **ส่งกลับเป็นด่าน** (middleware) | เรียกแบบ `validate(topicSchema)` ในหน้า route |
| 5 | ตรวจ body (ถ้า body ไม่มี ใช้ object ว่าง) | - |
| 6 | ถ้าไม่ผ่าน | - |
| 7 | แปลงรายการ error เป็น `{ field, message }` ทีละตัว | หน้าเว็บจะรู้ว่าช่องไหนผิด แสดงข้อความใต้ช่องนั้น |
| 8 | ตอบ 400: message = error ตัวแรก, data = error ทุกตัว แล้วจบ | ผู้ใช้เห็นข้อความแรกทันที |
| 10 | **แทน `req.body` ด้วยข้อมูลที่ตรวจแล้ว** | route ข้างหลังได้ข้อมูลที่ trim แล้ว ค่าว่างเป็น null แล้ว |
| 11 | ส่งต่อให้ด่านถัดไป | ถึง route จริง |

🧩 **Syntax ใหม่ 1: ฟังก์ชันที่ส่งกลับฟังก์ชัน (`=>` 2 ชั้น)**

```syntax
[k:const] [n:validate] [s:=] [s:(][n:schema][s:)] [s:=>] [s:(][n:req][s:,] [n:res][s:,] [n:next][s:)] [s:=>] [s:{] [s:...] [s:}][s:;]
```

อ่านทีละชั้น
1. `validate = (schema) => …` → ฟังก์ชันรับ schema
2. `… => (req, res, next) => { … }` → สิ่งที่ส่งกลับคือ "ด่าน" ที่ Express เรียกได้
3. `validate(topicSchema)` จึงได้ด่านที่จำ schema ไว้ข้างใน ใส่ใน route ได้

🧩 **Syntax ใหม่ 2: `next()`**

- ด่านทุกด่าน (middleware) มีพารามิเตอร์ที่ 3 ชื่อ `next`
- เรียก `next()` = "ผ่าน ไปด่านถัดไป"
- ถ้าไม่เรียก `next()` และไม่ตอบกลับ คำขอจะค้าง

🧩 **Syntax ใหม่ 3: `.map()` (แปลงทุกตัวใน array)**

```syntax
[n:array][s:.][p:map][s:(][s:(][n:แต่ละตัว][s:)] [s:=>] [v:ค่าใหม่][s:)]
```

```js
[1, 2, 3].map((n) => n * 10);   // [10, 20, 30]
```

- คล้าย `.filter()` (บท 03) แต่ `map` **แปลง** ทุกตัว ได้ array ใหม่ขนาดเท่าเดิม
- `(i) => ({ field: …, message: … })` ถ้าจะส่งกลับ object ในบรรทัดเดียว **ต้องครอบด้วย `( )`** ไม่งั้น JavaScript คิดว่า `{` คือเปิดชุดคำสั่ง

🧩 **Syntax ใหม่ 4: `??` (ถ้าเป็น null/undefined ใช้ค่าสำรอง)**

```syntax
[n:ค่า] [s:??] [v:ค่าสำรอง]
```

- คล้าย `||` แต่ใช้ค่าสำรอง **เฉพาะเมื่อเป็น `null` หรือ `undefined`** (ถ้าเป็น `0` หรือ `""` ยังใช้ค่าเดิม)
- `i.path.join(".")` = เอา array path มาต่อกันด้วยจุด เช่น `["end_date"]` → `"end_date"`

✅ **ลองเลย:** ยังทดสอบไม่ได้ จะได้ใช้จริงในขั้น 4.4.1

ตัวอย่างคำตอบเมื่อข้อมูลผิด (จะได้เห็นในขั้น 4.8.2)

```json
{
  "status": "error",
  "message": "กรุณากรอกชื่อหัวข้อ",
  "data": [
    { "field": "title", "message": "กรุณากรอกชื่อหัวข้อ" },
    { "field": "start_date", "message": "กรุณาเลือกวันเริ่มประเมิน" }
  ]
}
```

## 4.4 API Login

### ขั้นที่ 4.4.1 ตรวจชื่อผู้ใช้และรหัสผ่าน

> 🎯 **ขั้นนี้จะได้:** ส่วนแรกของ login: หาผู้ใช้และตรวจรหัส

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/routes/auth.js`

```js
import { Router } from "express";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, changePasswordSchema } from "../schemas/auth.js";

const router = Router();
const ALL_ROLES = ["hr", "evaluatee", "committee"];

// POST /api/auth/login  body: { username, password }
router.post("/login", validate(loginSchema), async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return fail(res, 401, "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  }
  // (ขั้น 4.4.2 จะเขียนต่อตรงนี้)
});

export default router;
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | ดึง package `jsonwebtoken` | สร้าง token ในขั้น 4.4.2 |
| 5-7 | ดึงฟังก์ชันที่เขียนในขั้นก่อนๆ (hash รหัสผ่าน, ด่านตรวจข้อมูล, schema) | - |
| 10 | รายชื่อบทบาททั้ง 3 เก็บเป็น array | ใช้ในขั้น 4.6 (เปลี่ยนรหัสได้ทุกบทบาท) |
| 13 | route POST `/login` มีด่าน `validate(loginSchema)` ก่อน | ไม่กรอก username/password → 400 ก่อนถึงโค้ดข้างใน |
| 14 | แกะ username, password จาก body | - |
| 15-16 | หาผู้ใช้จาก username เก็บไว้ใน `user` (ไม่พบ = `undefined`) | - |
| 17 | ถ้า **ไม่พบผู้ใช้** หรือ **รหัสไม่ตรง** | - |
| 18 | ตอบ 401 ด้วย **ข้อความเดียวกันทั้ง 2 กรณี** | ถ้าตอบต่างกัน คนร้ายจะรู้ว่า username ไหนมีอยู่จริง |

> 🧩 **syntax ที่ควรสังเกตในบรรทัด 17:** `!(await verifyPassword(...))`
> ต้องครอบ `await …` ด้วย `( )` ก่อนใส่ `!` เพื่อให้ "รอผลก่อน แล้วค่อยกลับค่า" ถ้าเขียน `!await …` จะอ่านยากและสับสนง่าย

### ขั้นที่ 4.4.2 ออก token และตอบกลับ

> 🎯 **ขั้นนี้จะได้:** login ถูกแล้วได้ token และข้อมูลผู้ใช้กลับไป

⌨️ **พิมพ์โค้ด:** ใน `routes/auth.js` พิมพ์แทนบรรทัด `// (ขั้น 4.4.2 จะเขียนต่อตรงนี้)`

```js
  const token = jwt.sign(
    { id: user.id, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
  ok(res, {
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      must_change_password: !!user.must_change_password,
    },
  }, "เข้าสู่ระบบสำเร็จ");
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | สร้าง token ด้วย `jwt.sign(ข้อมูล, กุญแจ, ตัวเลือก)` | บัตรผ่านที่หน้าเว็บจะแนบมาทุกคำขอ |
| 2 | ข้อมูลใน token (payload): id, role, ชื่อ | ด่าน `verifyToken` แกะออกมาเป็น `req.user` ใช้ตรวจสิทธิ์และรู้ว่าใครเรียก |
| 3 | เซ็นด้วย `JWT_SECRET` จาก .env | คนที่ไม่รู้ค่านี้ปลอม token ไม่ได้ |
| 4 | หมดอายุตาม .env (ไม่มี ใช้ 8 ชั่วโมง) | token หลุดไปก็ใช้ได้ไม่ตลอด |
| 6-14 | ตอบกลับ token และข้อมูลผู้ใช้ **เฉพาะที่จำเป็น** | **ห้ามส่ง `password_hash` กลับไป** |
| 13 | `must_change_password` แปลงเป็น true/false | หน้าเว็บใช้บังคับเปลี่ยนรหัสครั้งแรก (บท 07) |

🧩 **Syntax ใหม่: `!!` (แปลงเป็น true/false)**

```syntax
[s:!!][n:ค่า]
```

- MySQL ส่ง BOOLEAN มาเป็น `1` หรือ `0`
- `!1` = `false` → `!!1` = `true` / `!0` = `true` → `!!0` = `false`
- ใช้ `!` 2 ครั้ง = กลับค่า 2 รอบ ได้ true/false ที่ตรงกับค่าเดิม

> 💡 object ซ้อน object (บรรทัด 6-14) สอนแล้วในบท 03 ขั้น 3.7.2 ส่วน `token,` คือแบบย่อชื่อ (บท 03 ขั้น 3.8.1)

### ขั้นที่ 4.4.3 ต่อ route auth เข้า app.js แล้วทดสอบ login

> 🎯 **ขั้นนี้จะได้:** login ผ่าน Thunder Client ได้ token

⌨️ **แก้โค้ด:** เปิด `backend/app.js`
1. เพิ่ม import (ใต้ `import { ok, fail } …`)

```js
import authRoutes from "./routes/auth.js";
```

2. เพิ่มบรรทัดนี้ **ใต้ route `/api/health` และเหนือ `app.use("/api/topics", …)`**

```js
app.use("/api/auth", authRoutes);
```

| โค้ด | เอาไว้ทำอะไร |
|---|---|
| `app.use("/api/auth", authRoutes)` | คำขอที่ขึ้นต้นด้วย `/api/auth` ส่งไปไฟล์ routes/auth.js → `/login` ในไฟล์ = `/api/auth/login` |

▶️ **ทดสอบ:** Thunder Client → **POST** `http://localhost:5000/api/auth/login` → Body JSON

```json
{ "username": "hr1", "password": "123456" }
```

✅ **ต้องเห็น:** **401** "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" ถูกต้องแล้ว เพราะยังไม่มีบัญชีในระบบ ขั้นถัดไปจะสร้างบัญชี

✅ **ลองไม่กรอก:** body `{}` ต้องได้ **400** "กรุณากรอกชื่อผู้ใช้"

❗ **ถ้าไม่ได้**

| เห็นข้อความ | สาเหตุ | แก้ |
|---|---|---|
| 404 "ไม่พบ endpoint นี้" | ลืม `app.use("/api/auth", …)` หรือวางใต้บรรทัด 404 | ตรวจ app.js |

### ขั้นที่ 4.4.4 API สมัครสมาชิก

> 🎯 **ขั้นนี้จะได้:** สมัครสมาชิกได้ โดยบัญชีใหม่เป็นผู้รับการประเมินเสมอ (ข้อ 3.2.5.2 ลงทะเบียนเพื่อใช้งานระบบ)

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/schemas/user.js`

```js
import { z } from "zod";
import { requiredText, optionalText } from "./common.js";

// hr เพิ่มได้เฉพาะผู้รับการประเมินและกรรมการ
export const userSchema = z.object({
  username: requiredText("กรุณากรอกชื่อผู้ใช้", 50)
    .min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร")
    .regex(/^[a-zA-Z0-9_.]+$/, "ชื่อผู้ใช้ใช้ได้เฉพาะ a-z, 0-9, _ และ ."),
  full_name: requiredText("กรุณากรอกชื่อ-สกุล", 100),
  email: z
    .union([z.literal(""), z.email("รูปแบบอีเมลไม่ถูกต้อง").max(100)])
    .nullish()
    .transform((v) => v || null),
  phone: z
    .union([z.literal(""), z.string().regex(/^0\d{8,9}$/, "เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก ขึ้นต้นด้วย 0")])
    .nullish()
    .transform((v) => v || null),
  position: optionalText(100),
  department: optionalText(100),
  role: z.enum(["evaluatee", "committee"], { error: "บทบาทต้องเป็นผู้รับการประเมินหรือกรรมการ" }),
});
```

> 💡 กฎแต่ละบรรทัดจะอธิบายละเอียดในบท 05 ขั้น 5.2 ตอนนี้พิมพ์ตามไปก่อน

⌨️ **แก้โค้ด:** เปิด `backend/schemas/auth.js` เพิ่ม import และ schema ใหม่

```js
import { userSchema } from "./user.js";

// สมัครสมาชิก: ตัด role ออก ถ้าส่ง role มา Zod จะทิ้งให้เอง
export const registerSchema = userSchema.omit({ role: true }).extend({ password: passwordText });
```

⌨️ **แก้โค้ด:** เปิด `backend/routes/auth.js`
1. แก้บรรทัด import ของ schema ให้มี `registerSchema`

```js
import { loginSchema, registerSchema, changePasswordSchema } from "../schemas/auth.js";
```

2. พิมพ์ route นี้ **เหนือบรรทัด** `// POST /api/auth/login`

```js
// POST /api/auth/register  body: { username, password, full_name, email, phone, position, department }
// ไม่ต้อง login และได้ role = evaluatee เสมอ (บัญชี hr คนแรกให้เปลี่ยน role ใน DB)
router.post("/register", validate(registerSchema), async (req, res) => {
  const u = req.body;
  const [result] = await pool.query(
    "INSERT INTO users (username, password_hash, full_name, email, phone, position, department, role, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?, 'evaluatee', FALSE)",
    [u.username, await hashPassword(u.password), u.full_name, u.email, u.phone, u.position, u.department]
  );
  ok(res, { id: result.insertId, username: u.username }, "สมัครสมาชิกสำเร็จ", 201);
});
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | ไม่มี `verifyToken` | คนสมัครยังไม่มีบัญชี จึงยัง login ไม่ได้ |
| 6 | เขียน `'evaluatee'` และ `FALSE` ไว้ใน SQL เลย | รับ role จากภายนอกไม่ได้ จึงสมัครเป็น hr เองไม่ได้ และคนสมัครตั้งรหัสเองแล้วจึงไม่ต้องบังคับเปลี่ยน |
| 7 | hash รหัสผ่านก่อนบันทึก | ฐานข้อมูลไม่เก็บรหัสจริง |
| 9 | ตอบ 201 พร้อม id ใหม่ | แพตเทิร์น "เพิ่ม" แบบเดียวกับบท 03 |

> 🧩 syntax ใหม่: `.omit({ role: true })` = สร้าง schema ใหม่โดยตัดช่อง role ออก, `.extend({ … })` = เพิ่มช่องใหม่ต่อจากของเดิม

### ขั้นที่ 4.4.5 สร้างบัญชี 6 บัญชี แล้วทดสอบ login

> 🎯 **ขั้นนี้จะได้:** บัญชีจริงครบ 3 บทบาท ใช้ต่อทั้งคู่มือ

⌨️ **ทำตาม:** Thunder Client → **POST** `http://localhost:5000/api/auth/register` → Body JSON ส่งทีละบัญชี **ตามลำดับนี้** แต่ละครั้งต้องได้ **201** และ `id` ตามตาราง

```json
{ "username": "hr1", "password": "123456", "full_name": "สมศรี ใจดี" }
```

| id | username | full_name | บทบาทที่จะตั้ง |
|---|---|---|---|
| 1 | `hr1` | สมศรี ใจดี | hr |
| 2 | `comm1` | ประเสริฐ วงศ์ดี | committee |
| 3 | `comm2` | วิไล สายทอง | committee |
| 4 | `comm3` | ชัยวัฒน์ แก้วมา | committee |
| 5 | `teach1` | สมชาย รักเรียน | evaluatee (ค่าเริ่มต้น) |
| 6 | `teach2` | มาลี ศรีสุข | evaluatee (ค่าเริ่มต้น) |

⌨️ **ทำตาม:** เปลี่ยน role ในฐานข้อมูล (พิมพ์ทีละบรรทัด ใช้ได้ใน **PowerShell** และ **Git Bash** หรือแก้ใน HeidiSQL/DBeaver ก็ได้)

```bash
echo "UPDATE users SET role='hr' WHERE username='hr1'" | docker exec -i eva_mysql sh -c 'mysql -uroot -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE'
echo "UPDATE users SET role='committee' WHERE username LIKE 'comm%'" | docker exec -i eva_mysql sh -c 'mysql -uroot -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE'
```

> 💡 ชื่อบัญชีแรกคือ `hr1` เพราะชื่อผู้ใช้ต้องยาวอย่างน้อย 3 ตัว (`hr` สมัครไม่ได้)

> 💡 **ทำไมต้องแก้ใน DB?** API สมัครสมาชิกสร้าง hr ไม่ได้ เพื่อความปลอดภัย บัญชี hr คนแรกจึงต้องตั้งโดยคนที่เข้าถึงฐานข้อมูลได้ ส่วนกรรมการคนอื่นๆ ในงานจริง hr จะเป็นคนเพิ่มผ่าน `POST /api/users` (บท 05)

▶️ **ทดสอบ:** **POST** `http://localhost:5000/api/auth/login` → Body JSON

```json
{ "username": "hr1", "password": "123456" }
```

✅ **ต้องเห็น:** 200 "เข้าสู่ระบบสำเร็จ" และ `data.token` เป็นข้อความยาวขึ้นต้นด้วย `eyJ` และ `data.user.role` = `"hr"`

✅ **ลองรหัสผิด:** เปลี่ยน password เป็น `"999999"` ต้องได้ **401** "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"

✅ **ลองสมัครซ้ำ:** POST `/api/auth/register` ด้วย `hr1` อีกครั้ง ต้องได้ **400** "ข้อมูลซ้ำกับที่มีอยู่แล้ว"

✅ **ลองแอบเป็น hr:** สมัคร `{ "username": "hack1", "password": "123456", "full_name": "x", "role": "hr" }` แล้ว login บัญชีนี้ ต้องได้ `role` เป็น `"evaluatee"` เมื่อดูผลแล้วลบบัญชีนี้ทิ้ง

```bash
echo "DELETE FROM users WHERE username='hack1'" | docker exec -i eva_mysql sh -c 'mysql -uroot -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE'
```

❗ **ถ้าไม่ได้**

| เห็นข้อความ | สาเหตุ | แก้ |
|---|---|---|
| login ถูกแต่ได้ 401 ตลอด | ยังไม่ได้สมัครบัญชี หรือพิมพ์รหัสผิดตอนสมัคร | ลองสมัครใหม่ด้วยชื่ออื่น |
| `secretOrPrivateKey must have a value` | ไม่มี `JWT_SECRET` ใน .env | ตรวจ `.env` แล้วรีสตาร์ท server (`Ctrl + C` แล้ว `npm run dev`) |
| login ได้ แต่ role ยังเป็น evaluatee | login ก่อนรันคำสั่ง UPDATE | รัน UPDATE แล้ว login ใหม่ เพราะ role อยู่ใน token |
| id ไม่ตรงตาราง | สมัครสลับลำดับ หรือเคยสมัครไม่สำเร็จ | รีเซ็ตฐานข้อมูล (บท 02 ขั้น 2.6.1) แล้วทำบท 03 ขั้น 3.10.6 และขั้นนี้ใหม่ |

## 4.5 ด่านตรวจ token และสิทธิ์

### ขั้นที่ 4.5.1 ด่าน verifyToken

> 🎯 **ขั้นนี้จะได้:** ด่านที่ตรวจว่ามี token ที่ถูกต้องไหม ถ้าไม่มีตอบ 401

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/middleware/auth.js`

```js
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
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5 | ด่าน verifyToken (ฟังก์ชันแบบปกติ รับ 3 ค่าแบบ middleware) | ใส่หน้า route ที่ต้อง login |
| 6 | อ่าน header `Authorization` ถ้าไม่มีใช้ข้อความว่าง | ค่าจะเป็น `"Bearer eyJ..."` |
| 7 | ถ้าขึ้นต้นด้วย `"Bearer "` ตัด 7 ตัวแรกทิ้ง ได้ token ไม่งั้นเป็น null | แยก token ออกจากคำว่า Bearer |
| 8 | ไม่มี token ตอบ 401 แล้วจบ | ยังไม่ login |
| 9 | เริ่มลองทำ (ถ้า error ไปที่ catch) | - |
| 10 | ตรวจลายเซ็นและวันหมดอายุ ผ่านแล้วได้ payload เก็บใน `req.user` | route ข้างหลังรู้ว่าใครเรียก ผ่าน `req.user.id`, `req.user.role` |
| 11 | ผ่าน ไปด่านถัดไป | - |
| 12-13 | ถ้า `jwt.verify` โยน error (token ปลอม/หมดอายุ) ตอบ 401 | กัน token ปลอม |

🧩 **Syntax ใหม่ 1: `เงื่อนไข ? ค่าถ้าจริง : ค่าถ้าเท็จ` (ternary)**

```syntax
[v:เงื่อนไข] [s:?] [v:ค่าถ้าจริง] [s::] [v:ค่าถ้าเท็จ]
```

- เหมือน `if … else` แบบสั้น ที่ **ได้ค่าออกมา** เก็บใส่ตัวแปรได้
- `header.startsWith("Bearer ") ? header.slice(7) : null` = "ถ้าขึ้นต้นด้วย Bearer ได้ token ไม่งั้นได้ null"

🧩 **Syntax ใหม่ 2: คำสั่งของข้อความ**

| คำสั่ง | ทำอะไร | ตัวอย่าง |
|---|---|---|
| `.startsWith("x")` | ขึ้นต้นด้วย x ไหม (true/false) | `"Bearer abc".startsWith("Bearer ")` → `true` |
| `.slice(7)` | ตัดตั้งแต่ตัวที่ 7 (นับจาก 0) ไปจนจบ | `"Bearer abc".slice(7)` → `"abc"` |

🧩 **Syntax ใหม่ 3: `try … catch` (ลองทำ ถ้าพังให้จัดการ)**

```syntax
[k:try] [s:{]
  [v:คำสั่งที่อาจ error]
[s:}] [k:catch] [s:{]
  [v:คำสั่งที่ทำเมื่อ error]
[s:}]
```

- ถ้าบรรทัดไหนใน `try` error จะกระโดดไป `catch` ทันที (บรรทัดที่เหลือใน try ไม่ทำ)
- ปกติ Express 5 ส่ง error ไป error handler ให้เอง (บท 03) แต่ตรงนี้เราอยากตอบ **401** ไม่ใช่ 500 จึงดักเอง

### ขั้นที่ 4.5.2 ด่าน requireRole

> 🎯 **ขั้นนี้จะได้:** ด่านที่ตรวจว่าบทบาทของผู้ใช้ได้รับอนุญาตไหม ถ้าไม่ตอบ 403

⌨️ **พิมพ์โค้ด:** เพิ่มต่อท้าย `backend/middleware/auth.js`

```js
// อนุญาตเฉพาะ role ที่กำหนด ใช้ต่อจาก verifyToken
export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : fail(res, 403, "ไม่มีสิทธิ์เข้าถึง");
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | `requireRole` รับรายชื่อบทบาทกี่ตัวก็ได้ แล้วส่งกลับเป็นด่าน (แบบเดียวกับ validate ขั้น 4.3.5) | เรียกแบบ `requireRole("hr")` หรือ `requireRole("hr", "committee")` |
| 3 | ถ้าบทบาทของผู้ใช้อยู่ในรายชื่อ → ผ่าน ไม่งั้นตอบ 403 | กันบทบาทที่ไม่มีสิทธิ์ เช่น ครูเรียก API ลบผู้ใช้ |

🧩 **Syntax ใหม่ 1: `...ชื่อ` ในพารามิเตอร์ (รับกี่ค่าก็ได้)**

```syntax
[s:(][s:...][n:ชื่อ][s:)] [s:=>] [s:...]
```

- `requireRole("hr", "committee")` → ข้างในได้ `roles = ["hr", "committee"]`
- ต่างจาก `...` ใน object (บท 03 ขั้น 3.10.5) ที่ใช้ "กระจาย" ตรงนี้คือ "รวบ" ค่าที่ส่งมาเป็น array

🧩 **Syntax ใหม่ 2: `.includes()`**

```js
["hr", "committee"].includes("hr");         // true
["hr", "committee"].includes("evaluatee");  // false
```

> ❗ **ต้องใช้ต่อจาก `verifyToken` เสมอ** เพราะ `req.user` ถูกสร้างใน verifyToken ถ้าไม่มี จะ error `Cannot read properties of undefined (reading 'role')`

✅ **ลองเลย:** ถ้าขั้น 4.4.3 ใส่ `//` ไว้หน้าบรรทัด import ของ middleware/auth.js ให้เอา `//` ออก กดบันทึก server ต้องไม่มี error สีแดง

### ขั้นที่ 4.5.3 วิธีใช้ด่านใน route 3 แบบ

> 🎯 **ขั้นนี้จะได้:** รู้ว่าจะวางด่านตรงไหน (ใช้ทั้งระบบ)

```js
// แบบ 1: ทุก route ในไฟล์ ต้อง login + เป็น hr (ใช้กับ users, assignments, backups)
router.use(verifyToken, requireRole("hr"));

// แบบ 2: ทุก route ต้อง login แต่สิทธิ์ต่างกันแต่ละ route (ใช้กับ topics, indicators)
router.use(verifyToken);
router.get("/", requireRole("hr", "evaluatee", "committee"), async (req, res) => { … });
router.post("/", requireRole("hr"), async (req, res) => { … });

// แบบ 3: ใส่เฉพาะ route (ใช้กับ change-password เพราะ login ต้องเรียกได้โดยไม่มี token)
router.put("/change-password", verifyToken, requireRole(...ALL_ROLES), async (req, res) => { … });
```

| แบบ | เขียนที่ไหน | ผลคือ |
|---|---|---|
| 1 | `router.use(…)` ด้านบนไฟล์ | ทุก route ในไฟล์ผ่านด่านนี้ |
| 2 | `router.use(verifyToken)` + `requireRole` ในแต่ละ route | login ทุก route แต่สิทธิ์ต่างกัน |
| 3 | ใส่ในวงเล็บของ route นั้นๆ ก่อน handler | เฉพาะ route นั้น |

🧩 **Syntax ใหม่: route มีหลายด่าน**

```syntax
[n:router][s:.][p:post][s:(][v:"/url"][s:,] [n:ด่าน1][s:,] [n:ด่าน2][s:,] [k:async] [s:(][n:req][s:,] [n:res][s:)] [s:=>] [s:{] [s:...] [s:}][s:)][s:;]
```

- คั่นแต่ละด่านด้วย `,` Express ทำ **จากซ้ายไปขวา** ด่านไหนไม่ผ่านจะตอบกลับทันที ไม่ไปต่อ
- ลำดับที่ถูก: `verifyToken` → `requireRole` → `validate` → handler (ตรวจว่าใคร → มีสิทธิ์ไหม → ข้อมูลถูกไหม → ทำงาน)
- `requireRole(...ALL_ROLES)` = กระจาย array เป็นค่าทีละตัว = `requireRole("hr", "evaluatee", "committee")`

> ❗ **กฎของโจทย์:** ทุก route ยกเว้น login ต้องมี `verifyToken` + `requireRole`

## 4.6 API เปลี่ยนรหัสผ่าน

### ขั้นที่ 4.6.1 route change-password

> 🎯 **ขั้นนี้จะได้:** ผู้ใช้ทุกบทบาทเปลี่ยนรหัสของตัวเองได้ และปลดการบังคับเปลี่ยนรหัสครั้งแรก

⌨️ **แก้โค้ด:** ใน `routes/auth.js` เพิ่ม import ด่านที่เขียนในขั้น 4.5 **ใต้** `import { hashPassword, verifyPassword } …`

```js
import { verifyToken, requireRole } from "../middleware/auth.js";
```

⌨️ **พิมพ์โค้ด:** ใน `routes/auth.js` เพิ่มต่อจาก route login (ก่อน `export default router;`)

```js
// PUT /api/auth/change-password  body: { old_password, new_password }
router.put("/change-password", verifyToken, requireRole(...ALL_ROLES), validate(changePasswordSchema), async (req, res) => {
  const { old_password, new_password } = req.body;
  const [rows] = await pool.query("SELECT password_hash FROM users WHERE id = ?", [req.user.id]);
  if (!rows[0]) return fail(res, 404, "ไม่พบผู้ใช้");
  if (!(await verifyPassword(old_password, rows[0].password_hash))) {
    return fail(res, 400, "รหัสผ่านเดิมไม่ถูกต้อง");
  }
  if (old_password === new_password) return fail(res, 400, "รหัสผ่านใหม่ต้องไม่ซ้ำรหัสผ่านเดิม");
  await pool.query("UPDATE users SET password_hash = ?, must_change_password = FALSE WHERE id = ?", [
    await hashPassword(new_password),
    req.user.id,
  ]);
  ok(res, null, "เปลี่ยนรหัสผ่านสำเร็จ");
});
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | PUT `/change-password` ผ่าน 3 ด่าน: login แล้ว, บทบาทใดก็ได้, ข้อมูลถูกรูปแบบ | หน้า "เปลี่ยนรหัสผ่าน" (บท 07) เรียก URL นี้ |
| 4 | ดึง hash ของ **ผู้ใช้ที่ login อยู่** (`req.user.id` จาก token) | **ไม่รับ id จาก body** ไม่อย่างนั้นใครก็เปลี่ยนรหัสคนอื่นได้ |
| 5 | ไม่พบผู้ใช้ (ถูกลบไปแล้ว) ตอบ 404 | - |
| 6-8 | รหัสเดิมผิด ตอบ **400** | ต่างจาก login (401) เพราะผู้ใช้ login อยู่แล้ว แค่กรอกข้อมูลในฟอร์มผิด |
| 9 | รหัสใหม่ซ้ำรหัสเดิม ตอบ 400 | บังคับให้ตั้งรหัสใหม่จริงๆ (โดยเฉพาะตอนเข้าครั้งแรก) |
| 10-13 | บันทึก hash ของรหัสใหม่ และตั้ง `must_change_password = FALSE` | ปลดการบังคับเปลี่ยนรหัสครั้งแรก (เกณฑ์ 5.2.1) |
| 14 | ตอบสำเร็จ | - |

> 🧩 syntax ใหม่: `await` อยู่ข้างใน array ได้ (บรรทัด 11) = รอ hash เสร็จก่อน แล้วค่อยเอาผลใส่ array ส่งให้ query

▶️ **ทดสอบ:**
1. login เป็น `teach1` / `123456` คัดลอก token
2. Thunder Client → **PUT** `http://localhost:5000/api/auth/change-password` → แท็บ **Auth** → เลือก **Bearer** → วาง token
3. Body JSON

```json
{ "old_password": "111111", "new_password": "abcdef" }
```

✅ **ต้องเห็น:** **400** "รหัสผ่านเดิมไม่ถูกต้อง"

✅ **ลองไม่ใส่ token** (แท็บ Auth เลือก None): ต้องได้ **401** "กรุณาเข้าสู่ระบบ"

> 💡 **อย่าเพิ่งเปลี่ยนรหัสจริง** เพราะบทต่อไปใช้ teach1 / `123456` ทดสอบ

## 4.7 ใส่ด่านให้ API หัวข้อ

### ขั้นที่ 4.7.1 บังคับ login ทุก route ใน topics.js

> 🎯 **ขั้นนี้จะได้:** API หัวข้อเรียกไม่ได้ถ้าไม่ login

⌨️ **แก้โค้ด:** เปิด `backend/routes/topics.js`
1. เพิ่ม 3 บรรทัด import ใต้ import เดิม (บรรทัด 4-6 ด้านล่าง)
2. เพิ่ม `router.use(verifyToken);` ใต้ `const router = Router();` (บรรทัด 9)

```js
import { Router } from "express";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { topicSchema } from "../schemas/topic.js";

const router = Router();
router.use(verifyToken);
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4-6 | ดึงด่านทั้ง 3 และ schema ของหัวข้อ | ใช้ในขั้น 4.7.2-4.7.3 |
| 9 | ทุก route ในไฟล์นี้ต้องผ่าน verifyToken | ไม่ login ดูหัวข้อไม่ได้ (แบบ 2 ของขั้น 4.5.3) |

✅ **ลองเลย:** เปิด http://localhost:5000/api/topics ในเบราว์เซอร์ (ไม่มี token) ต้องได้ **401** "กรุณาเข้าสู่ระบบ"

### ขั้นที่ 4.7.2 กำหนดสิทธิ์แต่ละ route

> 🎯 **ขั้นนี้จะได้:** ทุกบทบาทดูหัวข้อได้ แต่เพิ่ม/แก้/ลบได้เฉพาะ hr

⌨️ **แก้โค้ด:** เติมด่าน `requireRole(…)` หลัง URL ของแต่ละ route (คำที่เพิ่มคือส่วน `requireRole(…),`)

```js
router.get("/", requireRole("hr", "evaluatee", "committee"), async (req, res) => {
router.get("/:id", requireRole("hr", "evaluatee", "committee"), async (req, res) => {
router.post("/", requireRole("hr"), async (req, res) => {
router.put("/:id", requireRole("hr"), async (req, res) => {
router.delete("/:id", requireRole("hr"), async (req, res) => {
```

| route | ใครทำได้ | เพราะ |
|---|---|---|
| GET ทั้ง 2 | ทุกบทบาท | ผู้รับประเมินและกรรมการต้องเห็นหัวข้อและตัวชี้วัด |
| POST, PUT, DELETE | hr เท่านั้น | งานจัดการหัวข้อเป็นของงานบุคลากร (เกณฑ์ 5.1.1) |

แก้คอมเมนต์ของ GET `/` ให้บอกสิทธิ์ด้วย: `// GET /api/topics  หัวข้อทั้งหมด พร้อมตัวชี้วัดของแต่ละหัวข้อ (ทุก role ดูได้)`

### ขั้นที่ 4.7.3 เปลี่ยนการตรวจข้อมูลเป็น Zod

> 🎯 **ขั้นนี้จะได้:** POST/PUT หัวข้อตรวจข้อมูลครบทุกช่อง แทนการเช็กเองแบบบท 03

⌨️ **แก้โค้ด:**
1. เติม `validate(topicSchema),` ต่อจาก `requireRole("hr"),` ใน route **POST** และ **PUT**

```js
router.post("/", requireRole("hr"), validate(topicSchema), async (req, res) => {
router.put("/:id", requireRole("hr"), validate(topicSchema), async (req, res) => {
```

2. ใน route POST **ลบบรรทัด** `if (!title || !start_date || !end_date) return fail(res, 400, "กรุณากรอกข้อมูลให้ครบ"); // บท 04 จะเปลี่ยนเป็น Zod` ทิ้ง (validate ทำแทนแล้ว และละเอียดกว่า)

| เทียบ | บท 03 (เช็กเอง) | บทนี้ (Zod) |
|---|---|---|
| ไม่กรอกชื่อ | ✅ จับได้ | ✅ จับได้ ข้อความบอกช่องชัดเจน |
| ชื่อเป็นช่องว่างล้วน `"   "` | ❌ ผ่าน | ✅ จับได้ (trim แล้วว่าง) |
| ชื่อยาวเกิน 200 ตัว | ❌ ผ่าน แล้วฐานข้อมูล error | ✅ จับได้ |
| วันที่ผิดรูปแบบ | ❌ ผ่าน | ✅ จับได้ |
| วันสิ้นสุดก่อนวันเริ่ม | ฐานข้อมูลจับ (ข้อความกว้างๆ) | ✅ จับได้ ข้อความชัด |
| PUT ไม่ส่งข้อมูล | ❌ ไม่ได้ตรวจเลย | ✅ จับได้ |

<details>
<summary>📄 ไฟล์ routes/topics.js ฉบับสมบูรณ์ (กดดูไว้เทียบ)</summary>

```js
import { Router } from "express";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { topicSchema } from "../schemas/topic.js";

const router = Router();
router.use(verifyToken);

// is_open = วันนี้อยู่ในช่วงเปิด-ปิดหรือไม่
const TOPIC_FIELDS = "*, (CURDATE() BETWEEN start_date AND end_date) AS is_open";

// GET /api/topics  หัวข้อทั้งหมด พร้อมตัวชี้วัดของแต่ละหัวข้อ (ทุก role ดูได้)
router.get("/", requireRole("hr", "evaluatee", "committee"), async (req, res) => {
  const [topics] = await pool.query(`SELECT ${TOPIC_FIELDS} FROM evaluation_topics ORDER BY id`);
  const [indicators] = await pool.query("SELECT * FROM indicators ORDER BY id");
  for (const t of topics) t.indicators = indicators.filter((i) => i.topic_id === t.id);
  ok(res, topics);
});

// GET /api/topics/:id
router.get("/:id", requireRole("hr", "evaluatee", "committee"), async (req, res) => {
  const [rows] = await pool.query(`SELECT ${TOPIC_FIELDS} FROM evaluation_topics WHERE id = ?`, [req.params.id]);
  if (!rows[0]) return fail(res, 404, "ไม่พบหัวข้อการประเมิน");
  const [indicators] = await pool.query("SELECT * FROM indicators WHERE topic_id = ? ORDER BY id", [req.params.id]);
  ok(res, { ...rows[0], indicators });
});

// POST /api/topics  body: { title, description, start_date, end_date }
router.post("/", requireRole("hr"), validate(topicSchema), async (req, res) => {
  const { title, description, start_date, end_date } = req.body;
  const [result] = await pool.query(
    "INSERT INTO evaluation_topics (title, description, start_date, end_date) VALUES (?, ?, ?, ?)",
    [title, description, start_date, end_date]
  );
  ok(res, { id: result.insertId }, "เพิ่มหัวข้อสำเร็จ", 201);
});

// PUT /api/topics/:id  (ใช้กำหนดช่วงเปิด-ปิดด้วย)
router.put("/:id", requireRole("hr"), validate(topicSchema), async (req, res) => {
  const { title, description, start_date, end_date } = req.body;
  const [result] = await pool.query(
    "UPDATE evaluation_topics SET title = ?, description = ?, start_date = ?, end_date = ? WHERE id = ?",
    [title, description, start_date, end_date, req.params.id]
  );
  if (!result.affectedRows) return fail(res, 404, "ไม่พบหัวข้อการประเมิน");
  ok(res, null, "แก้ไขหัวข้อสำเร็จ");
});

// DELETE /api/topics/:id  (ตัวชี้วัดและคะแนนในหัวข้อนี้ถูกลบตาม)
router.delete("/:id", requireRole("hr"), async (req, res) => {
  const [result] = await pool.query("DELETE FROM evaluation_topics WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) return fail(res, 404, "ไม่พบหัวข้อการประเมิน");
  ok(res, null, "ลบหัวข้อสำเร็จ");
});

export default router;
```

ไฟล์จริงในโปรเจกต์: [backend/routes/topics.js](../../backend/routes/topics.js)

</details>

## 4.8 ทดสอบด้วย Thunder Client

### ขั้นที่ 4.8.1 เก็บ token ไว้ในตัวแปร (ไม่ต้องวางทุกครั้ง)

> 🎯 **ขั้นนี้จะได้:** ทดสอบ API ที่ต้อง login ได้สะดวก

⌨️ **ทำตาม:**
1. Thunder Client → แท็บ **Env** → **New Environment** ตั้งชื่อ `local`
2. เพิ่มตัวแปร `token` (ยังไม่ต้องใส่ค่า) กด Save
3. ที่มุมขวาบนของ Thunder Client เลือก Environment เป็น `local`
4. login เป็น hr คัดลอก `data.token` ไปวางเป็นค่าของตัวแปร `token`
5. ใน request อื่น แท็บ **Auth → Bearer** พิมพ์ `{{token}}`

> 💡 อยากทดสอบเป็นคนอื่น (เช่น teach1) แค่ login ใหม่ แล้ววาง token ใหม่ในตัวแปร request ทุกตัวใช้ตามทันที

### ขั้นที่ 4.8.2 ทดสอบทุกกรณี

> 🎯 **ขั้นนี้จะได้:** มั่นใจว่า login, ด่านตรวจ และ validate ทำงานครบ

| # | ทดสอบ | ต้องได้ |
|---|---|---|
| 1 | login ด้วยรหัสผิด | **401** "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" |
| 2 | login ด้วย username ที่ไม่มี | **401** ข้อความเดียวกับข้อ 1 |
| 3 | login ไม่กรอกอะไร `{}` | **400** "กรุณากรอกชื่อผู้ใช้" |
| 4 | `GET /api/topics` **ไม่ใส่ token** | **401** "กรุณาเข้าสู่ระบบ" |
| 5 | `GET /api/topics` ใส่ token มั่ว `abc` | **401** "Token ไม่ถูกต้องหรือหมดอายุ" |
| 6 | `GET /api/topics` ใส่ token ของ hr | **200** |
| 7 | login เป็น `teach1` แล้ว `POST /api/topics` | **403** "ไม่มีสิทธิ์เข้าถึง" |
| 8 | token ของ hr `POST /api/topics` body `{"title":""}` | **400** + `data` มีรายการช่องที่ผิด |
| 9 | token ของ hr `POST /api/topics` วันสิ้นสุดก่อนวันเริ่ม | **400** "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม" |
| 10 | token ของ teach1 `PUT /api/auth/change-password` รหัสเดิมผิด | **400** "รหัสผ่านเดิมไม่ถูกต้อง" |

✅ **ผ่านเมื่อ:** ครบ 10 ข้อ และกด **Save** request เข้า Collection `Eva` ไว้ใช้เป็นหลักฐานข้อ 7.1 (Login ถูก/ผิด) และ 7.4 (Validate)

> 💡 **ลองถอด token ดู (ถ้ามีอินเทอร์เน็ต):** เปิด https://jwt.io วาง token จะเห็น payload `{ id: 1, role: "hr", … }` อ่านได้ทุกคน แต่ถ้าแก้ role แล้วเอาไปใช้ จะได้ 401 เพราะลายเซ็นไม่ตรง

## 4.9 สรุปความปลอดภัย

### ขั้นที่ 4.9.1 ด่านความปลอดภัยของระบบ (ใช้ตอบกรรมการ ข้อ 4.5, 6.12)

> 🎯 **ขั้นนี้จะได้:** ตารางสรุปที่ใช้เขียนเอกสารและตอบกรรมการ

| ด่าน | ป้องกันอะไร | อยู่ที่ |
|---|---|---|
| รหัสผ่านเก็บเป็น hash (scrypt + salt) | ฐานข้อมูลหลุด ก็ไม่รู้รหัสจริง | `utils/password.js` |
| JWT มีลายเซ็น + วันหมดอายุ | ปลอม/แก้ token ไม่ได้, token เก่าใช้ไม่ได้ตลอดไป | `routes/auth.js` |
| `verifyToken` ทุก route ยกเว้น login, สมัครสมาชิก และ health | ไม่ login เรียก API ไม่ได้ (401) | `middleware/auth.js` |
| สมัครสมาชิกได้ role = evaluatee เสมอ | สมัครเป็น hr เองไม่ได้ | `routes/auth.js` |
| `requireRole` | login แล้วแต่บทบาทไม่ตรง เรียกไม่ได้ (403) | `middleware/auth.js` |
| ใช้ `req.user.id` จาก token | แก้ข้อมูลของคนอื่นไม่ได้ | ทุก route ที่เกี่ยวกับ "ของตัวเอง" |
| Zod ตรวจทุก body | ข้อมูลผิดรูปแบบเข้าฐานข้อมูลไม่ได้ | `middleware/validate.js` + `schemas/` |
| SQL ใช้ `?` ทุกที่ | กัน SQL Injection | ทุก route |
| login ผิดตอบข้อความเดียวกัน | เดา username ไม่ได้ | `routes/auth.js` |
| `.env` ไม่ขึ้น Git | `JWT_SECRET` และรหัส DB ไม่หลุด | `.gitignore` |

---

## ❗ ปัญหาที่พบบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| login ถูกแต่ได้ 401 ตลอด | ยังไม่ได้สมัครบัญชี หรือรหัสไม่ตรงกับตอนสมัคร | ทำขั้น 4.4.5 |
| `secretOrPrivateKey must have a value` | ไม่ได้โหลด `.env` หรือไม่มี `JWT_SECRET` | ตรวจ `.env` และ `import "./env.js"` บรรทัดแรกของ app.js |
| ใส่ token แล้วยัง 401 | ลืมคำว่า `Bearer ` หรือคัดลอก token ไม่ครบ | ใช้แท็บ Auth → Bearer ของ Thunder Client |
| `Cannot read properties of undefined (reading 'role')` | ใช้ `requireRole` โดยไม่มี `verifyToken` ก่อน | `verifyToken` ต้องมาก่อนเสมอ |
| `Cannot find module '…/middleware/auth.js'` | ยังไม่ได้สร้างไฟล์ หรือสะกดชื่อผิด | ทำขั้น 4.5.1 |
| `does not provide an export named 'requireRole'` | ลืม `export` หรือสะกดชื่อไม่ตรง | ตรวจ `export const requireRole` |
| route ค้าง ไม่ตอบ | ด่านไม่เรียก `next()` และไม่ตอบกลับ | ทุกด่านต้อง `next()` หรือ `fail(...)` |
| `Cannot set headers after they are sent` | ลืม `return` หน้า `fail` ในด่าน | ใส่ `return fail(...)` |
| เปลี่ยน `JWT_SECRET` แล้ว token เก่าใช้ไม่ได้ | ลายเซ็นเปลี่ยน | ปกติ ให้ login ใหม่ |
| ได้ 400 ทั้งที่กรอกครบ | ชื่อช่องใน body ไม่ตรงกับ schema | เช่น ส่ง `startDate` แต่ schema ใช้ `start_date` |

---

⬅️ [บทที่ 03](03-backend-first-api.md) | ➡️ [บทที่ 05: API ของงานบุคลากร](05-api-hr.md)
