# บทที่ 06: API ของผู้รับการประเมินและกรรมการ

## เป้าหมาย

เรียนจบบทนี้แล้ว นักเรียนจะสร้าง API ได้ครบทุกบทบาท
- **ทุกบทบาท:** ดู/แก้ข้อมูลส่วนตัว
- **ผู้รับการประเมิน:** ให้คะแนนตัวเอง แนบหลักฐาน (อัปโหลดไฟล์ / URL)
- **กรรมการ:** ดูข้อมูลผู้ที่ต้องประเมิน ให้คะแนน (บันทึกร่าง) ยืนยันผลพร้อมลายเซ็น
- **hr:** รายงานผลรายบุคคลและรายกรรมการ
- คำนวณคะแนนถ่วงน้ำหนักและความคืบหน้า

🏆 ได้คะแนนข้อ (ฝั่ง backend)

| กลุ่ม | ข้อ |
|---|---|
| ผู้รับการประเมิน | 5.2.2-5.2.7, 5.2.9 |
| กรรมการ | 5.3.1-5.3.10 |
| รายงาน hr | 5.1.10-5.1.13 |
| API | 6.5 อัปโหลดไฟล์ |

⏱️ ครั้งแรกที่เรียน: ประมาณ **7 ชั่วโมง** (แบ่งเรียน 2-3 ครั้ง) | วันแข่ง (เมื่อคล่องแล้ว): **70 นาที**

### บทนี้แบ่งเป็นขั้นเล็กๆ

| ภาค | ทำอะไร | จำนวนขั้น |
|---|---|---|
| ภาค ก (6.1) | ภาพรวม API และวิธีคิดคะแนน | 3 ขั้น |
| ภาค ข (6.2-6.9) | เขียนโค้ดทีละขั้น ทดสอบทุกขั้น | 37 ขั้น |

### ไฟล์ที่จะสร้างในบทนี้

```
backend/
├── utils/
│   ├── score.js            ← ขั้น 6.3  สูตรคำนวณคะแนน (หัวใจของระบบ)
│   └── upload.js           ← ขั้น 6.4  ตรวจและบันทึกไฟล์อัปโหลด
├── schemas/
│   ├── evaluation.js       ← ขั้น 6.5  กฎของคะแนนตนเองและหลักฐาน
│   └── committee.js        ← ขั้น 6.7  กฎของคะแนนกรรมการและลายเซ็น
├── routes/
│   ├── profile.js          ← ขั้น 6.2  ข้อมูลส่วนตัว
│   ├── selfEvaluations.js  ← ขั้น 6.5  ประเมินตนเอง
│   ├── evidences.js        ← ขั้น 6.6  ดาวน์โหลด/ลบหลักฐาน
│   ├── committee.js        ← ขั้น 6.7  งานของกรรมการ
│   └── reports.js          ← ขั้น 6.8  รายงาน
└── app.js                  ← (แก้) ต่อ route ใหม่
```

> 💡 **ก่อนเริ่มบทนี้** ต้องทำบท 05 เสร็จ และมีข้อมูลจากบท 03-05 ครบ (ไม่ต้องรีเซ็ตฐานข้อมูล)
>
> ⌨️ **เตรียมบัญชีทดสอบ:** POST `/api/auth/register` body `{ "username": "teach3", "password": "123456", "full_name": "ครูทดสอบ" }` จดค่า `id` ไว้ แล้วใช้ token ของ hr POST `/api/assignments` body `{"committee_id":2,"evaluatee_id":(id ของ teach3),"committee_role":"chair"}` จดค่า `id` ไว้เรียกว่า **งานทดสอบ** บทนี้จะทดสอบกับ teach3 เพื่อไม่ให้ข้อมูลจริงเปลี่ยน และจะลบทิ้งตอนจบบท

---

# ภาค ก: แนวคิด

## 6.1 ภาพรวม

### ขั้นที่ 6.1.1 รายการ API ที่จะสร้าง

> 🎯 **ขั้นนี้จะได้:** รู้ว่าจะสร้างอะไร ใครใช้

| Method | URL | ใครใช้ | ทำอะไร |
|---|---|---|---|
| GET / PUT | `/api/profile` | ทุกบทบาท | ดู/แก้ข้อมูลของตัวเอง |
| GET | `/api/self-evaluations` | ผู้รับประเมิน | แบบประเมินของฉัน + คะแนน + หลักฐาน + ความคืบหน้า |
| PUT | `/api/self-evaluations/:indicatorId` | ผู้รับประเมิน | กรอก/แก้คะแนนตัวเอง |
| POST | `/api/self-evaluations/:indicatorId/evidences` | ผู้รับประเมิน | เพิ่มรายละเอียด + แนบไฟล์/URL |
| GET | `/api/evidences/:id/file` | ทุกบทบาท (ตามสิทธิ์) | ดาวน์โหลดไฟล์หลักฐาน |
| DELETE | `/api/evidences/:id` | ผู้รับประเมิน | ลบหลักฐานของตัวเอง |
| GET | `/api/committee/assignments` | กรรมการ | รายชื่อคนที่ต้องประเมิน |
| GET | `/api/committee/assignments/:id` | กรรมการ | ข้อมูลทั้งหมดสำหรับประเมิน 1 คน |
| PUT | `/api/committee/assignments/:id/scores` | กรรมการ | บันทึกร่าง |
| PUT | `/api/committee/assignments/:id/confirm` | กรรมการ | ยืนยันผล + ลายเซ็น |
| GET | `/api/reports/evaluatees` | hr | สรุปทุกคน |
| GET | `/api/reports/evaluatees/:id` | hr / เจ้าตัว / กรรมการของคนนั้น | รายงานรายบุคคล |
| GET | `/api/reports/committees` | hr | สถานะงานของกรรมการแต่ละคน |
| GET | `/api/reports/committees/:id` | hr | ตารางคะแนนของกรรมการ 1 คน |

📖 **สิ่งใหม่ในบทนี้:** นอกจากตรวจ **บทบาท** (requireRole) แล้ว ต้องตรวจ **ความเป็นเจ้าของ** ด้วย เช่น ครูดูได้เฉพาะหลักฐานของตัวเอง กรรมการเห็นเฉพาะคนที่ได้รับมอบหมาย

### ขั้นที่ 6.1.2 วิธีคิดคะแนน

> 🎯 **ขั้นนี้จะได้:** คิดคะแนนด้วยมือได้ ก่อนเขียนโค้ด

📖 **คะแนนถ่วงน้ำหนัก = (คะแนนที่ได้ ÷ คะแนนเต็ม) × น้ำหนัก**

| รูปแบบ | คะแนนเต็ม | ตัวอย่าง | คำนวณ | ได้ |
|---|---|---|---|---|
| สเกล 1-4 | 4 | ได้ 3, น้ำหนัก 20 | (3 ÷ 4) × 20 | **15** |
| มี/ไม่มี | 1 | ได้ "มี" (1), น้ำหนัก 15 | (1 ÷ 1) × 15 | **15** |
| มี/ไม่มี | 1 | ได้ "ไม่มี" (0), น้ำหนัก 10 | (0 ÷ 1) × 10 | **0** |

📖 **ถ้ามีกรรมการหลายคน?** ใช้ **ค่าเฉลี่ยของกรรมการที่ "ยืนยันผลแล้ว" เท่านั้น** (กรรมการที่ยังเป็นร่างไม่นับ เพราะคะแนนยังเปลี่ยนได้)

ตัวอย่าง: ตัวชี้วัดน้ำหนัก 20 แบบสเกล
- กรรมการ A (ยืนยันแล้ว) ให้ 4
- กรรมการ B (ยืนยันแล้ว) ให้ 2
- กรรมการ C (ยังเป็นร่าง) ให้ 1 ← **ไม่นับ**
- เฉลี่ย = (4 + 2) ÷ 2 = 3 → (3 ÷ 4) × 20 = **15**

> 💡 คะแนนรวมทั้งระบบ = รวมคะแนนถ่วงน้ำหนักทุกตัวชี้วัด (เต็ม 100 ถ้าน้ำหนักรวม 100)

### ขั้นที่ 6.1.3 วิธีคิดความคืบหน้า

> 🎯 **ขั้นนี้จะได้:** รู้ว่าเมื่อไหร่ตัวชี้วัดนับว่า "บันทึกครบ" (เกณฑ์ 5.2.7, 5.1.12)

📖 ตัวชี้วัด 1 ตัว "บันทึกครบ" เมื่อ
1. กรอกคะแนนแล้ว **และ**
2. แนบหลักฐานแล้ว (**ถ้า** ตัวชี้วัดนั้นต้องแนบ คือ evidence_type ไม่ใช่ `none`)

| ตัวชี้วัด | กรอกคะแนน | แนบหลักฐาน | ความคืบหน้าของตัวชี้วัด |
|---|---|---|---|
| ต้องแนบ | ✅ | ✅ | 2/2 = **100%** |
| ต้องแนบ | ✅ | ❌ | 1/2 = **50%** |
| ไม่ต้องแนบ (`none`) | ✅ | - | 1/1 = **100%** |

**ความคืบหน้าทั้งหมด** = จำนวนตัวชี้วัดที่ครบ 100% ÷ จำนวนตัวชี้วัดทั้งหมด
เช่น ตัวชี้วัด 6 ตัว ครบ 2 ตัว = **33.33%**

---

# ภาค ข: เขียนโค้ดทีละขั้น

## 6.2 API ข้อมูลส่วนตัว

### ขั้นที่ 6.2.1 GET และ PUT /api/profile

> 🎯 **ขั้นนี้จะได้:** ทุกบทบาทดูและแก้ข้อมูลของตัวเองได้

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/routes/profile.js`

```js
import { Router } from "express";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { profileSchema } from "../schemas/user.js";

const router = Router();
router.use(verifyToken, requireRole("hr", "evaluatee", "committee"));

// GET /api/profile  ข้อมูลส่วนตัวของผู้ที่ login อยู่
router.get("/", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, username, full_name, email, phone, position, department, role, must_change_password FROM users WHERE id = ?",
    [req.user.id]
  );
  if (!rows[0]) return fail(res, 404, "ไม่พบผู้ใช้");
  ok(res, rows[0]);
});

// PUT /api/profile  body: { full_name, email, phone, position, department }
router.put("/", validate(profileSchema), async (req, res) => {
  const { full_name, email, phone, position, department } = req.body;
  await pool.query("UPDATE users SET full_name = ?, email = ?, phone = ?, position = ?, department = ? WHERE id = ?", [
    full_name, email, phone, position, department, req.user.id,
  ]);
  ok(res, null, "บันทึกข้อมูลส่วนตัวสำเร็จ");
});

export default router;
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 6 | ใช้ `profileSchema` (บท 05 ขั้น 5.2.3: ไม่มี username และ role) | ผู้ใช้แก้ username และบทบาทของตัวเองไม่ได้ |
| 9 | login แล้ว ทุกบทบาท | - |
| 12-19 | ดึงข้อมูลของ `req.user.id` (ไม่มี password_hash) | หน้า "ข้อมูลส่วนตัว" (เกณฑ์ 5.2.2) |
| 22-28 | แก้ข้อมูลของ `req.user.id` | - |

> 💡 **URL ไม่มี `:id`** เพราะ "ข้อมูลของฉัน" รู้จาก token อยู่แล้ว ถ้ารับ id จาก URL ใครก็แก้ข้อมูลคนอื่นได้
> 🧩 syntax ทั้งหมดสอนไปแล้ว ข้อสังเกต: บรรทัด 25 ค่าใน array ขึ้นบรรทัดใหม่ได้ (บท 03 ขั้น 3.10.6)

⌨️ **แก้โค้ด:** เปิด `app.js` เพิ่ม `import profileRoutes from "./routes/profile.js";` และเพิ่ม **ใต้** `app.use("/api/assignments", assignmentRoutes);`

```js
app.use("/api/profile", profileRoutes);
```

✅ **ลองเลย:** login เป็น teach1 → `GET /api/profile` → ได้ข้อมูลของสมชาย / PUT body `{ "full_name": "สมชาย รักเรียน", "phone": "123" }` → **400** "เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก…"

## 6.3 สูตรคำนวณคะแนน (utils/score.js)

📖 ไฟล์นี้ **ไม่ยุ่งกับฐานข้อมูลเลย** รับค่าเข้า → คำนวณ → ส่งค่าออก จึงทดสอบง่าย (บท 12 จะเขียน unit test) และใช้ซ้ำได้ทั้งหน้าผู้รับประเมิน กรรมการ และรายงาน

### ขั้นที่ 6.3.1 ปัดทศนิยม และหาผลรวม

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชันพื้นฐาน 2 ตัวที่ฟังก์ชันอื่นใช้

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/utils/score.js`

```js
// ฟังก์ชันคำนวณคะแนน (ไม่มี DB ทดสอบด้วย node --test ได้)

export const round2 = (n) => Math.round(n * 100) / 100;

export const sum = (nums) => round2(nums.reduce((a, b) => a + b, 0));
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | คูณ 100 → ปัดเป็นจำนวนเต็ม → หาร 100 = ปัดทศนิยม 2 ตำแหน่ง | ใน JavaScript `0.1 + 0.2` ได้ `0.30000000000000004` ต้องปัดก่อนแสดง |
| 5 | บวกทุกตัวใน array แล้วปัด | รวมน้ำหนัก รวมคะแนน |

🧩 **Syntax ใหม่: `.reduce()` (รวมทุกตัวเป็นค่าเดียว)**

```syntax
[n:array][s:.][p:reduce][s:(][s:(][n:ผลสะสม][s:,] [n:ตัวปัจจุบัน][s:)] [s:=>] [v:ผลสะสมใหม่][s:,] [v:ค่าเริ่มต้น][s:)]
```

```text
[20, 15, 15].reduce((a, b) => a + b, 0)
รอบ 1: a = 0  (ค่าเริ่มต้น), b = 20 → 20
รอบ 2: a = 20,              b = 15 → 35
รอบ 3: a = 35,              b = 15 → 50   ← ผลลัพธ์
```

> 💡 `Math.round` เป็น 🟣 ฟังก์ชันที่มากับ JavaScript (`Math.round(2.5)` = 3)

### ขั้นที่ 6.3.2 ค่าเฉลี่ย และเปอร์เซ็นต์

> 🎯 **ขั้นนี้จะได้:** หาค่าเฉลี่ยคะแนนกรรมการ และคิดเป็น %

⌨️ **พิมพ์โค้ด:** เพิ่มต่อท้าย `utils/score.js`

```js

// ค่าเฉลี่ย ไม่นับค่าว่าง (null/undefined) ถ้าไม่มีเลยคืน null
export function average(nums) {
  const values = nums.filter((n) => n != null);
  return values.length ? round2(sum(values) / values.length) : null;
}

export const percent = (part, whole) => (whole ? round2((part / whole) * 100) : 0);
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4 | เก็บเฉพาะตัวที่ไม่ว่าง | กรรมการที่ยังไม่ให้คะแนนข้อนั้น ไม่ถูกนับเป็น 0 |
| 5 | มีค่า → ผลรวม ÷ จำนวน / ไม่มีเลย → null | null = "ยังไม่มีผล" (หน้าเว็บแสดง "-") ต่างจาก 0 ที่แปลว่า "ได้ 0 คะแนน" |
| 8 | ส่วน ÷ ทั้งหมด × 100 ถ้าทั้งหมดเป็น 0 ได้ 0 | กันหารด้วยศูนย์ (ได้ Infinity) |

🧩 **Syntax ใหม่: `!= null` (ไม่ว่าง แต่ 0 ผ่าน)**

| เขียน | `null` | `undefined` | `0` | `3` |
|---|---|---|---|---|
| `n != null` (`!=` ตัวเดียว) | false | false | **true** | true |
| `n` (เช็กแบบสั้นใน if) | false | false | **false** ❌ | true |

- **คะแนน 0 = "ไม่มี" เป็นคะแนนจริง ห้ามตัดทิ้ง** จึงต้องใช้ `!= null` ไม่ใช่ `if (n)`
- `!=` (ตัวเดียว) กับ `null` เป็นกรณีพิเศษที่อนุญาต เพราะได้ทั้ง null และ undefined ในทีเดียว (ที่อื่นใช้ `!==` เสมอ)

### ขั้นที่ 6.3.3 คะแนนถ่วงน้ำหนัก และตรวจคะแนน

> 🎯 **ขั้นนี้จะได้:** สูตรขั้น 6.1.2 เป็นโค้ด และฟังก์ชันตรวจว่าคะแนนถูกรูปแบบไหม

⌨️ **พิมพ์โค้ด:** เพิ่มต่อท้าย `utils/score.js`

```js

// คะแนนถ่วงน้ำหนัก: มี/ไม่มี -> 0 หรือ 1 เท่าของน้ำหนัก, สเกล 1-4 -> (คะแนน/4) x น้ำหนัก
export function weighted(score, indicator) {
  if (score == null) return 0;
  const ratio = indicator.score_type === "yes_no" ? score : score / 4;
  return round2(ratio * indicator.weight);
}

// คะแนนถูกต้องตามรูปแบบหรือไม่: มี/ไม่มี = 0 หรือ 1, สเกล = 1-4
export function isValidScore(score, scoreType) {
  if (!Number.isInteger(score)) return false;
  return scoreType === "yes_no" ? score === 0 || score === 1 : score >= 1 && score <= 4;
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4 | ยังไม่มีคะแนน ได้ 0 | - |
| 5 | สัดส่วน: มี/ไม่มี ใช้คะแนนตรงๆ (0 หรือ 1), สเกล หาร 4 | "คะแนนที่ได้ ÷ คะแนนเต็ม" |
| 6 | × น้ำหนัก แล้วปัด | คะแนนถ่วงน้ำหนักของตัวชี้วัดนี้ |
| 11 | ไม่ใช่จำนวนเต็ม (เช่น 2.5 หรือ "3") ไม่ผ่าน | - |
| 12 | มี/ไม่มี: ต้องเป็น 0 หรือ 1 / สเกล: ต้อง 1 ถึง 4 | ใช้ตรวจก่อนบันทึกคะแนนตนเองและคะแนนกรรมการ (กันคะแนน 3 ในตัวชี้วัดแบบมี/ไม่มี) |

> 🧩 syntax ใหม่: `Number.isInteger(x)` (🟣 ของ JavaScript) = เป็นจำนวนเต็มไหม และ ternary ที่แต่ละฝั่งเป็นเงื่อนไขยาว (บรรทัด 12) อ่านว่า "ถ้าเป็น yes_no → ต้อง 0 หรือ 1, ไม่งั้น → ต้อง 1 ถึง 4"

### ขั้นที่ 6.3.4 ความคืบหน้าของตัวชี้วัด

> 🎯 **ขั้นนี้จะได้:** สูตรขั้น 6.1.3 เป็นโค้ด

⌨️ **พิมพ์โค้ด:** เพิ่มต่อท้าย `utils/score.js`

```js

// ความคืบหน้าของตัวชี้วัด 1 ตัว (%): กรอกคะแนนแล้ว + แนบหลักฐานแล้ว (ถ้าตัวชี้วัดนั้นต้องแนบ)
export function indicatorProgress(indicator, score, evidenceCount) {
  const steps = [score != null];
  if (indicator.evidence_type !== "none") steps.push(evidenceCount > 0);
  return percent(steps.filter(Boolean).length, steps.length);
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4 | ขั้นที่ 1: กรอกคะแนนแล้วไหม เก็บเป็น array `[true]` หรือ `[false]` | - |
| 5 | ถ้าตัวชี้วัดต้องแนบ เพิ่มขั้นที่ 2: มีหลักฐานไหม | ตัวชี้วัดแบบ none มีแค่ 1 ขั้น |
| 6 | นับตัวที่เป็น true ÷ จำนวนขั้น × 100 | เช่น `[true, false]` → 1/2 = 50 |

> 🧩 syntax ใหม่: `.filter(Boolean)` = เก็บเฉพาะตัวที่เป็น "จริง" (`Boolean` คือฟังก์ชันที่แปลงค่าเป็น true/false ส่งเข้า filter ได้เลย)

### ขั้นที่ 6.3.5 เรียงข้อมูล

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชันเรียงรายการ ใช้ในรายงาน "เรียงตามคะแนน/ความคืบหน้า/ชื่อ"

⌨️ **พิมพ์โค้ด:** เพิ่มต่อท้าย `utils/score.js`

```js

// เรียงข้อมูลตาม key (ค่าว่างไว้ท้ายเสมอ) ไม่แก้ array เดิม
export function sortBy(list, key, dir = "asc") {
  const sign = dir === "desc" ? -1 : 1;
  return [...list].sort((a, b) => {
    if (a[key] == null) return 1;
    if (b[key] == null) return -1;
    return a[key] > b[key] ? sign : a[key] < b[key] ? -sign : 0;
  });
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | รับรายการ, ชื่อช่องที่จะใช้เรียง, ทิศทาง (ไม่ส่ง = น้อยไปมาก) | `sortBy(list, "committee_percent", "desc")` |
| 4 | น้อยไปมาก = 1, มากไปน้อย = -1 | กลับทิศทางด้วยการคูณเครื่องหมาย |
| 5 | **สำเนา array** แล้วเรียง | `.sort()` แก้ array เดิม ถ้าไม่สำเนา ข้อมูลต้นฉบับจะเปลี่ยนตาม |
| 6-7 | ค่าว่างไปไว้ท้ายเสมอ | คนที่ยังไม่มีคะแนน ไม่ขึ้นมาบนสุด |
| 8 | a มากกว่า → ส่ง sign, a น้อยกว่า → ส่ง -sign, เท่ากัน → 0 | กติกาของ sort: ลบ = a ไปก่อน, บวก = b ไปก่อน |

🧩 **Syntax ใหม่ 1: `[...array]` (สำเนา array)**

- เหมือน `{ ...object }` ของบท 03 แต่ใช้กับ array ได้ array ใหม่ที่มีของเหมือนเดิม

🧩 **Syntax ใหม่ 2: `object[ตัวแปร]` (หยิบช่องด้วยชื่อที่อยู่ในตัวแปร)**

```js
const key = "full_name";
user[key];       // เหมือน user.full_name
```

- ใช้เมื่อ "ชื่อช่อง" ไม่ตายตัว (ส่งมาเป็นพารามิเตอร์)

🧩 **Syntax ใหม่ 3: `.sort((a, b) => …)`**

- sort เรียกฟังก์ชันกับคู่ a, b หลายๆ ครั้ง ฟังก์ชันส่งกลับ: **ลบ** = a ก่อน b, **บวก** = b ก่อน a, **0** = เท่ากัน
- ternary ซ้อนกัน `x ? A : y ? B : C` อ่านว่า "ถ้า x ได้ A, ไม่งั้นถ้า y ได้ B, ไม่งั้นได้ C"

### ขั้นที่ 6.3.6 สรุปผลรายบุคคล: คำนวณรายตัวชี้วัด

> 🎯 **ขั้นนี้จะได้:** ส่วนแรกของ `buildResult` รวมทุกอย่างของผู้รับประเมิน 1 คนเป็นแถวต่อตัวชี้วัด

📖 **ข้อมูลเข้า 4 อย่าง → ผลลัพธ์**

| ข้อมูลเข้า | หน้าตา |
|---|---|
| `indicators` | ตัวชี้วัดทั้งหมด |
| `selfData` | `{ 1: { score: 4, evidence_count: 1 }, 2: {…} }` (คีย์ = id ตัวชี้วัด) |
| `assignments` | กรรมการของคนนี้ พร้อมสถานะ |
| `committeeScores` | `[{ assignment_id, indicator_id, score }, …]` |

⌨️ **พิมพ์โค้ด:** เพิ่มต่อท้าย `utils/score.js`

```js

// สรุปผลของผู้รับประเมิน 1 คน
// indicators: ตัวชี้วัดทั้งหมด, selfData: { indicator_id: { score, evidence_count } }
// assignments: กรรมการของคนนี้, committeeScores: [{ assignment_id, indicator_id, score }]
// ผลกรรมการใช้ค่าเฉลี่ยจากกรรมการที่ "ยืนยันแล้ว" เท่านั้น
export function buildResult(indicators, selfData, assignments, committeeScores) {
  const confirmedIds = assignments.filter((a) => a.status === "confirmed").map((a) => a.id);

  const rows = indicators.map((ind) => {
    const scores = {}; // { assignment_id: score }
    for (const s of committeeScores) if (s.indicator_id === ind.id) scores[s.assignment_id] = s.score;
    const self_score = selfData[ind.id]?.score ?? null;
    const evidence_count = selfData[ind.id]?.evidence_count ?? 0;
    const avg_score = average(confirmedIds.map((id) => scores[id]));
    return {
      ...ind,
      self_score,
      evidence_count,
      progress: indicatorProgress(ind, self_score, evidence_count),
      scores,
      avg_score,
      self_weighted: weighted(self_score, ind),
      committee_weighted: weighted(avg_score, ind),
    };
  });
  // (ขั้น 6.3.7 จะเขียนต่อตรงนี้)
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 7 | id ของกรรมการที่ยืนยันแล้ว เช่น `[1]` | ใช้หาค่าเฉลี่ยเฉพาะคนที่ยืนยัน |
| 9 | วนทุกตัวชี้วัด สร้างแถวผลลัพธ์ | 1 แถว = 1 ตัวชี้วัด |
| 10-11 | เก็บคะแนนของกรรมการแต่ละคนในตัวชี้วัดนี้ เป็น `{ 1: 4, 2: 3 }` | ตารางรายงานแสดงคะแนนแยกรายกรรมการ |
| 12 | คะแนนตนเอง (ไม่มี = null) | - |
| 13 | จำนวนหลักฐาน (ไม่มี = 0) | คิดความคืบหน้า |
| 14 | เฉลี่ยคะแนนเฉพาะกรรมการที่ยืนยันแล้ว | ตามกติกาขั้น 6.1.2 |
| 15-25 | ส่งกลับทุกช่องของตัวชี้วัด + ผลที่คำนวณ | ข้อมูลครบสำหรับแสดงตาราง |

🧩 **Syntax ใหม่: `?.` + `??` ใช้คู่กัน**

```syntax
[n:selfData][s:\[][n:ind][s:.][n:id][s:\]][s:?.][n:score] [s:??] [v:null]
```

อ่านทีละส่วน
1. `selfData[ind.id]` = ข้อมูลของตัวชี้วัดนี้ (ถ้าไม่เคยกรอกจะเป็น undefined)
2. `?.score` = ถ้ามีค่อยหยิบคะแนน ถ้าไม่มีได้ undefined (ไม่ error)
3. `?? null` = ถ้ายังเป็น undefined/null ใช้ null **แต่ถ้าคะแนนเป็น 0 ยังได้ 0** (ต่างจาก `|| null` ที่จะเปลี่ยน 0 เป็น null)

> 💡 `scores[s.assignment_id] = s.score` = สร้างช่องใน object ด้วยชื่อที่อยู่ในตัวแปร (ขั้น 6.3.5) ได้ `{ "1": 4, "2": 3 }`

### ขั้นที่ 6.3.7 สรุปผลรายบุคคล: ผลรวม

> 🎯 **ขั้นนี้จะได้:** buildResult ครบ ส่งกลับทั้งรายตัวชี้วัดและสรุป

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 6.3.7 จะเขียนต่อตรงนี้)`

```js

  const total_weight = sum(rows.map((r) => r.weight));
  const filled = rows.filter((r) => r.progress === 100).length; // ตัวชี้วัดที่บันทึกครบ
  const committee_total = sum(rows.map((r) => r.committee_weighted));

  return {
    rows,
    summary: {
      total_weight,
      indicator_count: rows.length,
      filled,
      progress: percent(filled, rows.length),
      self_total: sum(rows.map((r) => r.self_weighted)),
      committee_count: assignments.length,
      confirmed_count: confirmedIds.length,
      committee_total: confirmedIds.length ? committee_total : null,
      committee_percent: confirmedIds.length ? percent(committee_total, total_weight) : null,
    },
  };
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | น้ำหนักรวม | ตัวหารของ % คะแนน |
| 3 | จำนวนตัวชี้วัดที่บันทึกครบ 100% | ความคืบหน้าทั้งหมด |
| 4 | คะแนนรวมจากกรรมการ | - |
| 12 | ความคืบหน้า % | แถบความคืบหน้าในหน้าผู้รับประเมินและรายงาน hr |
| 13 | คะแนนรวมที่ให้ตัวเอง | เทียบกับผลกรรมการ |
| 14-15 | จำนวนกรรมการ และจำนวนที่ยืนยันแล้ว | แสดง "ยืนยันแล้ว 1/3" |
| 16-17 | ถ้ายังไม่มีใครยืนยัน ให้เป็น null | หน้าเว็บแสดง "-" ไม่ใช่ "0 คะแนน" ซึ่งไม่จริง |

▶️ **ทดสอบ:** สร้างไฟล์ทดลอง `backend/try-score.js`

```js
import { weighted, average, indicatorProgress } from "./utils/score.js";

console.log(weighted(3, { score_type: "scale_4", weight: 20 }));
console.log(weighted(1, { score_type: "yes_no", weight: 15 }));
console.log(average([4, 2, null]));
console.log(indicatorProgress({ evidence_type: "file" }, 3, 0));
```

รัน `node try-score.js`

✅ **ต้องเห็น:** `15`, `15`, `3`, `50` (ตรงกับตัวอย่างในขั้น 6.1.2-6.1.3) แล้วลบไฟล์ทดลอง

<details>
<summary>📄 ไฟล์ utils/score.js ทั้งไฟล์ (กดดูไว้เทียบ)</summary>

ไฟล์จริงในโปรเจกต์: [backend/utils/score.js](../../backend/utils/score.js) = ขั้น 6.3.1-6.3.7 ต่อกัน

</details>

## 6.4 ตรวจและบันทึกไฟล์อัปโหลด (utils/upload.js)

📖 **การอัปโหลดไฟล์ต่างจากส่ง JSON อย่างไร?**
- JSON ส่งไฟล์ไม่ได้ ต้องส่งแบบ **`multipart/form-data`** (แบบเดียวกับฟอร์ม HTML)
- `express-fileupload` (ตั้งค่าไว้ใน app.js บท 05 ขั้น 5.4.1) แยกให้: ไฟล์อยู่ใน `req.files` ช่องข้อความอยู่ใน `req.body`

### ขั้นที่ 6.4.1 ตรวจชนิดไฟล์

> 🎯 **ขั้นนี้จะได้:** รับเฉพาะ PDF / JPG / PNG ที่ชนิดไฟล์ตรงกับนามสกุลจริง (เกณฑ์ 5.2.4)

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/utils/upload.js`

```js
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs/promises";

export const UPLOAD_DIR = path.join(import.meta.dirname, "..", "uploads");

// ไฟล์หลักฐานที่รับ: นามสกุล -> mimetype
const ALLOWED = { ".pdf": "application/pdf", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };

// ตรวจชนิดไฟล์ คืนข้อความ error หรือ null ถ้าผ่าน
export function checkFile(file) {
  const ext = path.extname(file.name).toLowerCase();
  if (ALLOWED[ext] !== file.mimetype) return "รองรับเฉพาะไฟล์ PDF, JPG และ PNG";
  return null;
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | ดึงเครื่องมือจัดการไฟล์แบบ promise | ลบไฟล์ในขั้น 6.4.3 |
| 5 | ที่อยู่โฟลเดอร์ `backend/uploads` (ส่งออกด้วย) | ใช้ทั้งตอนบันทึกและดาวน์โหลด |
| 8 | ตาราง "นามสกุล → ชนิดไฟล์ (mimetype)" ที่อนุญาต | แก้ที่เดียวถ้าอยากรับชนิดอื่นเพิ่ม |
| 11 | ฟังก์ชันตรวจไฟล์ ส่งกลับ **ข้อความ error** หรือ **null** (ผ่าน) | ใช้ใน route แนบหลักฐาน |
| 12 | เอานามสกุลจากชื่อไฟล์ เป็นตัวเล็ก เช่น `.pdf` | - |
| 13 | ชนิดไฟล์จริงต้องตรงกับที่ตารางกำหนดสำหรับนามสกุลนั้น | เปลี่ยนชื่อ `virus.exe` เป็น `virus.pdf` ก็ไม่ผ่าน เพราะ mimetype ไม่ใช่ `application/pdf` |

🧩 **Syntax ใหม่: object ใช้เป็น "ตารางค้นหา"**

```syntax
[n:ALLOWED][s:\[][n:ext][s:\]]
```

- `ALLOWED[".pdf"]` → `"application/pdf"`, `ALLOWED[".exe"]` → `undefined` (ไม่มีในตาราง)
- ชื่อช่องมีจุด จึงต้องเขียนในวงเล็บเหลี่ยมพร้อม `" "` ใช้ `ALLOWED..pdf` ไม่ได้
- `file.name`, `file.mimetype` เป็น 🟣 ช่องที่ express-fileupload ให้มา

> 💡 **รูปแบบ "ส่งกลับข้อความ error หรือ null"** ใช้บ่อยในระบบนี้ เพราะต่อกันด้วย `||` ได้สะดวก (ขั้น 6.5.6)

### ขั้นที่ 6.4.2 ตรวจว่าแนบตรงกับที่ตัวชี้วัดกำหนด

> 🎯 **ขั้นนี้จะได้:** บังคับชนิดหลักฐานตาม evidence_type ของตัวชี้วัด

⌨️ **พิมพ์โค้ด:** เพิ่มต่อท้าย `utils/upload.js`

```js

// ตรวจไฟล์แนบตามชนิดหลักฐานของตัวชี้วัด (none/file/url/any) และแนบได้รายการละ 1 อย่าง
// รายละเอียดที่เป็นข้อความอย่างเดียว (ไม่แนบอะไร) เพิ่มได้ทุกตัวชี้วัด
export function checkAttachment(evidenceType, hasFile, hasUrl) {
  if (hasFile && hasUrl) return "แนบได้รายการละ 1 อย่าง: ไฟล์ หรือ URL";
  if (evidenceType === "none" && (hasFile || hasUrl)) return "ตัวชี้วัดนี้ไม่ต้องแนบหลักฐาน";
  if (evidenceType === "file" && hasUrl) return "ตัวชี้วัดนี้ต้องแนบหลักฐานเป็นไฟล์";
  if (evidenceType === "url" && hasFile) return "ตัวชี้วัดนี้ต้องแนบหลักฐานเป็น URL";
  return null;
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | กรณี | ผล |
|---|---|---|
| 5 | แนบทั้งไฟล์และ URL ในรายการเดียว | ❌ ให้แยกเป็น 2 รายการ |
| 6 | ตัวชี้วัด `none` แต่แนบอะไรมา | ❌ |
| 7 | ตัวชี้วัด `file` แต่ส่ง URL | ❌ |
| 8 | ตัวชี้วัด `url` แต่ส่งไฟล์ | ❌ |
| 9 | กรณีอื่น (รวม `any` และ "ข้อความอย่างเดียวไม่แนบอะไร") | ✅ |

> 🧩 syntax สอนไปแล้ว: `&&` / `||` (บท 05) ข้อสังเกต: `(hasFile || hasUrl)` ต้องมีวงเล็บ เพื่อให้ตรวจ "หรือ" ก่อน แล้วค่อย "และ" กับเงื่อนไขหน้า

### ขั้นที่ 6.4.3 บันทึกไฟล์ด้วยชื่อสุ่ม และลบไฟล์

> 🎯 **ขั้นนี้จะได้:** บันทึกไฟล์ลงโฟลเดอร์ uploads อย่างปลอดภัย

⌨️ **พิมพ์โค้ด:** เพิ่มต่อท้าย `utils/upload.js`

```js

// บันทึกไฟล์ด้วยชื่อสุ่ม (กันชื่อซ้ำ/ชื่อภาษาไทย) คืนชื่อไฟล์ที่บันทึก
export async function saveFile(file) {
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${path.extname(file.name).toLowerCase()}`;
  await file.mv(path.join(UPLOAD_DIR, name));
  return name;
}

export const deleteFile = (name) => fs.rm(path.join(UPLOAD_DIR, name), { force: true });
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4 | สร้างชื่อใหม่ = เวลาปัจจุบัน + เลขสุ่ม + นามสกุลเดิม เช่น `1762500000000-a1b2c3d4e5f6.pdf` | **ไม่ใช้ชื่อที่ผู้ใช้ส่งมา** กันชื่อซ้ำ และกันชื่ออันตรายอย่าง `../../.env` |
| 5 | ย้ายไฟล์ไปเก็บในโฟลเดอร์ uploads | `file.mv` เป็น 🟣 ของ express-fileupload |
| 6 | ส่งกลับชื่อที่บันทึก | เก็บลงคอลัมน์ `file_path` |
| 9 | ลบไฟล์ (`force: true` = ถ้าไม่มีไฟล์ก็ไม่ error) | ตอนลบหลักฐาน |

> 🧩 syntax ใหม่: `Date.now()` (🟣 ของ JavaScript) = เวลาปัจจุบันเป็นมิลลิวินาที ใช้ทำชื่อไม่ซ้ำ ส่วน template string ต่อหลาย `${}` ติดกันได้

**สรุปความปลอดภัยของการอัปโหลด**

| ป้องกัน | วิธี | อยู่ที่ |
|---|---|---|
| ไฟล์อันตราย (.exe, .js) | รับแค่ .pdf/.jpg/.png และนามสกุลต้องตรงกับชนิดไฟล์จริง | `checkFile` |
| ไฟล์ใหญ่เกิน | จำกัด 10MB | app.js (บท 05) |
| ชื่อไฟล์ซ้ำ/ชื่อแปลก | บันทึกด้วยชื่อสุ่ม | `saveFile` |
| คนแอบเปิดไฟล์คนอื่น | ไม่เปิดโฟลเดอร์ uploads เป็นสาธารณะ ดาวน์โหลดผ่าน API ที่ตรวจสิทธิ์ | ขั้น 6.6.2 |

## 6.5 API ประเมินตนเอง

### ขั้นที่ 6.5.1 กฎของคะแนนตนเองและหลักฐาน

> 🎯 **ขั้นนี้จะได้:** schema 2 ตัวสำหรับผู้รับการประเมิน

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/schemas/evaluation.js`

```js
import { z } from "zod";
import { requiredText } from "./common.js";

// คะแนนประเมินตนเอง (ตรวจช่วงตามรูปแบบตัวชี้วัดอีกครั้งใน route)
export const selfScoreSchema = z.object({
  score: z.coerce.number({ error: "กรุณาเลือกคะแนน" }).int("คะแนนต้องเป็นจำนวนเต็ม"),
});

// รายละเอียดประกอบ (ไฟล์แนบตรวจแยกใน route เพราะมาจาก req.files)
export const evidenceSchema = z.object({
  description: requiredText("กรุณากรอกรายละเอียดประกอบ", 1000),
  url: z
    .union([z.literal(""), z.url({ protocol: /^https?$/, error: "URL ต้องขึ้นต้นด้วย http:// หรือ https://" }).max(500)])
    .nullish()
    .transform((v) => v || null),
});
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 6 | คะแนนต้องเป็นจำนวนเต็ม (ยังไม่ตรวจช่วง) | ช่วงที่ถูก (0-1 หรือ 1-4) ขึ้นกับตัวชี้วัด ซึ่ง schema ไม่รู้ จึงตรวจต่อใน route ด้วย `isValidScore` |
| 11 | รายละเอียดบังคับ ไม่เกิน 1000 ตัว | คำอธิบายหลักฐาน (เกณฑ์ 5.2.3) |
| 12-15 | URL ว่างได้ แต่ถ้ากรอกต้องขึ้นต้นด้วย http:// หรือ https:// | กันลิงก์อันตรายแบบ `javascript:alert(1)` |

> 🧩 syntax ใหม่: `z.url({ protocol: /^https?$/ })` = URL ที่ protocol ตรง regex `https?` (`?` ใน regex = ตัวก่อนหน้ามีหรือไม่มีก็ได้ → `http` หรือ `https`) ที่เหลือแบบเดียวกับ email ในบท 05 ขั้น 5.2.2

### ขั้นที่ 6.5.2 ส่วนหัวไฟล์ และฟังก์ชันหาตัวชี้วัด

> 🎯 **ขั้นนี้จะได้:** ไฟล์ selfEvaluations.js ที่ทุก route เฉพาะผู้รับการประเมิน

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/routes/selfEvaluations.js`

```js
import { Router } from "express";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { selfScoreSchema, evidenceSchema } from "../schemas/evaluation.js";
import { isValidScore, indicatorProgress, percent } from "../utils/score.js";
import { checkFile, checkAttachment, saveFile } from "../utils/upload.js";

const router = Router();
router.use(verifyToken, requireRole("evaluatee")); // เฉพาะผู้รับการประเมิน ทำกับข้อมูลของตัวเอง

// ตัวชี้วัด พร้อม is_open (หัวข้ออยู่ในช่วงเปิด-ปิดหรือไม่)
async function findIndicator(id) {
  const [rows] = await pool.query(
    `SELECT i.*, (CURDATE() BETWEEN t.start_date AND t.end_date) AS is_open
     FROM indicators i JOIN evaluation_topics t ON t.id = i.topic_id WHERE i.id = ?`,
    [id]
  );
  return rows[0];
}

// (route ต่างๆ จะเขียนตรงนี้)

export default router;
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 11 | ทั้งไฟล์เฉพาะผู้รับการประเมิน | ทุก route ทำกับข้อมูลของ `req.user.id` เท่านั้น |
| 14-21 | หาตัวชี้วัด พร้อมบอกว่าหัวข้อของมันเปิดอยู่ไหม (`i.*` = ทุกคอลัมน์ของตัวชี้วัด) | ใช้ตรวจก่อนกรอกคะแนน/แนบหลักฐาน (ห้ามทำเมื่อหัวข้อปิด เกณฑ์ 5.1.2) |

⌨️ **แก้โค้ด:** เปิด `app.js` เพิ่ม `import selfEvaluationRoutes from "./routes/selfEvaluations.js";` และเพิ่ม **ใต้** `app.use("/api/profile", profileRoutes);`

```js
app.use("/api/self-evaluations", selfEvaluationRoutes);
```

### ขั้นที่ 6.5.3 GET แบบประเมินของฉัน: ดึงข้อมูล 4 ตาราง

> 🎯 **ขั้นนี้จะได้:** ส่วนแรกของ GET ดึงข้อมูลที่ต้องใช้ทั้งหมด

📖 **เทคนิค: query ทีละตาราง แล้วประกอบใน JavaScript** แทนการเขียน JOIN ยาวๆ ตัวเดียว ผลคือได้ข้อมูลซ้อนกันแบบ **หัวข้อ > ตัวชี้วัด > หลักฐาน** ที่หน้าเว็บใช้ง่าย

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (route ต่างๆ จะเขียนตรงนี้)`

```js
// GET /api/self-evaluations  หัวข้อ > ตัวชี้วัด พร้อมคะแนนตนเอง รายละเอียด และความคืบหน้า
router.get("/", async (req, res) => {
  const userId = req.user.id;
  const [topics] = await pool.query(
    "SELECT *, (CURDATE() BETWEEN start_date AND end_date) AS is_open FROM evaluation_topics ORDER BY id"
  );
  const [indicators] = await pool.query("SELECT * FROM indicators ORDER BY id");
  const [selfRows] = await pool.query("SELECT * FROM self_evaluations WHERE evaluatee_id = ?", [userId]);
  const [evidences] = await pool.query(
    `SELECT ev.* FROM evidences ev JOIN self_evaluations se ON se.id = ev.self_evaluation_id
     WHERE se.evaluatee_id = ? ORDER BY ev.id`,
    [userId]
  );
  // (ขั้น 6.5.4 จะเขียนต่อตรงนี้)
});

// (ขั้น 6.5.5 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ดึงอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4-6 | หัวข้อทั้งหมด + เปิดอยู่ไหม | หน้าเว็บซ่อนปุ่มแก้ไขเมื่อหัวข้อปิด |
| 7 | ตัวชี้วัดทั้งหมด | - |
| 8 | คะแนนตนเองของ **ฉัน** | - |
| 9-13 | หลักฐานของ **ฉัน** (JOIN เพื่อกรองด้วยเจ้าของ เพราะตาราง evidences ไม่มี evaluatee_id) | - |

### ขั้นที่ 6.5.4 GET แบบประเมินของฉัน: ประกอบข้อมูลและคิดความคืบหน้า

> 🎯 **ขั้นนี้จะได้:** GET ครบ ตอบ `{ topics, summary }`

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 6.5.4 จะเขียนต่อตรงนี้)`

```js

  let filled = 0;
  for (const t of topics) {
    t.indicators = indicators
      .filter((i) => i.topic_id === t.id)
      .map((i) => {
        const self = selfRows.find((s) => s.indicator_id === i.id);
        const list = self ? evidences.filter((e) => e.self_evaluation_id === self.id) : [];
        const score = self?.score ?? null;
        const progress = indicatorProgress(i, score, list.length);
        if (progress === 100) filled++;
        return { ...i, score, evidences: list, progress };
      });
  }
  const count = indicators.length;
  ok(res, { topics, summary: { indicator_count: count, filled, progress: percent(filled, count) } });
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | ตัวนับตัวชี้วัดที่ครบ (`let` เพราะจะเพิ่มค่า) | - |
| 3 | วนทีละหัวข้อ | - |
| 4-6 | ตัวชี้วัดของหัวข้อนี้ → แปลงแต่ละตัว | ได้ `t.indicators` ซ้อนในหัวข้อ |
| 7 | หาคะแนนตนเองของตัวชี้วัดนี้ | - |
| 8 | หลักฐานของคะแนนนั้น (ยังไม่มีคะแนน = ไม่มีหลักฐาน) | - |
| 9 | คะแนน (ยังไม่กรอก = null) | - |
| 10 | ความคืบหน้าของตัวชี้วัดนี้ | แถบสีในการ์ดตัวชี้วัด |
| 11 | ถ้าครบ 100% นับเพิ่ม 1 | - |
| 12 | ส่งกลับตัวชี้วัด + คะแนน + หลักฐาน + ความคืบหน้า | - |
| 15-16 | ตอบหัวข้อทั้งหมด และสรุปความคืบหน้า | แถบความคืบหน้ารวมด้านบนหน้า (เกณฑ์ 5.2.7) |

🧩 **Syntax ใหม่: `++` (เพิ่มทีละ 1) และเรียก filter → map ต่อกัน**

- `filled++` = `filled = filled + 1`
- `indicators.filter(…).map(…)` = กรองก่อน แล้วแปลงเฉพาะที่ผ่าน (ขึ้นบรรทัดใหม่หน้าจุดแต่ละคำสั่ง อ่านง่าย)

✅ **ลองเลย:** login เป็น **teach3** → `GET http://localhost:5000/api/self-evaluations` → `summary.progress` = **0**, `summary.filled` = 0 และเห็นตัวชี้วัด 6 ตัว

### ขั้นที่ 6.5.5 PUT กรอก/แก้คะแนนตนเอง

> 🎯 **ขั้นนี้จะได้:** ผู้รับประเมินให้คะแนนตัวเองได้ (เกณฑ์ 5.2.5, 5.2.6)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 6.5.5 จะเขียนต่อตรงนี้)`

```js
// PUT /api/self-evaluations/:indicatorId  body: { score }  กรอก/แก้คะแนนตนเอง
router.put("/:indicatorId", validate(selfScoreSchema), async (req, res) => {
  const indicator = await findIndicator(req.params.indicatorId);
  if (!indicator) return fail(res, 404, "ไม่พบตัวชี้วัด");
  if (!indicator.is_open) return fail(res, 400, "หัวข้อนี้ไม่อยู่ในช่วงเวลาการประเมิน");

  const { score } = req.body;
  if (!isValidScore(score, indicator.score_type)) {
    return fail(res, 400, indicator.score_type === "yes_no" ? "คะแนนต้องเป็น 1 (มี) หรือ 0 (ไม่มี)" : "คะแนนต้องอยู่ระหว่าง 1-4");
  }
  await pool.query(
    "INSERT INTO self_evaluations (evaluatee_id, indicator_id, score) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE score = ?",
    [req.user.id, indicator.id, score, score]
  );
  ok(res, null, "บันทึกคะแนนสำเร็จ");
});

// (ขั้น 6.5.6 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3-4 | ตรวจชั้น 1: ตัวชี้วัดมีจริง | - |
| 5 | ตรวจชั้น 2: หัวข้อเปิดอยู่ | ห้ามแก้หลังหมดเวลาประเมิน |
| 8-10 | ตรวจชั้น 3: คะแนนตรงรูปแบบ ข้อความ error ต่างกันตามรูปแบบ | ผู้ใช้รู้ชัดว่าต้องกรอกอะไร |
| 11-14 | เพิ่มหรือแก้คะแนนในคำสั่งเดียว | ใช้ได้ทั้ง "กรอกครั้งแรก" และ "แก้ไข" |
| 13 | id ผู้ใช้มาจาก token | แก้คะแนนของคนอื่นไม่ได้ |

🧩 **Syntax ใหม่ (SQL): `INSERT … ON DUPLICATE KEY UPDATE` (upsert)**

```syntax
[k:INSERT INTO] [n:ตาราง] [s:(][s:...][s:)] [k:VALUES] [s:(][s:...][s:)] [k:ON DUPLICATE KEY UPDATE] [n:คอลัมน์] [s:=] [v:?]
```

- ถ้ายังไม่มีแถว (ผู้รับประเมินคนนี้ + ตัวชี้วัดนี้) → **เพิ่มใหม่**
- ถ้ามีแล้ว (ชน `UNIQUE (evaluatee_id, indicator_id)` ของบท 02) → **แก้คอลัมน์ที่บอก**
- `?` ทั้งหมด 4 ตัว (3 ใน VALUES + 1 ใน UPDATE) จึงส่งค่า 4 ตัว (score ซ้ำ 2 ครั้ง)

✅ **ลองเลย:** (token ของ teach3)
- PUT `/api/self-evaluations/2` body `{"score":3}` → 200
- PUT `/api/self-evaluations/3` body `{"score":3}` → **400** "คะแนนต้องเป็น 1 (มี) หรือ 0 (ไม่มี)" (ตัวชี้วัด 3 เป็นแบบมี/ไม่มี)

### ขั้นที่ 6.5.6 POST เพิ่มหลักฐาน: ตรวจข้อมูลและไฟล์

> 🎯 **ขั้นนี้จะได้:** ส่วนแรกของการแนบหลักฐาน ตรวจทุกอย่างก่อนบันทึก

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 6.5.6 จะเขียนต่อตรงนี้)`

```js
// POST /api/self-evaluations/:indicatorId/evidences
// form-data: description (บังคับ), url (ไม่บังคับ), file (PDF/JPG/PNG ไม่บังคับ)
router.post("/:indicatorId/evidences", validate(evidenceSchema), async (req, res) => {
  const indicator = await findIndicator(req.params.indicatorId);
  if (!indicator) return fail(res, 404, "ไม่พบตัวชี้วัด");
  if (!indicator.is_open) return fail(res, 400, "หัวข้อนี้ไม่อยู่ในช่วงเวลาการประเมิน");

  const file = req.files?.file;
  const { description, url } = req.body;
  const error = checkAttachment(indicator.evidence_type, !!file, !!url) || (file && checkFile(file));
  if (error) return fail(res, 400, error);
  // (ขั้น 6.5.7 จะเขียนต่อตรงนี้)
});
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | `validate(evidenceSchema)` ใช้กับ form-data ได้ | express-fileupload ใส่ช่องข้อความไว้ใน `req.body` ให้ |
| 4-6 | ตัวชี้วัดมีจริงและหัวข้อเปิดอยู่ | เหมือนขั้น 6.5.5 |
| 8 | หยิบไฟล์ (ไม่มีก็ได้) | - |
| 10 | ตรวจชนิดหลักฐานก่อน ถ้าผ่านและมีไฟล์ ตรวจชนิดไฟล์ต่อ | ได้ข้อความ error ตัวแรกที่เจอ หรือค่าว่าง (ผ่าน) |
| 11 | มี error ตอบ 400 | - |

🧩 **Syntax ใหม่: ต่อการตรวจด้วย `||` และ `&&`**

```syntax
[k:const] [n:error] [s:=] [n:ตรวจที่1][s:()] [s:||] [s:(][n:มีไฟล์ไหม] [s:&&] [n:ตรวจที่2][s:()][s:)][s:;]
```

| กรณี | ผล |
|---|---|
| ตรวจที่ 1 เจอ error | ได้ข้อความนั้นเลย (ไม่ทำส่วนหลัง `||`) |
| ตรวจที่ 1 ผ่าน (null) + ไม่มีไฟล์ | `file && …` ได้ undefined → error ว่าง → ผ่าน |
| ตรวจที่ 1 ผ่าน + มีไฟล์ | ได้ผลของ checkFile (ข้อความหรือ null) |

> 💡 `!!file`, `!!url` = แปลงเป็น true/false (บท 04 ขั้น 4.4.2) ส่งให้ checkAttachment ที่ต้องการ true/false

### ขั้นที่ 6.5.7 POST เพิ่มหลักฐาน: บันทึก

> 🎯 **ขั้นนี้จะได้:** บันทึกหลักฐานพร้อมไฟล์ (เกณฑ์ 5.2.3, 5.2.4, 6.5)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 6.5.7 จะเขียนต่อตรงนี้)`

```js

  // ต้องมีแถวประเมินตนเองก่อน (เพิ่มรายละเอียดก่อนกรอกคะแนนได้)
  await pool.query(
    "INSERT INTO self_evaluations (evaluatee_id, indicator_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE id = id",
    [req.user.id, indicator.id]
  );
  const [[self]] = await pool.query("SELECT id FROM self_evaluations WHERE evaluatee_id = ? AND indicator_id = ?", [
    req.user.id,
    indicator.id,
  ]);

  const fileName = file ? await saveFile(file) : null;
  const [result] = await pool.query(
    "INSERT INTO evidences (self_evaluation_id, description, file_path, file_name, url) VALUES (?, ?, ?, ?, ?)",
    [self.id, description, fileName, file?.name ?? null, url]
  );
  ok(res, { id: result.insertId }, "เพิ่มรายละเอียดประกอบสำเร็จ", 201);
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3-6 | สร้างแถวคะแนนตนเอง (คะแนนว่าง) ถ้ายังไม่มี ถ้ามีแล้วไม่ทำอะไร | หลักฐานต้องผูกกับแถว self_evaluations (FK) ผู้ใช้จึงแนบก่อนกรอกคะแนนได้ |
| 7-10 | ดึง id ของแถวนั้น | ใช้เป็น `self_evaluation_id` |
| 12 | มีไฟล์ → บันทึกด้วยชื่อสุ่ม, ไม่มี → null | - |
| 13-16 | บันทึกหลักฐาน: `file_path` = ชื่อสุ่ม, `file_name` = ชื่อเดิม | ดาวน์โหลดได้ชื่อเดิม (ขั้น 6.6.2) |
| 17 | ตอบ 201 | - |

> 💡 `ON DUPLICATE KEY UPDATE id = id` = "ถ้ามีแล้ว แก้ id ให้เท่าเดิม" = ไม่เปลี่ยนอะไรเลย (เทคนิค "สร้างถ้ายังไม่มี")

▶️ **ทดสอบ:** (token ของ teach3) Thunder Client → POST `http://localhost:5000/api/self-evaluations/1/evidences`
1. Body → **Form** → ติ๊ก **Files**
2. ช่อง `description` = `แผนการสอน`
3. ช่อง `file` เลือกไฟล์ PDF อะไรก็ได้

✅ **ต้องเห็น:** **201** และไฟล์ชื่อสุ่มโผล่ในโฟลเดอร์ `backend/uploads` (จด id ไว้ใช้ขั้น 6.6.2)

✅ **ลองแนบไฟล์ .txt:** **400** "รองรับเฉพาะไฟล์ PDF, JPG และ PNG"

✅ **ลองตัวชี้วัด 6 (ต้องเป็น URL):** ช่อง `description` = `x`, `url` = `abc` → **400** "URL ต้องขึ้นต้นด้วย http:// หรือ https://"

<details>
<summary>📄 ไฟล์ routes/selfEvaluations.js ทั้งไฟล์ (กดดูไว้เทียบ)</summary>

ไฟล์จริงในโปรเจกต์: [backend/routes/selfEvaluations.js](../../backend/routes/selfEvaluations.js) = ขั้น 6.5.2-6.5.7

</details>

## 6.6 API ไฟล์หลักฐาน (ดาวน์โหลด / ลบ)

### ขั้นที่ 6.6.1 ส่วนหัวไฟล์ และฟังก์ชันหาหลักฐาน

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชันหาหลักฐาน พร้อม "เจ้าของ" และสถานะหัวข้อ

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/routes/evidences.js`

```js
import { Router } from "express";
import path from "node:path";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { UPLOAD_DIR, deleteFile } from "../utils/upload.js";

const router = Router();
router.use(verifyToken);

// หลักฐาน พร้อมเจ้าของ (evaluatee_id) และสถานะเปิดของหัวข้อ
async function findEvidence(id) {
  const [rows] = await pool.query(
    `SELECT ev.*, se.evaluatee_id, (CURDATE() BETWEEN t.start_date AND t.end_date) AS is_open
     FROM evidences ev
     JOIN self_evaluations se ON se.id = ev.self_evaluation_id
     JOIN indicators i ON i.id = se.indicator_id
     JOIN evaluation_topics t ON t.id = i.topic_id
     WHERE ev.id = ?`,
    [id]
  );
  return rows[0];
}

// (ขั้น 6.6.2 จะเขียนต่อตรงนี้)

export default router;
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 14 | ทุกคอลัมน์ของหลักฐาน + เจ้าของ + หัวข้อเปิดไหม | ตรวจสิทธิ์และตรวจเวลาในขั้นถัดไป |
| 16-18 | JOIN ต่อกัน 3 ทอด: หลักฐาน → คะแนนตนเอง → ตัวชี้วัด → หัวข้อ | เดินตาม FK จากหลักฐานไปจนถึงหัวข้อ |

> 💡 JOIN หลายตารางต่อกันได้เรื่อยๆ แต่ละ JOIN บอกว่าเชื่อมตารางใหม่กับตารางที่มีอยู่แล้วอย่างไร (JOIN สอนในบท 05 ขั้น 5.6.1)

⌨️ **แก้โค้ด:** เปิด `app.js` เพิ่ม `import evidenceRoutes from "./routes/evidences.js";` และเพิ่ม **ใต้** `app.use("/api/self-evaluations", selfEvaluationRoutes);`

```js
app.use("/api/evidences", evidenceRoutes);
```

### ขั้นที่ 6.6.2 ดาวน์โหลดไฟล์ (ตรวจความเป็นเจ้าของ)

> 🎯 **ขั้นนี้จะได้:** ดาวน์โหลดไฟล์ได้เฉพาะคนที่มีสิทธิ์

📖 **นอกจากบทบาท ต้องตรวจความเป็นเจ้าของด้วย**

| บทบาท | ดาวน์โหลดได้ |
|---|---|
| hr | ทุกไฟล์ |
| ผู้รับการประเมิน | เฉพาะไฟล์ของตัวเอง |
| กรรมการ | เฉพาะไฟล์ของคนที่ตัวเองได้รับมอบหมายให้ประเมิน |

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 6.6.2 จะเขียนต่อตรงนี้)`

```js
// GET /api/evidences/:id/file  ดาวน์โหลดไฟล์หลักฐาน
// hr ทุกไฟล์, ผู้รับประเมินเฉพาะของตัวเอง, กรรมการเฉพาะคนที่ได้รับมอบหมาย
router.get("/:id/file", requireRole("hr", "evaluatee", "committee"), async (req, res) => {
  const evidence = await findEvidence(req.params.id);
  if (!evidence?.file_path) return fail(res, 404, "ไม่พบไฟล์");

  const { role, id: userId } = req.user;
  if (role === "evaluatee" && evidence.evaluatee_id !== userId) return fail(res, 403, "ไม่มีสิทธิ์ดาวน์โหลดไฟล์นี้");
  if (role === "committee") {
    const [rows] = await pool.query("SELECT id FROM assignments WHERE committee_id = ? AND evaluatee_id = ?", [
      userId,
      evidence.evaluatee_id,
    ]);
    if (!rows.length) return fail(res, 403, "ไม่มีสิทธิ์ดาวน์โหลดไฟล์นี้");
  }
  res.download(path.join(UPLOAD_DIR, evidence.file_path), evidence.file_name);
});

// (ขั้น 6.6.3 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5 | ไม่พบหลักฐาน **หรือ** หลักฐานไม่มีไฟล์ (เป็น URL) ตอบ 404 | `evidence?.file_path` จัดการทั้ง 2 กรณีในบรรทัดเดียว |
| 7 | แกะ role และ id (เปลี่ยนชื่อเป็น userId) | - |
| 8 | ผู้รับประเมินที่ไม่ใช่เจ้าของ → 403 | - |
| 9-15 | กรรมการ: ต้องมีการมอบหมายคู่ "ฉัน ↔ เจ้าของไฟล์" ไม่งั้น 403 | - |
| 16 | ส่งไฟล์ให้ดาวน์โหลด ด้วย **ชื่อเดิม** | ผู้ใช้ได้ `แผนการสอน.pdf` ไม่ใช่ชื่อสุ่ม |

🧩 **Syntax ใหม่: แกะ object พร้อมเปลี่ยนชื่อ**

```syntax
[k:const] [s:{] [n:role][s:,] [p:id][s::] [n:userId] [s:}] [s:=] [n:req][s:.][n:user][s:;]
```

- `id: userId` = "เอาช่อง `id` มาเก็บในตัวแปรชื่อ `userId`" (ชื่อ id ทั่วไปเกินไป เปลี่ยนให้ชัดว่าเป็นของผู้ใช้)

> 🧩 `res.download(ที่อยู่ไฟล์, ชื่อที่ให้ผู้ใช้เห็น)` เป็น 🟣 ของ Express

✅ **ลองเลย:**
- token ของ teach3 → GET `/api/evidences/(id จากขั้น 6.5.7)/file` → ได้ไฟล์ PDF (Thunder Client แสดงเนื้อไฟล์)
- token ของ **teach1** → GET ไฟล์เดียวกัน → **403** "ไม่มีสิทธิ์ดาวน์โหลดไฟล์นี้"

### ขั้นที่ 6.6.3 ลบหลักฐานของตัวเอง

> 🎯 **ขั้นนี้จะได้:** ผู้รับประเมินลบหลักฐานที่แนบผิดได้ พร้อมลบไฟล์จริง

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 6.6.3 จะเขียนต่อตรงนี้)`

```js
// DELETE /api/evidences/:id  ลบรายละเอียด/หลักฐานของตัวเอง (พร้อมไฟล์)
router.delete("/:id", requireRole("evaluatee"), async (req, res) => {
  const evidence = await findEvidence(req.params.id);
  if (!evidence || evidence.evaluatee_id !== req.user.id) return fail(res, 404, "ไม่พบรายละเอียดประกอบ");
  if (!evidence.is_open) return fail(res, 400, "หัวข้อนี้ไม่อยู่ในช่วงเวลาการประเมิน");

  await pool.query("DELETE FROM evidences WHERE id = ?", [evidence.id]);
  if (evidence.file_path) await deleteFile(evidence.file_path);
  ok(res, null, "ลบรายละเอียดประกอบสำเร็จ");
});
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4 | ไม่พบ **หรือไม่ใช่ของฉัน** ตอบ **404** (ไม่ใช่ 403) | ไม่บอกคนอื่นว่ามีหลักฐาน id นี้อยู่จริง |
| 5 | หัวข้อปิดแล้วห้ามลบ | - |
| 7 | ลบแถวในฐานข้อมูล | - |
| 8 | ถ้ามีไฟล์ ลบไฟล์จริงด้วย | ไม่ให้ไฟล์ค้างในเครื่องโดยไม่มีใครใช้ |

✅ **ลองเลย:** token ของ teach3 → DELETE `/api/evidences/(id จากขั้น 6.5.7)` → 200 และไฟล์ในโฟลเดอร์ uploads หายไป

## 6.7 API กรรมการ

### ขั้นที่ 6.7.1 กฎของการบันทึกร่าง

> 🎯 **ขั้นนี้จะได้:** schema ที่รับคะแนนหลายตัวชี้วัดพร้อมกัน

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/schemas/committee.js`

```js
import { z } from "zod";
import { idField, optionalText } from "./common.js";

// บันทึกร่าง: คะแนนรายตัวชี้วัด (ให้ไม่ครบได้) + ความเห็นสรุป
export const draftSchema = z.object({
  scores: z
    .array(
      z.object({
        indicator_id: idField("รหัสตัวชี้วัดไม่ถูกต้อง"),
        score: z.number({ error: "คะแนนต้องเป็นตัวเลข" }).int("คะแนนต้องเป็นจำนวนเต็ม"),
      }),
      { error: "รูปแบบคะแนนไม่ถูกต้อง" }
    )
    .max(500),
  summary_comment: optionalText(2000),
});
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 6-14 | `scores` ต้องเป็น array ที่แต่ละตัวเป็น `{ indicator_id, score }` ไม่เกิน 500 ตัว | หน้าเว็บส่งคะแนนทุกข้อที่กรอกมาในครั้งเดียว (ให้ไม่ครบได้ เพราะเป็นร่าง) |
| 15 | ความเห็นสรุปไม่บังคับ (ตอนร่าง) | บังคับตอนยืนยันแทน |

🧩 **Syntax ใหม่: `z.array(กฎของแต่ละตัว)`**

```syntax
[p:z][s:.][p:array][s:(][p:z][s:.][p:object][s:(][s:{] [s:...] [s:}][s:)][s:)]
```

body ที่ผ่านกฎนี้หน้าตาแบบนี้

```json
{ "scores": [{ "indicator_id": 1, "score": 4 }, { "indicator_id": 2, "score": 3 }], "summary_comment": "ดี" }
```

### ขั้นที่ 6.7.2 กฎของลายเซ็น

> 🎯 **ขั้นนี้จะได้:** schema ตรวจลายเซ็นตอนยืนยันผล

⌨️ **พิมพ์โค้ด:** เพิ่มต่อท้าย `schemas/committee.js`

```js

// ยืนยันผล: ลายเซ็นเป็นรูป PNG แบบ data URL จาก canvas.toDataURL()
export const confirmSchema = z.object({
  signature: z
    .string({ error: "กรุณาลงลายเซ็น" })
    .regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, "กรุณาลงลายเซ็น")
    .max(1_000_000, "ไฟล์ลายเซ็นใหญ่เกินไป"),
});
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 6 | ต้องขึ้นต้นด้วย `data:image/png;base64,` ตามด้วยตัวอักษร base64 | รับเฉพาะรูป PNG จากการวาด ไม่รับข้อความอื่น |
| 7 | ไม่เกิน 1 ล้านตัวอักษร | กันข้อมูลใหญ่เกินจนฐานข้อมูลอืด |

📖 **ลายเซ็นเก็บอย่างไร?** หน้าเว็บวาดบน `<canvas>` แล้วแปลงเป็นข้อความด้วย `canvas.toDataURL()` (บท 10) ได้ข้อความยาวแบบ `data:image/png;base64,iVBORw0KG...` เก็บลงคอลัมน์ `signature` (MEDIUMTEXT) ได้เลย และแสดงเป็นรูปได้ด้วย `<img src="ข้อความนี้">`

> 🧩 syntax ใหม่: ใน regex `\/` = เครื่องหมาย `/` จริงๆ (ต้องใส่ `\` เพราะ `/` ใช้ครอบ regex) ส่วน `1_000_000` = หนึ่งล้าน (`_` ช่วยให้อ่านตัวเลขง่าย ไม่มีผลกับค่า)

### ขั้นที่ 6.7.3 ส่วนหัวไฟล์ และรายชื่อคนที่ต้องประเมิน

> 🎯 **ขั้นนี้จะได้:** กรรมการเห็นรายชื่อผู้รับการประเมินของตัวเอง (เกณฑ์ 5.3.1)

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/routes/committee.js`

```js
import { Router } from "express";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { draftSchema, confirmSchema } from "../schemas/committee.js";
import { isValidScore, weighted, sum, percent } from "../utils/score.js";

const router = Router();
router.use(verifyToken, requireRole("committee")); // เฉพาะกรรมการ เห็นเฉพาะงานที่ได้รับมอบหมาย

// งานมอบหมายของกรรมการที่ login อยู่ (ไม่ใช่ของตัวเอง = ไม่พบ)
async function findMyAssignment(id, committeeId) {
  const [rows] = await pool.query("SELECT * FROM assignments WHERE id = ? AND committee_id = ?", [id, committeeId]);
  return rows[0];
}

// GET /api/committee/assignments  ผู้รับการประเมินที่ต้องประเมิน
router.get("/assignments", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT a.id, a.evaluatee_id, a.committee_role, a.status, a.confirmed_at,
            u.full_name, u.position, u.department,
            (SELECT COUNT(*) FROM committee_scores s WHERE s.assignment_id = a.id) AS scored_count,
            (SELECT COUNT(*) FROM self_evaluations se WHERE se.evaluatee_id = a.evaluatee_id AND se.score IS NOT NULL) AS self_count
     FROM assignments a JOIN users u ON u.id = a.evaluatee_id
     WHERE a.committee_id = ? ORDER BY a.status = 'confirmed', u.full_name`,
    [req.user.id]
  );
  const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM indicators");
  ok(res, rows.map((r) => ({ ...r, indicator_count: total })));
});

// (ขั้น 6.7.4 จะเขียนต่อตรงนี้)

export default router;
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 10 | ทั้งไฟล์เฉพาะกรรมการ | - |
| 13-16 | หางานมอบหมายตาม id **และต้องเป็นของกรรมการคนนี้** | **หัวใจความปลอดภัย** กรรมการ A ใส่ id งานของกรรมการ B จะไม่เจอ (404) |
| 21-22 | ข้อมูลงาน + ชื่อ ตำแหน่ง แผนกของผู้รับประเมิน | การ์ดรายชื่อในหน้ากรรมการ |
| 23 | ฉันให้คะแนนไปกี่ข้อแล้ว | แสดง "2/6 ข้อ" |
| 24 | ผู้รับประเมินกรอกคะแนนตัวเองไปกี่ข้อ | รู้ว่าเขาพร้อมให้ประเมินหรือยัง |
| 26 | เฉพาะงานของฉัน เรียงงานที่ยังไม่ยืนยันขึ้นก่อน แล้วตามชื่อ | `a.status = 'confirmed'` ได้ 0 (ยัง) หรือ 1 (ยืนยันแล้ว) เรียงน้อยไปมาก งานที่ต้องทำจึงอยู่บน |
| 29 | นับตัวชี้วัดทั้งหมด | ตัวหารของ "2/6" |
| 30 | เติมจำนวนตัวชี้วัดลงทุกแถว | - |

✅ **ลองเลย:** login เป็น **comm1** → `GET /api/committee/assignments` → 3 คน (teach1, teach2, teach3) สถานะ `pending` ทั้งหมด

⌨️ **แก้โค้ด:** เปิด `app.js` เพิ่ม `import committeeRoutes from "./routes/committee.js";` และเพิ่ม **ใต้** `app.use("/api/evidences", evidenceRoutes);`

```js
app.use("/api/committee", committeeRoutes);
```

### ขั้นที่ 6.7.4 ข้อมูลสำหรับประเมิน 1 คน: ดึงข้อมูล

> 🎯 **ขั้นนี้จะได้:** ส่วนแรกของ GET `/assignments/:id` ดึงทุกอย่างที่หน้าประเมินต้องใช้ (เกณฑ์ 5.3.2, 5.3.3, 5.3.6)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 6.7.4 จะเขียนต่อตรงนี้)`

```js
// GET /api/committee/assignments/:id  ข้อมูลสำหรับประเมิน 1 คน
// หัวข้อ > ตัวชี้วัด + รายละเอียด/หลักฐาน + คะแนนตนเอง + คะแนนที่กรรมการให้ + ตารางสรุป
router.get("/assignments/:id", async (req, res) => {
  const assignment = await findMyAssignment(req.params.id, req.user.id);
  if (!assignment) return fail(res, 404, "ไม่พบงานที่ได้รับมอบหมาย");

  const [[evaluatee]] = await pool.query(
    "SELECT id, full_name, email, phone, position, department FROM users WHERE id = ?",
    [assignment.evaluatee_id]
  );
  const [topics] = await pool.query("SELECT id, title, description, start_date, end_date FROM evaluation_topics ORDER BY id");
  const [indicators] = await pool.query("SELECT * FROM indicators ORDER BY id");
  const [selfRows] = await pool.query("SELECT * FROM self_evaluations WHERE evaluatee_id = ?", [evaluatee.id]);
  const [evidences] = await pool.query(
    `SELECT ev.id, ev.self_evaluation_id, ev.description, ev.file_name, ev.url
     FROM evidences ev JOIN self_evaluations se ON se.id = ev.self_evaluation_id
     WHERE se.evaluatee_id = ? ORDER BY ev.id`,
    [evaluatee.id]
  );
  const [myScores] = await pool.query("SELECT indicator_id, score FROM committee_scores WHERE assignment_id = ?", [assignment.id]);
  // (ขั้น 6.7.5 จะเขียนต่อตรงนี้)
});

// (ขั้น 6.7.6 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ดึงอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4-5 | งานของฉันเท่านั้น ไม่ใช่ = 404 | - |
| 7-10 | ข้อมูลผู้รับประเมิน | ส่วนหัวของหน้าประเมิน (เกณฑ์ 5.3.2) |
| 11-12 | หัวข้อ และตัวชี้วัดทั้งหมด | - |
| 13 | คะแนนที่ผู้รับประเมินให้ตัวเอง | กรรมการเห็นเทียบ |
| 14-19 | หลักฐานของผู้รับประเมิน (**ไม่ส่ง file_path** ชื่อสุ่มไม่จำเป็นต่อหน้าเว็บ) | กรรมการดูประกอบการให้คะแนน (เกณฑ์ 5.3.3) |
| 20 | คะแนนที่ฉันเคยให้ไว้ (ร่าง) | เปิดหน้ามาแล้วคะแนนเดิมยังอยู่ |

### ขั้นที่ 6.7.5 ข้อมูลสำหรับประเมิน 1 คน: ประกอบและสรุป

> 🎯 **ขั้นนี้จะได้:** GET ครบ พร้อมตารางสรุปคะแนน

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 6.7.5 จะเขียนต่อตรงนี้)`

```js

  const rows = indicators.map((i) => {
    const self = selfRows.find((s) => s.indicator_id === i.id);
    const score = myScores.find((s) => s.indicator_id === i.id)?.score ?? null;
    return {
      ...i,
      self_score: self?.score ?? null,
      evidences: self ? evidences.filter((e) => e.self_evaluation_id === self.id) : [],
      score,
      weighted_score: weighted(score, i),
    };
  });
  for (const t of topics) t.indicators = rows.filter((r) => r.topic_id === t.id);

  const total_weight = sum(rows.map((r) => r.weight));
  const total = sum(rows.map((r) => r.weighted_score));
  const scored = rows.filter((r) => r.score != null).length;

  ok(res, {
    assignment,
    evaluatee,
    topics,
    summary: { indicator_count: rows.length, scored, total, total_weight, percent: percent(total, total_weight) },
  });
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2-12 | ทุกตัวชี้วัด: คะแนนตนเอง + หลักฐาน + คะแนนของฉัน + คะแนนถ่วงน้ำหนัก | การ์ดตัวชี้วัดในหน้าประเมิน |
| 13 | จัดตัวชี้วัดเข้าหัวข้อ | แสดงแยกตามหัวข้อ |
| 15-17 | น้ำหนักรวม คะแนนรวม จำนวนข้อที่ให้แล้ว | ตารางสรุปคะแนนท้ายหน้า (เกณฑ์ 5.3.6) |
| 19-24 | ตอบทุกอย่างในครั้งเดียว | หน้าเว็บเรียก API ครั้งเดียวพอ |

> 🧩 syntax ทั้งหมดสอนไปแล้ว (โครงเดียวกับขั้น 6.5.4)

✅ **ลองเลย:** (token ของ comm1)
- `GET /api/committee/assignments/(งานทดสอบ)` → 200 ข้อมูลของ teach3 (`summary.scored` = 0)
- `GET /api/committee/assignments/5` (งานของ comm2) → **404**

### ขั้นที่ 6.7.6 บันทึกร่าง: ตรวจคะแนนทุกข้อ

> 🎯 **ขั้นนี้จะได้:** ส่วนแรกของ PUT `/scores` ตรวจทุกอย่างก่อนบันทึก (เกณฑ์ 5.3.4, 5.3.5)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 6.7.6 จะเขียนต่อตรงนี้)`

```js
// PUT /api/committee/assignments/:id/scores  บันทึกร่าง (แก้ได้จนกว่าจะยืนยัน)
// body: { scores: [{ indicator_id, score }], summary_comment }
router.put("/assignments/:id/scores", validate(draftSchema), async (req, res) => {
  const assignment = await findMyAssignment(req.params.id, req.user.id);
  if (!assignment) return fail(res, 404, "ไม่พบงานที่ได้รับมอบหมาย");
  if (assignment.status === "confirmed") return fail(res, 400, "ยืนยันผลแล้ว แก้ไขไม่ได้");

  // ตรวจคะแนนทุกข้อตามรูปแบบของตัวชี้วัด
  const { scores, summary_comment } = req.body;
  const [indicators] = await pool.query("SELECT id, name, score_type FROM indicators");
  for (const s of scores) {
    const indicator = indicators.find((i) => i.id === s.indicator_id);
    if (!indicator) return fail(res, 400, `ไม่พบตัวชี้วัดรหัส ${s.indicator_id}`);
    if (!isValidScore(s.score, indicator.score_type)) return fail(res, 400, `คะแนนของ "${indicator.name}" ไม่ถูกต้อง`);
  }
  // (ขั้น 6.7.7 จะเขียนต่อตรงนี้)
});

// (ขั้น 6.7.8 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4-5 | งานของฉันเท่านั้น | - |
| 6 | ยืนยันแล้วห้ามแก้ | **"ล็อก" ผลหลังยืนยัน** (เกณฑ์ 5.3.10) ไม่ต้องมีอะไรพิเศษ แค่เช็กสถานะทุกครั้ง |
| 10 | ดึงตัวชี้วัดทั้งหมด (ครั้งเดียว ไม่ query ในลูป) | - |
| 11-15 | วนทุกคะแนนที่ส่งมา: ตัวชี้วัดต้องมีจริง และคะแนนต้องตรงรูปแบบ | ข้อความบอกชื่อตัวชี้วัดที่ผิด แก้ได้ตรงจุด |

> 💡 **`return` ในลูป `for…of`** ออกจากทั้งฟังก์ชันทันที (ไม่ใช่แค่ออกจากลูป) เจอข้อผิดข้อแรกก็ตอบ 400 เลย

### ขั้นที่ 6.7.7 บันทึกร่าง: บันทึกด้วย transaction

> 🎯 **ขั้นนี้จะได้:** บันทึกคะแนนหลายข้อ + สถานะ แบบ "สำเร็จทั้งหมด หรือไม่บันทึกเลย" (เกณฑ์ 5.3.8)

📖 **Transaction คืออะไร?** คำสั่งหลายคำสั่งที่ต้องสำเร็จพร้อมกัน เหมือนโอนเงิน: หักบัญชี A + เพิ่มบัญชี B ถ้าหักแล้วเพิ่มไม่ได้ ต้องคืนเงิน A

```text
beginTransaction ─▶ บันทึกคะแนน ─▶ เปลี่ยนสถานะ ─▶ commit (ยืนยันทั้งหมด)
                         │               │
                       error           error
                         └───────┬───────┘
                                 ▼
                        rollback (ยกเลิกทั้งหมด)
```

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 6.7.7 จะเขียนต่อตรงนี้)`

```js

  // บันทึกคะแนน + สถานะ พร้อมกันด้วย transaction (สำเร็จทั้งหมด หรือไม่บันทึกเลย)
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (scores.length) {
      await conn.query(
        "INSERT INTO committee_scores (assignment_id, indicator_id, score) VALUES ? AS new ON DUPLICATE KEY UPDATE score = new.score",
        [scores.map((s) => [assignment.id, s.indicator_id, s.score])]
      );
    }
    await conn.query("UPDATE assignments SET status = 'draft', summary_comment = ? WHERE id = ?", [summary_comment, assignment.id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  ok(res, null, "บันทึกร่างสำเร็จ");
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | ยืมสายเชื่อมต่อ 1 เส้นจาก pool | transaction ต้องทำบนสายเดียวกันทุกคำสั่ง |
| 5 | เริ่ม transaction | - |
| 6-11 | ถ้ามีคะแนน: เพิ่มหรือแก้คะแนนทุกข้อในคำสั่งเดียว | upsert หลายแถวพร้อมกัน |
| 9 | แปลงคะแนนเป็นแถว `[assignment_id, indicator_id, score]` | รูปแบบที่ `VALUES ?` ต้องการ (บท 05 ขั้น 5.4.4) |
| 12 | สถานะเป็น draft และบันทึกความเห็น | - |
| 13 | ยืนยันทั้งหมด | ข้อมูลถูกบันทึกจริงตอนนี้ |
| 14-16 | ถ้ามี error: ยกเลิกทั้งหมด แล้วส่ง error ต่อ | error handler (บท 03) ตอบ 500 ให้ |
| 17-19 | คืนสายเสมอ ไม่ว่าสำเร็จหรือ error | ถ้าไม่คืน สายจะหมด pool แล้วระบบค้าง |

🧩 **Syntax ใหม่ 1: `try … catch (err) … finally`**

```syntax
[k:try] [s:{] [v:ลองทำ] [s:}] [k:catch] [s:(][n:err][s:)] [s:{] [v:ทำเมื่อ error] [s:}] [k:finally] [s:{] [v:ทำเสมอ] [s:}]
```

- ต่อจากบท 04 ขั้น 4.5.1: `catch (err)` รับ error มาเก็บในตัวแปร
- `finally` = ทำเสมอทั้งตอนสำเร็จและตอน error (เหมาะกับ "คืนของที่ยืมมา")
- `throw err` = โยน error ต่อไปให้คนข้างนอกจัดการ

🧩 **Syntax ใหม่ 2 (MySQL 8): upsert หลายแถว**

```syntax
[k:INSERT INTO] [n:ตาราง] [s:(][s:...][s:)] [k:VALUES] [v:?] [k:AS] [n:new] [k:ON DUPLICATE KEY UPDATE] [n:score] [s:=] [n:new][s:.][n:score]
```

- `AS new` = ตั้งชื่อเรียก "แถวที่กำลังจะใส่" ว่า new
- แถวไหนชน UNIQUE → แก้ score เป็นค่าใหม่ของแถวนั้น (`new.score`)

> 🏃 **ฉบับย่อ:** ถ้ายังไม่เข้าใจ transaction ใช้ `pool.query` ตรงๆ 2 คำสั่งก่อนได้ ทำงานเหมือนกันในกรณีปกติ

✅ **ลองเลย:** (token ของ comm1) PUT `/api/committee/assignments/(งานทดสอบ)/scores`

```json
{ "scores": [{ "indicator_id": 1, "score": 4 }], "summary_comment": "ดี" }
```

→ 200 "บันทึกร่างสำเร็จ" แล้ว GET `/api/committee/assignments` สถานะของ teach3 เป็น `draft`

✅ **ลองคะแนนผิด:** `{"scores":[{"indicator_id":3,"score":4}]}` → **400** `คะแนนของ "การทำวิจัยในชั้นเรียน" ไม่ถูกต้อง`

### ขั้นที่ 6.7.8 ยืนยันผล + ลายเซ็น

> 🎯 **ขั้นนี้จะได้:** กรรมการยืนยันผล (หลังจากนี้แก้ไม่ได้) (เกณฑ์ 5.3.7, 5.3.9, 5.3.10)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 6.7.8 จะเขียนต่อตรงนี้)`

```js
// PUT /api/committee/assignments/:id/confirm  body: { signature }  ยืนยันและส่งผล (หลังจากนี้แก้ไม่ได้)
router.put("/assignments/:id/confirm", validate(confirmSchema), async (req, res) => {
  const assignment = await findMyAssignment(req.params.id, req.user.id);
  if (!assignment) return fail(res, 404, "ไม่พบงานที่ได้รับมอบหมาย");
  if (assignment.status === "confirmed") return fail(res, 400, "ยืนยันผลไปแล้ว");

  const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM indicators");
  const [[{ scored }]] = await pool.query("SELECT COUNT(*) AS scored FROM committee_scores WHERE assignment_id = ?", [assignment.id]);
  if (scored < total) return fail(res, 400, `ยังให้คะแนนไม่ครบ (${scored}/${total} ตัวชี้วัด)`);
  if (!assignment.summary_comment) return fail(res, 400, "กรุณาบันทึกความเห็นสรุปก่อนยืนยัน");

  await pool.query("UPDATE assignments SET status = 'confirmed', signature = ?, confirmed_at = NOW() WHERE id = ?", [
    req.body.signature,
    assignment.id,
  ]);
  ok(res, null, "ยืนยันและส่งผลการประเมินสำเร็จ");
});
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | ตรวจลายเซ็นด้วย confirmSchema | ไม่มีลายเซ็น = 400 |
| 5 | ยืนยันซ้ำไม่ได้ | - |
| 7-9 | นับตัวชี้วัดทั้งหมดกับที่ให้คะแนนแล้ว ไม่ครบ = 400 | ยืนยันได้เมื่อให้คะแนนครบทุกข้อ |
| 10 | ต้องมีความเห็นสรุป (บันทึกไว้ตอนร่าง) | - |
| 12-15 | สถานะ confirmed + ลายเซ็น + เวลายืนยัน (`NOW()` = เวลาปัจจุบันของ MySQL) | หลังจากนี้ PUT scores จะถูกปฏิเสธ (ขั้น 6.7.6 บรรทัด 6) |

✅ **ลองเลย:** (token ของ comm1)
1. PUT `/api/committee/assignments/(งานทดสอบ)/confirm` body `{"signature":"data:image/png;base64,iVBORw0KGgo="}` → **400** "ยังให้คะแนนไม่ครบ (1/6 ตัวชี้วัด)"
2. บันทึกร่างให้ครบ 6 ข้อ

```json
{ "scores": [{"indicator_id":1,"score":4},{"indicator_id":2,"score":3},{"indicator_id":3,"score":1},{"indicator_id":4,"score":1},{"indicator_id":5,"score":4},{"indicator_id":6,"score":3}], "summary_comment": "ดีมาก" }
```

3. confirm อีกครั้ง → **200**
4. PUT scores อีกครั้ง → **400** "ยืนยันผลแล้ว แก้ไขไม่ได้"

<details>
<summary>📄 ไฟล์ routes/committee.js ทั้งไฟล์ (กดดูไว้เทียบ)</summary>

ไฟล์จริงในโปรเจกต์: [backend/routes/committee.js](../../backend/routes/committee.js)

</details>

### ขั้นที่ 6.7.9 กรอกข้อมูลจริงให้ครบ

> 🎯 **ขั้นนี้จะได้:** มีคะแนน หลักฐาน และผลของกรรมการจริงไว้ทดสอบรายงานและหน้าเว็บ

📖 API ครบแล้ว จึงใช้ API สร้างข้อมูลจริงได้เลย ใช้เวลาประมาณ 10-15 นาที บันทึก request ไว้ใน Thunder Client จะได้ไม่ต้องพิมพ์ซ้ำ เตรียมไฟล์ PDF อะไรก็ได้ไว้ 1 ไฟล์

**1) ผู้รับการประเมิน teach1** (token ของ teach1) ส่ง PUT `/api/self-evaluations/(เลขตัวชี้วัด)`

| ตัวชี้วัด | body |
|---|---|
| 1 | `{"score":4}` |
| 2 | `{"score":3}` |
| 3 | `{"score":1}` |
| 4 | `{"score":1}` |
| 5 | `{"score":4}` |
| 6 | `{"score":3}` |

**2) หลักฐานของ teach1** ส่ง POST `/api/self-evaluations/(เลขตัวชี้วัด)/evidences` แบบ **Form**

| ตัวชี้วัด | description | แนบ |
|---|---|---|
| 1 | แผนการจัดการเรียนรู้วิชาการเขียนโปรแกรมเว็บ | `file` = ไฟล์ PDF |
| 2 | ใช้ Google Classroom ในทุกรายวิชา | `url` = `https://classroom.google.com` |
| 2 | ผลิตคลิปสอนบน YouTube 10 คลิป | `url` = `https://youtube.com` |
| 3 | วิจัยเรื่องการพัฒนาทักษะการเขียนโปรแกรมด้วย Pair Programming | `file` = ไฟล์ PDF |
| 4 | อบรมหลักสูตร Full-stack Developer 30 ชั่วโมง | `url` = `https://example.com/cert.pdf` |
| 6 | ร่วมกิจกรรมจิตอาสาพัฒนาชุมชน | `url` = `https://example.com/activity` |

**3) ผู้รับการประเมิน teach2** (token ของ teach2)

| คำขอ | ส่ง |
|---|---|
| PUT `/api/self-evaluations/1` | `{"score":3}` |
| PUT `/api/self-evaluations/3` | `{"score":0}` |
| PUT `/api/self-evaluations/5` | `{"score":3}` |
| POST `/api/self-evaluations/1/evidences` แบบ Form | `description` = แผนการจัดการเรียนรู้วิชาฐานข้อมูล, `file` = ไฟล์ PDF |

**4) กรรมการ comm1 ประเมิน teach1 จนยืนยันผล** (token ของ comm1) PUT `/api/committee/assignments/1/scores`

```json
{ "scores": [{"indicator_id":1,"score":4},{"indicator_id":2,"score":3},{"indicator_id":3,"score":1},{"indicator_id":4,"score":1},{"indicator_id":5,"score":4},{"indicator_id":6,"score":3}], "summary_comment": "ปฏิบัติงานได้ดี มีหลักฐานครบถ้วน" }
```

แล้ว PUT `/api/committee/assignments/1/confirm`

```json
{ "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" }
```

**5) กรรมการ comm2 บันทึกร่าง teach1** (token ของ comm2) PUT `/api/committee/assignments/2/scores`

```json
{ "scores": [{"indicator_id":1,"score":3},{"indicator_id":2,"score":2}], "summary_comment": "ควรเพิ่มหลักฐานด้านสื่อการสอน" }
```

✅ **ลองเลย:**
- token ของ teach1 → `GET /api/self-evaluations` → `summary.progress` = **100**
- token ของ teach2 → `GET /api/self-evaluations` → `summary.progress` = **33.33**, `summary.filled` = 2
- token ของ hr → PUT `/api/indicators/1` body `{ "topic_id": 1, "name": "การจัดทำแผนการจัดการเรียนรู้", "weight": 20, "score_type": "yes_no", "evidence_type": "file" }` → **400** "ตัวชี้วัดนี้มีการให้คะแนนแล้ว เปลี่ยนรูปแบบการประเมินไม่ได้" (จากบท 05 ขั้น 5.5.4)

> 💡 ลิงก์ในตารางเป็นตัวอย่าง ส่วนลายเซ็นในข้อ 4 คือรูป PNG ขนาด 1×1 จุด ลายเซ็นจริงจะวาดผ่านหน้าเว็บในบท 10

## 6.8 API รายงาน

### ขั้นที่ 6.8.1 ส่วนหัวไฟล์ และฟังก์ชันดึงตัวชี้วัด

> 🎯 **ขั้นนี้จะได้:** ไฟล์ reports.js พร้อมฟังก์ชันช่วยตัวแรก

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/routes/reports.js`

```js
import { Router } from "express";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { buildResult, weighted, sum, sortBy } from "../utils/score.js";

const router = Router();
router.use(verifyToken);

// ตัวชี้วัดทั้งหมด พร้อมชื่อหัวข้อ
async function loadIndicators() {
  const [rows] = await pool.query(
    `SELECT i.id, i.topic_id, t.title AS topic_title, i.name, i.description, i.weight, i.score_type, i.evidence_type
     FROM indicators i JOIN evaluation_topics t ON t.id = i.topic_id
     ORDER BY i.topic_id, i.id`
  );
  return rows;
}

// (ขั้น 6.8.2 จะเขียนต่อตรงนี้)

export default router;
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5 | ดึงฟังก์ชันคำนวณ 4 ตัว | (บท 11 จะเพิ่ม `average`, `percent` และไฟล์ตรวจข้อมูล สำหรับ Dashboard) |
| 8 | ทุก route ต้อง login (สิทธิ์กำหนดแต่ละ route) | รายงานรายบุคคลให้เจ้าตัวและกรรมการดูได้ด้วย |
| 11-18 | ตัวชี้วัดทั้งหมด + ชื่อหัวข้อ เรียงตามหัวข้อ | หัวตารางรายงาน |

⌨️ **แก้โค้ด:** เปิด `app.js` เพิ่ม `import reportRoutes from "./routes/reports.js";` และเพิ่ม **ใต้** `app.use("/api/assignments", assignmentRoutes);` (เหนือ `/api/profile`)

```js
app.use("/api/reports", reportRoutes);
```

### ขั้นที่ 6.8.2 คำนวณผลหลายคนพร้อมกัน

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชันที่คำนวณผลของผู้รับประเมินหลายคนด้วย query แค่ 4 ครั้ง

📖 **ทำไมไม่คำนวณทีละคน?** ถ้ามี 100 คน แล้ว query ทีละคน คนละ 3 ครั้ง = 300 ครั้ง ช้ามาก
**วิธีที่ดีกว่า:** ดึงของทุกคนพร้อมกัน (3 ครั้ง + ตัวชี้วัด 1 ครั้ง) แล้วแยกทีละคนใน JavaScript

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 6.8.2 จะเขียนต่อตรงนี้)`

```js
// คำนวณผลของผู้รับประเมินหลายคนในครั้งเดียว คืน { evaluatee_id: { assignments, rows, summary } }
async function loadResults(evaluateeIds) {
  if (!evaluateeIds.length) return {};
  const indicators = await loadIndicators();
  // คะแนนตนเอง + จำนวนหลักฐาน
  const [selfRows] = await pool.query(
    `SELECT se.evaluatee_id, se.indicator_id, se.score, COUNT(ev.id) AS evidence_count
     FROM self_evaluations se LEFT JOIN evidences ev ON ev.self_evaluation_id = se.id
     WHERE se.evaluatee_id IN (?) GROUP BY se.id`,
    [evaluateeIds]
  );
  const [assignments] = await pool.query(
    `SELECT a.*, u.full_name AS committee_name, u.position AS committee_position
     FROM assignments a JOIN users u ON u.id = a.committee_id
     WHERE a.evaluatee_id IN (?) ORDER BY a.committee_role, a.id`,
    [evaluateeIds]
  );
  const [scores] = await pool.query(
    `SELECT s.assignment_id, s.indicator_id, s.score
     FROM committee_scores s JOIN assignments a ON a.id = s.assignment_id
     WHERE a.evaluatee_id IN (?)`,
    [evaluateeIds]
  );

  const results = {};
  for (const id of evaluateeIds) {
    const mine = assignments.filter((a) => a.evaluatee_id === id);
    const selfData = Object.fromEntries(selfRows.filter((r) => r.evaluatee_id === id).map((r) => [r.indicator_id, r]));
    const myScores = scores.filter((s) => mine.some((a) => a.id === s.assignment_id));
    results[id] = { assignments: mine, ...buildResult(indicators, selfData, mine, myScores) };
  }
  return results;
}

// (ขั้น 6.8.3 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | ไม่มีใครเลย ส่งกลับ object ว่าง | `IN ()` ว่างเป็น SQL ที่ผิด |
| 6-11 | คะแนนตนเองของทุกคน + นับหลักฐานของแต่ละแถว | `LEFT JOIN` = แถวที่ไม่มีหลักฐานเลยก็ยังได้ (นับ 0) |
| 12-17 | กรรมการของทุกคน + ชื่อ ตำแหน่ง (เรียงประธานก่อน) | รายงานแสดงรายชื่อกรรมการพร้อมลายเซ็น |
| 18-23 | คะแนนกรรมการของทุกคน | - |
| 25-31 | แยกข้อมูลทีละคน แล้วส่งให้ buildResult | ผลของแต่ละคน |
| 28 | แปลงคะแนนตนเองเป็น `{ indicator_id: แถว }` | รูปแบบที่ buildResult ต้องการ (ขั้น 6.3.6) |
| 29 | คะแนนกรรมการเฉพาะงานของคนนี้ | - |

🧩 **Syntax ใหม่ 1 (mysql2): `IN (?)` + array**

- ส่ง array `[5, 6, 7]` แทน `?` ตัวเดียว mysql2 แปลงเป็น `IN (5, 6, 7)` ให้

🧩 **Syntax ใหม่ 2 (SQL): `LEFT JOIN` และ `GROUP BY`**

| | `JOIN` (บท 05) | `LEFT JOIN` |
|---|---|---|
| แถวซ้ายที่ไม่มีคู่ทางขวา | ถูกตัดทิ้ง | **ยังอยู่** (ฝั่งขวาเป็น NULL) |

- `GROUP BY se.id` + `COUNT(ev.id)` = รวมแถวที่มี se.id เดียวกันเป็นแถวเดียว แล้วนับหลักฐาน (NULL ไม่ถูกนับ → ได้ 0)

🧩 **Syntax ใหม่ 3: `.some()` (มีอย่างน้อย 1 ตัวที่ตรงไหม)**

```js
[1, 2, 3].some((n) => n > 2);   // true
[1, 2, 3].some((n) => n > 5);   // false
```

> 💡 `{ assignments: mine, ...buildResult(…) }` = รวม assignments กับทุกช่องที่ buildResult ส่งกลับ (`rows`, `summary`) เป็น object เดียว

### ขั้นที่ 6.8.3 สรุปผลทุกคน พร้อมเรียงลำดับ

> 🎯 **ขั้นนี้จะได้:** `GET /api/reports/evaluatees?sort=score|progress|name` (เกณฑ์ 5.1.10, 5.1.12)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 6.8.3 จะเขียนต่อตรงนี้)`

```js
// GET /api/reports/evaluatees?sort=score|progress|name
// สรุปรายผู้รับการประเมิน: % การบันทึก, จำนวนกรรมการที่ยืนยัน, คะแนนรวม
router.get("/evaluatees", requireRole("hr"), async (req, res) => {
  const [users] = await pool.query(
    "SELECT id, username, full_name, position, department FROM users WHERE role = 'evaluatee' ORDER BY id"
  );
  const results = await loadResults(users.map((u) => u.id));
  const list = users.map((u) => ({ ...u, ...results[u.id].summary }));

  const sortKey = { score: "committee_percent", progress: "progress", name: "full_name" }[req.query.sort];
  ok(res, sortKey ? sortBy(list, sortKey, sortKey === "full_name" ? "asc" : "desc") : list);
});

// (ขั้น 6.8.4 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | เฉพาะ hr | - |
| 4-6 | ผู้รับประเมินทั้งหมด | - |
| 7 | คำนวณผลทุกคนพร้อมกัน | - |
| 8 | รวมข้อมูลผู้ใช้กับสรุปผลเป็นแถวเดียว | ตารางรายงานของ hr |
| 10 | แปลงค่า sort ที่ส่งมาเป็นชื่อช่องที่จะเรียง (ไม่ตรง = undefined) | - |
| 11 | ถ้ามี sortKey: เรียง (ชื่อ = น้อยไปมาก, คะแนน/ความคืบหน้า = มากไปน้อย) ไม่งั้นส่งตามเดิม | ปุ่มเรียงในหน้ารายงาน |

🧩 **Syntax ใหม่: object แทน if-else (เลือกค่าตามคีย์)**

```syntax
[s:{] [n:คีย์1][s::] [v:"ค่า1"][s:,] [n:คีย์2][s::] [v:"ค่า2"] [s:}][s:\[][n:ตัวแปร][s:\]]
```

```js
{ score: "committee_percent", progress: "progress" }["score"];   // "committee_percent"
{ score: "committee_percent", progress: "progress" }["abc"];     // undefined
```

- สั้นกว่าเขียน `if (sort === "score") … else if (sort === "progress") …` และกันค่าแปลกๆ ที่ส่งมา (ได้ undefined = ไม่เรียง)

✅ **ลองเลย:** (token ของ hr) `GET /api/reports/evaluatees?sort=progress` → teach1 (100) อยู่บนสุด ตามด้วย teach2 (33.33)

### ขั้นที่ 6.8.4 รายงานรายบุคคล (ตรวจสิทธิ์ 3 แบบ และซ่อนผลร่าง)

> 🎯 **ขั้นนี้จะได้:** `GET /api/reports/evaluatees/:id` ใช้ได้ทั้ง hr, เจ้าตัว และกรรมการ (เกณฑ์ 5.1.13, 5.2.9)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 6.8.4 จะเขียนต่อตรงนี้)`

```js
// GET /api/reports/evaluatees/:id  รายงานผลการประเมินรายบุคคล
// hr ดูได้ทุกคน, ผู้รับประเมินดูได้เฉพาะของตัวเอง, กรรมการดูได้เฉพาะคนที่ได้รับมอบหมาย
router.get("/evaluatees/:id", requireRole("hr", "evaluatee", "committee"), async (req, res) => {
  const id = Number(req.params.id);
  const { role, id: userId } = req.user;
  if (role === "evaluatee" && userId !== id) return fail(res, 403, "ดูได้เฉพาะผลของตนเอง");
  if (role === "committee") {
    const [rows] = await pool.query("SELECT id FROM assignments WHERE committee_id = ? AND evaluatee_id = ?", [userId, id]);
    if (!rows.length) return fail(res, 403, "ไม่ได้รับมอบหมายให้ประเมินผู้นี้");
  }

  const [users] = await pool.query(
    "SELECT id, username, full_name, email, phone, position, department FROM users WHERE id = ? AND role = 'evaluatee'",
    [id]
  );
  if (!users[0]) return fail(res, 404, "ไม่พบผู้รับการประเมิน");

  const result = (await loadResults([id]))[id];

  // ผู้รับประเมินเห็นเฉพาะผลของกรรมการที่ยืนยันแล้ว
  if (role === "evaluatee") {
    for (const a of result.assignments) {
      if (a.status === "confirmed") continue;
      a.summary_comment = null;
      a.signature = null;
      for (const r of result.rows) delete r.scores[a.id];
    }
  }
  ok(res, { evaluatee: users[0], ...result });
});

// (ขั้น 6.8.5 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4 | แปลง id เป็นตัวเลข | เทียบกับ `userId` (ตัวเลข) ได้ และส่งให้ loadResults |
| 6 | ผู้รับประเมินดูคนอื่น → 403 | - |
| 7-10 | กรรมการต้องได้รับมอบหมายคนนี้ | - |
| 12-16 | หาผู้รับประเมิน (ต้องเป็นบทบาท evaluatee) | ขอ id ของกรรมการหรือ hr = 404 |
| 18 | คำนวณผลของคนเดียว แล้วหยิบผลของ id นี้ | ใช้ฟังก์ชันเดียวกับรายงานทั้งหมด |
| 21-28 | **ถ้าเป็นเจ้าตัว:** กรรมการที่ยังไม่ยืนยัน → ลบความเห็น ลายเซ็น และคะแนนออก | คะแนนร่างยังเปลี่ยนได้ ถ้าให้เห็นแล้วกรรมการแก้ทีหลังจะเกิดปัญหา (เกณฑ์ 5.2.9) |

🧩 **Syntax ใหม่: `continue` และ `delete`**

| คำ | ทำอะไร |
|---|---|
| `continue` | ข้ามไปรอบถัดไปของลูปทันที (บรรทัดที่เหลือในรอบนี้ไม่ทำ) |
| `delete obj[key]` | ลบช่องออกจาก object |

> 💡 `(await loadResults([id]))[id]` ต้องครอบ `await …` ด้วยวงเล็บก่อน แล้วค่อยหยิบ `[id]` (รอผลก่อน แล้วค่อยหยิบช่อง)

✅ **ลองเลย:**
- token ของ teach1 → `GET /api/reports/evaluatees/5` → 200, `summary.confirmed_count` = 1 (comm1) และ `assignments` ของ comm2 (draft) มี `summary_comment` เป็น null
- token ของ teach1 → `GET /api/reports/evaluatees/6` → **403** "ดูได้เฉพาะผลของตนเอง"

### ขั้นที่ 6.8.5 รายงานของกรรมการ

> 🎯 **ขั้นนี้จะได้:** hr ติดตามสถานะงานของกรรมการแต่ละคน และดูตารางคะแนนรายกรรมการ (เกณฑ์ 5.1.10, 5.1.11)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 6.8.5 จะเขียนต่อตรงนี้)`

```js
// GET /api/reports/committees  ติดตามสถานะการประเมินของกรรมการแต่ละคน
router.get("/committees", requireRole("hr"), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.position, u.department,
            COUNT(a.id) AS total,
            COALESCE(SUM(a.status = 'pending'), 0) AS pending,
            COALESCE(SUM(a.status = 'draft'), 0) AS draft,
            COALESCE(SUM(a.status = 'confirmed'), 0) AS confirmed
     FROM users u LEFT JOIN assignments a ON a.committee_id = u.id
     WHERE u.role = 'committee'
     GROUP BY u.id ORDER BY u.id`
  );
  ok(res, rows);
});

// GET /api/reports/committees/:id  สรุปการประเมินรายกรรมการ (ตัวชี้วัด x ผู้รับประเมิน)
router.get("/committees/:id", requireRole("hr"), async (req, res) => {
  const [users] = await pool.query(
    "SELECT id, full_name, position, department FROM users WHERE id = ? AND role = 'committee'",
    [req.params.id]
  );
  if (!users[0]) return fail(res, 404, "ไม่พบกรรมการ");

  const indicators = await loadIndicators();
  const [assignments] = await pool.query(
    `SELECT a.id, a.evaluatee_id, a.committee_role, a.status, a.summary_comment, a.confirmed_at, e.full_name AS evaluatee_name
     FROM assignments a JOIN users e ON e.id = a.evaluatee_id
     WHERE a.committee_id = ? ORDER BY a.id`,
    [req.params.id]
  );
  const [scores] = await pool.query(
    "SELECT s.assignment_id, s.indicator_id, s.score FROM committee_scores s JOIN assignments a ON a.id = s.assignment_id WHERE a.committee_id = ?",
    [req.params.id]
  );

  const rows = assignments.map((a) => {
    const mine = Object.fromEntries(scores.filter((s) => s.assignment_id === a.id).map((s) => [s.indicator_id, s.score]));
    return { ...a, scores: mine, total: sum(indicators.map((i) => weighted(mine[i.id], i))) };
  });
  ok(res, { committee: users[0], indicators, rows });
});
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4-8 | ต่อกรรมการ 1 คน: นับงานทั้งหมด และนับแยกตามสถานะ | ตาราง "ติดตามสถานะกรรมการ" (เกณฑ์ 5.1.11) |
| 9 | `LEFT JOIN` | กรรมการที่ยังไม่มีงานเลยก็แสดง (นับ 0) |
| 18-22 | หากรรมการ ไม่พบ 404 | - |
| 25-30 | งานทั้งหมดของกรรมการคนนี้ + ชื่อผู้รับประเมิน | แถวของตาราง |
| 31-34 | คะแนนทั้งหมดที่กรรมการคนนี้ให้ | - |
| 36-39 | ต่อผู้รับประเมิน 1 คน: คะแนนรายตัวชี้วัด และคะแนนรวมถ่วงน้ำหนัก | ตาราง "ตัวชี้วัด × ผู้รับประเมิน" |

🧩 **Syntax ใหม่ (SQL): `SUM(เงื่อนไข)` และ `COALESCE`**

| เขียน | ทำอะไร |
|---|---|
| `a.status = 'pending'` | ได้ 1 (จริง) หรือ 0 (เท็จ) |
| `SUM(a.status = 'pending')` | รวม 1 ทั้งหมด = **นับแถวที่เป็น pending** |
| `COALESCE(x, 0)` | ถ้า x เป็น NULL ใช้ 0 (กรรมการที่ไม่มีงานเลย SUM ได้ NULL) |

✅ **ลองเลย:** (token ของ hr) `GET /api/reports/committees` → 3 แถว comm1: total 3 / `GET /api/reports/committees/2` → ตารางของ comm1

<details>
<summary>📄 ไฟล์ routes/reports.js ฉบับสมบูรณ์ (กดดูไว้เทียบ)</summary>

ไฟล์จริงในโปรเจกต์: [backend/routes/reports.js](../../backend/routes/reports.js)
ฉบับสมบูรณ์มีเพิ่มจากบทนี้ 2 จุด (เพิ่มในบท 11): import `average`, `percent`, `findDataIssues` และ route `GET /overview` สำหรับ Dashboard

</details>

## 6.9 ทดสอบรวม

### ขั้นที่ 6.9.1 ทดสอบฝั่งผู้รับการประเมิน

> 🎯 **ขั้นนี้จะได้:** มั่นใจว่า API ของผู้รับการประเมินครบ

> 💡 ไม่ต้องรีเซ็ตฐานข้อมูล login เป็น **teach3**

| # | ทดสอบ | ต้องได้ |
|---|---|---|
| 1 | GET `/api/self-evaluations` | 200 หัวข้อ > ตัวชี้วัด + `summary.progress` = 0 |
| 2 | PUT `/api/self-evaluations/2` `{"score":3}` | 200 |
| 3 | PUT `/api/self-evaluations/3` `{"score":3}` (ตัวชี้วัดแบบ มี/ไม่มี) | 400 "คะแนนต้องเป็น 1 (มี) หรือ 0 (ไม่มี)" |
| 4 | POST `/api/self-evaluations/1/evidences` แบบ **Form**: `description`=แผนการสอน, `file`=ไฟล์ PDF | 201 |
| 5 | เหมือนข้อ 4 แต่แนบไฟล์ .txt | 400 "รองรับเฉพาะไฟล์ PDF, JPG และ PNG" |
| 6 | POST `/api/self-evaluations/6/evidences` `description`=x, `url`=abc | 400 "URL ต้องขึ้นต้นด้วย…" |
| 7 | GET `/api/evidences/{id ข้อ 4}/file` | ได้ไฟล์ PDF |
| 8 | login `teach1` แล้ว GET ไฟล์ของข้อ 4 | 403 |

### ขั้นที่ 6.9.2 ทดสอบฝั่งกรรมการ และรายงาน

> 🎯 **ขั้นนี้จะได้:** มั่นใจว่า API ของกรรมการและรายงานครบ

**กรรมการ** (login `comm1`) งานทดสอบยืนยันไปแล้วในขั้น 6.7.8 ก่อนเริ่มให้ใช้ token ของ hr DELETE `/api/assignments/(งานทดสอบ)` แล้ว POST มอบหมายใหม่แบบเดิม จะได้ **งานทดสอบ** id ใหม่ที่สถานะ `pending`

| # | ทดสอบ | ต้องได้ |
|---|---|---|
| 9 | GET `/api/committee/assignments` | 200 รายการงาน 3 คน |
| 10 | GET `/api/committee/assignments/5` (งานของ comm2) | 404 |
| 11 | PUT `/api/committee/assignments/(งานทดสอบ)/scores` `{"scores":[{"indicator_id":1,"score":4}],"summary_comment":"ดี"}` | 200 สถานะเป็น draft |
| 12 | PUT `/api/committee/assignments/(งานทดสอบ)/confirm` `{"signature":"data:image/png;base64,iVBORw0KGgo="}` | 400 "ยังให้คะแนนไม่ครบ (1/6 ตัวชี้วัด)" |
| 13 | ให้คะแนนครบ 6 ข้อ แล้ว confirm | 200 |
| 14 | PUT scores อีกครั้ง | 400 "ยืนยันผลแล้ว แก้ไขไม่ได้" |

**รายงาน**

| # | ทดสอบ | ต้องได้ |
|---|---|---|
| 15 | hr: GET `/api/reports/evaluatees?sort=score` | 200 คนที่มีผลยืนยันอยู่บน |
| 16 | teach1: GET `/api/reports/evaluatees/6` | 403 |
| 17 | comm2: GET `/api/reports/evaluatees/(id ของ teach3)` (ไม่ได้รับมอบหมาย) | 403 "ไม่ได้รับมอบหมายให้ประเมินผู้นี้" |

✅ **ผ่านเมื่อ:** ครบ 17 ข้อ กด Save เข้า Collection `Eva`

🧹 **เก็บกวาด:** ใช้ token ของ hr DELETE `/api/users/(id ของ teach3)` งานทดสอบและคะแนนของ teach3 จะถูกลบตาม เหลือเฉพาะข้อมูลจริงไว้ใช้ในบทต่อไป **ห้ามรีเซ็ตฐานข้อมูล**

---

## ❗ ปัญหาที่พบบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| คะแนนรวมเป็นข้อความต่อกัน `"20.0015.00"` | ลืม `decimalNumbers: true` ใน db.js | ใส่แล้วรีสตาร์ท (บท 03 ขั้น 3.7.4) |
| คะแนน 0 หายไปจากค่าเฉลี่ย | ใช้ `if (score)` หรือ `score \|\| null` | ใช้ `score != null` และ `??` |
| อัปโหลดแล้ว `req.files` undefined | ส่งเป็น JSON ไม่ใช่ form-data | Thunder Client → Body → Form → ติ๊ก Files |
| ชื่อไฟล์ภาษาไทยเพี้ยน | ไม่ได้ตั้ง `defParamCharset: "utf8"` | ตรวจ app.js (บท 05 ขั้น 5.4.1) |
| `ENOENT … uploads` | ไม่มีโฟลเดอร์ uploads | สร้าง `backend/uploads/` (บท 01 ขั้น 1.6.3) |
| ให้คะแนนแล้ว error `Check constraint` | คะแนนเกิน 0-4 | `isValidScore` ต้องตรวจก่อนบันทึก |
| ได้ "หัวข้อนี้ไม่อยู่ในช่วงเวลาการประเมิน" | วันที่ของหัวข้อไม่ครอบคลุมวันนี้ | แก้ช่วงวันด้วย `PUT /api/topics/:id` หรือผ่านหน้า hr |
| ระบบค้างหลังบันทึกร่างไปหลายครั้ง | ลืม `conn.release()` | ใส่ใน `finally` |
| `ER_PARSE_ERROR` ที่ `IN ()` | ส่ง array ว่างให้ `IN (?)` | ตรวจ `if (!ids.length) return …` ก่อน |
| `Cannot read properties of undefined (reading 'summary')` | เรียก `results[id]` ด้วย id ที่เป็นข้อความ | แปลงด้วย `Number(...)` ก่อน |

---

⬅️ [บทที่ 05](05-api-hr.md) | ➡️ [บทที่ 07: Frontend พื้นฐานและหน้า Login](07-frontend-basics.md)
