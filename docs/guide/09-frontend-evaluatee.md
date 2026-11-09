# บทที่ 09: หน้าจอผู้รับการประเมิน

## เป้าหมาย

เรียนจบบทนี้แล้ว นักเรียนจะสร้างหน้าของผู้รับการประเมิน (ครู) ได้
- **หน้าหลัก:** ดูความก้าวหน้า
- **ประเมินตนเอง:** ให้คะแนน + แนบหลักฐาน (ไฟล์/URL) + ลบหลักฐาน
- **ผลการประเมิน:** ดูคะแนนและความเห็นกรรมการ + Export PDF
- **รายงานรายบุคคล** ที่ใช้ร่วมกับหน้าของ hr

🏆 ได้คะแนนข้อ 5.2.3-5.2.9 (ข้อ 5.2.1-5.2.2 ทำไปแล้วในบท 07) และ 5.1.13 (รายงานรายบุคคลของ hr)

⏱️ ครั้งแรกที่เรียน: ประมาณ **5 ชั่วโมง** | วันแข่ง (เมื่อคล่องแล้ว): **45 นาที**

### บทนี้แบ่งเป็นขั้นเล็กๆ

| ภาค | ทำอะไร | จำนวนขั้น |
|---|---|---|
| ภาค ก (9.1) | ภาพรวมหน้าของผู้รับการประเมิน | 1 ขั้น |
| ภาค ข (9.2-9.5) | สร้างหน้าทีละส่วน | 17 ขั้น |

### ไฟล์ที่จะสร้างในบทนี้

```
frontend/
├── schemas/evaluation.js               ← ขั้น 9.3  กฎฟอร์มหลักฐาน
├── components/
│   ├── evaluatee/IndicatorCard.js      ← ขั้น 9.3  การ์ดตัวชี้วัด
│   └── EvaluationReport.js             ← ขั้น 9.4  รายงานรายบุคคล (ใช้ร่วม 3 หน้า)
└── pages/
    ├── evaluatee/
    │   ├── index.js                    ← ขั้น 9.2  หน้าหลัก
    │   ├── evaluation.js               ← ขั้น 9.3  ประเมินตนเอง
    │   └── result.js                   ← ขั้น 9.5  ผลการประเมิน
    └── hr/reports/evaluatees/[id].js   ← ขั้น 9.4  รายงานรายบุคคลของ hr
```

> 💡 **ก่อนเริ่มบทนี้** ต้องทำบท 08 เสร็จ และ **รีเซ็ตฐานข้อมูล** (บท 02 ขั้น 2.6.1) แล้ว login เป็น **teach2 / 123456** ระบบจะพาไปหน้าเปลี่ยนรหัสก่อน (บท 07) ตั้งรหัสใหม่ เช่น `teach2pass` แล้วจะเข้าหน้าหลักได้

---

# ภาค ก: ภาพรวม

## 9.1 หน้าของผู้รับการประเมิน

### ขั้นที่ 9.1.1 3 หน้า และ API ที่ใช้

> 🎯 **ขั้นนี้จะได้:** รู้ว่าแต่ละหน้าเรียก API อะไร (API ทำไว้แล้วในบท 06)

| หน้า | URL | API ที่เรียก | เกณฑ์ |
|---|---|---|---|
| หน้าหลัก | `/evaluatee` | `GET /self-evaluations` + `GET /reports/evaluatees/:id` | 5.2.7 ความก้าวหน้า |
| ประเมินตนเอง | `/evaluatee/evaluation` | `GET /self-evaluations`, `PUT /self-evaluations/:id`, `POST …/evidences`, `DELETE /evidences/:id`, `GET /evidences/:id/file` | 5.2.3-5.2.6 |
| ผลการประเมิน | `/evaluatee/result` | `GET /reports/evaluatees/:id` + `GET /self-evaluations` | 5.2.8-5.2.9 |

📖 **id ของตัวเองมาจากไหน?** `user.id` ที่เก็บไว้ตอน login (บท 07 ขั้น 7.6.1) ใช้เรียกรายงานของตัวเอง ส่วน backend ตรวจซ้ำอีกครั้งว่าเป็นเจ้าของจริง (บท 06 ขั้น 6.8.4)

---

# ภาค ข: สร้างหน้าทีละส่วน

## 9.2 หน้าหลัก: ความก้าวหน้า (เกณฑ์ 5.2.7)

### ขั้นที่ 9.2.1 โหลด 2 API พร้อมกัน

> 🎯 **ขั้นนี้จะได้:** ส่วนการทำงานของหน้า /evaluatee

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/pages/evaluatee/index.js`

```jsx
import { useEffect, useState } from "react";
import Link from "next/link";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { scoreLabel } from "@/lib/format";
import Layout from "@/components/Layout";

// หน้าหลักผู้รับการประเมิน: ความก้าวหน้าของแต่ละตัวชี้วัด
export default function EvaluateeHome() {
  const user = useAuth(["evaluatee"]);
  const [data, setData] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api.get("/self-evaluations").then((res) => setData(res.data.data)).catch((err) => setError(errorMessage(err)));
    api.get(`/reports/evaluatees/${user.id}`).then((res) => setReport(res.data.data.summary)).catch((err) => setError(errorMessage(err)));
  }, [user]);

  if (!user) return null;
  // โหลดไม่สำเร็จ (เช่น เซิร์ฟเวอร์ไม่ทำงาน) แสดงข้อความแทนหน้าว่าง
  if (!data) return <Layout user={user}>{error && <div className="alert alert-error mb-4">{error}</div>}</Layout>;

  // (ขั้น 9.2.2 จะเขียนต่อตรงนี้)
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 10 | เฉพาะผู้รับการประเมิน | hr หรือกรรมการเปิดหน้านี้ ถูกพากลับหน้าของตัวเอง |
| 11 | ข้อมูลแบบประเมิน (หัวข้อ > ตัวชี้วัด + ความคืบหน้า) | - |
| 12 | สรุปผลการประเมิน (เก็บแค่ `summary`) | ใช้แสดง "กรรมการยืนยันผลแล้ว x/y" |
| 17 | โหลดแบบประเมินของฉัน | - |
| 18 | โหลดรายงานของฉัน ด้วย `user.id` เก็บเฉพาะส่วน summary | - |
| 23 | ยังไม่มีข้อมูล แสดง error (ถ้ามี) | แพตเทิร์นบท 07 ขั้น 7.14.4 |

> 🧩 syntax ทั้งหมดสอนไปแล้ว ข้อสังเกต: 2 คำขอเขียนแยกกัน (ไม่รอกัน) ต่างจาก `Promise.all` (บท 08) ที่รอให้ครบทุกตัวก่อน ที่นี่ข้อมูลแต่ละอย่างแสดงทันทีที่มา

### ขั้นที่ 9.2.2 กล่องสถิติ

> 🎯 **ขั้นนี้จะได้:** ตัวเลขใหญ่ 2 กล่อง: ความก้าวหน้า และกรรมการที่ยืนยันแล้ว

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 9.2.2 จะเขียนต่อตรงนี้)`

```jsx
  return (
    <Layout user={user}>
      <h1 className="text-2xl font-bold mb-4">สวัสดี {user.full_name}</h1>

      <div className="stats stats-vertical sm:stats-horizontal shadow bg-base-100 w-full mb-4">
        <div className="stat">
          <div className="stat-title">ความก้าวหน้าการประเมินตนเอง</div>
          <div className="stat-value text-primary">{data.summary.progress}%</div>
          <div className="stat-desc">
            บันทึกครบ {data.summary.filled}/{data.summary.indicator_count} ตัวชี้วัด
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">กรรมการยืนยันผลแล้ว</div>
          <div className="stat-value">
            {report ? `${report.confirmed_count}/${report.committee_count}` : "-"}
          </div>
          <div className="stat-desc">
            <Link href="/evaluatee/result" className="link">
              ดูผลและความเห็นกรรมการ
            </Link>
          </div>
        </div>
      </div>

      {/* (ขั้น 9.2.3 จะเขียนต่อตรงนี้) */}
    </Layout>
  );
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5 | กล่องสถิติของ daisyUI: มือถือเรียงแนวตั้ง จอ ≥640px เรียงแนวนอน | responsive |
| 6-12 | กล่องที่ 1: ชื่อ / ตัวเลขใหญ่ / คำอธิบาย | "33.33%" "บันทึกครบ 2/6 ตัวชี้วัด" |
| 15-17 | กล่องที่ 2: ถ้ารายงานโหลดมาแล้ว แสดง "ยืนยัน/ทั้งหมด" ไม่งั้น "-" | - |
| 19-21 | ลิงก์ไปหน้าผลการประเมิน | - |

| class ของ daisyUI | ส่วนไหน |
|---|---|
| `stats` | กล่องรวม |
| `stat` | กล่องย่อย 1 ช่อง |
| `stat-title` | หัวข้อเล็ก |
| `stat-value` | ตัวเลขใหญ่ |
| `stat-desc` | คำอธิบายใต้ตัวเลข |

### ขั้นที่ 9.2.3 ความก้าวหน้ารายตัวชี้วัด

> 🎯 **ขั้นนี้จะได้:** รายการทุกตัวชี้วัด พร้อมคะแนน จำนวนหลักฐาน และแถบความคืบหน้า

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 9.2.3 จะเขียนต่อตรงนี้) */}`

```jsx
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex justify-between items-center gap-2">
            <h2 className="card-title">ความก้าวหน้ารายตัวชี้วัด</h2>
            <Link href="/evaluatee/evaluation" className="btn btn-sm btn-primary">
              ไปประเมินตนเอง
            </Link>
          </div>
          {data.topics.map((t) => (
            <div key={t.id}>
              <h3 className="font-bold mt-3">{t.title}</h3>
              <ul className="divide-y divide-base-200">
                {t.indicators.map((i) => (
                  <li key={i.id} className="py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex-1 min-w-48">{i.name}</span>
                    <span className="text-sm opacity-70 w-40">
                      คะแนน {scoreLabel(i.score, i.score_type)} | หลักฐาน {i.evidences.length}
                    </span>
                    <progress
                      className={`progress w-32 ${i.progress === 100 ? "progress-success" : "progress-primary"}`}
                      value={i.progress}
                      max="100"
                    />
                    <span className="text-sm w-12 text-right">{i.progress}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs opacity-60 mt-2">ตัวชี้วัดครบ 100% เมื่อกรอกคะแนนแล้ว และแนบหลักฐานแล้ว (ถ้าตัวชี้วัดนั้นต้องแนบ)</p>
        </div>
      </div>
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 9 | วนหัวข้อ | - |
| 13 | **วนซ้อน:** ตัวชี้วัดในหัวข้อนั้น | API ส่งข้อมูลมาเป็นชั้นอยู่แล้ว (หัวข้อ > ตัวชี้วัด) |
| 14 | แต่ละแถว: เรียงแนวนอน ล้นแล้วขึ้นบรรทัดใหม่ | มือถือแถวไม่ล้นจอ |
| 15 | ชื่อตัวชี้วัด กินพื้นที่ที่เหลือ (`flex-1`) แต่ไม่แคบกว่า `min-w-48` | - |
| 17 | คะแนน (มี/ไม่มี หรือตัวเลข หรือ "-") และจำนวนหลักฐาน | - |
| 19-23 | แถบความคืบหน้า ครบ 100% สีเขียว ไม่ครบสีหลัก | เห็นทันทีว่าตัวไหนยังไม่ครบ |
| 20 | เลือก class ด้วย ternary ใน template string | - |
| 30 | คำอธิบายเกณฑ์ "ครบ" | ผู้ใช้เข้าใจว่าทำไมบางตัวยังไม่ 100% |

✅ **ลองเลย:** (login teach2) เปิด http://localhost:3000/evaluatee
1. กล่องแรก "33.33%" "บันทึกครบ 2/6 ตัวชี้วัด"
2. กล่องที่สอง "0/3" (ยังไม่มีกรรมการยืนยัน)
3. ตัวชี้วัด "การทำวิจัยในชั้นเรียน" แถบ 50% (กรอกคะแนนแล้วแต่ยังไม่แนบไฟล์)

<details>
<summary>📄 ไฟล์ pages/evaluatee/index.js ทั้งไฟล์ (กดดูไว้เทียบ)</summary>

ไฟล์จริงในโปรเจกต์: [frontend/pages/evaluatee/index.js](../../frontend/pages/evaluatee/index.js)

</details>

## 9.3 หน้าประเมินตนเอง (เกณฑ์ 5.2.3-5.2.6)

📖 **โครงหน้า:** หน้าแม่โหลดข้อมูลแล้ววนแสดง "การ์ด" 1 ใบต่อ 1 ตัวชี้วัด ทุกการ์ดมีฟอร์มของตัวเอง จึงแยกการ์ดเป็น component

```text
pages/evaluatee/evaluation.js          (หน้าแม่: โหลดข้อมูล)
 └── หัวข้อ 1
      ├── <IndicatorCard indicator={…} isOpen={…} onChange={load} />
      ├── <IndicatorCard … />          (การ์ด: ฟอร์มของตัวเอง เรียก API เอง)
      └── …                           บันทึกแล้ว → onChange() → หน้าแม่โหลดใหม่
```

### ขั้นที่ 9.3.1 หน้าแม่: โหลดข้อมูล

> 🎯 **ขั้นนี้จะได้:** ส่วนการทำงานของหน้า /evaluatee/evaluation

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/pages/evaluatee/evaluation.js`

```jsx
import { useEffect, useState } from "react";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { thaiDate } from "@/lib/format";
import Layout from "@/components/Layout";
import IndicatorCard from "@/components/evaluatee/IndicatorCard";

// ประเมินตนเอง: กรอกคะแนน + รายละเอียด/หลักฐานในแต่ละตัวชี้วัด
export default function Evaluation() {
  const user = useAuth(["evaluatee"]);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get("/self-evaluations")
      .then((res) => setData(res.data.data))
      .catch((err) => setError(errorMessage(err)));

  useEffect(() => {
    if (user) load();
  }, [user]);

  if (!user) return null;
  // โหลดไม่สำเร็จ (เช่น เซิร์ฟเวอร์ไม่ทำงาน) แสดงข้อความแทนหน้าว่าง
  if (!data) return <Layout user={user}>{error && <div className="alert alert-error mb-4">{error}</div>}</Layout>;

  // (ขั้น 9.3.2 จะเขียนต่อตรงนี้)
}
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 6 | ดึงการ์ด (สร้างในขั้น 9.3.4) | ระหว่างนี้ error `Module not found` เป็นเรื่องปกติ |
| 14-18 | `load` เป็นฟังก์ชัน (ไม่ใช่เรียกใน useEffect ตรงๆ) | **ส่งให้การ์ดเรียกโหลดใหม่ได้** หลังบันทึก |
| 20-22 | โหลดครั้งแรก | - |

> 🧩 แพตเทิร์นเดียวกับหน้า CRUD ของบท 08 ไม่มี syntax ใหม่

### ขั้นที่ 9.3.2 หน้าแม่: หัวข้อและการ์ด

> 🎯 **ขั้นนี้จะได้:** หน้าประเมินตนเองที่แสดงการ์ดตัวชี้วัดแยกตามหัวข้อ

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 9.3.2 จะเขียนต่อตรงนี้)`

```jsx
  return (
    <Layout user={user}>
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <h1 className="text-2xl font-bold">ประเมินตนเอง</h1>
        <div className="text-sm">
          บันทึกครบ {data.summary.filled}/{data.summary.indicator_count} ตัวชี้วัด
          <progress className="progress progress-primary w-40 block" value={data.summary.progress} max="100" />
        </div>
      </div>

      {data.topics.map((t) => (
        <section key={t.id} className="mb-6">
          <h2 className="text-lg font-bold">{t.title}</h2>
          <p className="text-sm opacity-70 mb-2">
            ช่วงประเมิน {thaiDate(t.start_date)} - {thaiDate(t.end_date)}
          </p>
          {!t.is_open && <div className="alert alert-warning mb-2">หัวข้อนี้ไม่อยู่ในช่วงเวลาการประเมิน ดูข้อมูลได้อย่างเดียว</div>}
          <div className="grid lg:grid-cols-2 gap-4">
            {t.indicators.map((i) => (
              <IndicatorCard key={i.id} indicator={i} isOpen={!!t.is_open} onChange={load} />
            ))}
          </div>
        </section>
      ))}
    </Layout>
  );
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5-8 | ความคืบหน้ารวมมุมขวาบน | บันทึกแล้วตัวเลขขยับทันที (เพราะโหลดใหม่) |
| 11 | 1 หัวข้อ = 1 `<section>` | - |
| 14-16 | ช่วงวันที่ประเมิน | - |
| 17 | หัวข้อปิดแล้ว แสดงกล่องเหลือง | ผู้ใช้รู้ว่าทำไมแก้ไม่ได้ |
| 18 | การ์ด 2 คอลัมน์บนจอใหญ่ | - |
| 20 | ส่ง 3 อย่างให้การ์ด | ดูตารางด้านล่าง |

| prop | ค่า | เอาไว้ทำอะไร |
|---|---|---|
| `indicator` | ข้อมูลตัวชี้วัด (มี score, evidences, progress มาแล้ว) | การ์ดแสดงผล |
| `isOpen` | หัวข้อเปิดอยู่ไหม (`!!` แปลง 1/0 เป็น true/false) | ปิดแล้วการ์ดห้ามแก้ |
| `onChange` | ฟังก์ชัน `load` ของหน้าแม่ | **การ์ดบอกหน้าแม่ให้โหลดใหม่** หลังบันทึก |

> 💡 **ส่งฟังก์ชันเป็น prop** (`onChange={load}`) = ลูกเรียกฟังก์ชันของแม่ได้ เป็นวิธีที่ component ลูก "สื่อสารกลับ" หาแม่

### ขั้นที่ 9.3.3 schema ของฟอร์มหลักฐาน (ตรวจไฟล์ฝั่งหน้า)

> 🎯 **ขั้นนี้จะได้:** ตรวจรายละเอียด URL และไฟล์ (ชนิด/ขนาด) ก่อนอัปโหลด

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/schemas/evaluation.js`

```js
import { z } from "zod";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// รายละเอียดประกอบ + ไฟล์หรือ URL (ไม่บังคับ แนบได้ 1 อย่าง)
export const evidenceSchema = z
  .object({
    description: z.string().trim().min(1, "กรุณากรอกรายละเอียดประกอบ").max(1000, "ต้องไม่เกิน 1000 ตัวอักษร"),
    url: z.union([z.literal(""), z.url({ protocol: /^https?$/, error: "URL ต้องขึ้นต้นด้วย http:// หรือ https://" })]),
    file: z.any(), // FileList จาก <input type="file">
  })
  .refine((d) => !(d.url && d.file?.length), { message: "แนบได้รายการละ 1 อย่าง: ไฟล์ หรือ URL", path: ["url"] })
  .refine((d) => !d.file?.length || /\.(pdf|jpe?g|png)$/i.test(d.file[0].name), {
    message: "รองรับเฉพาะไฟล์ PDF, JPG และ PNG",
    path: ["file"],
  })
  .refine((d) => !d.file?.length || d.file[0].size <= MAX_SIZE, { message: "ไฟล์ต้องมีขนาดไม่เกิน 10MB", path: ["file"] });
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | ขนาดสูงสุด 10MB (เท่ากับ backend) | - |
| 8 | รายละเอียดบังคับ | - |
| 9 | URL ว่างได้ ถ้ากรอกต้อง http/https | เหมือน backend บท 06 ขั้น 6.5.1 |
| 10 | ช่องไฟล์รับอะไรก็ได้ (`z.any()`) | ค่าจากช่องเลือกไฟล์เป็น **FileList** ตรวจด้วย refine แทน |
| 12 | ห้ามแนบทั้ง URL และไฟล์พร้อมกัน | - |
| 13-16 | ถ้ามีไฟล์ ชื่อต้องลงท้าย .pdf .jpg .jpeg .png | ผู้ใช้รู้ทันทีโดยไม่ต้องรออัปโหลด |
| 17 | ถ้ามีไฟล์ ขนาดต้องไม่เกิน 10MB | ไม่เสียเวลาอัปโหลดไฟล์ใหญ่ที่ backend จะปฏิเสธอยู่ดี |

🧩 **Syntax ใหม่: FileList และ regex แบบ "หรือ"**

| เขียน | แปลว่า |
|---|---|
| `d.file?.length` | จำนวนไฟล์ที่เลือก (ไม่ได้เลือก = 0 หรือ undefined) |
| `d.file[0]` | ไฟล์แรก มี `.name` (ชื่อ) และ `.size` (ขนาดไบต์) |
| `!A \|\| B` | "ถ้าไม่มี A ก็ผ่าน ถ้ามี A ต้อง B" (ไม่เลือกไฟล์ = ผ่าน) |
| `/\.(pdf\|jpe?g\|png)$/i` | ลงท้ายด้วย `.pdf` หรือ `.jpg` หรือ `.jpeg` หรือ `.png` (`\|` = หรือ, `e?` = มี e หรือไม่มีก็ได้, `i` = ไม่สนตัวเล็กใหญ่) |
| `.refine(…).refine(…)` | ต่อ refine ได้หลายตัว ตรวจทีละเงื่อนไข |

> 💡 ตรวจไฟล์ฝั่งหน้าเพื่อความสะดวก backend ยังตรวจซ้ำ (ทั้งนามสกุลและชนิดไฟล์จริง บท 06 ขั้น 6.4.1)

### ขั้นที่ 9.3.4 IndicatorCard: ตัวเลือกคะแนน และฟอร์ม

> 🎯 **ขั้นนี้จะได้:** ส่วนต้นของการ์ดตัวชี้วัด

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/components/evaluatee/IndicatorCard.js` (สร้างโฟลเดอร์ `evaluatee` ใน components ก่อน)

```jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Trash2, Paperclip } from "lucide-react";
import api, { errorMessage, downloadFile } from "@/lib/api";
import { validateWith } from "@/lib/validate";
import { SCALE_LABELS, EVIDENCE_TYPES } from "@/lib/constants";
import { evidenceSchema } from "@/schemas/evaluation";
import Field from "@/components/Field";

// ตัวเลือกคะแนนตามรูปแบบตัวชี้วัด
const scoreOptions = (type) =>
  type === "yes_no"
    ? [{ value: 1, label: "มี" }, { value: 0, label: "ไม่มี" }]
    : [1, 2, 3, 4].map((v) => ({ value: v, label: `ระดับ ${v} - ${SCALE_LABELS[v]}` }));

// การ์ดตัวชี้วัด 1 ตัว: กรอกคะแนนตนเอง + รายละเอียดประกอบหลายรายการ
export default function IndicatorCard({ indicator: ind, isOpen, onChange }) {
  const [error, setError] = useState("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: validateWith(evidenceSchema),
    defaultValues: { description: "", url: "", file: undefined },
  });

  // (ขั้น 9.3.5 จะเขียนต่อตรงนี้)
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4 | ดึง `downloadFile` เพิ่ม (บท 07 ขั้น 7.5.3) | ดาวน์โหลดไฟล์หลักฐานที่ต้องใช้ token |
| 11-14 | ฟังก์ชันสร้างรายการตัวเลือกคะแนนตามรูปแบบ | มี/ไม่มี → 2 ตัวเลือก (1, 0) / สเกล → 4 ตัวเลือก พร้อมคำอธิบายระดับ |
| 14 | `[1, 2, 3, 4].map(…)` สร้าง `{ value, label }` 4 ตัว | label เช่น "ระดับ 3 - ปฏิบัติได้ตามระดับ…" |
| 17 | รับ prop `indicator` แต่ตั้งชื่อตัวแปรสั้นว่า `ind` | พิมพ์สั้นลง (ใช้หลายสิบครั้ง) |
| 19-22 | ฟอร์มเพิ่มหลักฐาน ค่าเริ่มต้นว่าง | - |

🧩 **Syntax ใหม่: เปลี่ยนชื่อตอนแกะ props**

```syntax
[k:function] [n:IndicatorCard][s:(][s:{] [p:indicator][s::] [n:ind][s:,] [n:isOpen][s:,] [n:onChange] [s:}][s:)]
```

- เหมือนบท 06 ขั้น 6.6.2 (`id: userId`): prop ชื่อ `indicator` แต่ในฟังก์ชันใช้ชื่อ `ind`
- ternary ข้ามหลายบรรทัด (บรรทัด 12-14): ขึ้นบรรทัดใหม่หน้า `?` และ `:` อ่านง่าย

### ขั้นที่ 9.3.5 IndicatorCard: ฟังก์ชันเรียก API

> 🎯 **ขั้นนี้จะได้:** บันทึกคะแนน เพิ่ม/ลบหลักฐาน และดาวน์โหลดไฟล์

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 9.3.5 จะเขียนต่อตรงนี้)`

```jsx
  // เรียก API แล้วให้หน้าแม่โหลดใหม่ คืน true ถ้าสำเร็จ
  const run = async (request) => {
    setError("");
    try {
      await request;
      onChange();
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    }
  };

  const saveScore = (score) => run(api.put(`/self-evaluations/${ind.id}`, { score }));

  const addEvidence = async ({ description, url, file }) => {
    const form = new FormData();
    form.append("description", description);
    if (url) form.append("url", url);
    if (file?.length) form.append("file", file[0]);
    if (await run(api.post(`/self-evaluations/${ind.id}/evidences`, form))) reset();
  };

  const removeEvidence = (ev) => confirm(`ลบ "${ev.description}" ?`) && run(api.delete(`/evidences/${ev.id}`));

  const download = (ev) => downloadFile(`/evidences/${ev.id}/file`, ev.file_name).catch((err) => setError(errorMessage(err)));

  const canFile = ["file", "any"].includes(ind.evidence_type);
  const canUrl = ["url", "any"].includes(ind.evidence_type);

  // (ขั้น 9.3.6 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2-12 | `run`: รอคำขอ → บอกหน้าแม่โหลดใหม่ → ส่งกลับ true / error → แสดงในการ์ด → false | คล้าย `run` ของบท 08 แต่ส่งกลับผลด้วย เพื่อรู้ว่าควรล้างฟอร์มไหม |
| 14 | บันทึกคะแนน (ส่ง `{ score }`) | เลือกแล้วบันทึกทันที |
| 16-22 | เพิ่มหลักฐาน: สร้าง FormData ใส่รายละเอียด ใส่ URL หรือไฟล์ (ถ้ามี) | **อัปโหลดไฟล์ = ส่ง FormData** (เหมือนนำเข้า CSV บท 08) |
| 21 | ถ้าสำเร็จ (`run` ได้ true) → ล้างฟอร์ม | ไม่สำเร็จ ข้อความที่พิมพ์ไว้ยังอยู่ แก้แล้วส่งใหม่ได้ |
| 24 | ลบ: ถามก่อน ตกลงแล้วค่อยลบ | - |
| 26 | ดาวน์โหลดไฟล์ด้วยชื่อเดิม ถ้าพลาดแสดง error | - |
| 28-29 | ตัวชี้วัดนี้แนบไฟล์ได้ไหม / แนบ URL ได้ไหม | แสดงเฉพาะช่องที่ใช้ได้ (ขั้น 9.3.8) |

> 🧩 syntax ใหม่: `if (await run(…)) reset();` = รอผล แล้วใช้ผลเป็นเงื่อนไขเลย (true → ล้างฟอร์ม)
> 💡 `["file", "any"].includes(ind.evidence_type)` = ชนิดหลักฐานเป็น file หรือ any ไหม (`.includes` บท 04 ขั้น 4.5.2)

### ขั้นที่ 9.3.6 IndicatorCard: หัวการ์ด และเลือกคะแนน

> 🎯 **ขั้นนี้จะได้:** เห็นการ์ด เลือกคะแนนแล้วบันทึกทันที (เกณฑ์ 5.2.5, 5.2.6)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 9.3.6 จะเขียนต่อตรงนี้)`

```jsx
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body p-4 gap-3">
        <div className="flex flex-wrap justify-between gap-2">
          <div className="flex-1 min-w-48">
            <h3 className="font-bold">{ind.name}</h3>
            <p className="text-sm opacity-70">{ind.description}</p>
            <p className="text-xs mt-1">
              น้ำหนัก {ind.weight} | หลักฐาน: {EVIDENCE_TYPES[ind.evidence_type]} {ind.evidence_note && `(${ind.evidence_note})`}
            </p>
          </div>
          <div className="text-sm text-right">
            <div>ความคืบหน้า {ind.progress}%</div>
            <progress className="progress progress-primary w-32" value={ind.progress} max="100" />
          </div>
        </div>

        {error && <div className="alert alert-error py-2">{error}</div>}

        {/* คะแนนตนเอง: เลือกแล้วบันทึกทันที แก้ไขได้ตลอดช่วงที่เปิด */}
        <div>
          <div className="font-medium text-sm mb-1">คะแนนประเมินตนเอง</div>
          <div className="flex flex-col gap-1">
            {scoreOptions(ind.score_type).map((o) => (
              <label key={o.value} className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  className="radio radio-sm radio-primary"
                  name={`score-${ind.id}`}
                  checked={ind.score === o.value}
                  disabled={!isOpen}
                  onChange={() => saveScore(o.value)}
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>

        {/* (ขั้น 9.3.7 จะเขียนต่อตรงนี้) */}
      </div>
    </div>
  );
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 6-10 | ชื่อ คำอธิบาย น้ำหนัก ชนิดหลักฐาน และคำแนะนำ | ผู้ใช้รู้ว่าต้องแนบอะไร |
| 9 | `{ind.evidence_note && `(…)`}` มีคำแนะนำค่อยแสดงในวงเล็บ | - |
| 12-15 | ความคืบหน้าของตัวชี้วัดนี้ | - |
| 18 | error ของการ์ดนี้ (จาก `run`) | เช่น "หัวข้อนี้ไม่อยู่ในช่วงเวลาการประเมิน" |
| 24 | วนตัวเลือกคะแนน (2 หรือ 4 ตัว) | - |
| 25 | `<label>` ครอบ radio + ข้อความ | คลิกที่ข้อความก็เลือกได้ |
| 27 | ปุ่มเลือกแบบวงกลม (radio) ของ daisyUI | เลือกได้ทีละ 1 |
| 29 | `name` เหมือนกันภายในการ์ด แต่ต่างการ์ด | radio ที่ชื่อเดียวกันเลือกได้ทีละ 1 ถ้าทุกการ์ดชื่อเดียวกัน เลือกการ์ดหนึ่งแล้วการ์ดอื่นหลุด |
| 30 | ติ๊กตามค่าจาก API | หลังบันทึก หน้าแม่โหลดใหม่ ค่านี้อัปเดตเอง |
| 31 | หัวข้อปิดแล้วเลือกไม่ได้ | - |
| 32 | เลือกแล้วบันทึกทันที | ไม่ต้องมีปุ่มบันทึก |

🧩 **Syntax ใหม่: radio ที่ควบคุมด้วยข้อมูล**

```syntax
[s:<][p:input] [p:type][s:=][v:"radio"] [p:name][s:={][v:ชื่อกลุ่ม][s:}] [p:checked][s:={][v:เงื่อนไขว่าติ๊กไหม][s:}] [p:onChange][s:={][s:()] [s:=>] [n:ทำเมื่อเลือก][s:}] [s:/>]
```

- ไม่ได้ใช้ RHF กับ radio ชุดนี้ เพราะเลือกแล้วยิง API ทันที ไม่ได้รอกดส่งฟอร์ม

### ขั้นที่ 9.3.7 IndicatorCard: รายการหลักฐาน

> 🎯 **ขั้นนี้จะได้:** เห็นหลักฐานที่แนบแล้ว ดาวน์โหลด เปิดลิงก์ และลบได้ (เกณฑ์ 5.2.3)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 9.3.7 จะเขียนต่อตรงนี้) */}`

```jsx
        {/* รายการรายละเอียดประกอบ */}
        <div>
          <div className="font-medium text-sm mb-1">รายละเอียดประกอบ / หลักฐาน ({ind.evidences.length} รายการ)</div>
          <ul className="space-y-1">
            {ind.evidences.map((ev, n) => (
              <li key={ev.id} className="flex items-start gap-2 bg-base-200 rounded p-2 text-sm">
                <div className="flex-1 min-w-0">
                  <div>
                    {n + 1}. {ev.description}
                  </div>
                  {ev.file_name && (
                    <button type="button" className="link link-primary text-left break-all" onClick={() => download(ev)}>
                      <Paperclip size={14} className="inline" /> {ev.file_name}
                    </button>
                  )}
                  {ev.url && (
                    <a href={ev.url} target="_blank" rel="noreferrer" className="link link-primary block break-all">
                      {ev.url}
                    </a>
                  )}
                </div>
                {isOpen && (
                  <button type="button" className="btn btn-xs btn-ghost text-error" title="ลบรายละเอียด" onClick={() => removeEvidence(ev)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* (ขั้น 9.3.8 จะเขียนต่อตรงนี้) */}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | หัวข้อพร้อมจำนวนรายการ | - |
| 5 | วนหลักฐาน ได้ลำดับ `n` (เริ่ม 0) | แสดงเลข 1, 2, 3 |
| 7 | `min-w-0` | ให้ข้อความยาวตัดบรรทัดได้ในกล่อง flex (ไม่งั้นล้น) |
| 11-15 | มีไฟล์: แสดงเป็น **ปุ่ม** หน้าตาเหมือนลิงก์ กดแล้วดาวน์โหลด | ไฟล์ต้องโหลดผ่าน API ที่แนบ token ลิงก์ธรรมดาส่ง token ไม่ได้ |
| 16-20 | มี URL: แสดงเป็นลิงก์ เปิดแท็บใหม่ | URL ภายนอกเปิดตรงได้ |
| 17 | `target="_blank" rel="noreferrer"` | เปิดแท็บใหม่ และไม่ส่งข้อมูลว่ามาจากเว็บเรา (ความปลอดภัย) |
| 17 | `break-all` | URL ยาวๆ ตัดขึ้นบรรทัดใหม่ ไม่ล้นจอมือถือ |
| 22-26 | ปุ่มลบ แสดงเฉพาะตอนหัวข้อเปิด | - |

### ขั้นที่ 9.3.8 IndicatorCard: ฟอร์มเพิ่มหลักฐาน

> 🎯 **ขั้นนี้จะได้:** แนบไฟล์หรือ URL ได้ตามชนิดที่ตัวชี้วัดกำหนด (เกณฑ์ 5.2.4)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 9.3.8 จะเขียนต่อตรงนี้) */}`

```jsx
        {isOpen && (
          <form onSubmit={handleSubmit(addEvidence)} className="border border-base-300 rounded-box p-3">
            <Field label="เพิ่มรายละเอียดประกอบ" error={errors.description}>
              <textarea className="textarea w-full" rows={2} {...register("description")} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-x-4">
              {canFile && (
                <Field label="แนบไฟล์ (PDF, JPG, PNG ไม่เกิน 10MB)" error={errors.file}>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="file-input w-full" {...register("file")} />
                </Field>
              )}
              {canUrl && (
                <Field label={canFile ? "หรือแนบลิงก์ (URL)" : "แนบลิงก์ (URL)"} error={errors.url}>
                  <input className="input w-full" placeholder="https://" {...register("url")} />
                </Field>
              )}
            </div>
            <button className="btn btn-sm btn-primary mt-2" disabled={isSubmitting}>
              เพิ่มรายละเอียด
            </button>
          </form>
        )}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | ฟอร์มแสดงเฉพาะตอนหัวข้อเปิด | - |
| 2 | ส่งฟอร์ม → ตรวจ schema → `addEvidence` | - |
| 7-11 | ช่องเลือกไฟล์ เฉพาะตัวชี้วัดที่แนบไฟล์ได้ | ตัวชี้วัดแบบ `url` ไม่เห็นช่องนี้ |
| 9 | `accept` = หน้าต่างเลือกไฟล์แสดงเฉพาะชนิดนี้, `{...register("file")}` = ค่าเป็น FileList | ยังต้องตรวจซ้ำ เพราะผู้ใช้เลือก "All files" ได้ |
| 12-16 | ช่อง URL เฉพาะตัวชี้วัดที่แนบลิงก์ได้ ป้ายเปลี่ยนตามว่ามีช่องไฟล์ไหม | ถ้ามีทั้งคู่ ป้ายบอกว่า "หรือ" |

> 💡 ตัวชี้วัดแบบ `none` (ไม่ต้องแนบ) ยังเห็นช่องรายละเอียด เพราะเพิ่มคำอธิบายอย่างเดียวได้ แต่ไม่เห็นช่องไฟล์และ URL

✅ **ลองเลย:** (login teach2) เปิด "ประเมินตนเอง"
1. เลือกคะแนนตัวชี้วัดที่ 2 → แถบความคืบหน้ารวมด้านบนเปลี่ยน
2. กด "เพิ่มรายละเอียด" โดยไม่กรอก → "กรุณากรอกรายละเอียดประกอบ"
3. ตัวชี้วัด "การทำวิจัยในชั้นเรียน": แนบ PDF → ชื่อไฟล์ขึ้นในรายการ ความคืบหน้าเป็น 100% กดชื่อไฟล์แล้วดาวน์โหลดได้
4. แนบไฟล์ .txt (เลือก All files) → "รองรับเฉพาะไฟล์ PDF, JPG และ PNG" (ฝั่งหน้าจับได้)
5. ตัวชี้วัด "การมีส่วนร่วม…" ใส่ URL `abc` → "URL ต้องขึ้นต้นด้วย…"
6. ลบหลักฐาน → ถามก่อน แล้วหาย
7. ตัวชี้วัด "การปฏิบัติตามระเบียบวินัย" (ไม่ต้องแนบ) ไม่มีช่องไฟล์และ URL

<details>
<summary>📄 ไฟล์ทั้งหมดของขั้น 9.3 (กดดูไว้เทียบ)</summary>

- [frontend/pages/evaluatee/evaluation.js](../../frontend/pages/evaluatee/evaluation.js)
- [frontend/schemas/evaluation.js](../../frontend/schemas/evaluation.js)
- [frontend/components/evaluatee/IndicatorCard.js](../../frontend/components/evaluatee/IndicatorCard.js)

</details>

## 9.4 รายงานผลรายบุคคล (component ใช้ร่วม)

📖 รายงานผลรายบุคคลต้องแสดง 3 ที่: หน้าผลของผู้รับการประเมิน (บทนี้), หน้ารายงานของ hr (บทนี้) และหน้ากรรมการ (ใช้ API เดียวกัน) จึงทำเป็น component เดียว รับข้อมูลจาก `GET /api/reports/evaluatees/:id` (บท 06 ขั้น 6.8.4)

### ขั้นที่ 9.4.1 EvaluationReport: จัดกลุ่มตามหัวข้อ และกล่องสถิติ

> 🎯 **ขั้นนี้จะได้:** ส่วนบนของรายงาน: ชื่อ ตำแหน่ง และตัวเลขสรุป 4 กล่อง

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/components/EvaluationReport.js`

```jsx
import { COMMITTEE_ROLES } from "@/lib/constants";
import { scoreLabel, thaiDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

// รายงานผลการประเมินรายบุคคล (ใช้ร่วมกันทั้ง hr / ผู้รับประเมิน / กรรมการ)
// data มาจาก GET /api/reports/evaluatees/:id
export default function EvaluationReport({ data }) {
  const { evaluatee, assignments, rows, summary } = data;

  // จัดกลุ่มตัวชี้วัดตามหัวข้อ
  const topics = [];
  for (const r of rows) {
    let t = topics.find((x) => x.id === r.topic_id);
    if (!t) topics.push((t = { id: r.topic_id, title: r.topic_title, rows: [] }));
    t.rows.push(r);
  }

  return (
    <div className="space-y-4">
      <div className="card bg-base-100 shadow print:shadow-none">
        <div className="card-body">
          <h2 className="card-title">{evaluatee.full_name}</h2>
          <p className="text-sm opacity-70">
            {evaluatee.position} {evaluatee.department}
          </p>
          <div className="stats stats-vertical sm:stats-horizontal bg-base-200 mt-2">
            <div className="stat">
              <div className="stat-title">บันทึกการประเมินตนเอง</div>
              <div className="stat-value text-2xl">{summary.progress}%</div>
              <div className="stat-desc">
                {summary.filled}/{summary.indicator_count} ตัวชี้วัด
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">กรรมการยืนยันผล</div>
              <div className="stat-value text-2xl">
                {summary.confirmed_count}/{summary.committee_count}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">คะแนนจากกรรมการ</div>
              <div className="stat-value text-2xl">{summary.committee_total ?? "-"}</div>
              <div className="stat-desc">
                จาก {summary.total_weight} คะแนน {summary.committee_percent != null && `(${summary.committee_percent}%)`}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">คะแนนประเมินตนเอง</div>
              <div className="stat-value text-2xl">{summary.self_total}</div>
            </div>
          </div>
        </div>
      </div>

      {/* (ขั้น 9.4.2 จะเขียนต่อตรงนี้) */}
    </div>
  );
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 7 | รับ prop `data` (คำตอบทั้งก้อนของ API) | - |
| 8 | แกะ 4 ส่วนออกมา | - |
| 11-16 | **จัดกลุ่ม** แถวตัวชี้วัด (ที่มาเป็นรายการเดียว) ให้เป็นกลุ่มตามหัวข้อ | ตารางแสดงแถวชื่อหัวข้อคั่นระหว่างกลุ่ม |
| 13 | หากลุ่มของหัวข้อนี้ (ใช้ `let` เพราะอาจสร้างใหม่) | - |
| 14 | ยังไม่มี → สร้างกลุ่มใหม่ เก็บไว้ใน `t` และใส่ลงรายการพร้อมกัน | - |
| 15 | ใส่แถวลงกลุ่ม | - |
| 20 | การ์ด ตอนพิมพ์ไม่มีเงา (`print:shadow-none`) | PDF ดูสะอาด |
| 26-50 | กล่องสถิติ 4 ช่อง | สรุปผลบนสุดของรายงาน |
| 42 | คะแนนกรรมการ ถ้ายังไม่มีใครยืนยัน (null) แสดง "-" | `??` บท 04 ขั้น 4.3.5 |
| 44 | มี % ค่อยแสดง `(83.75%)` | - |

> 🧩 syntax ใหม่: `topics.push((t = { … }))` = กำหนดค่าให้ `t` แล้วใช้ค่านั้นทันทีในคำสั่งเดียว (วงเล็บ 2 ชั้น) ถ้าเขียนแยก 2 บรรทัดก็ได้: `t = { … }; topics.push(t);`

### ขั้นที่ 9.4.2 EvaluationReport: ตารางคะแนน (คอลัมน์ตามจำนวนกรรมการ)

> 🎯 **ขั้นนี้จะได้:** ตารางคะแนนรายตัวชี้วัด แยกคะแนนของกรรมการแต่ละคน

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 9.4.2 จะเขียนต่อตรงนี้) */}`

```jsx
      <div className="overflow-x-auto bg-base-100 rounded-box shadow print:shadow-none">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>ตัวชี้วัด</th>
              <th className="text-right">น้ำหนัก</th>
              <th className="text-center">ตนเอง</th>
              {assignments.map((a) => (
                <th key={a.id} className="text-center">
                  {a.committee_name}
                  <div className="font-normal">{COMMITTEE_ROLES[a.committee_role]}</div>
                </th>
              ))}
              <th className="text-center">เฉลี่ยกรรมการ</th>
              <th className="text-right">คะแนนที่ได้</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => [
              <tr key={`t${t.id}`} className="bg-base-200">
                <td colSpan={5 + assignments.length} className="font-bold">
                  {t.title}
                </td>
              </tr>,
              ...t.rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td className="text-right">{r.weight}</td>
                  <td className="text-center">{scoreLabel(r.self_score, r.score_type)}</td>
                  {assignments.map((a) => (
                    <td key={a.id} className="text-center">
                      {scoreLabel(r.scores[a.id], r.score_type)}
                    </td>
                  ))}
                  <td className="text-center">{r.avg_score ?? "-"}</td>
                  <td className="text-right">{r.committee_weighted}</td>
                </tr>
              )),
            ])}
          </tbody>
          <tfoot>
            <tr>
              <td>รวม</td>
              <td className="text-right">{summary.total_weight}</td>
              <td colSpan={2 + assignments.length}></td>
              <td className="text-right">{summary.committee_total ?? "-"}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs opacity-60">
        คะแนนที่ได้ = (คะแนนเฉลี่ยของกรรมการที่ยืนยันผลแล้ว ÷ คะแนนเต็ม) × น้ำหนัก (มี/ไม่มี คะแนนเต็ม 1, สเกล คะแนนเต็ม 4)
      </p>

      {/* (ขั้น 9.4.3 จะเขียนต่อตรงนี้) */}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5-7 | คอลัมน์ตายตัว 3 คอลัมน์แรก | - |
| 8-13 | **คอลัมน์กรรมการ เท่ากับจำนวนกรรมการ** (ชื่อ + บทบาท) | มีกรรมการ 2 หรือ 5 คน ตารางปรับเอง |
| 14-15 | คอลัมน์ตายตัว 2 คอลัมน์ท้าย | - |
| 19 | วนกลุ่มหัวข้อ แต่ละกลุ่มส่งกลับ **array ของแถว** | - |
| 20-24 | แถวแรกของกลุ่ม: ชื่อหัวข้อ กว้างเต็มตาราง | `colSpan` = 5 คอลัมน์ตายตัว + จำนวนกรรมการ |
| 25-37 | ตามด้วยแถวตัวชี้วัดทุกตัวในกลุ่ม (`...` กระจายลงใน array) | - |
| 30-34 | คะแนนของกรรมการแต่ละคน เรียงตรงกับหัวคอลัมน์ | `r.scores` = `{ assignment_id: score }` (บท 06 ขั้น 6.3.6) |
| 35 | คะแนนเฉลี่ยของกรรมการที่ยืนยันแล้ว | - |
| 36 | คะแนนถ่วงน้ำหนักที่ได้ | - |
| 41-48 | ท้ายตาราง: น้ำหนักรวม และคะแนนรวม | ช่องว่างตรงกลางกว้าง `2 + จำนวนกรรมการ` |
| 51-53 | อธิบายสูตรคำนวณ | กรรมการ/ผู้อ่านเข้าใจที่มาของคะแนน |

🧩 **Syntax ใหม่: map ที่ส่งกลับหลายแถวต่อรอบ**

```syntax
[n:topics][s:.][p:map][s:(][s:(][n:t][s:)] [s:=>] [s:\[] [v:<แถวหัวข้อ />][s:,] [s:...][n:t][s:.][n:rows][s:.][p:map][s:(][s:...][s:)] [s:\]][s:)]
```

- แต่ละรอบส่งกลับ array `[แถวหัวข้อ, แถวตัวชี้วัด1, แถวตัวชี้วัด2, …]`
- React แสดง array ซ้อน array ได้ แต่ **ทุกแถวต้องมี key ที่ไม่ซ้ำ** จึงใช้ `` `t${t.id}` `` (มีตัว t นำหน้า) ให้ไม่ชนกับ id ของตัวชี้วัด

### ขั้นที่ 9.4.3 EvaluationReport: การ์ดกรรมการ ความเห็น และลายเซ็น

> 🎯 **ขั้นนี้จะได้:** รายงานครบ แสดงความเห็นสรุปและลายเซ็นของกรรมการ (เกณฑ์ 5.2.9)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 9.4.3 จะเขียนต่อตรงนี้) */}`

```jsx
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignments.map((a) => (
          <div key={a.id} className="card bg-base-100 shadow print:shadow-none print:border">
            <div className="card-body p-4">
              <div className="flex justify-between gap-2">
                <div>
                  <div className="font-bold">{a.committee_name}</div>
                  <div className="text-sm opacity-70">{COMMITTEE_ROLES[a.committee_role]}</div>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <p className="text-sm whitespace-pre-line">{a.summary_comment || "ยังไม่มีความเห็น"}</p>
              {a.signature && (
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.signature} alt="ลายเซ็น" className="h-16 mx-auto" />
                  <div className="text-xs opacity-60">ลงนามเมื่อ {thaiDate(a.confirmed_at)}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | การ์ด 1/2/3 คอลัมน์ตามขนาดจอ | - |
| 3 | ตอนพิมพ์: ไม่มีเงา มีเส้นขอบแทน | การ์ดยังแยกกันชัดบนกระดาษ |
| 10 | ป้ายสถานะ | - |
| 12 | ความเห็นสรุป รักษาการขึ้นบรรทัดที่กรรมการพิมพ์ (`whitespace-pre-line`) | - |
| 13-19 | มีลายเซ็นค่อยแสดงรูป | - |
| 15 | คอมเมนต์บอก ESLint ว่าตั้งใจใช้ `<img>` ธรรมดา | Next แนะนำ `<Image>` แต่รูป data URL ใช้ `<img>` ง่ายกว่า |
| 16 | **รูปลายเซ็น:** ใส่ข้อความ `data:image/png;base64,…` ใน `src` ได้เลย | ไม่ต้องเก็บไฟล์รูปแยก |
| 17 | วันที่ลงนาม | - |

> 💡 ผู้รับการประเมินเห็นความเห็น ลายเซ็น และคะแนน **เฉพาะกรรมการที่ยืนยันแล้ว** เพราะ backend ลบของกรรมการที่ยังไม่ยืนยันออกก่อนส่ง (บท 06 ขั้น 6.8.4) หน้าเว็บไม่ต้องกรองเอง

### ขั้นที่ 9.4.4 หน้ารายงานรายบุคคลของ hr

> 🎯 **ขั้นนี้จะได้:** ปุ่ม "ดูรายงาน" ในหน้ารายงานของ hr (บท 08 ขั้น 8.6.3) ใช้ได้แล้ว (เกณฑ์ 5.1.13)

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/pages/hr/reports/evaluatees/[id].js`

```jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Printer } from "lucide-react";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import EvaluationReport from "@/components/EvaluationReport";

// รายงานผลการประเมินรายบุคคล (พิมพ์/บันทึกเป็น PDF ได้)
export default function EvaluateeReport() {
  const user = useAuth(["hr"]);
  const { id } = useRouter().query;
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !id) return;
    api
      .get(`/reports/evaluatees/${id}`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(errorMessage(err)));
  }, [user, id]);

  if (!user) return null;

  return (
    <Layout user={user}>
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4 print:hidden">
        <Link href="/hr/reports" className="btn btn-sm btn-ghost">
          ← กลับ
        </Link>
        <button className="btn btn-sm btn-primary" onClick={() => window.print()}>
          <Printer size={16} /> พิมพ์ / PDF
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-4">รายงานผลการประเมินรายบุคคล</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {data && <EvaluationReport data={data} />}
    </Layout>
  );
}
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 13 | อ่าน id จากชื่อไฟล์ `[id]` | แพตเทิร์นเดียวกับบท 08 ขั้น 8.6.5 |
| 18 | รอทั้ง user และ id | - |
| 29 | แถบปุ่มซ่อนตอนพิมพ์ | - |
| 39 | มีข้อมูลแล้วแสดงรายงาน **ใช้ component เดียวกับหน้าผู้รับการประเมิน** | เขียนครั้งเดียว ใช้ 2 ที่ |

✅ **ลองเลย:** login เป็น hr → รายงาน → "ดูรายงาน" ของสมชาย → เห็นคะแนนของกรรมการ 3 คน (comm1 ยืนยันแล้ว, comm2 ร่าง 2 ข้อ, comm3 "-") ความเห็น และลายเซ็นของ comm1

> 💡 hr เห็นคะแนนร่างของ comm2 ด้วย (ต่างจากผู้รับการประเมิน) เพราะ hr ต้องติดตามความคืบหน้า แต่คะแนนที่ได้ยังคิดจากกรรมการที่ยืนยันแล้วเท่านั้น

## 9.5 หน้าผลการประเมิน + Export PDF (เกณฑ์ 5.2.8, 5.2.9)

### ขั้นที่ 9.5.1 โหลดรายงาน และปุ่ม Export PDF

> 🎯 **ขั้นนี้จะได้:** หน้า /evaluatee/result ที่แสดงรายงานและบันทึกเป็น PDF ได้

📖 **โจทย์ห้ามใช้ jspdf** เราใช้ความสามารถของเบราว์เซอร์แทน: `window.print()` เปิดหน้าต่างพิมพ์ แล้วผู้ใช้เลือก **"บันทึกเป็น PDF"** (Save as PDF)

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/pages/evaluatee/result.js`

```jsx
import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { scoreLabel } from "@/lib/format";
import Layout from "@/components/Layout";
import EvaluationReport from "@/components/EvaluationReport";

// ผลการประเมิน + ความเห็นกรรมการ + รายละเอียดประกอบ (Export PDF ด้วย window.print)
export default function Result() {
  const user = useAuth(["evaluatee"]);
  const [report, setReport] = useState(null);
  const [self, setSelf] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api.get(`/reports/evaluatees/${user.id}`).then((res) => setReport(res.data.data)).catch((err) => setError(errorMessage(err)));
    api.get("/self-evaluations").then((res) => setSelf(res.data.data)).catch((err) => setError(errorMessage(err)));
  }, [user]);

  if (!user) return null;

  return (
    <Layout user={user}>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold">ผลการประเมิน</h1>
        <button className="btn btn-primary print:hidden" onClick={() => window.print()}>
          <Printer size={18} /> Export PDF
        </button>
      </div>
      <p className="text-sm opacity-70 mb-4 print:hidden">
        แสดงคะแนนและความเห็นเฉพาะกรรมการที่ยืนยันผลแล้ว กด Export PDF แล้วเลือก &quot;บันทึกเป็น PDF&quot;
      </p>

      {report && <EvaluationReport data={report} />}

      {/* (ขั้น 9.5.2 จะเขียนต่อตรงนี้) */}
    </Layout>
  );
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 12-13 | state รายงาน และแบบประเมินตนเอง | หน้านี้แสดงทั้ง 2 อย่าง |
| 18-19 | โหลดรายงานของฉัน และแบบประเมินของฉัน | - |
| 29 | ปุ่ม Export PDF ซ่อนตอนพิมพ์ | กระดาษไม่มีปุ่ม |
| 33-35 | คำแนะนำ ซ่อนตอนพิมพ์ | `&quot;` = เครื่องหมาย `"` ใน JSX (ใส่ตรงๆ ESLint จะเตือน) |
| 37 | รายงาน (component จากขั้น 9.4) | - |

**class `print:` ที่ใช้จัดหน้าตอนพิมพ์**

| class | ผล |
|---|---|
| `print:hidden` | ซ่อนตอนพิมพ์ (ปุ่ม เมนู คำแนะนำ) |
| `print:shadow-none` | เอาเงาออก |
| `print:bg-white` | พื้นหลังขาว (ใน Layout) |
| `print:p-0` | ไม่เว้นขอบ (ใน Layout) |
| `break-before-page` | ขึ้นหน้ากระดาษใหม่ก่อนส่วนนี้ |

### ขั้นที่ 9.5.2 รายละเอียดประกอบ (ขึ้นหน้าใหม่ตอนพิมพ์)

> 🎯 **ขั้นนี้จะได้:** หน้าผลการประเมินครบ พร้อมรายการหลักฐานทุกตัวชี้วัด (เกณฑ์ 5.2.8)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 9.5.2 จะเขียนต่อตรงนี้) */}`

```jsx
      {self && (
        <div className="card bg-base-100 shadow print:shadow-none mt-4 break-before-page">
          <div className="card-body">
            <h2 className="card-title">รายละเอียดประกอบการประเมินตนเอง</h2>
            {self.topics.map((t) => (
              <div key={t.id}>
                <h3 className="font-bold mt-2">{t.title}</h3>
                <ol className="list-decimal list-inside space-y-2">
                  {t.indicators.map((i) => (
                    <li key={i.id}>
                      {i.name} (คะแนนตนเอง {scoreLabel(i.score, i.score_type)})
                      <ul className="list-disc list-inside ml-6 text-sm opacity-80">
                        {i.evidences.map((ev) => (
                          <li key={ev.id}>
                            {ev.description}
                            {ev.file_name && ` [ไฟล์: ${ev.file_name}]`}
                            {ev.url && ` [${ev.url}]`}
                          </li>
                        ))}
                        {i.evidences.length === 0 && <li>ไม่มีรายละเอียดประกอบ</li>}
                      </ul>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | `break-before-page` ขึ้นกระดาษหน้าใหม่ตอนพิมพ์ | รายงานคะแนนอยู่หน้า 1 รายละเอียดอยู่หน้าถัดไป |
| 8 | รายการแบบมีเลขลำดับ (`ol` + `list-decimal`) | - |
| 12 | รายการย่อยแบบจุด (`ul` + `list-disc`) ย่อหน้าเข้า | - |
| 16-17 | ต่อท้ายด้วยชื่อไฟล์หรือ URL ถ้ามี | บนกระดาษกดลิงก์ไม่ได้ จึงพิมพ์เป็นข้อความ |
| 20 | ไม่มีหลักฐาน แสดงข้อความ | - |

✅ **ลองเลย:** logout แล้ว login เป็น **teach1** (เปลี่ยนรหัสก่อน) → "ผลการประเมิน"
1. เห็นคะแนนและความเห็นของ comm1 (ยืนยันแล้ว) พร้อมลายเซ็น
2. **ไม่เห็น** คะแนนร่างของ comm2 (คอลัมน์ comm2 เป็น "-" และการ์ดเขียน "ยังไม่มีความเห็น")
3. กด Export PDF → ตัวอย่างก่อนพิมพ์ไม่มีเมนูและปุ่ม รายละเอียดประกอบขึ้นหน้าใหม่ → เลือก "บันทึกเป็น PDF" ได้

> 💡 **ดูหน้าตอนพิมพ์โดยไม่ต้องพิมพ์จริง:** F12 → กด `Ctrl+Shift+P` → พิมพ์ "Rendering" → ตั้ง "Emulate CSS media type" เป็น `print`
> ❗ ถ้าเครื่องมี Internet Download Manager (IDM) อาจดักไฟล์ PDF จนบันทึกไม่ได้ ไม่ใช่ปัญหาของระบบ ให้ปิด IDM ชั่วคราว

<details>
<summary>📄 ไฟล์ทั้งหมดของขั้น 9.4-9.5 (กดดูไว้เทียบ)</summary>

- [frontend/components/EvaluationReport.js](../../frontend/components/EvaluationReport.js)
- [frontend/pages/hr/reports/evaluatees/[id].js](../../frontend/pages/hr/reports/evaluatees/[id].js)
- [frontend/pages/evaluatee/result.js](../../frontend/pages/evaluatee/result.js)

</details>

---

## ❗ ปัญหาที่พบบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| เลือกคะแนนการ์ดหนึ่ง แล้วการ์ดอื่นหลุด | radio ทุกการ์ดชื่อเดียวกัน | `` name={`score-${ind.id}`} `` |
| เลือกคะแนนแล้วไม่ติ๊ก | ไม่ได้เรียก `onChange()` ให้หน้าแม่โหลดใหม่ | ตรวจฟังก์ชัน `run` |
| อัปโหลดแล้ว backend บอกไม่มีไฟล์ | ส่ง JSON แทน FormData หรือชื่อช่องไม่ใช่ `file` | ใช้ `new FormData()` และ `form.append("file", file[0])` |
| อัปโหลดได้ 400 "ตัวชี้วัดนี้ต้องแนบหลักฐานเป็น URL" | แนบไฟล์ในตัวชี้วัดแบบ url | ตรวจ `canFile` / `canUrl` |
| ฟอร์มไม่ล้างหลังเพิ่ม | ไม่ได้เรียก `reset()` | `if (await run(...)) reset()` |
| คลิกชื่อไฟล์แล้วได้ 401 | ใช้ `<a href>` ไปที่ API ตรงๆ | ใช้ `downloadFile()` |
| ตอนพิมพ์ยังเห็นเมนู | ลืม `print:hidden` ที่ navbar | ตรวจ Layout (บท 07 ขั้น 7.12.2) |
| `Each child in a list should have a unique "key"` ในตารางรายงาน | key ของแถวหัวข้อชนกับแถวตัวชี้วัด | ใช้ `` key={`t${t.id}`} `` |
| ผู้รับการประเมินเห็นคะแนนร่าง | ใช้ API อื่นแทน `/reports/evaluatees/:id` | ใช้ API รายงาน ซึ่ง backend ซ่อนผลร่างให้ |
| หน้าเปลี่ยนรหัสโผล่ทุกครั้งที่ login teach | ข้อมูลตัวอย่างตั้ง `must_change_password` ไว้ | เปลี่ยนรหัสครั้งเดียว (รีเซ็ตฐานข้อมูลแล้วต้องเปลี่ยนใหม่) |

---

⬅️ [บทที่ 08](08-frontend-hr.md) | ➡️ [บทที่ 10: หน้าจอกรรมการ](10-frontend-committee.md)
