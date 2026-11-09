# บทที่ 11: โจทย์ท้าทาย (ส่วนที่ 8)

## เป้าหมาย

เรียนจบบทนี้แล้ว นักเรียนจะเพิ่มความสามารถพิเศษให้ระบบได้ 4 เรื่อง

| ข้อ | หัวข้อ | คะแนน | อยู่ที่ |
|---|---|---|---|
| 8.1 | Dashboard | 2 | 11.2, 11.3 |
| 8.2 | ตรวจสอบความถูกต้องของข้อมูล (Data Validation) | 2 | 11.2.1-11.2.2 และ 11.3.2 |
| 8.3 + 8.4 | สำรองและกู้คืนข้อมูล (Backup & Restore) | 4 | 11.4, 11.5 |
| 8.5 | ออกรายงาน (Reporting) | 2 | 11.6 (ทำไปแล้วในบท 08) |

⏱️ ครั้งแรกที่เรียน: ประมาณ **6 ชั่วโมง** (แบ่งเรียน 2 ครั้ง) | วันแข่ง (เมื่อคล่องแล้ว): **70 นาที**

> 💡 **ลำดับแนะนำในวันแข่ง:** 8.5 รายงาน (มีแล้ว แค่ตรวจ) → 8.1 Dashboard + 8.2 → 8.3/8.4 (ยากสุด)

### บทนี้แบ่งเป็นขั้นเล็กๆ

| ภาค | ทำอะไร | จำนวนขั้น |
|---|---|---|
| ภาค ก (11.1) | หลักการของแต่ละเรื่อง | 3 ขั้น |
| ภาค ข (11.2-11.7) | เขียนโค้ดทีละส่วน | 27 ขั้น |

### ไฟล์ที่จะสร้าง/แก้ในบทนี้

```
backend/
├── utils/dataCheck.js        ← ขั้น 11.2.1-11.2.2  ตรวจความสมบูรณ์ของข้อมูล
├── routes/reports.js         ← ขั้น 11.2.3-11.2.6  (แก้) เพิ่ม GET /overview
├── utils/backup.js           ← ขั้น 11.4.1-11.4.4  เรียก mysqldump / mysql
├── routes/backups.js         ← ขั้น 11.4.5-11.4.6  API สำรอง/กู้คืน
└── app.js                    ← ขั้น 11.4.7  (แก้) ต่อ route backups
frontend/pages/hr/
├── index.js                  ← ขั้น 11.3  (เขียนใหม่ทั้งไฟล์) Dashboard
└── backups.js                ← ขั้น 11.5  หน้าสำรองข้อมูล
```

> 💡 **ก่อนเริ่มบทนี้** ต้องทำบท 10 เสร็จ และ **รีเซ็ตฐานข้อมูล** (บท 02 ขั้น 2.6.1) ตัวเลขใน "ลองเลย" ของบทนี้คิดจากข้อมูลตัวอย่าง

---

# ภาค ก: หลักการ

## 11.1 แต่ละเรื่องทำงานอย่างไร

### ขั้นที่ 11.1.1 Dashboard = API เดียว ส่งตัวเลขสรุปทั้งหมด

> 🎯 **ขั้นนี้จะได้:** รู้ว่าจะคำนวณที่ไหน แสดงอย่างไร

```text
หน้า /hr (Dashboard)
   │  GET /api/reports/overview   (ยิงครั้งเดียว)
   ▼
backend: ดึงข้อมูล → คำนวณด้วยฟังก์ชันใน score.js (บท 06) → ส่งกลับเป็นก้อนเดียว
   │  { counts, assignments, progress, scores, topics, ranking, issues }
   ▼
หน้าเว็บ: แสดงด้วย class ของ daisyUI (ไม่ใช้ไลบรารีกราฟ เพราะโจทย์ห้าม)
```

| ส่วนของข้อมูล | แสดงด้วย | ตัวอย่าง |
|---|---|---|
| `counts` จำนวนคน/หัวข้อ/ตัวชี้วัด | `stats` | ผู้รับการประเมิน 5 คน |
| `progress.average` % ประเมินตนเองเฉลี่ย | `radial-progress` (วงกลม) | 27% |
| `assignments` สถานะงานกรรมการ | `progress` (แถบ) | ยืนยันผลแล้ว 1/13 |
| `scores` คะแนนกรรมการเฉลี่ย/สูง/ต่ำ | ตัวเลขใหญ่ | 91.25% |
| `topics` ค่าเฉลี่ยรายหัวข้อ | `progress` | ด้านการจัดการเรียนการสอน 92.5% |
| `ranking` 5 อันดับแรก | รายการลำดับเลข | 1. สมชาย 91.25% |
| `issues` ปัญหาของข้อมูล | `alert` เหลือง/เขียว | ตรวจสอบข้อมูลแล้ว |

### ขั้นที่ 11.1.2 Data Validation มี 2 ระดับ

> 🎯 **ขั้นนี้จะได้:** อธิบายเกณฑ์ 8.2 ให้กรรมการฟังได้ครบ

| ระดับ | ตรวจอะไร | อยู่ที่ไหน |
|---|---|---|
| 1. ข้อมูลที่กรอก | ช่องว่าง รูปแบบ ความยาว ช่วงค่า | Zod ทั้งฝั่งหน้าและ backend (บท 04, 05, 07) + CHECK/UNIQUE ในฐานข้อมูล (บท 02) |
| 2. ความสมบูรณ์ของข้อมูลทั้งระบบ | สิ่งที่ "ผิดตรรกะ" ซึ่งตรวจทีละช่องไม่เจอ | `findDataIssues` (ขั้น 11.2.1) แสดงบน Dashboard |

**ตัวอย่างข้อมูลที่ผิดตรรกะ** (ตรวจทีละช่องผ่านหมด แต่ระบบใช้งานจริงไม่ได้)
- น้ำหนักตัวชี้วัดรวมทั้งหมดไม่เท่ากับ 100
- มีหัวข้อที่ไม่มีตัวชี้วัดเลย
- ผู้รับการประเมินที่ยังไม่มีกรรมการ หรือไม่มีประธาน

> 💡 **ตอนนำเสนอ อธิบาย 8.2 ให้ครบทั้ง 2 ระดับ**

### ขั้นที่ 11.1.3 Backup/Restore ใช้โปรแกรมของ MySQL

> 🎯 **ขั้นนี้จะได้:** เข้าใจว่า backend สั่งโปรแกรมอื่นทำงานแทน

- **สำรอง (Backup):** สั่ง `mysqldump` ได้ข้อความ SQL ที่มีคำสั่ง `DROP TABLE` + `CREATE TABLE` + `INSERT` ของทุกตาราง → เขียนเป็นไฟล์ `.sql`
- **กู้คืน (Restore):** ส่งข้อความ SQL นั้นเข้าโปรแกรม `mysql` → ตารางถูกสร้างใหม่ ข้อมูลกลับมาเหมือนตอนสำรอง

```text
                    ┌─ มี DB_CONTAINER (รัน npm run dev บนเครื่อง)
backend ── สั่ง ───┤      docker exec -i eva_mysql mysqldump …   (ใช้ mysqldump ในกล่อง MySQL)
                    └─ ไม่มี DB_CONTAINER (backend รันใน docker compose บท 13)
                           mysqldump -hmysql …                   (image ของ backend ลง mysql-client ไว้)
```

**เกณฑ์มี 2 ข้อ (8.3 และ 8.4) จึงทำให้กู้คืนได้ 2 ทาง**
- กู้คืนจาก **ไฟล์บน server** (เลือกจากรายการ)
- **ดาวน์โหลด** ไฟล์มาเก็บในเครื่อง แล้ว **อัปโหลด** กลับไปกู้คืน

**กันความผิดพลาด 3 ชั้น**

| กัน | วิธี |
|---|---|
| ส่งชื่อไฟล์แบบ `../../app.js` เพื่ออ่านไฟล์อื่นของ server | ชื่อไฟล์ต้องตรงรูปแบบ `backup-….sql` เท่านั้น |
| อัปโหลดไฟล์ SQL อื่นที่ไม่ใช่ของระบบนี้ | ต้องมี `` CREATE TABLE `users` `` |
| กู้คืนผิดไฟล์ ข้อมูลล่าสุดหาย | **สำรองข้อมูลปัจจุบันอัตโนมัติก่อนกู้คืนทุกครั้ง** |

---

# ภาค ข: เขียนโค้ด

## 11.2 Backend ของ Dashboard (เกณฑ์ 8.1, 8.2)

### ขั้นที่ 11.2.1 ฟังก์ชันตรวจข้อมูล: น้ำหนักรวม

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชันที่คืนรายการข้อความเตือน (array ว่าง = ข้อมูลพร้อม)

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/utils/dataCheck.js`

```js
import { sum } from "./score.js";

// ตรวจความถูกต้อง/ครบถ้วนของข้อมูลการประเมิน คืนรายการข้อความแจ้งเตือน (ว่าง = ข้อมูลพร้อม)
// topics: [{ id, title }], indicators: [{ topic_id, weight }]
// evaluatees: [{ id, full_name }], assignments: [{ evaluatee_id, committee_role }]
export function findDataIssues({ topics, indicators, evaluatees, assignments }) {
  const issues = [];

  const totalWeight = sum(indicators.map((i) => i.weight));
  if (totalWeight !== 100) issues.push(`น้ำหนักรวมของตัวชี้วัดทั้งหมดเท่ากับ ${totalWeight} (ควรเท่ากับ 100)`);

  // (ขั้น 11.2.2 จะเขียนต่อตรงนี้)
  return issues;
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | ใช้ `sum` จาก score.js (บท 06 ขั้น 6.3.1) | รวมน้ำหนักแบบปัดทศนิยม 2 ตำแหน่ง |
| 3-5 | บอกว่าแต่ละตัวต้องมีช่องอะไรบ้าง | คนเรียกใช้รู้ว่าต้องส่งอะไรมา |
| 6 | รับ object 1 ก้อน แล้ว **แกะ 4 ช่องในวงเล็บพารามิเตอร์** | เรียกแบบ `findDataIssues({ topics, … })` ไม่ต้องจำลำดับ |
| 7 | array เก็บข้อความเตือน | - |
| 9 | รวมน้ำหนักทุกตัวชี้วัด | - |
| 10 | ไม่เท่ากับ 100 → เพิ่มข้อความเตือน | - |
| 13 | คืนรายการข้อความ | - |

> 🧩 syntax: แกะ object ในพารามิเตอร์ `function f({ a, b })` แบบเดียวกับ props ของ component (บท 07) ส่วน `.push()` = เพิ่มของท้าย array

💡 **ฟังก์ชันนี้ไม่ยุ่งกับฐานข้อมูล** รับข้อมูลเข้าไป คืนข้อความออกมา จึงเขียน unit test ได้ง่าย (บท 12)

### ขั้นที่ 11.2.2 ฟังก์ชันตรวจข้อมูล: หัวข้อว่าง และกรรมการ

> 🎯 **ขั้นนี้จะได้:** ตรวจครบ 3 กฎ

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 11.2.2 จะเขียนต่อตรงนี้)`

```js
  for (const t of topics) {
    if (!indicators.some((i) => i.topic_id === t.id)) issues.push(`หัวข้อ "${t.title}" ยังไม่มีตัวชี้วัด`);
  }

  for (const e of evaluatees) {
    const mine = assignments.filter((a) => a.evaluatee_id === e.id);
    if (mine.length === 0) issues.push(`${e.full_name} ยังไม่มีกรรมการประเมิน`);
    else if (!mine.some((a) => a.committee_role === "chair")) issues.push(`${e.full_name} ยังไม่มีประธานกรรมการ`);
  }
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1-3 | ทุกหัวข้อ: ถ้า **ไม่มี** ตัวชี้วัดสักตัวที่อยู่ในหัวข้อนี้ → เตือน | หัวข้อว่างประเมินไม่ได้ |
| 6 | หาการมอบหมายของคนนี้ | - |
| 7 | ไม่มีกรรมการเลย → เตือน | - |
| 8 | มีกรรมการ แต่ **ไม่มีประธาน** → เตือน | ทุกคนต้องมีประธาน 1 คน |

> 🧩 syntax สอนไปแล้ว: `.some()` = มีอย่างน้อย 1 ตัวที่ตรงเงื่อนไขไหม (บท 06) ใส่ `!` ข้างหน้า = "ไม่มีเลย"

### ขั้นที่ 11.2.3 เพิ่มฟังก์ชันที่ต้องใช้ใน reports.js

> 🎯 **ขั้นนี้จะได้:** reports.js เรียกใช้ค่าเฉลี่ย เปอร์เซ็นต์ และตัวตรวจข้อมูลได้

⌨️ **แก้โค้ด:** เปิด `backend/routes/reports.js` (จากบท 06 ขั้น 6.8.1) **แก้บรรทัด import score.js** แล้วเพิ่มบรรทัดใหม่ใต้มัน

```js
import { buildResult, weighted, sum, sortBy, average, percent } from "../utils/score.js";
import { findDataIssues } from "../utils/dataCheck.js";
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | เพิ่ม `average`, `percent` ต่อท้ายของเดิม (บท 06 ขั้น 6.3.2) | คำนวณค่าเฉลี่ยบน Dashboard |
| 2 | ดึงตัวตรวจข้อมูลจากขั้น 11.2.1 | ส่งรายการเตือนไปกับ Dashboard |

### ขั้นที่ 11.2.4 API Dashboard: ดึงข้อมูล

> 🎯 **ขั้นนี้จะได้:** route `GET /api/reports/overview` ส่วนแรก

⌨️ **พิมพ์โค้ด:** ใน `backend/routes/reports.js` วาง **ต่อจากฟังก์ชัน `loadResults` (บท 06 ขั้น 6.8.2) และก่อน route `GET /evaluatees`**

```js
// GET /api/reports/overview  ข้อมูล Dashboard ของ hr: สถิติภาพรวม + ค่าเฉลี่ยคะแนน + การตรวจข้อมูล
router.get("/overview", requireRole("hr"), async (req, res) => {
  const [users] = await pool.query("SELECT id, full_name, role FROM users WHERE role <> 'hr' ORDER BY id");
  const [topics] = await pool.query(
    "SELECT id, title, (CURDATE() BETWEEN start_date AND end_date) AS is_open FROM evaluation_topics ORDER BY id"
  );
  const [assignments] = await pool.query("SELECT evaluatee_id, committee_role, status FROM assignments");
  const indicators = await loadIndicators();

  const evaluatees = users.filter((u) => u.role === "evaluatee");
  const results = await loadResults(evaluatees.map((e) => e.id));
  const list = evaluatees.map((e) => ({ id: e.id, full_name: e.full_name, ...results[e.id].summary }));
  const scored = list.filter((e) => e.committee_percent != null); // มีกรรมการยืนยันอย่างน้อย 1 คน
  const percents = scored.map((e) => e.committee_percent);

  // (ขั้น 11.2.5 จะเขียนต่อตรงนี้)
});
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | เฉพาะ hr | - |
| 3 | ผู้ใช้ทุกคนที่ไม่ใช่ hr (`<>` = ไม่เท่ากับ ในภาษา SQL) | นับผู้รับการประเมินและกรรมการ |
| 4-6 | หัวข้อ พร้อมสถานะเปิด/ปิด (บท 03 ขั้น 3.10.3) | ป้าย "เปิด" บน Dashboard |
| 7 | การมอบหมายทั้งหมด | นับสถานะ และตรวจประธาน |
| 8 | ตัวชี้วัดทั้งหมด (ฟังก์ชันจากบท 06 ขั้น 6.8.1) | - |
| 10 | เฉพาะผู้รับการประเมิน | - |
| 11 | คำนวณผลทุกคนพร้อมกัน (บท 06 ขั้น 6.8.2) | ใช้ซ้ำของเดิม ไม่เขียนใหม่ |
| 12 | รวมชื่อ + ผลสรุปของแต่ละคนเป็น 1 ก้อน | - |
| 13 | เฉพาะคนที่มีกรรมการยืนยันแล้ว (มีคะแนนกรรมการ) | ค่าเฉลี่ยคะแนนไม่ควรนับคนที่ยังไม่มีผล |
| 14 | ดึงเฉพาะ % คะแนนกรรมการออกมาเป็น array ตัวเลข | หาค่าเฉลี่ย สูงสุด ต่ำสุด |

### ขั้นที่ 11.2.5 API Dashboard: ค่าเฉลี่ยรายหัวข้อ

> 🎯 **ขั้นนี้จะได้:** % คะแนนเฉลี่ยของแต่ละหัวข้อ

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 11.2.5 จะเขียนต่อตรงนี้)`

```js
  // ค่าเฉลี่ย % คะแนนกรรมการรายหัวข้อ (เฉพาะคนที่มีผลยืนยันแล้ว)
  const topicStats = topics.map((t) => {
    const inTopic = indicators.filter((i) => i.topic_id === t.id);
    const weight = sum(inTopic.map((i) => i.weight));
    const avg = average(
      scored.map((e) => {
        const got = sum(results[e.id].rows.filter((r) => r.topic_id === t.id).map((r) => r.committee_weighted));
        return percent(got, weight);
      })
    );
    return { ...t, indicator_count: inTopic.length, total_weight: weight, avg_percent: avg };
  });

  // (ขั้น 11.2.6 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | ทำทีละหัวข้อ | - |
| 3 | ตัวชี้วัดในหัวข้อนี้ | - |
| 4 | น้ำหนักเต็มของหัวข้อนี้ | ตัวหารของ % |
| 5-9 | แต่ละคน: รวมคะแนนกรรมการเฉพาะแถวในหัวข้อนี้ → แปลงเป็น % → หาค่าเฉลี่ยของทุกคน | - |
| 7 | `.filter().map()` ต่อกัน แล้ว `sum` | "คะแนนที่ได้ในหัวข้อนี้" |
| 11 | คืนข้อมูลหัวข้อเดิม + จำนวนตัวชี้วัด + น้ำหนัก + ค่าเฉลี่ย | - |

> 💡 ยังไม่มีใครมีผลยืนยัน → `average([])` คืน `null` (บท 06 ขั้น 6.3.2) หน้าเว็บแสดง "-"

### ขั้นที่ 11.2.6 API Dashboard: ส่งผลลัพธ์

> 🎯 **ขั้นนี้จะได้:** API ครบ ส่งข้อมูล 7 ส่วน

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 11.2.6 จะเขียนต่อตรงนี้)`

```js
  const countStatus = (s) => assignments.filter((a) => a.status === s).length;
  ok(res, {
    counts: {
      evaluatees: evaluatees.length,
      committees: users.length - evaluatees.length,
      topics: topics.length,
      open_topics: topics.filter((t) => t.is_open).length,
      indicators: indicators.length,
    },
    assignments: { total: assignments.length, pending: countStatus("pending"), draft: countStatus("draft"), confirmed: countStatus("confirmed") },
    progress: {
      average: average(list.map((e) => e.progress)) ?? 0,
      completed: list.filter((e) => e.progress === 100).length,
      fully_evaluated: list.filter((e) => e.committee_count > 0 && e.confirmed_count === e.committee_count).length,
    },
    scores: {
      evaluated: scored.length,
      average: average(percents),
      max: percents.length ? Math.max(...percents) : null,
      min: percents.length ? Math.min(...percents) : null,
    },
    topics: topicStats,
    ranking: sortBy(scored, "committee_percent", "desc").slice(0, 5),
    issues: findDataIssues({ topics, indicators, evaluatees, assignments }),
  });
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | ฟังก์ชันนับการมอบหมายตามสถานะ | - |
| 3-9 | `counts`: จำนวนผู้รับการประเมิน กรรมการ (= ทุกคน − ผู้รับการประเมิน) หัวข้อ หัวข้อที่เปิด ตัวชี้วัด | กล่อง stats |
| 10 | `assignments`: ทั้งหมด และแยก 3 สถานะ | แถบสถานะกรรมการ |
| 12 | % การประเมินตนเองเฉลี่ย (ไม่มีคนเลย → 0) | วงกลม |
| 13 | จำนวนคนที่ประเมินตนเองครบ 100% | - |
| 14 | จำนวนคนที่ **กรรมการทุกคน** ยืนยันแล้ว | - |
| 17-20 | `scores`: จำนวนคนที่มีผล ค่าเฉลี่ย สูงสุด ต่ำสุด (ไม่มีข้อมูล → null) | การ์ดคะแนน |
| 22 | ค่าเฉลี่ยรายหัวข้อ (ขั้น 11.2.5) | - |
| 23 | เรียงคะแนนมากไปน้อย (บท 06 ขั้น 6.3.5) เอา 5 คนแรก | อันดับคะแนนสูงสุด |
| 24 | ตรวจข้อมูล (ขั้น 11.2.1) | **เกณฑ์ 8.2** |

🧩 **Syntax ใหม่: `Math.max(...array)` และ `.slice(0, 5)`**

```syntax
[p:Math][s:.][p:max][s:(][s:...][n:percents][s:)]
[n:list][s:.][p:slice][s:(][v:0][s:,] [v:5][s:)]
```

| คำ | สี | ความหมาย |
|---|---|---|
| `Math.max` / `Math.min` | 🟣 | หาค่ามากสุด / น้อยสุด **ของตัวเลขที่ส่งทีละตัว** `Math.max(3, 9, 5)` → 9 |
| `...percents` | ⚪ | กระจาย array เป็นตัวเลขทีละตัว (บท 04 ขั้น 4.5.3) `[3, 9, 5]` → `3, 9, 5` |
| `.slice(0, 5)` | 🟣 | ตัดเอาตำแหน่ง 0 ถึงก่อน 5 (= 5 ตัวแรก) ไม่แก้ array เดิม |

**จำ:** `Math.max([3, 9, 5])` (ส่ง array ตรงๆ) ได้ `NaN` ต้องใส่ `...` เสมอ และ `Math.max()` ของ array ว่างได้ `-Infinity` จึงต้องเช็ก `percents.length` ก่อน

### ขั้นที่ 11.2.7 ทดสอบ API Dashboard

> 🎯 **ขั้นนี้จะได้:** มั่นใจว่าตัวเลขถูกก่อนทำหน้าเว็บ

✅ **ลองเลย:** Thunder Client (token ของ hr) `GET http://localhost:5000/api/reports/overview` ต้องได้ 200 และ

| ช่อง | ค่าที่ต้องได้ (ข้อมูลตัวอย่าง) |
|---|---|
| `counts` | evaluatees 5, committees 3, topics 2, open_topics 2, indicators 6 |
| `assignments` | total 13, pending 11, draft 1, confirmed 1 |
| `progress` | average 26.67, completed 1, fully_evaluated 0 |
| `scores` | evaluated 1, average 91.25, max 91.25, min 91.25 |
| `topics` | หัวข้อ 1: avg_percent 92.5, หัวข้อ 2: avg_percent 90 (น้ำหนักหัวข้อละ 50) |
| `ranking` | สมชาย รักเรียน 91.25 คนเดียว |
| `issues` | `[]` (ข้อมูลตัวอย่างครบถ้วน) |

ลองต่อ: token ของ teach1 → **403** "ไม่มีสิทธิ์เข้าถึง"

> 💡 open_topics ขึ้นกับวันที่ในเครื่อง ถ้าเลยช่วงวันของหัวข้อในข้อมูลตัวอย่างแล้ว อาจได้ 0

## 11.3 หน้า Dashboard (เกณฑ์ 8.1)

📖 หน้า `/hr` ตอนนี้เป็นหน้าทักทายชั่วคราวจากบท 08 ขั้น 8.2.3 **ลบเนื้อหาเดิมทั้งไฟล์** แล้วเขียนใหม่ตามขั้นด้านล่าง

### ขั้นที่ 11.3.1 โหลดข้อมูล และเตรียมแถบสถานะ

> 🎯 **ขั้นนี้จะได้:** โครงหน้า Dashboard ที่โหลดข้อมูลจาก API

⌨️ **พิมพ์โค้ด:** เปิด `frontend/pages/hr/index.js` ลบของเดิมทั้งหมด แล้วพิมพ์

```jsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { TriangleAlert, CircleCheck } from "lucide-react";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";

// Dashboard ของงานบุคลากร: สถิติภาพรวม ค่าเฉลี่ยคะแนน และการตรวจความถูกต้องของข้อมูล
export default function HrDashboard() {
  const user = useAuth(["hr"]);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api
      .get("/reports/overview")
      .then((res) => setData(res.data.data))
      .catch((err) => setError(errorMessage(err)));
  }, [user]);

  if (!user) return null;
  // โหลดไม่สำเร็จ (เช่น เซิร์ฟเวอร์ไม่ทำงาน) แสดงข้อความแทนหน้าว่าง
  if (!data) return <Layout user={user}>{error && <div className="alert alert-error mb-4">{error}</div>}</Layout>;

  const { counts, assignments, progress, scores, topics, ranking, issues } = data;
  const statusBars = [
    { label: "ยังไม่ประเมิน", value: assignments.pending, color: "progress-neutral" },
    { label: "บันทึกร่าง", value: assignments.draft, color: "progress-warning" },
    { label: "ยืนยันผลแล้ว", value: assignments.confirmed, color: "progress-success" },
  ];

  return (
    <Layout user={user}>
      <h1 className="text-2xl font-bold mb-4">Dashboard ภาพรวมการประเมิน</h1>

      {/* (ขั้น 11.3.2 จะเขียนต่อตรงนี้) */}
    </Layout>
  );
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | ไอคอนสามเหลี่ยมเตือน และวงกลมถูก | กล่องตรวจข้อมูล |
| 14-20 | โหลด Dashboard ครั้งเดียวเมื่อมี user | - |
| 24 | ยังไม่มีข้อมูล: แสดง error (ถ้ามี) | ไม่เห็นหน้าว่าง (แพตเทิร์นบท 07) |
| 26 | แกะข้อมูล 7 ส่วน | - |
| 27-31 | **ข้อมูลของแถบ 3 แถบ เก็บเป็น array** ป้าย ค่า สี | วาดด้วย `.map` ทีเดียว ไม่ต้องเขียนแถบซ้ำ 3 ครั้ง |

### ขั้นที่ 11.3.2 กล่องตรวจข้อมูล (เกณฑ์ 8.2)

> 🎯 **ขั้นนี้จะได้:** มีปัญหา → กล่องเหลืองพร้อมรายการ, ไม่มี → กล่องเขียว

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 11.3.2 จะเขียนต่อตรงนี้) */}`

```jsx
      {/* ตรวจความถูกต้องของข้อมูล */}
      {issues.length > 0 ? (
        <div role="alert" className="alert alert-warning mb-4 items-start">
          <TriangleAlert size={20} />
          <div>
            <div className="font-bold">ตรวจพบข้อมูลที่ควรแก้ไข {issues.length} รายการ</div>
            <ul className="list-disc list-inside text-sm">
              {issues.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div role="alert" className="alert alert-success mb-4">
          <CircleCheck size={20} /> ตรวจสอบข้อมูลแล้ว: ตัวชี้วัด น้ำหนัก และการมอบหมายกรรมการครบถ้วน
        </div>
      )}

      {/* (ขั้น 11.3.3 จะเขียนต่อตรงนี้) */}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | มีข้อความเตือนไหม | เลือกกล่อง |
| 3 | `role="alert"` + `alert-warning` (เหลือง) `items-start` = ไอคอนชิดบน | `role` บอกโปรแกรมอ่านหน้าจอว่าเป็นข้อความเตือน |
| 6 | หัวกล่อง: จำนวนปัญหา | - |
| 8-10 | รายการปัญหา ใช้ **ข้อความเป็น key** | ข้อความแต่ละข้อไม่ซ้ำกัน |
| 15-17 | กล่องเขียว ข้อมูลพร้อม | - |

### ขั้นที่ 11.3.3 กล่องสถิติ 4 ช่อง

> 🎯 **ขั้นนี้จะได้:** จำนวนผู้รับการประเมิน กรรมการ หัวข้อ ตัวชี้วัด

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 11.3.3 จะเขียนต่อตรงนี้) */}`

```jsx
      <div className="stats stats-vertical sm:stats-horizontal shadow bg-base-100 w-full mb-4">
        <div className="stat">
          <div className="stat-title">ผู้รับการประเมิน</div>
          <div className="stat-value">{counts.evaluatees}</div>
          <div className="stat-desc">คน</div>
        </div>
        <div className="stat">
          <div className="stat-title">กรรมการ</div>
          <div className="stat-value">{counts.committees}</div>
          <div className="stat-desc">คน</div>
        </div>
        <div className="stat">
          <div className="stat-title">หัวข้อการประเมิน</div>
          <div className="stat-value">{counts.topics}</div>
          <div className="stat-desc">เปิดอยู่ {counts.open_topics} หัวข้อ</div>
        </div>
        <div className="stat">
          <div className="stat-title">ตัวชี้วัด</div>
          <div className="stat-value">{counts.indicators}</div>
          <div className="stat-desc">ตัว</div>
        </div>
      </div>

      {/* (ขั้น 11.3.4 จะเขียนต่อตรงนี้) */}
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | กล่องสถิติ แนวตั้งบนมือถือ แนวนอนบนจอใหญ่ (บท 09 ขั้น 9.2.2) | - |
| 5 | `stat-desc` = ข้อความเล็กใต้ตัวเลข | หน่วย หรือรายละเอียดเพิ่ม |
| 15 | จำนวนหัวข้อที่เปิดอยู่ | - |

### ขั้นที่ 11.3.4 วงกลมความคืบหน้าการประเมินตนเอง

> 🎯 **ขั้นนี้จะได้:** วงกลม % แบบ daisyUI (ไม่ใช้ไลบรารีกราฟ)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 11.3.4 จะเขียนต่อตรงนี้) */}`

```jsx
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-base">การบันทึกประเมินตนเอง (เฉลี่ย)</h2>
            <div className="radial-progress text-primary text-xl font-bold" style={{ "--value": progress.average, "--size": "7rem" }} role="progressbar">
              {Math.round(progress.average)}%
            </div>
            <p className="text-sm">
              บันทึกครบ {progress.completed}/{counts.evaluatees} คน
            </p>
          </div>
        </div>

        {/* (ขั้น 11.3.5 จะเขียนต่อตรงนี้) */}
      </div>

      {/* (ขั้น 11.3.7 จะเขียนต่อตรงนี้) */}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | ตาราง 3 คอลัมน์บนจอกลางขึ้นไป (มือถือเรียงลงมา) | การ์ด 3 ใบในขั้น 11.3.4-11.3.6 |
| 3 | จัดของในการ์ดไว้ตรงกลาง | - |
| 5 | **วงกลม %** ค่าและขนาดส่งผ่าน **CSS variable** ใน `style` | daisyUI อ่าน `--value` (0-100) ไปวาดวง |
| 6 | ตัวเลขกลางวง ปัดเป็นจำนวนเต็ม | 26.67 → 27% |
| 9 | บันทึกครบกี่คนจากทั้งหมด | - |
| 14 | ที่ว่างของการ์ดใบที่ 2 และ 3 (อยู่ **ใน** grid) | - |
| 17 | ที่ว่างของส่วนล่าง (อยู่ **นอก** grid) | - |

🧩 **Syntax ใหม่: CSS variable ใน style**

```syntax
[p:style][s:={{] [v:"--value"][s::] [n:progress.average][s:,] [v:"--size"][s::] [v:"7rem"] [s:}}]
```

| คำ | สี | ความหมาย |
|---|---|---|
| `style={{ … }}` | ⚪ | `{ }` ชั้นนอก = ใส่ JavaScript, ชั้นใน = object ของ style |
| `"--value"` | 🟢 | ชื่อ CSS variable **ต้องขึ้นต้นด้วย `--`** และต้องอยู่ใน `" "` (มีขีด) |
| `"--size"` | 🟢 | ขนาดวงกลม |

**จำ:** `radial-progress` ต้องมี `style={{ "--value": ตัวเลข }}` เสมอ ไม่งั้นวงว่าง

### ขั้นที่ 11.3.5 แถบสถานะการประเมินของกรรมการ

> 🎯 **ขั้นนี้จะได้:** แถบ 3 แถบ วาดจาก array `statusBars`

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 11.3.5 จะเขียนต่อตรงนี้) */}`

```jsx
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-base">สถานะการประเมินของกรรมการ</h2>
            {statusBars.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm">
                  <span>{s.label}</span>
                  <span>
                    {s.value}/{assignments.total}
                  </span>
                </div>
                <progress className={`progress ${s.color}`} value={s.value} max={assignments.total || 1} />
              </div>
            ))}
            <p className="text-sm mt-1">
              ประเมินครบทุกกรรมการแล้ว {progress.fully_evaluated}/{counts.evaluatees} คน
            </p>
          </div>
        </div>

        {/* (ขั้น 11.3.6 จะเขียนต่อตรงนี้) */}
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4 | วน 3 แถบจากขั้น 11.3.1 | - |
| 6-10 | ป้ายซ้าย ตัวเลขขวา | - |
| 12 | แถบ: สีจาก array, ค่า, เต็ม = จำนวนงานทั้งหมด (ว่าง → 1 กันหารศูนย์) | - |
| 15-17 | จำนวนคนที่กรรมการทุกคนยืนยันแล้ว | - |

### ขั้นที่ 11.3.6 การ์ดคะแนนจากกรรมการ

> 🎯 **ขั้นนี้จะได้:** ค่าเฉลี่ย สูงสุด ต่ำสุด (ยังไม่มีผล → "-")

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 11.3.6 จะเขียนต่อตรงนี้) */}`

```jsx
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-base">คะแนนจากกรรมการ</h2>
            <div className="text-4xl font-bold text-primary">{scores.average != null ? `${scores.average}%` : "-"}</div>
            <p className="text-sm opacity-70">ค่าเฉลี่ย จาก {scores.evaluated} คนที่มีผลยืนยันแล้ว</p>
            <div className="flex gap-4 text-sm">
              <span>สูงสุด {scores.max ?? "-"}%</span>
              <span>ต่ำสุด {scores.min ?? "-"}%</span>
            </div>
          </div>
        </div>
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4 | มีค่าเฉลี่ย → "91.25%" ไม่มี → "-" | - |
| 7-8 | `?? "-"` = ค่าเป็น null แสดง "-" (บท 04) | - |

### ขั้นที่ 11.3.7 ค่าเฉลี่ยรายหัวข้อ และอันดับคะแนน

> 🎯 **ขั้นนี้จะได้:** Dashboard ครบ

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 11.3.7 จะเขียนต่อตรงนี้) */}`

```jsx
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-base">ค่าเฉลี่ยคะแนนรายหัวข้อ</h2>
            {topics.map((t) => (
              <div key={t.id}>
                <div className="flex justify-between text-sm gap-2">
                  <span>
                    {t.title} {t.is_open ? <span className="badge badge-success badge-sm">เปิด</span> : <span className="badge badge-sm">ปิด</span>}
                  </span>
                  <span className="whitespace-nowrap">{t.avg_percent != null ? `${t.avg_percent}%` : "-"}</span>
                </div>
                <progress className="progress progress-primary" value={t.avg_percent ?? 0} max="100" />
                <div className="text-xs opacity-60">
                  {t.indicator_count} ตัวชี้วัด น้ำหนักรวม {t.total_weight}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <h2 className="card-title text-base">อันดับคะแนนสูงสุด</h2>
              <Link href="/hr/reports" className="link text-sm">
                ดูรายงานทั้งหมด
              </Link>
            </div>
            <ol className="list-decimal list-inside">
              {ranking.map((r) => (
                <li key={r.id} className="py-1">
                  <Link href={`/hr/reports/evaluatees/${r.id}`} className="link link-hover">
                    {r.full_name}
                  </Link>{" "}
                  <span className="badge badge-primary">{r.committee_percent}%</span>
                </li>
              ))}
            </ol>
            {ranking.length === 0 && <p className="text-sm opacity-60">ยังไม่มีผลที่กรรมการยืนยัน</p>}
          </div>
        </div>
      </div>
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | 2 คอลัมน์บนจอใหญ่ | - |
| 9 | ชื่อหัวข้อ + ป้ายเปิด (เขียว) / ปิด (เทา) | - |
| 11 | % เฉลี่ย หรือ "-" | - |
| 13 | แถบ % (null → 0) | - |
| 15 | จำนวนตัวชี้วัด และน้ำหนักรวมของหัวข้อ | เห็นทันทีถ้าน้ำหนักแปลก |
| 26-28 | ลิงก์ไปหน้ารายงาน (บท 08 ขั้น 8.6) | - |
| 30 | `<ol>` + `list-decimal` = รายการมีเลขลำดับ 1. 2. 3. | อันดับ |
| 33-36 | ชื่อเป็นลิงก์ไปรายงานรายบุคคล (บท 09 ขั้น 9.4.4) + ป้าย % | - |
| 40 | ยังไม่มีผล แสดงข้อความ | - |

✅ **ลองเลย:** login hr → หน้าแรก (เมนู Dashboard)

| ต้องเห็น | ค่า |
|---|---|
| กล่องเขียว | ตรวจสอบข้อมูลแล้ว |
| stats | 5 / 3 / 2 (เปิดอยู่ 2) / 6 |
| วงกลม | 27% บันทึกครบ 1/5 คน |
| แถบ | ยังไม่ประเมิน 11/13, บันทึกร่าง 1/13, ยืนยันผลแล้ว 1/13 |
| คะแนน | 91.25% |
| อันดับ | 1. สมชาย รักเรียน 91.25% |

ย่อจอให้เล็ก (F12 → โหมดมือถือ) การ์ดต้องเรียงลงมาเป็นแถวเดียว

## 11.4 Backend ของการสำรอง/กู้คืน (เกณฑ์ 8.3, 8.4)

### ขั้นที่ 11.4.1 โฟลเดอร์เก็บไฟล์ และตรวจชื่อไฟล์

> 🎯 **ขั้นนี้จะได้:** ส่วนหัวของไฟล์ backup.js

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/utils/backup.js`

```js
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const BACKUP_DIR = path.join(import.meta.dirname, "..", "backups");
fs.mkdirSync(BACKUP_DIR, { recursive: true });

// ชื่อไฟล์ที่ยอมรับ (กันการส่ง ../ เพื่อเข้าถึงไฟล์อื่น)
export const isBackupName = (name) => /^backup-[\w-]+\.sql$/.test(name);

// (ขั้น 11.4.2 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | `spawn` = สั่งโปรแกรมอื่นของเครื่องให้ทำงาน | เรียก `mysqldump`, `mysql`, `docker` |
| 2-3 | จัดการไฟล์ และต่อ path (บท 06 ขั้น 6.4.1) | - |
| 5 | โฟลเดอร์ `backend/backups` | ที่เก็บไฟล์สำรอง (ไม่ขึ้น Git บท 01) |
| 6 | สร้างโฟลเดอร์ตอนเปิด server ถ้ายังไม่มี | ไม่ต้องสร้างเอง |
| 9 | ตรวจชื่อไฟล์ด้วย regex คืน true/false | **กันคนส่งชื่อ `../../app.js`** มาอ่านไฟล์อื่น |

🧩 **Syntax ใหม่: regex ตรวจชื่อไฟล์ + `.test()`**

```syntax
[s:/^][v:backup-][s:\[][v:\w-][s:\]+][s:\.][v:sql][s:$/][s:.][p:test][s:(][n:name][s:)]
```

| ส่วน | ความหมาย |
|---|---|
| `^` … `$` | ต้องตรงตั้งแต่ต้นจนจบข้อความ (บท 05 ขั้น 5.2.1) |
| `backup-` | ต้องขึ้นต้นด้วยคำนี้ |
| `[\w-]+` | ตัวอักษรอังกฤษ ตัวเลข `_` หรือ `-` อย่างน้อย 1 ตัว (**ไม่มี `/` และ `.`**) |
| `\.sql` | จุดจริงๆ ตามด้วย sql (`.` เดี่ยวๆ ใน regex = อะไรก็ได้ จึงต้องใส่ `\`) |
| `.test(name)` | 🟣 ข้อความตรงรูปแบบไหม คืน `true`/`false` |

**ตัวอย่าง:** `backup-2026-11-07-10-30-00.sql` → true, `../app.js` → false
**จำ:** `{ recursive: true }` ใน `mkdirSync` = สร้างโฟลเดอร์แม่ให้ด้วย และไม่ error ถ้ามีอยู่แล้ว

### ขั้นที่ 11.4.2 ประกอบคำสั่งที่จะรัน

> 🎯 **ขั้นนี้จะได้:** เลือกได้ว่าจะเรียกผ่าน `docker exec` หรือเรียกตรง

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 11.4.2 จะเขียนต่อตรงนี้)`

```js
// เรียก mysqldump / mysql แล้วรอจนจบ: input = ข้อมูลที่ส่งเข้า stdin, คืน stdout เป็น Buffer
// - รันบนเครื่อง (npm run dev, มี DB_CONTAINER): เรียกผ่าน docker exec ใน container ของ MySQL
// - รันใน Docker (docker compose): image ของ backend ติดตั้ง mysql client ไว้ เรียกตรงไปที่ DB_HOST
// ส่งรหัสผ่านทาง MYSQL_PWD เพื่อไม่ให้รหัสผ่านอยู่บน command line
function runMysql(tool, options, input) {
  const { DB_CONTAINER, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  const args = [`-u${DB_USER}`, "--default-character-set=utf8mb4", ...options, DB_NAME];
  const [cmd, cmdArgs] = DB_CONTAINER
    ? ["docker", ["exec", "-i", "-e", `MYSQL_PWD=${DB_PASSWORD}`, DB_CONTAINER, tool, ...args]]
    : [tool, [`-h${DB_HOST}`, `-P${DB_PORT}`, "--skip-ssl", ...args]];

  // (ขั้น 11.4.3 จะเขียนต่อตรงนี้)
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5 | `tool` = `"mysqldump"` หรือ `"mysql"`, `options` = ตัวเลือกเพิ่ม, `input` = ข้อความ SQL ที่จะส่งเข้า (ตอนกู้คืน) | ใช้ฟังก์ชันเดียวทั้งสำรองและกู้คืน |
| 6 | ดึงค่าจาก `.env` (บท 01) | - |
| 7 | ตัวเลือกที่ใช้ทุกแบบ: ผู้ใช้, ภาษาไทยไม่เพี้ยน, ตัวเลือกเพิ่ม, ชื่อฐานข้อมูล | - |
| 8-10 | มี `DB_CONTAINER` → สั่ง `docker exec` เข้าไปรันในกล่อง MySQL, ไม่มี → รันตรงๆ ไปที่ host/port | backend บนเครื่องเราไม่ได้ลง mysqldump จึงยืมของในกล่อง |
| 9 | `-i` = ส่งข้อมูลเข้าได้ (stdin), `-e MYSQL_PWD=…` = ส่งรหัสผ่านเป็นตัวแปรในกล่อง | ไม่ใส่รหัสผ่านใน `-p` ที่คนอื่นเห็นได้ |
| 10 | `--skip-ssl` | MySQL ในเครื่องไม่ได้เปิด SSL |

**ตัวอย่างคำสั่งที่ได้** (`npm run dev`, `.env` มี `DB_CONTAINER=eva_mysql`)

```text
docker exec -i -e MYSQL_PWD=… eva_mysql mysqldump -uroot --default-character-set=utf8mb4 --single-transaction --no-tablespaces eva_db
```

> 🧩 syntax สอนไปแล้ว: แกะ array `const [cmd, cmdArgs] = …` (บท 03 ขั้น 3.7.3) + ternary (บท 04 ขั้น 4.5.1) + `...` กระจาย array (บท 04 ขั้น 4.5.3)

### ขั้นที่ 11.4.3 สั่งโปรแกรมทำงาน แล้วรอผล

> 🎯 **ขั้นนี้จะได้:** `runMysql` คืนผลลัพธ์ได้ด้วย `await`

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 11.4.3 จะเขียนต่อตรงนี้)`

```js
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, { env: { ...process.env, MYSQL_PWD: DB_PASSWORD } });
    const output = [];
    let error = "";
    child.stdout.on("data", (chunk) => output.push(chunk));
    child.stderr.on("data", (chunk) => (error += chunk));
    child.on("error", reject); // เช่น เครื่องไม่มีคำสั่ง docker / mysqldump
    child.on("close", (code) => (code === 0 ? resolve(Buffer.concat(output)) : reject(new Error(error.trim()))));
    child.stdin.end(input);
  });
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | สร้าง "สัญญา" ที่จะสำเร็จ (`resolve`) หรือล้มเหลว (`reject`) ทีหลัง | ให้คนเรียก `await runMysql(…)` ได้ |
| 2 | เริ่มรันโปรแกรม พร้อมตัวแปร `MYSQL_PWD` | แบบเรียกตรงใช้รหัสผ่านจากตัวแปรนี้ |
| 3-4 | ที่เก็บผลลัพธ์ และข้อความ error | - |
| 5 | โปรแกรมพิมพ์ผลออกมาทีละก้อน → เก็บต่อกันใน array | ไฟล์สำรองใหญ่ได้หลาย MB มาไม่พร้อมกัน |
| 6 | เก็บข้อความ error ที่โปรแกรมพิมพ์ | ส่งต่อให้ผู้ใช้เห็นสาเหตุ |
| 7 | เปิดโปรแกรมไม่ได้เลย → ล้มเหลว | เช่น ไม่มี docker |
| 8 | โปรแกรมจบ: รหัส 0 = สำเร็จ → รวมผลทุกก้อนส่งกลับ, อื่นๆ = ล้มเหลวพร้อมข้อความ | - |
| 9 | ส่งข้อความ SQL เข้าโปรแกรม แล้วปิดช่องส่ง | ตอนกู้คืน (ตอนสำรองไม่มี input ก็แค่ปิดช่อง) |

🧩 **Syntax ใหม่: `new Promise` และ `.on("เหตุการณ์", ฟังก์ชัน)`**

```syntax
[k:return] [k:new] [p:Promise][s:((][n:resolve][s:,] [n:reject][s:) =>] [s:{] [v:…] [s:});]
[n:child][s:.][p:on][s:(][v:"close"][s:,] [s:(][n:code][s:) =>] [v:…][s:);]
```

| คำ | สี | ความหมาย |
|---|---|---|
| `new Promise((resolve, reject) => { … })` | 🔵🟣 | ห่องานที่ "จบทีหลัง" ให้ใช้ `await` ได้ |
| `resolve(ค่า)` | 🟢 | เรียกเมื่อสำเร็จ → `await` ได้ค่านี้ |
| `reject(error)` | 🟢 | เรียกเมื่อล้มเหลว → ไปที่ `catch` ของคนเรียก |
| `.on("data", fn)` | 🟣 | "เมื่อเกิดเหตุการณ์นี้ ให้เรียก fn" (คล้าย `onClick` ของปุ่ม) |
| `Buffer.concat(output)` | 🟣 | ต่อข้อมูลหลายก้อนเป็นก้อนเดียว |

**จำ:** งานส่วนใหญ่ (axios, pool.query) คืน Promise ให้อยู่แล้ว เราเขียน `new Promise` เองเฉพาะตอนที่ของเดิมใช้ `.on(...)` แบบนี้

### ขั้นที่ 11.4.4 สำรอง กู้คืน และรายการไฟล์

> 🎯 **ขั้นนี้จะได้:** 3 ฟังก์ชันที่ route จะเรียกใช้

⌨️ **พิมพ์โค้ด:** พิมพ์ต่อท้ายไฟล์ `backend/utils/backup.js`

```js
// สำรองฐานข้อมูลเป็นไฟล์ .sql คืนชื่อไฟล์ เช่น backup-2026-11-07-10-30-00.sql
export async function createBackup(suffix = "") {
  const stamp = new Date().toLocaleString("sv-SE").replace(/[: ]/g, "-"); // 2026-11-07 10:30:00 -> 2026-11-07-10-30-00
  const name = `backup-${stamp}${suffix}.sql`;
  const sql = await runMysql("mysqldump", ["--single-transaction", "--no-tablespaces"]);
  fs.writeFileSync(path.join(BACKUP_DIR, name), sql);
  return name;
}

// กู้คืนจากข้อความ SQL (ไฟล์สำรองมี DROP TABLE + CREATE TABLE + INSERT ครบ)
export const restoreBackup = (sql) => runMysql("mysql", [], sql);

// รายการไฟล์สำรอง ใหม่สุดก่อน
export function listBackups() {
  return fs
    .readdirSync(BACKUP_DIR)
    .filter(isBackupName)
    .map((name) => {
      const stat = fs.statSync(path.join(BACKUP_DIR, name));
      return { name, size: stat.size, created_at: stat.mtime };
    })
    .sort((a, b) => b.created_at - a.created_at);
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | `suffix = ""` = ถ้าไม่ส่งมา ใช้ค่าว่าง | ตอนกู้คืนส่ง `"-before-restore"` ต่อท้ายชื่อ |
| 3 | วันเวลาปัจจุบันแบบ `2026-11-07 10:30:00` แล้วแทน `:` และช่องว่างด้วย `-` | ชื่อไฟล์ห้ามมี `:` (Windows) และเรียงตามเวลาได้ |
| 5 | สั่ง mysqldump: `--single-transaction` = สำรองโดยไม่ล็อกตาราง, `--no-tablespaces` = ไม่ต้องใช้สิทธิ์พิเศษ | - |
| 6 | เขียนผลลงไฟล์ | - |
| 11 | กู้คืน = ส่ง SQL เข้าโปรแกรม `mysql` | - |
| 16 | รายชื่อไฟล์ทั้งหมดในโฟลเดอร์ | - |
| 17 | เอาเฉพาะชื่อที่ตรงรูปแบบ (ส่งชื่อฟังก์ชันเข้า filter ได้เลย) | - |
| 19-20 | ขนาด (byte) และเวลาแก้ไขล่าสุดของไฟล์ | แสดงในตาราง |
| 22 | เรียงใหม่สุดก่อน (บท 06 ขั้น 6.3.5) วันที่ลบกันได้เป็นมิลลิวินาที | - |

> 🧩 syntax ใหม่: ค่าเริ่มต้นของพารามิเตอร์ `function f(x = "")` และ `"sv-SE"` = รูปแบบวันที่ของสวีเดน ซึ่งบังเอิญเป็น `ปี-เดือน-วัน ชม:นาที:วิ` พอดี

### ขั้นที่ 11.4.5 route: รายการ สำรอง และดาวน์โหลด

> 🎯 **ขั้นนี้จะได้:** API 3 ตัวแรกของ `/api/backups`

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `backend/routes/backups.js`

```js
import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { BACKUP_DIR, isBackupName, createBackup, restoreBackup, listBackups } from "../utils/backup.js";

const router = Router();
router.use(verifyToken, requireRole("hr")); // สำรอง/กู้คืนข้อมูลได้เฉพาะ hr

// ไฟล์สำรองต้องเป็นของระบบนี้ (มีตาราง users)
const isSystemBackup = (sql) => sql.includes("CREATE TABLE `users`");

// path ของไฟล์สำรองจากชื่อใน URL (ชื่อผิดรูปแบบหรือไม่มีไฟล์ = null)
function backupPath(name) {
  if (!isBackupName(name)) return null;
  const file = path.join(BACKUP_DIR, name);
  return fs.existsSync(file) ? file : null;
}

// GET /api/backups  รายการไฟล์สำรอง
router.get("/", (req, res) => ok(res, listBackups()));

// POST /api/backups  สำรองข้อมูลตอนนี้
router.post("/", async (req, res) => {
  try {
    const name = await createBackup();
    ok(res, { name }, "สำรองข้อมูลสำเร็จ", 201);
  } catch (err) {
    console.error(err);
    fail(res, 500, `สำรองข้อมูลไม่สำเร็จ: ${err.message}`);
  }
});

// GET /api/backups/:name/download  ดาวน์โหลดไฟล์สำรอง
router.get("/:name/download", (req, res) => {
  const file = backupPath(req.params.name);
  if (!file) return fail(res, 404, "ไม่พบไฟล์สำรอง");
  res.download(file);
});

// (ขั้น 11.4.6 จะเขียนต่อตรงนี้)

export default router;
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 9 | ใส่ด่าน 2 ตัวให้ **ทุก route ในไฟล์** ทีเดียว: login แล้ว และเป็น hr | ไม่ต้องใส่ `requireRole("hr")` ซ้ำทุก route |
| 12 | ไฟล์ของระบบนี้ต้องมีคำสั่งสร้างตาราง users | กันอัปโหลดไฟล์ SQL อื่น |
| 15-19 | ชื่อ → path เต็ม (ชื่อผิดรูปแบบ หรือไม่มีไฟล์ → null) | ใช้ร่วม 4 route |
| 22 | รายการไฟล์ | - |
| 25-33 | สำรองตอนนี้ สำเร็จ 201 ล้มเหลว 500 พร้อมสาเหตุ | - |
| 27 | `await` ได้เพราะ runMysql คืน Promise (ขั้น 11.4.3) | - |
| 36-40 | ดาวน์โหลด (บท 06 ขั้น 6.6.2) | เกณฑ์ 8.4: เก็บไฟล์ไว้ในเครื่อง |

> 🧩 syntax: `.includes("…")` ของข้อความ = มีคำนี้อยู่ไหม (เหมือน `.includes` ของ array) ส่วน `` ` `` ในชื่อตารางอยู่ใน `" "` จึงเป็นตัวอักษรธรรมดา

### ขั้นที่ 11.4.6 route: กู้คืน 2 ทาง และลบไฟล์

> 🎯 **ขั้นนี้จะได้:** API ครบ 6 ตัว

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 11.4.6 จะเขียนต่อตรงนี้)`

```js
// กู้คืน: สำรองข้อมูลปัจจุบันไว้ก่อนเสมอ (กันกู้ผิดไฟล์)
async function restore(res, sql) {
  if (!isSystemBackup(sql)) return fail(res, 400, "ไฟล์นี้ไม่ใช่ไฟล์สำรองของระบบประเมินบุคลากร");
  try {
    const before = await createBackup("-before-restore");
    await restoreBackup(sql);
    ok(res, { before }, `กู้คืนข้อมูลสำเร็จ (ข้อมูลก่อนกู้คืนถูกเก็บไว้ที่ ${before})`);
  } catch (err) {
    console.error(err);
    fail(res, 500, `กู้คืนข้อมูลไม่สำเร็จ: ${err.message}`);
  }
}

// POST /api/backups/restore  form-data: file (.sql)  กู้คืนจากไฟล์ที่อัปโหลด
router.post("/restore", async (req, res) => {
  const file = req.files?.file;
  if (!file) return fail(res, 400, "กรุณาเลือกไฟล์ .sql");
  if (!file.name.toLowerCase().endsWith(".sql")) return fail(res, 400, "รองรับเฉพาะไฟล์ .sql");
  await restore(res, file.data.toString("utf8"));
});

// POST /api/backups/:name/restore  กู้คืนจากไฟล์สำรองบน server
router.post("/:name/restore", async (req, res) => {
  const file = backupPath(req.params.name);
  if (!file) return fail(res, 404, "ไม่พบไฟล์สำรอง");
  await restore(res, fs.readFileSync(file, "utf8"));
});

// DELETE /api/backups/:name
router.delete("/:name", (req, res) => {
  const file = backupPath(req.params.name);
  if (!file) return fail(res, 404, "ไม่พบไฟล์สำรอง");
  fs.rmSync(file);
  ok(res, null, "ลบไฟล์สำรองสำเร็จ");
});
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | ฟังก์ชันกู้คืนที่ใช้ร่วม 2 route รับ `res` มาด้วยเพื่อตอบเอง | ไม่ต้องเขียนซ้ำ |
| 3 | ไม่ใช่ไฟล์ของระบบ → 400 | - |
| 5 | **สำรองข้อมูลปัจจุบันก่อน** ชื่อไฟล์ลงท้าย `-before-restore` | กู้ผิดไฟล์ ก็กู้กลับได้ |
| 6 | กู้คืน | - |
| 7 | ตอบพร้อมชื่อไฟล์ที่สำรองไว้ก่อนกู้ | - |
| 16 | ไฟล์ที่อัปโหลดชื่อช่อง `file` (express-fileupload บท 06) | - |
| 17-18 | ไม่มีไฟล์ / ไม่ใช่ .sql → 400 | - |
| 19 | แปลงข้อมูลไฟล์ (Buffer) เป็นข้อความ แล้วกู้คืน | **เกณฑ์ 8.4: อัปโหลดกลับ** |
| 23-27 | กู้คืนจากไฟล์บน server ตามชื่อใน URL | **เกณฑ์ 8.3** |
| 30-35 | ลบไฟล์สำรอง | ไฟล์เก่าไม่ล้นเครื่อง |

> 🧩 syntax: `.endsWith(".sql")` = ลงท้ายด้วยไหม, `.toLowerCase()` ก่อน เพื่อให้ `.SQL` ผ่านด้วย, `fs.readFileSync(file, "utf8")` = อ่านไฟล์เป็นข้อความ

### ขั้นที่ 11.4.7 ต่อ route เข้า app.js แล้วทดสอบ

> 🎯 **ขั้นนี้จะได้:** สำรองและกู้คืนผ่าน Thunder Client ได้

⌨️ **แก้โค้ด:** เปิด `backend/app.js` เพิ่ม import **ใต้ import ของ committeeRoutes**

```js
import backupRoutes from "./routes/backups.js";
```

แล้วเพิ่มบรรทัดนี้ **ใต้ `app.use("/api/committee", committeeRoutes);`**

```js
app.use("/api/backups", backupRoutes);
```

✅ **ลองเลย:** (token ของ hr) ทำตามลำดับ

| # | ส่ง | ต้องได้ |
|---|---|---|
| 1 | `POST /api/backups` | **201** "สำรองข้อมูลสำเร็จ" + ชื่อไฟล์ และมีไฟล์ใน `backend/backups` |
| 2 | `GET /api/backups` | รายการ 1 ไฟล์ พร้อม size และ created_at |
| 3 | `POST /api/topics` เพิ่มหัวข้อ "หัวข้อทดสอบ" แล้ว `GET /api/reports/overview` | `issues` มี `หัวข้อ "หัวข้อทดสอบ" ยังไม่มีตัวชี้วัด` |
| 4 | `POST /api/backups/<ชื่อไฟล์ข้อ 1>/restore` | **200** "กู้คืนข้อมูลสำเร็จ (ข้อมูลก่อนกู้คืนถูกเก็บไว้ที่ …-before-restore.sql)" |
| 5 | `GET /api/topics` | กลับเป็น 2 หัวข้อ (หัวข้อทดสอบหายไป) |
| 6 | `GET /api/backups/..%2Fapp.js/download` | **404** "ไม่พบไฟล์สำรอง" |
| 7 | `POST /api/backups/restore` แบบ Form แนบไฟล์ `.txt` ชื่อช่อง `file` | **400** "รองรับเฉพาะไฟล์ .sql" |
| 8 | token ของ teach1 → `GET /api/backups` | **403** |

> 💡 เปิดไฟล์ .sql ใน VS Code ดูได้ จะเห็น `DROP TABLE IF EXISTS`, `` CREATE TABLE `users` `` และ `INSERT INTO` ของทุกตาราง

## 11.5 หน้าสำรองข้อมูล (เกณฑ์ 8.3, 8.4)

### ขั้นที่ 11.5.1 state โหลดรายการ และฟังก์ชันเรียก API ที่ใช้เวลานาน

> 🎯 **ขั้นนี้จะได้:** ส่วนการทำงานหลักของหน้า /hr/backups (เมนู "สำรองข้อมูล" มีใน Layout แล้ว บท 07)

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/pages/hr/backups.js`

```jsx
import { useEffect, useRef, useState } from "react";
import { DatabaseBackup, Download, RotateCcw, Trash2, Upload } from "lucide-react";
import api, { errorMessage, downloadFile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";

// สำรองและกู้คืนข้อมูล (mysqldump ผ่าน backend)
export default function Backups() {
  const user = useAuth(["hr"]);
  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileRef = useRef(null);

  const load = () =>
    api
      .get("/backups")
      .then((res) => setList(res.data.data))
      .catch((err) => setMessage({ type: "error", text: errorMessage(err) }));

  useEffect(() => {
    if (user) load();
  }, [user]);

  // เรียก API ที่ใช้เวลานาน: ล็อกปุ่ม แสดงผลลัพธ์ แล้วโหลดรายการใหม่
  const run = async (request) => {
    setBusy(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await request();
      setMessage({ type: "success", text: res.data.message });
      load();
    } catch (err) {
      setMessage({ type: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  // (ขั้น 11.5.2 จะเขียนต่อตรงนี้)
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 11 | `busy` = กำลังทำงานอยู่ไหม | ล็อกปุ่ม และแสดงแถบวิ่ง |
| 13 | จับช่องเลือกไฟล์ (บท 08 ขั้น 8.4.7) | อ่านไฟล์ที่เลือก |
| 15-19 | โหลดรายการไฟล์สำรอง | - |
| 26 | `run` รับ **ฟังก์ชัน** `request` ที่จะยิง API | ใช้ร่วมกันทั้ง สำรอง กู้คืน ลบ |
| 27-28 | เริ่ม: ล็อกปุ่ม ล้างข้อความเดิม | - |
| 30 | เรียกฟังก์ชันที่ส่งมา แล้วรอ | - |
| 31-32 | สำเร็จ: ข้อความเขียว แล้วโหลดรายการใหม่ | ไฟล์ใหม่ขึ้นในตารางทันที |
| 35-36 | **ทำเสมอ** ทั้งสำเร็จและล้มเหลว: ปลดล็อกปุ่ม (บท 06 ขั้น 6.7.7) | ไม่งั้น error แล้วปุ่มค้างล็อกตลอด |

📖 **ทำไมส่งฟังก์ชันเข้า `run` แทนผลลัพธ์?** ถ้าเขียน `run(api.post("/backups"))` คำขอจะถูกยิง **ก่อน** `run` ได้ล็อกปุ่ม การส่ง `() => api.post("/backups")` ทำให้ `run` เป็นคนเลือกจังหวะยิงเอง (หลัง `setBusy(true)`)

### ขั้นที่ 11.5.2 ฟังก์ชันกู้คืน 2 ทาง และลบ

> 🎯 **ขั้นนี้จะได้:** ทุกปุ่มถามยืนยันก่อนทำ

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 11.5.2 จะเขียนต่อตรงนี้)`

```jsx
  const restoreFrom = (b) =>
    confirm(`กู้คืนข้อมูลจาก ${b.name} ?\nข้อมูลปัจจุบันจะถูกแทนที่ (ระบบจะสำรองข้อมูลปัจจุบันไว้ให้ก่อน)`) &&
    run(() => api.post(`/backups/${b.name}/restore`));

  const restoreUpload = () => {
    const file = fileRef.current.files[0];
    if (!file) return setMessage({ type: "error", text: "กรุณาเลือกไฟล์ .sql" });
    if (!confirm(`กู้คืนข้อมูลจากไฟล์ ${file.name} ?\nข้อมูลปัจจุบันจะถูกแทนที่`)) return;
    const form = new FormData();
    form.append("file", file);
    run(() => api.post("/backups/restore", form)).then(() => (fileRef.current.value = ""));
  };

  const remove = (b) => confirm(`ลบไฟล์ ${b.name} ?`) && run(() => api.delete(`/backups/${b.name}`));

  if (!user) return null;

  // (ขั้น 11.5.3 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1-3 | กู้คืนจากไฟล์บน server: ถามก่อน กดตกลงแล้วค่อยยิง | เกณฑ์ 8.3 |
| 2 | `\n` ในข้อความ = ขึ้นบรรทัดใหม่ในกล่องถาม | - |
| 6-7 | อ่านไฟล์ที่เลือก ไม่เลือก → ข้อความแดง | - |
| 9-11 | ห่อไฟล์ใน FormData ชื่อช่อง `file` แล้วส่ง (บท 08 ขั้น 8.4.7) จบแล้วล้างช่องเลือกไฟล์ | เกณฑ์ 8.4 |
| 14 | ลบไฟล์: ถามก่อน | - |

🧩 **Syntax ใหม่: `&&` แทน if สั้นๆ**

```syntax
[p:confirm][s:(][v:"…"][s:)] [s:&&] [p:run][s:(][v:…][s:)]
```

| เขียนแบบนี้ | เหมือนกับ |
|---|---|
| `confirm("…") && run(…)` | `if (confirm("…")) run(…)` |

**จำ:** `a && b` ทำ `b` เฉพาะเมื่อ `a` เป็นจริง (แบบเดียวกับ `{cond && <div/>}` ใน JSX)

### ขั้นที่ 11.5.3 หัวหน้า ปุ่มสำรอง และช่องอัปโหลด

> 🎯 **ขั้นนี้จะได้:** ปุ่ม "สำรองข้อมูลตอนนี้" และกล่องกู้คืนจากไฟล์ในเครื่อง

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 11.5.3 จะเขียนต่อตรงนี้)`

```jsx
  return (
    <Layout user={user}>
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold">สำรองและกู้คืนข้อมูล</h1>
        <button className="btn btn-primary" disabled={busy} onClick={() => run(() => api.post("/backups"))}>
          <DatabaseBackup size={18} /> สำรองข้อมูลตอนนี้
        </button>
      </div>

      {busy && <progress className="progress progress-primary w-full mb-2" />}
      {message.text && <div className={`alert alert-${message.type} mb-4`}>{message.text}</div>}

      <div className="card bg-base-100 shadow mb-4">
        <div className="card-body py-4 flex-row flex-wrap items-center gap-2">
          <span className="font-medium">กู้คืนจากไฟล์ในเครื่อง</span>
          <input ref={fileRef} type="file" accept=".sql" className="file-input file-input-sm w-full sm:w-auto" />
          <button className="btn btn-sm btn-warning" disabled={busy} onClick={restoreUpload}>
            <Upload size={16} /> อัปโหลดและกู้คืน
          </button>
        </div>
      </div>

      {/* (ขั้น 11.5.4 จะเขียนต่อตรงนี้) */}
    </Layout>
  );
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5 | ปุ่มสำรอง ล็อกระหว่างทำงาน ส่ง **ฟังก์ชัน** ยิง API ให้ `run` | กดซ้ำรัวๆ ไม่ได้ |
| 10 | `<progress>` **ไม่ใส่ value** = แถบวิ่งไปมา (ไม่รู้ว่าเหลือเท่าไร) | บอกว่ากำลังทำงาน |
| 14 | `card-body` เรียงแนวนอน ขึ้นบรรทัดใหม่เมื่อไม่พอ | - |
| 16 | ช่องเลือกไฟล์ รับเฉพาะ .sql | มือถือเต็มความกว้าง จอใหญ่พอดีเนื้อ |
| 17 | ปุ่มสีส้ม (เตือนว่าข้อมูลจะถูกแทนที่) | - |

### ขั้นที่ 11.5.4 ตารางไฟล์สำรอง

> 🎯 **ขั้นนี้จะได้:** หน้าสำรองข้อมูลครบ ดาวน์โหลด/กู้คืน/ลบ ได้ทุกไฟล์

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 11.5.4 จะเขียนต่อตรงนี้) */}`

```jsx
      <div className="overflow-x-auto bg-base-100 rounded-box shadow">
        <table className="table">
          <thead>
            <tr>
              <th>ไฟล์สำรอง</th>
              <th>วันเวลา</th>
              <th className="text-right">ขนาด</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.name}>
                <td className="break-all">{b.name}</td>
                <td className="whitespace-nowrap">{new Date(b.created_at).toLocaleString("th-TH")}</td>
                <td className="text-right whitespace-nowrap">{(b.size / 1024).toFixed(1)} KB</td>
                <td className="whitespace-nowrap text-right">
                  <button
                    className="btn btn-xs btn-ghost"
                    title="ดาวน์โหลด"
                    onClick={() => downloadFile(`/backups/${b.name}/download`, b.name).catch((err) => alert(errorMessage(err)))}
                  >
                    <Download size={14} />
                  </button>
                  <button className="btn btn-xs btn-ghost" title="กู้คืน" disabled={busy} onClick={() => restoreFrom(b)}>
                    <RotateCcw size={14} />
                  </button>
                  <button className="btn btn-xs btn-ghost text-error" title="ลบ" disabled={busy} onClick={() => remove(b)}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="text-center opacity-60 p-4">ยังไม่มีไฟล์สำรอง</p>}
      </div>
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 14 | ชื่อไฟล์ ตัดบรรทัดได้ทุกตัวอักษร | ชื่อยาวไม่ดันตารางบนมือถือ |
| 15 | วันเวลาแบบไทย (บท 08) | - |
| 16 | byte ÷ 1024 = KB ทศนิยม 1 ตำแหน่ง | - |
| 18-24 | ดาวน์โหลดผ่าน `downloadFile` (ส่ง token ไปด้วย บท 07) | **เกณฑ์ 8.4** |
| 20 | `title` = ข้อความเมื่อชี้เมาส์ | ปุ่มมีแค่ไอคอน |
| 25-27 | กู้คืนจากไฟล์นี้ | **เกณฑ์ 8.3** |
| 28-30 | ลบ (สีแดง) | - |

> 🧩 syntax ใหม่: `.toFixed(1)` = แสดงทศนิยม 1 ตำแหน่ง (`2.345.toFixed(1)` → `"2.3"`)

✅ **ลองเลย:** login hr → เมนู "สำรองข้อมูล"
1. กด "สำรองข้อมูลตอนนี้" → แถบวิ่ง → กล่องเขียว ตารางมี 1 ไฟล์
2. กดไอคอนดาวน์โหลด → ได้ไฟล์ .sql ในเครื่อง
3. ไปหน้าหัวข้อ เพิ่มหัวข้อใหม่ → Dashboard มีกล่องเหลือง "ยังไม่มีตัวชี้วัด"
4. กลับหน้าสำรองข้อมูล กดกู้คืนไฟล์ในข้อ 1 → ตกลง → ข้อความเขียว และตารางมีไฟล์ `…-before-restore.sql` เพิ่ม
5. Dashboard กลับเป็นกล่องเขียว (หัวข้อที่เพิ่มหายไป)
6. เลือกไฟล์จากข้อ 2 → "อัปโหลดและกู้คืน" → สำเร็จ
7. ไม่เลือกไฟล์แล้วกดอัปโหลด → "กรุณาเลือกไฟล์ .sql"

## 11.6 ออกรายงาน (เกณฑ์ 8.5)

### ขั้นที่ 11.6.1 ตรวจว่ารายงานที่ทำไปแล้วครบเกณฑ์

> 🎯 **ขั้นนี้จะได้:** รู้ว่า 8.5 ทำเสร็จแล้วจากบทก่อนๆ และพูดอธิบายได้

📖 ไม่ต้องเขียนโค้ดเพิ่ม รายงานทำไว้แล้ว 2 แบบ

| แบบ | อยู่ที่ | ทำด้วย |
|---|---|---|
| ดาวน์โหลด CSV (เปิดใน Excel) | หน้ารายงานของ hr (บท 08 ขั้น 8.6.1-8.6.2) | `downloadCsv` (บท 07 ขั้น 7.11.3) ใส่ BOM ให้ Excel อ่านภาษาไทยได้ |
| พิมพ์ / PDF | หน้ารายงาน hr, รายงานรายบุคคล (บท 09 ขั้น 9.4), หน้าประเมินของกรรมการ (บท 10) | `window.print()` + `print:hidden` ซ่อนปุ่ม/เมนู + `hidden print:block` แสดงวันที่พิมพ์ |

✅ **ลองเลย:**
1. หน้ารายงาน → "ดาวน์โหลด CSV" → เปิดใน Excel ภาษาไทยอ่านออก คอลัมน์ไม่เลื่อน
2. กด "พิมพ์ / PDF" → ตัวอย่างก่อนพิมพ์ไม่มีเมนู แท็บ ปุ่ม แต่มีบรรทัด "พิมพ์เมื่อ …"
3. เลือก "บันทึกเป็น PDF" → ได้ไฟล์ PDF

> 💡 **ตอนนำเสนอ 8.5** เปิดให้ดูทั้ง CSV ใน Excel และ PDF แล้วบอกว่าไม่ได้ลง package เพิ่ม (กฎของโจทย์)

## 11.7 ทดสอบรวม

### ขั้นที่ 11.7.1 ทดสอบโจทย์ท้าทายทั้งหมด

> 🎯 **ขั้นนี้จะได้:** มั่นใจว่าได้ครบ 10 คะแนน

| เกณฑ์ | ทดสอบ | ผ่านเมื่อ |
|---|---|---|
| 8.1 | เปิด Dashboard บนคอมและมือถือ | ตัวเลขตรงขั้น 11.3.7 การ์ดเรียงตามจอ |
| 8.2 | เพิ่มหัวข้อว่าง / เพิ่มตัวชี้วัดน้ำหนัก 10 / เปลี่ยนประธานของใครสักคนเป็นกรรมการ | กล่องเหลืองแจ้งตรงเรื่อง ("น้ำหนักรวม… เท่ากับ 110", "ยังไม่มีประธานกรรมการ") |
| 8.2 | กรอกฟอร์มผิด (ชื่อว่าง เบอร์โทรผิด) | ข้อความแดงใต้ช่อง (ระดับ 1) |
| 8.3 | สำรอง → แก้ข้อมูล → กู้คืนจากรายการ | ข้อมูลกลับเหมือนเดิม มีไฟล์ before-restore |
| 8.4 | ดาวน์โหลดไฟล์ → อัปโหลดกลับ | กู้คืนสำเร็จ |
| 8.5 | CSV และ PDF | ขั้น 11.6.1 |

✅ **ผ่านเมื่อ:** ครบทุกแถว แล้ว **รีเซ็ตฐานข้อมูล** (หรือกู้คืนจากไฟล์ที่สำรองไว้ตอนเริ่ม) ก่อนไปบท 12

<details>
<summary>📄 ไฟล์ทั้งหมดของบทนี้ (กดดูไว้เทียบ)</summary>

- [backend/utils/dataCheck.js](../../backend/utils/dataCheck.js)
- [backend/routes/reports.js](../../backend/routes/reports.js) (route `/overview`)
- [backend/utils/backup.js](../../backend/utils/backup.js)
- [backend/routes/backups.js](../../backend/routes/backups.js)
- [backend/app.js](../../backend/app.js)
- [frontend/pages/hr/index.js](../../frontend/pages/hr/index.js)
- [frontend/pages/hr/backups.js](../../frontend/pages/hr/backups.js)

</details>

---

## ❗ ปัญหาที่พบบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| สำรองแล้วได้ 500 "spawn docker ENOENT" | เครื่องไม่มีคำสั่ง docker หรือ Docker Desktop ยังไม่เปิด | เปิด Docker Desktop แล้วลอง `docker ps` ใน Terminal |
| สำรองแล้วได้ 500 "No such container" | `DB_CONTAINER` ใน `.env` ไม่ตรงชื่อกล่องจริง | ดูชื่อด้วย `docker ps` แล้วแก้ `.env` และรีสตาร์ต backend |
| สำรองแล้วได้ 500 "spawn mysqldump ENOENT" | ไม่ได้ตั้ง `DB_CONTAINER` ตอนรัน `npm run dev` | ใส่ `DB_CONTAINER=eva_mysql` ใน `.env` |
| กู้คืนแล้วภาษาไทยเพี้ยน | ไม่ได้ใส่ `--default-character-set=utf8mb4` | ตรวจ args ในขั้น 11.4.2 |
| ไฟล์สำรองขนาด 0 KB | mysqldump ล้มเหลวแต่ไม่ได้เช็ก code | ตรวจบรรทัด `code === 0` ในขั้น 11.4.3 |
| ปุ่มค้างล็อกหลัง error | ไม่ได้ปลดล็อกใน `finally` | ตรวจขั้น 11.5.1 บรรทัด 35-36 |
| วงกลม radial-progress ว่าง | เขียน style ผิด | `style={{ "--value": 60 }}` (ชื่อต้องมี `--` และอยู่ใน `" "`) |
| "สูงสุด -Infinity%" | เรียก `Math.max()` กับ array ว่าง | เช็ก `percents.length ?` ก่อน (ขั้น 11.2.6) |
| Dashboard ว่างเปล่า ไม่มีข้อความ | ลืม `.catch` หรือบรรทัด `if (!data)` | ใส่แพตเทิร์น error (บท 07) |
| หน้า /hr ยังเป็นข้อความทักทาย | ยังไม่ได้ลบไฟล์ชั่วคราวจากบท 08 | ทำขั้น 11.3.1 (ลบของเดิมทั้งไฟล์) |

---

⬅️ [บทที่ 10](10-frontend-committee.md) | ➡️ [บทที่ 12: การทดสอบ](12-testing.md)
