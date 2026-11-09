# บทที่ 12: การทดสอบ

## เป้าหมาย

เรียนจบบทนี้แล้ว นักเรียนจะ
- เขียน **Unit Test** ทดสอบฟังก์ชันคำนวณ เรียงข้อมูล และตรวจข้อมูล ด้วย `node --test` (ไม่ต้องลง package เพิ่ม)
- เขียน **API Test** ทดสอบ Login, เพิ่ม, อ่าน, แก้ไข, ลบ แบบอัตโนมัติ
- ตรวจ Console/Network ด้วย DevTools และทดสอบ Responsive

🏆 ส่วนที่ 7 (เฉพาะที่อยู่ในบทนี้ 10 คะแนน)

| ข้อ | เรื่อง | คะแนน | อยู่ที่ |
|---|---|---|---|
| 7.1 | ทดสอบ Login ถูก/ผิด | 1 | 12.7.3 |
| 7.2 | ทดสอบ Insert | 1 | 12.7.5 |
| 7.3 | ทดสอบ Update | 1 | 12.7.6 |
| 7.4 | Validate ข้อมูลก่อนส่ง (ช่องว่าง/อีเมล/ความยาว) | 1 | 12.6 |
| 7.5 | ทดสอบฟังก์ชันเฉพาะจุด (คำนวณคะแนน, เรียงข้อมูล) | 1 | 12.3, 12.4 |
| 7.6 | ทดสอบ Service API อย่างน้อย 3 รายการ | 1 | 12.7, 12.9 |
| 7.7 | Console/Network ไม่มี Error | 1 | 12.10 |
| 7.10 | Responsive (มือถือ + Desktop) | 3 | 12.11 |

(7.8 GitLab และ 7.9 เครื่องแม่ข่าย อยู่บท 13)

⏱️ ครั้งแรกที่เรียน: ประมาณ **4 ชั่วโมง** | วันแข่ง (เมื่อคล่องแล้ว): **30 นาที**

### บทนี้แบ่งเป็นขั้นเล็กๆ

| ภาค | ทำอะไร | จำนวนขั้น |
|---|---|---|
| ภาค ก (12.1) | Unit Test และ API Test คืออะไร | 2 ขั้น |
| ภาค ข (12.2-12.12) | เขียนเทส และทดสอบด้วยมือ | 28 ขั้น |

### ไฟล์ที่จะสร้างในบทนี้

```
backend/tests/
├── score.test.js      ← ขั้น 12.3  คำนวณคะแนน (7.5)
├── sort.test.js       ← ขั้น 12.4  เรียงข้อมูล (7.5)
├── password.test.js   ← ขั้น 12.5  hash รหัสผ่าน
├── validate.test.js   ← ขั้น 12.6  ตรวจข้อมูล (7.4, 8.2)
└── api.test.js        ← ขั้น 12.7  API (7.1, 7.2, 7.3, 7.6)
```

---

# ภาค ก: หลักการ

## 12.1 การทดสอบด้วยโค้ด

### ขั้นที่ 12.1.1 Unit Test คืออะไร

> 🎯 **ขั้นนี้จะได้:** เข้าใจว่าเทสคือ "โค้ดที่ตรวจโค้ด"

📖 **Unit Test** = โค้ดที่เรียกฟังก์ชันของเรา แล้วตรวจว่าได้ผลตามที่คาดไว้ รันซ้ำได้ทุกครั้งที่แก้โค้ด รู้ทันทีว่าอะไรพัง

```text
เรียกฟังก์ชัน          ผลที่ได้     ผลที่คาด     สรุป
weighted(3, สเกล 40)  →   30     ==   30     →  ✔ ผ่าน
weighted(3, สเกล 40)  →   40     ==   30     →  ✖ ไม่ผ่าน (มีคนแก้สูตรผิด)
```

💡 **ทำไมฟังก์ชันใน `utils/score.js` ทดสอบง่าย?** เพราะไม่ยุ่งกับฐานข้อมูล ใส่ค่าเข้า ได้ค่าออก เสมอ (เรียกว่า **pure function**) นี่คือเหตุผลที่บท 06 แยกการคำนวณออกจาก route

**เครื่องมือมากับ Node.js แล้ว** (โจทย์ห้ามใช้ vitest)

| ของ | มาจาก | ใช้ทำอะไร |
|---|---|---|
| `test("ชื่อ", ฟังก์ชัน)` | `node:test` | 1 กรณีทดสอบ |
| `describe("ชื่อกลุ่ม", ฟังก์ชัน)` | `node:test` | จัดกลุ่มเทสที่เกี่ยวกัน |
| `assert.equal(ได้, คาด)` | `node:assert/strict` | ต้องเท่ากัน (`===`) |
| `assert.notEqual(ได้, คาด)` | `node:assert/strict` | ต้องไม่เท่ากัน |
| `assert.deepEqual(ได้, คาด)` | `node:assert/strict` | object/array หน้าตาเหมือนกันทุกช่อง |
| `assert.match(ข้อความ, /regex/)` | `node:assert/strict` | ข้อความตรงรูปแบบ |
| `npm test` | script ใน package.json (บท 01) | รัน `node --test "tests/*.test.js"` ทุกไฟล์ |

### ขั้นที่ 12.1.2 API Test ต่างจาก Unit Test อย่างไร

> 🎯 **ขั้นนี้จะได้:** รู้ว่าเทสแบบไหนต้องเปิดฐานข้อมูล

| | Unit Test | API Test |
|---|---|---|
| ทดสอบ | ฟังก์ชัน 1 ตัว | URL ของ API ทั้งเส้นทาง (route → middleware → ฐานข้อมูล) |
| ต้องเปิด MySQL | ไม่ต้อง | **ต้อง** (`docker compose up -d`) |
| ไฟล์ | score, sort, password, validate | api.test.js |
| เปิด server | ไม่ | เปิดเองใน port สุ่ม (ไม่ชนกับ `npm run dev`) |

📖 **API Test เปิด server เองได้อย่างไร?** บท 03 แยก `app.js` (ตัว Express) ออกจาก `server.js` (สั่งเปิด port 5000) ไฟล์เทสจึง `import app` มาเปิด port ของตัวเองได้

---

# ภาค ข: เขียนเทส

## 12.2 เตรียมรันเทส

### ขั้นที่ 12.2.1 ตรวจ script และสร้างโฟลเดอร์

> 🎯 **ขั้นนี้จะได้:** สั่ง `npm test` ได้

📖 ใน `backend/package.json` มี script นี้แล้วตั้งแต่บท 01

```json
"test": "node --test \"tests/*.test.js\""
```

| ส่วน | ความหมาย |
|---|---|
| `node --test` | ตัวรันเทสที่มากับ Node.js |
| `"tests/*.test.js"` | ทุกไฟล์ในโฟลเดอร์ tests ที่ลงท้าย `.test.js` (`*` = อะไรก็ได้) |
| `\"` | เครื่องหมายคำพูดซ้อนใน JSON | 

⌨️ **ทำ:** สร้างโฟลเดอร์ `backend/tests`

> ⚠️ Node 24 เขียนแค่ `node --test tests/` (ชื่อโฟลเดอร์) ไม่ได้ จะ error `Cannot find module` ต้องใช้แบบมี `*.test.js`

## 12.3 Unit Test: คำนวณคะแนน (เกณฑ์ 7.5)

### ขั้นที่ 12.3.1 เทสแรก: ผลรวม ค่าเฉลี่ย เปอร์เซ็นต์

> 🎯 **ขั้นนี้จะได้:** ไฟล์เทสแรก และเห็นผล ✔ ครั้งแรก

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/tests/score.test.js`

```js
// ทดสอบฟังก์ชันคำนวณคะแนน (เกณฑ์ 7.5) รัน: npm test
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { sum, average, percent, weighted, isValidScore, indicatorProgress, buildResult } from "../utils/score.js";

const scale = { id: 1, weight: 40, score_type: "scale_4", evidence_type: "file" };
const yesNo = { id: 2, weight: 60, score_type: "yes_no", evidence_type: "none" };

describe("sum / average / percent", () => {
  test("sum ปัดทศนิยม 2 ตำแหน่ง", () => {
    assert.equal(sum([0.1, 0.2]), 0.3);
    assert.equal(sum([]), 0);
  });
  test("average ไม่นับค่าว่าง และคืน null ถ้าไม่มีค่า", () => {
    assert.equal(average([4, null, 2]), 3);
    assert.equal(average([null, undefined]), null);
  });
  test("percent หารด้วย 0 ได้ 0", () => {
    assert.equal(percent(1, 3), 33.33);
    assert.equal(percent(5, 0), 0);
  });
});

// (ขั้น 12.3.2 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | ดึง `test` และ `describe` จากตัวรันเทส | - |
| 3 | ดึง `assert` แบบ strict | `equal` เทียบด้วย `===` (ชนิดต้องตรงด้วย) |
| 4 | ดึงฟังก์ชันที่จะทดสอบ (`../` = ถอยออกจาก tests ไป backend) | - |
| 6-7 | **ตัวชี้วัดตัวอย่าง** 2 แบบ น้ำหนัก 40 + 60 = 100 | ใช้ซ้ำหลายเทส |
| 9 | กลุ่มเทส | ผลลัพธ์แสดงเป็นกลุ่ม อ่านง่าย |
| 10-13 | `0.1 + 0.2` ใน JavaScript ได้ `0.30000000000000004` ฟังก์ชัน `sum` ต้องปัดให้เป็น 0.3 | กันคะแนนรวมแสดงทศนิยมยาว |
| 14-17 | ค่าเฉลี่ยไม่นับ null, ไม่มีค่าเลย → null | กรรมการยังไม่ให้คะแนนต้องไม่ถูกนับเป็น 0 |
| 18-21 | หารศูนย์ต้องได้ 0 ไม่ใช่ `NaN`/`Infinity` | ระบบไม่มีตัวชี้วัดก็ไม่พัง |

🧩 **Syntax ใหม่: test และ assert**

```syntax
[p:describe][s:(][v:"ชื่อกลุ่ม"][s:,] [s:() => {]
  [p:test][s:(][v:"ชื่อกรณี"][s:,] [s:() => {]
    [p:assert][s:.][p:equal][s:(][v:ค่าที่ได้][s:,] [v:ค่าที่คาด][s:);]
  [s:});]
[s:});]
```

| คำ | สี | ความหมาย |
|---|---|---|
| `describe` | 🟣 | กลุ่ม (มีหรือไม่มีก็ได้) |
| `test` | 🟣 | 1 กรณี ชื่อควรบอกว่า "ทดสอบเรื่องอะไร คาดว่าเป็นอย่างไร" |
| `assert.equal(ได้, คาด)` | 🟣 | ไม่เท่ากัน → เทสนี้ ✖ |

**จำ:** 1 test มี assert ได้หลายบรรทัด ผ่านทุกบรรทัดถึงจะ ✔

✅ **ลองเลย:** Terminal ในโฟลเดอร์ `backend` พิมพ์ `npm test` ต้องเห็น ✔ 3 บรรทัด และท้ายสุด `ℹ pass 3`

### ขั้นที่ 12.3.2 คะแนนถ่วงน้ำหนัก

> 🎯 **ขั้นนี้จะได้:** ทดสอบสูตรหลักของระบบ

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 12.3.2 จะเขียนต่อตรงนี้)`

```js
describe("weighted คะแนนถ่วงน้ำหนัก", () => {
  test("สเกล 1-4: (คะแนน / 4) x น้ำหนัก", () => {
    assert.equal(weighted(4, scale), 40);
    assert.equal(weighted(3, scale), 30);
    assert.equal(weighted(1, scale), 10);
  });
  test("มี/ไม่มี: มี = เต็มน้ำหนัก, ไม่มี = 0", () => {
    assert.equal(weighted(1, yesNo), 60);
    assert.equal(weighted(0, yesNo), 0);
  });
  test("ยังไม่ได้ให้คะแนน = 0", () => {
    assert.equal(weighted(null, scale), 0);
  });
});

// (ขั้น 12.3.3 จะเขียนต่อตรงนี้)
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3-5 | สเกล: 4 → เต็ม 40, 3 → 30, 1 → 10 | ตรวจสูตร (คะแนน ÷ 4) × น้ำหนัก |
| 8-9 | มี → 60 เต็ม, ไม่มี → 0 | - |
| 12 | ยังไม่ให้คะแนน → 0 | ไม่ได้ `NaN` |

✅ **ลองเลย:** `npm test` → pass 6

💡 **ลองให้เทสจับผิด:** แก้ `utils/score.js` ให้หาร 5 แทน 4 แล้ว `npm test` จะเห็น

```text
✖ สเกล 1-4: (คะแนน / 4) x น้ำหนัก
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  32 !== 40
```

อ่านว่า "ได้ 32 แต่คาดว่า 40" แล้ว **แก้กลับเป็น 4**

### ขั้นที่ 12.3.3 ตรวจช่วงคะแนน และความคืบหน้า

> 🎯 **ขั้นนี้จะได้:** ทดสอบกรณีขอบ (ค่าน้อยสุด มากสุด เกินช่วง)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 12.3.3 จะเขียนต่อตรงนี้)`

```js
describe("isValidScore ตรวจช่วงคะแนนตามรูปแบบ", () => {
  test("มี/ไม่มี รับเฉพาะ 0 และ 1", () => {
    assert.equal(isValidScore(0, "yes_no"), true);
    assert.equal(isValidScore(1, "yes_no"), true);
    assert.equal(isValidScore(2, "yes_no"), false);
  });
  test("สเกล รับ 1-4 และต้องเป็นจำนวนเต็ม", () => {
    assert.equal(isValidScore(1, "scale_4"), true);
    assert.equal(isValidScore(4, "scale_4"), true);
    assert.equal(isValidScore(0, "scale_4"), false);
    assert.equal(isValidScore(5, "scale_4"), false);
    assert.equal(isValidScore(2.5, "scale_4"), false);
  });
});

describe("indicatorProgress ความคืบหน้ารายตัวชี้วัด", () => {
  test("ต้องแนบหลักฐาน: มีคะแนน + หลักฐาน = 100, มีแค่คะแนน = 50", () => {
    assert.equal(indicatorProgress(scale, 3, 1), 100);
    assert.equal(indicatorProgress(scale, 3, 0), 50);
    assert.equal(indicatorProgress(scale, null, 0), 0);
  });
  test("ไม่ต้องแนบหลักฐาน: มีคะแนนก็ครบ", () => {
    assert.equal(indicatorProgress(yesNo, 0, 0), 100);
  });
});

// (ขั้น 12.3.4 จะเขียนต่อตรงนี้)
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 8-9 | ขอบล่างและขอบบนของสเกลต้องผ่าน | - |
| 10-11 | เลยขอบไป 1 ต้องไม่ผ่าน | **กรณีขอบ** คือจุดที่โค้ดผิดบ่อยที่สุด |
| 12 | ทศนิยมต้องไม่ผ่าน | - |
| 18-20 | ตัวชี้วัดแบบต้องแนบไฟล์ (`scale` มี `evidence_type: "file"`): ครบ 2 อย่าง = 100, คะแนนอย่างเดียว = 50, ไม่มีอะไร = 0 | ตรงกับแถบความคืบหน้าบท 09 |
| 23 | ไม่ต้องแนบ: มีคะแนน (แม้ได้ 0) = 100 | คะแนน 0 ก็นับว่ากรอกแล้ว |

### ขั้นที่ 12.3.4 สรุปผลรายบุคคล: เตรียมข้อมูลตัวอย่าง

> 🎯 **ขั้นนี้จะได้:** ข้อมูลจำลองกรรมการ 3 คน (ยืนยัน 2 ร่าง 1)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 12.3.4 จะเขียนต่อตรงนี้)`

```js
describe("buildResult สรุปผลผู้รับการประเมิน", () => {
  const selfData = { 1: { score: 3, evidence_count: 1 }, 2: { score: 1, evidence_count: 0 } };
  const assignments = [
    { id: 10, status: "confirmed" },
    { id: 11, status: "confirmed" },
    { id: 12, status: "draft" },
  ];
  const scores = [
    { assignment_id: 10, indicator_id: 1, score: 4 },
    { assignment_id: 10, indicator_id: 2, score: 1 },
    { assignment_id: 11, indicator_id: 1, score: 2 },
    { assignment_id: 11, indicator_id: 2, score: 0 },
    { assignment_id: 12, indicator_id: 1, score: 1 }, // ร่าง ไม่นำมาคิด
  ];

  // (ขั้น 12.3.5 จะเขียนต่อตรงนี้)
});
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | คะแนนตนเอง: ตัวชี้วัด 1 ให้ 3 แนบ 1 ไฟล์, ตัวชี้วัด 2 ให้ "มี" | - |
| 3-7 | กรรมการ 3 คน ยืนยันแล้ว 2 (id 10, 11) ร่าง 1 (id 12) | - |
| 8-14 | คะแนนของกรรมการแต่ละคน | - |
| 13 | คะแนนของกรรมการที่ยังร่าง **ต้องไม่ถูกนับ** | เทสข้อนี้คือเหตุผลที่ใส่ข้อมูลร่างไว้ |

📖 **คิดคำตอบก่อนเขียนเทส** (ตัวชี้วัด 1 สเกล น้ำหนัก 40, ตัวชี้วัด 2 มี/ไม่มี น้ำหนัก 60)
- ตัวชี้วัด 1: กรรมการที่ยืนยันให้ 4 และ 2 → เฉลี่ย 3 → (3 ÷ 4) × 40 = **30**
- ตัวชี้วัด 2: ให้ 1 และ 0 → เฉลี่ย 0.5 → 0.5 × 60 = **30**
- รวม 60 จาก 100 = **60%**

### ขั้นที่ 12.3.5 สรุปผลรายบุคคล: ตรวจผล

> 🎯 **ขั้นนี้จะได้:** score.test.js ครบ

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 12.3.5 จะเขียนต่อตรงนี้)`

```js
  test("ใช้ค่าเฉลี่ยจากกรรมการที่ยืนยันแล้วเท่านั้น", () => {
    const { rows, summary } = buildResult([scale, yesNo], selfData, assignments, scores);
    assert.equal(rows[0].avg_score, 3); // (4 + 2) / 2
    assert.equal(rows[0].committee_weighted, 30);
    assert.equal(rows[1].avg_score, 0.5); // (1 + 0) / 2
    assert.equal(rows[1].committee_weighted, 30);
    assert.equal(summary.committee_total, 60);
    assert.equal(summary.committee_percent, 60);
    assert.equal(summary.confirmed_count, 2);
    assert.equal(summary.committee_count, 3);
  });

  test("คะแนนตนเองและความคืบหน้า", () => {
    const { summary } = buildResult([scale, yesNo], selfData, assignments, scores);
    assert.equal(summary.self_total, 90); // 30 + 60
    assert.equal(summary.total_weight, 100);
    assert.equal(summary.filled, 2);
    assert.equal(summary.progress, 100);
  });

  test("ยังไม่มีกรรมการยืนยัน: คะแนนกรรมการเป็น null", () => {
    const { summary } = buildResult([scale, yesNo], {}, [{ id: 12, status: "draft" }], scores);
    assert.equal(summary.committee_total, null);
    assert.equal(summary.committee_percent, null);
    assert.equal(summary.progress, 0);
  });
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | เรียกฟังก์ชันจริง แล้วแกะ `rows` กับ `summary` | - |
| 3-6 | ตรวจคำตอบที่คิดไว้ในขั้น 12.3.4 ทีละตัวชี้วัด | - |
| 7-8 | รวม 60 = 60% | - |
| 9-10 | ยืนยัน 2 จากกรรมการทั้งหมด 3 | - |
| 15 | คะแนนตนเอง: (3 ÷ 4) × 40 + 60 = 90 | - |
| 17-18 | กรอกครบ 2 ตัว ความคืบหน้า 100% | - |
| 22 | ไม่มีคะแนนตนเอง (`{}`) และกรรมการมีแต่ร่าง | - |
| 23-24 | คะแนนกรรมการต้องเป็น **null** ไม่ใช่ 0 | หน้าเว็บแสดง "-" แทน "0%" (ยังไม่มีผล ≠ ได้ 0) |

✅ **ลองเลย:** `npm test` → pass 13

## 12.4 Unit Test: เรียงข้อมูล (เกณฑ์ 7.5)

### ขั้นที่ 12.4.1 ข้อมูลตัวอย่าง และตัวช่วยอ่านผล

> 🎯 **ขั้นนี้จะได้:** ข้อมูลที่มีทั้งค่าว่างและชื่อภาษาไทย

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/tests/sort.test.js`

```js
// ทดสอบการเรียงข้อมูล (เกณฑ์ 7.5)
import { test } from "node:test";
import assert from "node:assert/strict";
import { sortBy } from "../utils/score.js";

const list = [
  { name: "ข", score: 70 },
  { name: "ก", score: null },
  { name: "ค", score: 90 },
  { name: "ง", score: 80 },
];
const names = (rows) => rows.map((r) => r.name).join("");

// (ขั้น 12.4.2 จะเขียนต่อตรงนี้)
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 6-11 | 4 แถว **ไม่เรียง** และมีคะแนนว่าง 1 คน | ทดสอบครบทุกกรณี |
| 12 | แปลงผลลัพธ์เป็นข้อความชื่อต่อกัน `"คงขก"` | เทียบลำดับด้วย `equal` บรรทัดเดียว อ่านง่ายกว่าเทียบ array |

> 🧩 syntax: `.join("")` = ต่อทุกตัวใน array เป็นข้อความเดียว (`["ก", "ข"]` → `"กข"`)

### ขั้นที่ 12.4.2 ทดสอบการเรียง 4 กรณี

> 🎯 **ขั้นนี้จะได้:** sort.test.js ครบ

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 12.4.2 จะเขียนต่อตรงนี้)`

```js
test("เรียงคะแนนมากไปน้อย ค่าว่างไว้ท้าย", () => {
  assert.equal(names(sortBy(list, "score", "desc")), "คงขก");
});

test("เรียงคะแนนน้อยไปมาก ค่าว่างยังอยู่ท้าย", () => {
  assert.equal(names(sortBy(list, "score")), "ขงคก");
});

test("เรียงตามชื่อภาษาไทย ก-ฮ", () => {
  assert.equal(names(sortBy(list, "name")), "กขคง");
});

test("ไม่แก้ไข array เดิม", () => {
  sortBy(list, "score", "desc");
  assert.equal(names(list), "ขกคง");
});
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | มากไปน้อย: ค 90, ง 80, ข 70, ก (ว่าง) ท้ายสุด | อันดับคะแนน |
| 6 | น้อยไปมาก: ข 70, ง 80, ค 90 **ก ยังอยู่ท้าย** | คนที่ยังไม่มีคะแนนต้องไม่ขึ้นก่อน |
| 10 | เรียงชื่อภาษาไทย ก ข ค ง ได้ถูก (เทียบด้วย `>` `<` บท 06 ขั้น 6.3.5) | พยัญชนะไทยเรียงตามรหัสตัวอักษรอยู่แล้ว |
| 14-15 | เรียงแล้ว `list` ต้นฉบับต้องเหมือนเดิม | กันบั๊กที่ข้อมูลเปลี่ยนลำดับเอง |

> 🧩 syntax: ไม่มี `describe` ก็ได้ (ไฟล์เล็ก) เทสจะแสดงแบบไม่จัดกลุ่ม

✅ **ลองเลย:** `npm test` → pass 17

## 12.5 Unit Test: hash รหัสผ่าน

### ขั้นที่ 12.5.1 ทดสอบ hashPassword และ verifyPassword

> 🎯 **ขั้นนี้จะได้:** พิสูจน์ว่ารหัสผ่านเก็บเป็น hash จริง

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/tests/password.test.js`

```js
// ทดสอบการ hash รหัสผ่านด้วย crypto.scrypt
import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../utils/password.js";

test("เก็บเป็น hash ไม่ใช่รหัสผ่านจริง และ hash ซ้ำได้ค่าไม่เหมือนเดิม (salt)", async () => {
  const a = await hashPassword("123456");
  const b = await hashPassword("123456");
  assert.equal(a.includes("123456"), false);
  assert.notEqual(a, b);
});

test("ตรวจรหัสผ่านถูก/ผิด", async () => {
  const stored = await hashPassword("123456");
  assert.equal(await verifyPassword("123456", stored), true);
  assert.equal(await verifyPassword("654321", stored), false);
});
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 6 | ฟังก์ชันเทสเป็น `async` | hash ต้อง `await` (บท 04 ขั้น 4.2) |
| 9 | ใน hash ต้องไม่มีรหัสผ่านจริงปนอยู่ | - |
| 10 | hash รหัสเดียวกัน 2 ครั้ง ต้อง **ไม่เหมือนกัน** | พิสูจน์ว่ามี salt สุ่ม |
| 15-16 | รหัสถูก → true, ผิด → false | หลักของการ login |

✅ **ลองเลย:** `npm test` → pass 19

## 12.6 Unit Test: ตรวจข้อมูล (เกณฑ์ 7.4, 8.2)

### ขั้นที่ 12.6.1 ส่วนหัว และตัวช่วยดึงข้อความ error

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชันสั้นๆ ที่ตอบว่า "ข้อมูลนี้ผิดเพราะอะไร"

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/tests/validate.test.js`

```js
// ทดสอบการตรวจข้อมูล (เกณฑ์ 7.4, 8.2): Zod schema, ไฟล์แนบ, ความครบถ้วนของข้อมูล
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { loginSchema } from "../schemas/auth.js";
import { userSchema } from "../schemas/user.js";
import { topicSchema } from "../schemas/topic.js";
import { indicatorSchema } from "../schemas/indicator.js";
import { evidenceSchema } from "../schemas/evaluation.js";
import { confirmSchema } from "../schemas/committee.js";
import { checkFile, checkAttachment } from "../utils/upload.js";
import { findDataIssues } from "../utils/dataCheck.js";

// คืนข้อความ error แรก (หรือ null ถ้าผ่าน)
const firstError = (schema, data) => schema.safeParse(data).error?.issues[0].message ?? null;

const user = { username: "teach9", full_name: "ครูทดสอบ", role: "evaluatee" };

// (ขั้น 12.6.2 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4-9 | schema ฝั่ง backend ทุกไฟล์ (บท 04-06) | ทดสอบกฎตรวจข้อมูลโดยไม่ต้องเปิด server |
| 10 | ตัวตรวจไฟล์แนบ (บท 06 ขั้น 6.4) | - |
| 11 | ตัวตรวจความครบถ้วน (บท 11) | เกณฑ์ 8.2 |
| 14 | ตรวจด้วย `safeParse` → มี error เอาข้อความแรก, ไม่มี → `null` | เทสเขียนแค่ `assert.equal(firstError(…), "ข้อความ")` |
| 16 | ผู้ใช้ที่ **ถูกต้อง** 1 คน | แต่ละเทสแก้แค่ช่องเดียวด้วย `{ ...user, ช่อง: ค่าผิด }` |

📖 **อ่านบรรทัด 14 ทีละส่วน**

| ส่วน | ได้อะไร |
|---|---|
| `schema.safeParse(data)` | `{ success, data }` หรือ `{ success: false, error }` (บท 04 ขั้น 4.3) |
| `.error?.issues[0].message` | ไม่มี error → `undefined` (ไม่พัง เพราะ `?.`), มี → ข้อความแรก |
| `?? null` | `undefined` → `null` | 

### ขั้นที่ 12.6.2 ตรวจช่องว่าง

> 🎯 **ขั้นนี้จะได้:** เทสกฎ "ต้องกรอก"

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 12.6.2 จะเขียนต่อตรงนี้)`

```js
describe("ตรวจช่องว่าง", () => {
  test("login ไม่กรอกชื่อผู้ใช้", () => {
    assert.equal(firstError(loginSchema, { password: "123456" }), "กรุณากรอกชื่อผู้ใช้");
  });
  test("ช่องว่างล้วนถือว่าไม่ได้กรอก (trim)", () => {
    assert.equal(firstError(userSchema, { ...user, full_name: "   " }), "กรุณากรอกชื่อ-สกุล");
  });
  test("ข้อมูลครบผ่าน และช่องไม่บังคับที่ว่างเป็น null", () => {
    const result = userSchema.safeParse({ ...user, email: "", position: "" });
    assert.equal(result.success, true);
    assert.equal(result.data.email, null);
    assert.equal(result.data.position, null);
  });
});

// (ขั้น 12.6.3 จะเขียนต่อตรงนี้)
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | ไม่ส่ง username เลย | - |
| 6 | พิมพ์แต่ช่องว่าง ต้องถือว่าไม่ได้กรอก | `.trim()` ในบท 05 ทำงานจริง |
| 9-12 | ช่องไม่บังคับที่ส่ง `""` ต้องกลายเป็น `null` | เก็บลงฐานข้อมูลเป็น NULL ไม่ใช่ข้อความว่าง |

### ขั้นที่ 12.6.3 ตรวจรูปแบบ

> 🎯 **ขั้นนี้จะได้:** เทสอีเมล เบอร์โทร ชื่อผู้ใช้ URL ลายเซ็น

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 12.6.3 จะเขียนต่อตรงนี้)`

```js
describe("ตรวจรูปแบบ", () => {
  test("อีเมลผิดรูปแบบ", () => {
    assert.equal(firstError(userSchema, { ...user, email: "abc@" }), "รูปแบบอีเมลไม่ถูกต้อง");
    assert.equal(firstError(userSchema, { ...user, email: "a@b.com" }), null);
  });
  test("เบอร์โทรต้องขึ้นต้นด้วย 0 และยาว 9-10 หลัก", () => {
    assert.notEqual(firstError(userSchema, { ...user, phone: "12345678" }), null);
    assert.equal(firstError(userSchema, { ...user, phone: "0812345678" }), null);
  });
  test("ชื่อผู้ใช้ห้ามมีภาษาไทยหรือช่องว่าง", () => {
    assert.equal(firstError(userSchema, { ...user, username: "ครู 1" }), "ชื่อผู้ใช้ใช้ได้เฉพาะ a-z, 0-9, _ และ .");
  });
  test("URL หลักฐานต้องเป็น http/https", () => {
    assert.notEqual(firstError(evidenceSchema, { description: "x", url: "ftp://a.com" }), null);
    assert.equal(firstError(evidenceSchema, { description: "x", url: "https://a.com" }), null);
  });
  test("ลายเซ็นต้องเป็นรูป PNG แบบ data URL", () => {
    assert.equal(firstError(confirmSchema, { signature: "hello" }), "กรุณาลงลายเซ็น");
    assert.equal(firstError(confirmSchema, { signature: "data:image/png;base64,iVBORw0KGgo=" }), null);
  });
});

// (ขั้น 12.6.4 จะเขียนต่อตรงนี้)
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3-4 | **คู่ผิด/ถูก**: ผิดต้องได้ข้อความ, ถูกต้องได้ null | ทดสอบทั้ง 2 ฝั่งของกฎ |
| 7 | `notEqual(…, null)` = "ต้องมี error" (ไม่สนว่าข้อความอะไร) | เบอร์โทรมีข้อความยาว ไม่ต้องพิมพ์ทั้งหมด |
| 14 | `ftp://` ต้องไม่ผ่าน | ป้องกันลิงก์แปลก |
| 18-19 | ลายเซ็นต้องเป็น data URL ของ PNG (บท 06 ขั้น 6.7.2) | - |

### ขั้นที่ 12.6.4 ตรวจความยาวและช่วงค่า

> 🎯 **ขั้นนี้จะได้:** เทสความยาวขั้นต่ำ ขั้นสูง ช่วงตัวเลข และวันที่

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 12.6.4 จะเขียนต่อตรงนี้)`

```js
describe("ตรวจความยาวและช่วงค่า", () => {
  test("ชื่อผู้ใช้สั้นกว่า 3 ตัว", () => {
    assert.equal(firstError(userSchema, { ...user, username: "ab" }), "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร");
  });
  test("ชื่อ-สกุลยาวเกิน 100 ตัว", () => {
    assert.equal(firstError(userSchema, { ...user, full_name: "ก".repeat(101) }), "ต้องไม่เกิน 100 ตัวอักษร");
  });
  test("น้ำหนักตัวชี้วัดต้องมากกว่า 0 และไม่เกิน 100 (รับตัวเลขที่เป็นข้อความได้)", () => {
    const ind = { topic_id: "1", name: "ตัวชี้วัด", score_type: "scale_4", evidence_type: "file" };
    assert.equal(firstError(indicatorSchema, { ...ind, weight: 0 }), "น้ำหนักต้องมากกว่า 0");
    assert.equal(firstError(indicatorSchema, { ...ind, weight: 101 }), "น้ำหนักต้องไม่เกิน 100");
    assert.equal(indicatorSchema.parse({ ...ind, weight: "20" }).weight, 20);
  });
  test("วันสิ้นสุดต้องไม่ก่อนวันเริ่ม", () => {
    const topic = { title: "หัวข้อ", start_date: "2026-12-01", end_date: "2026-11-01" };
    assert.equal(firstError(topicSchema, topic), "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม");
  });
});

// (ขั้น 12.6.5 จะเขียนต่อตรงนี้)
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 6 | `"ก".repeat(101)` = ข้อความ "ก" 101 ตัว | สร้างข้อความยาวโดยไม่ต้องพิมพ์เอง |
| 10-11 | น้ำหนัก 0 และ 101 ต้องไม่ผ่าน (กรณีขอบ) | - |
| 12 | ส่ง `"20"` (ข้อความ) ต้องได้ 20 (ตัวเลข) | `z.coerce` ในบท 05 แปลงให้ เพราะฟอร์มส่งมาเป็นข้อความ |
| 15-16 | วันสิ้นสุดก่อนวันเริ่ม | `.refine` ในบท 05 |

> 🧩 syntax: `schema.parse(x)` = ตรวจแล้วคืนข้อมูลที่แปลงแล้ว (ถ้าผิดจะ throw) ใช้ในเทสที่มั่นใจว่าผ่าน

### ขั้นที่ 12.6.5 ตรวจไฟล์แนบ

> 🎯 **ขั้นนี้จะได้:** เทสชนิดไฟล์ และการแนบตามที่ตัวชี้วัดกำหนด

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 12.6.5 จะเขียนต่อตรงนี้)`

```js
describe("ไฟล์และหลักฐานแนบ", () => {
  test("รับเฉพาะ PDF/JPG/PNG และนามสกุลต้องตรงกับชนิดไฟล์", () => {
    assert.equal(checkFile({ name: "ใบรับรอง.PDF", mimetype: "application/pdf" }), null);
    assert.notEqual(checkFile({ name: "virus.exe", mimetype: "application/octet-stream" }), null);
    assert.notEqual(checkFile({ name: "fake.pdf", mimetype: "image/png" }), null);
  });
  test("แนบตามชนิดหลักฐานของตัวชี้วัด", () => {
    assert.equal(checkAttachment("file", true, false), null);
    assert.equal(checkAttachment("file", false, true), "ตัวชี้วัดนี้ต้องแนบหลักฐานเป็นไฟล์");
    assert.equal(checkAttachment("url", true, false), "ตัวชี้วัดนี้ต้องแนบหลักฐานเป็น URL");
    assert.equal(checkAttachment("none", false, false), null);
    assert.equal(checkAttachment("any", true, true), "แนบได้รายการละ 1 อย่าง: ไฟล์ หรือ URL");
  });
});

// (ขั้น 12.6.6 จะเขียนต่อตรงนี้)
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | ชื่อภาษาไทย นามสกุลตัวใหญ่ `.PDF` ต้องผ่าน | - |
| 4 | ไฟล์ .exe ต้องไม่ผ่าน | - |
| 5 | **ปลอมนามสกุล** (ชื่อ .pdf แต่จริงเป็นรูป) ต้องไม่ผ่าน | - |
| 8-12 | `checkAttachment(ชนิดที่กำหนด, มีไฟล์ไหม, มี URL ไหม)` ทุกกรณี (บท 06 ขั้น 6.4.2) | - |

### ขั้นที่ 12.6.6 ตรวจความครบถ้วนของข้อมูล

> 🎯 **ขั้นนี้จะได้:** validate.test.js ครบ และทดสอบ findDataIssues จากบท 11

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 12.6.6 จะเขียนต่อตรงนี้)`

```js
describe("findDataIssues ตรวจความครบถ้วนของข้อมูล", () => {
  const topics = [{ id: 1, title: "การสอน" }];
  const indicators = [{ topic_id: 1, weight: 60 }, { topic_id: 1, weight: 40 }];
  const evaluatees = [{ id: 5, full_name: "ครู ก" }];

  test("ข้อมูลครบ ไม่มีคำเตือน", () => {
    const assignments = [{ evaluatee_id: 5, committee_role: "chair" }];
    assert.deepEqual(findDataIssues({ topics, indicators, evaluatees, assignments }), []);
  });
  test("น้ำหนักไม่ครบ 100 / หัวข้อไม่มีตัวชี้วัด / ไม่มีประธาน", () => {
    const issues = findDataIssues({
      topics: [...topics, { id: 2, title: "หัวข้อว่าง" }],
      indicators: [{ topic_id: 1, weight: 90 }],
      evaluatees,
      assignments: [{ evaluatee_id: 5, committee_role: "member" }],
    });
    assert.equal(issues.length, 3);
    assert.match(issues[0], /เท่ากับ 90/);
    assert.match(issues[1], /หัวข้อว่าง/);
    assert.match(issues[2], /ยังไม่มีประธานกรรมการ/);
  });
  test("ผู้รับประเมินที่ยังไม่มีกรรมการ", () => {
    const issues = findDataIssues({ topics, indicators, evaluatees, assignments: [] });
    assert.deepEqual(issues, ["ครู ก ยังไม่มีกรรมการประเมิน"]);
  });
});
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2-4 | ข้อมูลที่ **ถูกต้อง**: น้ำหนัก 60 + 40 = 100 | - |
| 8 | ข้อมูลครบต้องได้ `[]` ใช้ `deepEqual` เทียบ array | `equal([], [])` ได้ false เพราะเป็นคนละก้อน |
| 11-16 | ทำผิด 3 อย่างพร้อมกัน: เพิ่มหัวข้อว่าง, น้ำหนักรวม 90, มีแต่กรรมการไม่มีประธาน | - |
| 17 | ต้องเตือนครบ 3 ข้อ | - |
| 18-20 | ตรวจแต่ละข้อแค่ **คำสำคัญ** ด้วย regex | ไม่ต้องพิมพ์ข้อความยาวทั้งประโยค |
| 23-24 | ไม่มีกรรมการเลย | - |

🧩 **Syntax ใหม่: `deepEqual` และ `match`**

| คำสั่ง | ใช้เมื่อ | ตัวอย่าง |
|---|---|---|
| `assert.deepEqual(a, b)` | เทียบ object/array ทุกช่อง | `deepEqual([1, 2], [1, 2])` ✔ |
| `assert.match(ข้อความ, /regex/)` | ข้อความมีคำนี้ไหม | `match("น้ำหนักรวม… เท่ากับ 90", /เท่ากับ 90/)` ✔ |

**จำ:** `assert.equal` กับ object/array จะ ✖ เสมอ (แม้หน้าตาเหมือนกัน) เพราะ `===` เทียบว่าเป็น "ก้อนเดียวกัน" ไม่ใช่ "หน้าตาเหมือนกัน"

✅ **ลองเลย:** `npm test` → pass 36

## 12.7 API Test (เกณฑ์ 7.1, 7.2, 7.3, 7.6)

📖 ต้อง **เปิด MySQL** ก่อน (`docker compose up -d mysql`) และฐานข้อมูลต้องเป็นข้อมูลตัวอย่าง (login hr / 123456 ได้) เทสนี้เพิ่มผู้ใช้ทดสอบ แล้วลบทิ้งตอนจบ ข้อมูลเดิมไม่เปลี่ยน

### ขั้นที่ 12.7.1 ตัวช่วยเรียก API

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชัน `api()` และ `login()` สำหรับใช้ในทุกเทส

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/tests/api.test.js`

```js
// ทดสอบ Service API (เกณฑ์ 7.1, 7.2, 7.3, 7.6) ต้องเปิด MySQL (docker compose up -d) ก่อน
// เปิด app ที่ port สุ่ม จึงรันพร้อม npm run dev ได้ ข้อมูลที่เพิ่มระหว่างทดสอบจะถูกลบตอนจบ
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../app.js";
import pool from "../db.js";

let server, baseUrl, hrToken, evaluateeToken, newUserId;

// เรียก API คืน { code, body }
async function api(method, url, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(baseUrl + url, { method, headers, body: body && JSON.stringify(body) });
  return { code: res.status, body: await res.json() };
}

const login = (username, password) => api("POST", "/auth/login", { body: { username, password } });

// (ขั้น 12.7.2 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | `before` / `after` = ทำก่อนเทสแรก / หลังเทสสุดท้าย | เปิด-ปิด server |
| 5 | ดึง Express app (บท 03 ขั้น 3.9) | เปิดเองในไฟล์เทส |
| 6 | ดึง pool ฐานข้อมูล | ลบข้อมูลทดสอบ และปิดการเชื่อมต่อตอนจบ |
| 8 | ตัวแปรที่ **ใช้ร่วมระหว่างเทส** (เช่น token จากเทส login ใช้ต่อในเทสอื่น) | - |
| 11 | `api(method, url, { token, body })` ส่วนที่ 3 ไม่ส่งได้ (`= {}`) | `api("GET", "/users")` ก็ได้ |
| 13 | มี token → ใส่ `Authorization: Bearer …` | - |
| 14 | `fetch` (มากับ Node.js ไม่ต้องลง axios) `body && …` = มี body ค่อยแปลงเป็น JSON | - |
| 15 | คืนรหัส HTTP และข้อมูลที่ตอบ | ตรวจทั้งสองอย่าง |
| 18 | ตัวช่วย login | - |

### ขั้นที่ 12.7.2 เปิดและปิด server

> 🎯 **ขั้นนี้จะได้:** server เปิดที่ port สุ่ม ปิดเองเมื่อเทสจบ

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 12.7.2 จะเขียนต่อตรงนี้)`

```js
before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://localhost:${server.address().port}/api`;
});

after(async () => {
  if (newUserId) await pool.query("DELETE FROM users WHERE id = ?", [newUserId]);
  server.close();
  await pool.end();
});

// (ขั้น 12.7.3 จะเขียนต่อตรงนี้)
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | `listen(0)` = ให้ระบบเลือก port ว่างให้ | ไม่ชนกับ 5000 ที่ `npm run dev` ใช้อยู่ |
| 3 | รอจน server พร้อม (Promise แบบบท 11 ขั้น 11.4.3) | - |
| 4 | ถามว่าได้ port อะไร แล้วสร้าง URL ฐาน | - |
| 8 | ถ้าเทสพังกลางทาง ผู้ใช้ทดสอบยังไม่ถูกลบ → ลบตรงนี้ | ข้อมูลไม่ค้าง |
| 9-10 | ปิด server และปิดการเชื่อมต่อฐานข้อมูล | **ไม่ปิด = เทสค้างไม่จบ** |

### ขั้นที่ 12.7.3 ทดสอบ Login ถูก/ผิด (เกณฑ์ 7.1)

> 🎯 **ขั้นนี้จะได้:** 4 กรณีของการ login

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 12.7.3 จะเขียนต่อตรงนี้)`

```js
describe("POST /api/auth/login", () => {
  test("username/password ถูก ได้ 200 + token", async () => {
    const { code, body } = await login("hr", "123456");
    assert.equal(code, 200);
    assert.equal(body.status, "success");
    assert.equal(body.data.user.role, "hr");
    assert.equal(body.data.user.password_hash, undefined); // ไม่ส่ง hash กลับ
    hrToken = body.data.token;
    evaluateeToken = (await login("teach1", "123456")).body.data.token;
  });

  test("รหัสผ่านผิด ได้ 401", async () => {
    const { code, body } = await login("hr", "wrong-password");
    assert.equal(code, 401);
    assert.deepEqual(body, { status: "error", message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", data: null });
  });

  test("ไม่มีผู้ใช้นี้ ได้ 401 ข้อความเดียวกัน (ไม่บอกว่าผิดช่องไหน)", async () => {
    const { code, body } = await login("nobody", "123456");
    assert.equal(code, 401);
    assert.equal(body.message, "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  });

  test("ไม่กรอกข้อมูล ได้ 400", async () => {
    const { code, body } = await login("", "");
    assert.equal(code, 400);
    assert.equal(body.message, "กรุณากรอกชื่อผู้ใช้");
  });
});

// (ขั้น 12.7.4 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4-6 | ถูก: 200, status success, บทบาท hr | - |
| 7 | **ต้องไม่ส่ง hash รหัสผ่านกลับ** | ความปลอดภัย (บท 04) |
| 8-9 | เก็บ token ของ hr และ teach1 | เทสถัดไปใช้ |
| 15 | ผิด: ตรวจทั้งก้อนว่าตรงรูปแบบ `{ status, message, data }` | กฎ response รูปแบบเดียว |
| 18-22 | ชื่อผู้ใช้ไม่มีในระบบ ได้ **ข้อความเดียวกับรหัสผิด** | ไม่บอกคนร้ายว่าชื่อผู้ใช้นี้มีจริง |
| 24-28 | ไม่กรอก → 400 (Zod ตรวจก่อนถึงฐานข้อมูล) | - |

> 💡 เทสในไฟล์เดียวกัน **รันตามลำดับ** เทสแรกจึงเก็บ token ไว้ให้เทสหลังใช้ได้

### ขั้นที่ 12.7.4 ทดสอบความปลอดภัย

> 🎯 **ขั้นนี้จะได้:** พิสูจน์ว่า verifyToken และ requireRole ทำงาน

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 12.7.4 จะเขียนต่อตรงนี้)`

```js
describe("ความปลอดภัย", () => {
  test("ไม่มี token ได้ 401", async () => {
    const { code } = await api("GET", "/users");
    assert.equal(code, 401);
  });
  test("token ปลอม ได้ 401", async () => {
    const { code } = await api("GET", "/users", { token: "fake.token.value" });
    assert.equal(code, 401);
  });
  test("ผู้รับการประเมินเรียก API ของ hr ได้ 403", async () => {
    const { code } = await api("GET", "/users", { token: evaluateeToken });
    assert.equal(code, 403);
  });
  test("endpoint ที่ไม่มี ได้ 404", async () => {
    const { code } = await api("GET", "/not-found", { token: hrToken });
    assert.equal(code, 404);
  });
});

// (ขั้น 12.7.5 จะเขียนต่อตรงนี้)
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2-9 | ไม่มี token / token ปลอม → **401** (ยังไม่รู้ว่าเป็นใคร) | verifyToken (บท 04 ขั้น 4.5) |
| 3 | `const { code } = …` แกะเฉพาะช่องที่ต้องใช้ | - |
| 10-13 | login แล้ว แต่บทบาทไม่ได้รับอนุญาต → **403** | requireRole |
| 14-17 | URL ที่ไม่มี → 404 | ตัวดัก 404 ใน app.js (บท 03 ขั้น 3.9.4) |

### ขั้นที่ 12.7.5 ทดสอบเพิ่มผู้ใช้ (เกณฑ์ 7.2)

> 🎯 **ขั้นนี้จะได้:** ทดสอบ Insert ทั้งกรณีสำเร็จและไม่สำเร็จ

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 12.7.5 จะเขียนต่อตรงนี้)`

```js
describe("/api/users (POST, GET, PUT, DELETE)", () => {
  const username = `api_test_${Date.now()}`;

  test("POST เพิ่มผู้ใช้ ได้ 201 + รหัสผ่านชั่วคราว", async () => {
    const { code, body } = await api("POST", "/users", {
      token: hrToken,
      body: { username, full_name: "ครูทดสอบ API", email: "api@test.com", role: "evaluatee" },
    });
    assert.equal(code, 201);
    assert.match(body.data.temp_password, /^\d{6}$/);
    newUserId = body.data.id;
  });

  test("POST ข้อมูลไม่ถูกต้อง ได้ 400 พร้อมช่องที่ผิด", async () => {
    const { code, body } = await api("POST", "/users", {
      token: hrToken,
      body: { username, full_name: "ซ้ำ", email: "abc", role: "evaluatee" },
    });
    assert.equal(code, 400);
    assert.equal(body.data[0].field, "email");
  });

  test("POST username ซ้ำ ได้ 400", async () => {
    const { code } = await api("POST", "/users", {
      token: hrToken,
      body: { username, full_name: "ซ้ำ", role: "evaluatee" },
    });
    assert.equal(code, 400);
  });

  // (ขั้น 12.7.6 จะเขียนต่อตรงนี้)
});

// (ขั้น 12.7.8 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | ชื่อผู้ใช้ไม่ซ้ำทุกครั้งที่รัน (`Date.now()` = เวลาปัจจุบันเป็นตัวเลข) | รันเทสซ้ำได้ ไม่ติด "ข้อมูลซ้ำ" |
| 9 | เพิ่มสำเร็จ 201 | - |
| 10 | รหัสชั่วคราวต้องเป็นตัวเลข 6 หลัก (`\d{6}`) | - |
| 11 | จำ id ไว้ | แก้ ลบ และลบทิ้งตอนจบ |
| 19-20 | อีเมลผิด → 400 และบอกว่า **ช่อง email** ผิด (บท 04 ขั้น 4.3.5) | หน้าเว็บแสดง error ใต้ช่องได้ |
| 23-29 | ชื่อผู้ใช้ซ้ำกับที่เพิ่งเพิ่ม → 400 | UNIQUE ในฐานข้อมูล + ตัวแปล error ใน app.js |

### ขั้นที่ 12.7.6 ทดสอบอ่าน และแก้ไข (เกณฑ์ 7.3)

> 🎯 **ขั้นนี้จะได้:** เพิ่มแล้วอ่านกลับมาได้จริง แก้แล้วค่าเปลี่ยนจริง

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 12.7.6 จะเขียนต่อตรงนี้)`

```js
  test("GET ข้อมูลที่เพิ่มถูกบันทึกจริง", async () => {
    const { code, body } = await api("GET", `/users/${newUserId}`, { token: hrToken });
    assert.equal(code, 200);
    assert.equal(body.data.username, username);
    assert.equal(body.data.full_name, "ครูทดสอบ API");
    assert.equal(body.data.must_change_password, 1);
  });

  test("ผู้ใช้ใหม่ login ด้วยรหัสชั่วคราวได้ และต้องเปลี่ยนรหัสผ่าน", async () => {
    const reset = await api("PUT", `/users/${newUserId}/reset-password`, { token: hrToken });
    const { code, body } = await login(username, reset.body.data.temp_password);
    assert.equal(code, 200);
    assert.equal(body.data.user.must_change_password, true);
  });

  test("PUT แก้ไขแล้ว GET ได้ค่าใหม่", async () => {
    const put = await api("PUT", `/users/${newUserId}`, {
      token: hrToken,
      body: { username, full_name: "ครูทดสอบ แก้ไขแล้ว", department: "ไอที", phone: "0812345678" },
    });
    assert.equal(put.code, 200);
    const { body } = await api("GET", `/users/${newUserId}`, { token: hrToken });
    assert.equal(body.data.full_name, "ครูทดสอบ แก้ไขแล้ว");
    assert.equal(body.data.department, "ไอที");
    assert.equal(body.data.phone, "0812345678");
  });

  // (ขั้น 12.7.7 จะเขียนต่อตรงนี้)
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1-7 | อ่านผู้ใช้ที่เพิ่มในขั้น 12.7.5 ค่าตรงกับที่ส่ง และต้องเปลี่ยนรหัสผ่าน (MySQL ส่ง `1`) | **พิสูจน์ว่าบันทึกลงฐานข้อมูลจริง** ไม่ใช่แค่ตอบ 201 |
| 10 | รีเซ็ตรหัสผ่าน ได้รหัสชั่วคราวใหม่ | รหัสจาก POST hash ไปแล้ว ไม่มีทางรู้ |
| 11-13 | login ด้วยรหัสชั่วคราวได้ และ API บอกให้เปลี่ยนรหัส (`true`) | - |
| 17-21 | แก้ไข → 200 | - |
| 22-25 | **อ่านกลับมาตรวจ** ว่าค่าเปลี่ยนจริง | เกณฑ์ 7.3 "แก้ไขแล้วตรวจสอบผลลัพธ์" |

### ขั้นที่ 12.7.7 ทดสอบลบ และกรณีไม่พบ

> 🎯 **ขั้นนี้จะได้:** ครบ POST, GET, PUT, DELETE

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 12.7.7 จะเขียนต่อตรงนี้)`

```js
  test("PUT ผู้ใช้ที่ไม่มี ได้ 404", async () => {
    const { code } = await api("PUT", "/users/999999", { token: hrToken, body: { username: "nobody", full_name: "x" } });
    assert.equal(code, 404);
  });

  test("DELETE ลบแล้ว GET ได้ 404", async () => {
    const del = await api("DELETE", `/users/${newUserId}`, { token: hrToken });
    assert.equal(del.code, 200);
    const { code, body } = await api("GET", `/users/${newUserId}`, { token: hrToken });
    assert.equal(code, 404);
    assert.equal(body.message, "ไม่พบผู้ใช้");
    newUserId = null;
  });
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1-4 | แก้ id ที่ไม่มี → 404 | - |
| 7-8 | ลบ → 200 | - |
| 9-11 | อ่านอีกครั้ง ต้อง 404 "ไม่พบผู้ใช้" | พิสูจน์ว่าลบจริง |
| 12 | ลบแล้ว ล้าง id | `after` จะได้ไม่ลบซ้ำ |

### ขั้นที่ 12.7.8 ทดสอบสิทธิ์ดูรายงาน

> 🎯 **ขั้นนี้จะได้:** api.test.js ครบ

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 12.7.8 จะเขียนต่อตรงนี้)`

```js
describe("GET /api/reports/evaluatees/:id (สิทธิ์ตามบทบาท)", () => {
  test("ผู้รับการประเมินดูผลของตัวเองได้", async () => {
    const { code, body } = await api("GET", "/reports/evaluatees/5", { token: evaluateeToken });
    assert.equal(code, 200);
    assert.equal(body.data.evaluatee.username, "teach1");
    assert.equal(body.data.rows.length > 0, true);
  });
  test("ดูผลของคนอื่นไม่ได้ ได้ 403", async () => {
    const { code } = await api("GET", "/reports/evaluatees/6", { token: evaluateeToken });
    assert.equal(code, 403);
  });
  test("hr ขอผู้รับประเมินที่ไม่มี ได้ 404", async () => {
    const { code } = await api("GET", "/reports/evaluatees/999999", { token: hrToken });
    assert.equal(code, 404);
  });
});
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3-6 | teach1 (id 5) ดูของตัวเอง → 200 มีแถวคะแนน | - |
| 9-10 | teach1 ดูของ teach2 (id 6) → **403** | ตรวจสิทธิ์ 3 แบบ (บท 06 ขั้น 6.8.4) |
| 13-14 | id ไม่มี → 404 | - |

## 12.8 รันเทสทั้งหมด

### ขั้นที่ 12.8.1 รัน และอ่านผล

> 🎯 **ขั้นนี้จะได้:** pass ครบ 55

⌨️ **ทำ:** เปิด MySQL แล้วรันในโฟลเดอร์ backend

```bash
docker compose up -d mysql
cd backend
npm test
```

✅ **ผ่านเมื่อ:** ท้ายผลเห็น

```text
ℹ tests 55
ℹ suites 14
ℹ pass 55
ℹ fail 0
```

| ไฟล์ | จำนวนเทส |
|---|---|
| score.test.js | 13 |
| sort.test.js | 4 |
| password.test.js | 2 |
| validate.test.js | 17 |
| api.test.js | 19 |

> 💡 **โชว์กรรมการ:** เปิด Terminal รัน `npm test` ให้ดูว่าผ่านทั้งหมด แล้วชี้ว่าเทสไหนตรงเกณฑ์ข้อไหน (ตารางต้นบท)

## 12.9 ทดสอบ API ด้วย Thunder Client (เกณฑ์ 7.6 แบบโชว์)

### ขั้นที่ 12.9.1 บันทึก Collection สำหรับโชว์

> 🎯 **ขั้นนี้จะได้:** คำขอที่บันทึกไว้ กดโชว์กรรมการได้ทันที

1. Thunder Client → **Collections** → New Collection ชื่อ "Eva API"
2. สร้าง request แล้วกด Save เข้า Collection

| ชื่อ | Method + URL | ผลที่ต้องได้ |
|---|---|---|
| Login hr | POST `http://localhost:5000/api/auth/login` | 200 + token |
| Login ผิด | POST `/api/auth/login` รหัสผิด | 401 |
| รายการหัวข้อ | GET `/api/topics` | 200 |
| เพิ่มหัวข้อ | POST `/api/topics` | 201 |
| แก้ไขหัวข้อ | PUT `/api/topics/<id ที่เพิ่ม>` | 200 |
| ลบหัวข้อ | DELETE `/api/topics/<id ที่เพิ่ม>` | 200 |
| ไม่มี token | GET `/api/users` (ไม่ใส่ Auth) | 401 |

3. แท็บ **Auth → Bearer** ของแต่ละ request วาง token จาก "Login hr" (บท 04)

> 💡 ลบเฉพาะหัวข้อที่เพิ่งเพิ่ม ถ้าลบหัวข้อ 1-2 ของข้อมูลตัวอย่าง ตัวชี้วัดจะหายไปด้วย

## 12.10 ตรวจ Console และ Network (เกณฑ์ 7.7)

### ขั้นที่ 12.10.1 ใช้ DevTools ตรวจทุกหน้า

> 🎯 **ขั้นนี้จะได้:** มั่นใจว่าไม่มี error แดงทั้งระบบ

1. เปิดเว็บ แล้วกด **F12** (DevTools)
2. แท็บ **Console:** กด 🚫 (Clear console) ก่อน แล้วใช้งาน **ทุกเมนูของทุกบทบาท** ต้องไม่มีข้อความสีแดง
3. แท็บ **Network:** กรองเฉพาะ **Fetch/XHR** ทุกคำขอต้องเป็น 200/201 (ยกเว้นที่ตั้งใจทดสอบ เช่น login ผิดได้ 401)

| ถ้าเจอ | สาเหตุที่พบบ่อย | แก้ |
|---|---|---|
| `Uncaught (in promise) AxiosError` | `.then()` ไม่มี `.catch()` | เพิ่ม `.catch((err) => setError(errorMessage(err)))` |
| `Each child in a list should have a unique "key"` | `.map()` ไม่ใส่ key | ใส่ `key={item.id}` |
| `A component is changing an uncontrolled input to be controlled` | ค่าเริ่มต้นฟอร์มเป็น null | ใช้ `formValues()` (บท 07 ขั้น 7.11.2) |
| `404 /api/...` ใน Network | URL ผิด หรือลืมต่อ route ใน app.js | ตรวจ app.js |
| `500` ใน Network | backend error | ดู Terminal ของ backend |

> 💡 คำเตือนสีเหลืองของ Next.js ตอน `npm run dev` (เช่น Fast Refresh) ไม่ใช่ error

## 12.11 ทดสอบ Responsive (เกณฑ์ 7.10 = 3 คะแนน)

### ขั้นที่ 12.11.1 ตรวจทุกหน้าในโหมดมือถือ

> 🎯 **ขั้นนี้จะได้:** ได้ทั้งคะแนนมือถือ 1.5 และ Desktop 1.5

1. F12 → กดไอคอน **📱 Toggle device toolbar** (`Ctrl+Shift+M`)
2. เลือกอุปกรณ์ เช่น **iPhone 12 Pro** (390 px)
3. ตรวจทุกหน้าตามตาราง แล้วปิดโหมดมือถือ ตรวจซ้ำแบบจอใหญ่

| ตรวจ | ผ่านเมื่อ |
|---|---|
| เมนู | มือถือเป็นปุ่ม ☰ กดแล้วมีรายการเมนู |
| ไม่ล้นแนวนอน | ไม่มีแถบเลื่อนซ้าย-ขวาของทั้งหน้า (ตารางเลื่อนได้ในกรอบตัวเอง) |
| ฟอร์ม | ช่องกรอกเต็มความกว้าง กรอกได้ |
| การ์ด/กล่องสถิติ | เรียงลงแนวตั้ง |
| Modal | อยู่ในจอ กดปุ่มได้ |
| ลายเซ็น | ลากนิ้วเซ็นได้ หน้าไม่เลื่อนตาม |

**class ที่ทำให้ responsive (สรุปทั้งระบบ)**

| ปัญหาบนมือถือ | แก้ด้วย |
|---|---|
| ตารางล้นจอ | ครอบด้วย `overflow-x-auto` |
| ปุ่ม/ข้อความเรียงแถวเดียวแล้วล้น | `flex flex-wrap` |
| การ์ดหลายคอลัมน์แคบเกิน | `grid md:grid-cols-3` (มือถือ 1 คอลัมน์) |
| กล่องสถิติแนวนอนล้น | `stats stats-vertical sm:stats-horizontal` |
| เมนูยาว | dropdown `lg:hidden` + เมนูแนวนอน `hidden lg:flex` (บท 07) |
| URL หรือชื่อไฟล์ยาวล้น | `break-all` |

## 12.12 แผนทดสอบสำหรับโชว์กรรมการ

### ขั้นที่ 12.12.1 ตารางแผนทดสอบ

> 🎯 **ขั้นนี้จะได้:** เอกสารสรุปว่าทดสอบอะไรบ้าง (ใส่ใน README หรือพิมพ์แนบ)

| เกณฑ์ | กรณีทดสอบ | ผลที่คาดหวัง | ผล |
|---|---|---|---|
| 7.1 | login hr / 123456 | เข้าหน้า Dashboard | ✅ |
| 7.1 | login hr / รหัสผิด | "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" | ✅ |
| 7.2 | เพิ่มผู้ใช้ใหม่ | ได้รหัสชั่วคราว ผู้ใช้อยู่ในรายการ | ✅ |
| 7.3 | แก้ชื่อผู้ใช้ | ชื่อในรายการเปลี่ยน | ✅ |
| 7.4 | เพิ่มผู้ใช้ อีเมล "abc" | "รูปแบบอีเมลไม่ถูกต้อง" ใต้ช่อง | ✅ |
| 7.4 | เพิ่มหัวข้อไม่กรอกชื่อ | "กรุณากรอกชื่อหัวข้อ" | ✅ |
| 7.5 | `npm test` (คำนวณ, เรียง) | pass ทั้งหมด | ✅ |
| 7.6 | `npm test` (api.test.js) + Thunder Client | GET/POST/PUT/DELETE ผ่าน | ✅ |
| 7.7 | ใช้งานทุกเมนู ดู F12 | Console ไม่มีสีแดง | ✅ |
| 7.10 | โหมดมือถือ 390px และจอใหญ่ | ทุกหน้าไม่ล้น เมนู ☰ ใช้ได้ | ✅ |

---

## ❗ ปัญหาที่พบบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| `Cannot find module 'C:\...\tests'` | script ใช้ `node --test tests/` | ใช้ `node --test "tests/*.test.js"` |
| เทสค้างไม่จบ | ไม่ได้ `pool.end()` / `server.close()` | ใส่ใน `after()` (ขั้น 12.7.2) |
| API test ได้ `ECONNREFUSED` | MySQL ไม่ได้รัน | `docker compose up -d mysql` |
| API test login ไม่ผ่าน (401) | รหัสผ่าน hr/teach1 ถูกเปลี่ยนไปแล้ว | รีเซ็ตฐานข้อมูล (บท 02 ขั้น 2.6.1) |
| เทสผู้ใช้ซ้ำตอนรันรอบสอง | ใช้ชื่อตายตัว | ใช้ `` `api_test_${Date.now()}` `` |
| `assert.equal` กับ array ไม่ผ่านทั้งที่หน้าตาเหมือนกัน | `===` เทียบว่าเป็นก้อนเดียวกัน | ใช้ `assert.deepEqual` |
| `SyntaxError: Cannot use import statement` | package.json ไม่มี `"type": "module"` | ตรวจบท 01 |

---

⬅️ [บทที่ 11](11-challenges.md) | ➡️ [บทที่ 13: เอกสาร API, Git และ Deploy](13-docs-git-deploy.md)
