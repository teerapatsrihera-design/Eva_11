# บทที่ 08: หน้าจองานบุคลากร

## เป้าหมาย

เรียนจบบทนี้แล้ว นักเรียนจะสร้างหน้าของ hr ได้
- หัวข้อและตัวชี้วัด
- ผู้ใช้งาน (ค้นหา แท็บ รีเซ็ตรหัส นำเข้า CSV)
- มอบหมายกรรมการ และติดตามสถานะ
- รายงาน (เรียงลำดับ ส่งออก CSV พิมพ์)

และใช้ **"แพตเทิร์นหน้า CRUD + Modal"** ได้คล่อง ซึ่งเป็นโครงที่ใช้ซ้ำทั้งระบบ

🏆 ได้คะแนนข้อ 5.1.1-5.1.13 (ฝั่งหน้าจอ) ของส่วน hr

⏱️ ครั้งแรกที่เรียน: ประมาณ **7 ชั่วโมง** (แบ่งเรียน 2-3 ครั้ง) | วันแข่ง (เมื่อคล่องแล้ว): **60 นาที** (Dashboard อยู่บท 11)

### บทนี้แบ่งเป็นขั้นเล็กๆ

| ภาค | ทำอะไร | จำนวนขั้น |
|---|---|---|
| ภาค ก (8.1) | แพตเทิร์นหน้า CRUD | 1 ขั้น |
| ภาค ข (8.2-8.6) | สร้างหน้าของ hr ทีละส่วน | 29 ขั้น |

### ไฟล์ที่จะสร้างในบทนี้

```
frontend/
├── components/
│   ├── Modal.js                    ← ขั้น 8.2
│   ├── StatusBadge.js              ← ขั้น 8.2
│   └── hr/
│       ├── TopicModal.js           ← ขั้น 8.3
│       ├── IndicatorModal.js       ← ขั้น 8.3
│       └── UserModal.js            ← ขั้น 8.4
├── schemas/
│   ├── topic.js                    ← ขั้น 8.3
│   └── indicator.js                ← ขั้น 8.3
└── pages/hr/
    ├── index.js                    ← ขั้น 8.2 (ชั่วคราว บท 11 ทำเป็น Dashboard)
    ├── topics.js                   ← ขั้น 8.3
    ├── users.js                    ← ขั้น 8.4
    ├── assignments.js              ← ขั้น 8.5
    └── reports/
        ├── index.js                ← ขั้น 8.6
        └── committees/[id].js      ← ขั้น 8.6
```

> 💡 **ก่อนเริ่มบทนี้** ต้องทำบท 07 เสร็จ เปิด backend และ frontend ไว้ และ login เป็น **hr1 / 123456**
> หน้ารายงานรายบุคคล `reports/evaluatees/[id].js` ต้องใช้ component ที่สร้างในบท 09 จึงจะสร้างในบท 09 ขั้น 9.4.4

---

# ภาค ก: แนวคิด

## 8.1 แพตเทิร์นหน้า CRUD

### ขั้นที่ 8.1.1 โครงของทุกหน้าที่จัดการข้อมูล

> 🎯 **ขั้นนี้จะได้:** เห็นโครงที่ใช้ซ้ำทุกหน้า (จำได้ = เขียนหน้าใหม่ได้เร็วมาก)

```text
┌────────────────────────────────────────────┐
│ หัวข้อหน้า                     [+ เพิ่ม]      │ ← กด: setEditing({})   (ว่าง = เพิ่มใหม่)
├────────────────────────────────────────────┤
│ รายการ 1                       [แก้] [ลบ]    │ ← แก้: setEditing(item) (มีข้อมูล = แก้ไข)
│ รายการ 2                       [แก้] [ลบ]    │ ← ลบ: confirm → api.delete → load()
└────────────────────────────────────────────┘
          │ editing ไม่ใช่ null
          ▼
   ┌──────────────┐
   │   Modal ฟอร์ม  │ ← บันทึก: item.id มี → PUT, ไม่มี → POST
   │ [ยกเลิก][บันทึก]│    สำเร็จ → onSaved() → ปิด modal + load()
   └──────────────┘
```

**state ที่ใช้ทุกหน้า**

| state | ค่า | ความหมาย |
|---|---|---|
| `items` | `[]` | รายการที่โหลดมา |
| `error` | `""` | ข้อความ error ตอนโหลด |
| `editing` | `null` | modal ปิดอยู่ |
| | `{}` | เปิด modal **เพิ่มใหม่** (ไม่มี id) |
| | `{ id: 3, … }` | เปิด modal **แก้ไข** รายการ id 3 |

**ฟังก์ชันที่ใช้ทุกหน้า**

| ฟังก์ชัน | ทำอะไร |
|---|---|
| `load()` | เรียก API ดึงรายการ เก็บลง state |
| `remove(item)` | ถาม confirm → DELETE → load() |
| `saved()` | ปิด modal (setEditing(null)) → load() |

---

# ภาค ข: สร้างหน้าทีละส่วน

## 8.2 Component พื้นฐาน

### ขั้นที่ 8.2.1 Modal (กล่องเด้ง)

> 🎯 **ขั้นนี้จะได้:** กล่องเด้งที่ฟอร์มเพิ่ม/แก้ไขทุกตัวใช้

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/components/Modal.js`

```jsx
// กล่อง modal ของ DaisyUI แสดงเมื่อถูก render (ปิดโดยให้หน้าแม่เลิก render)
export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        {children}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | รับ หัวข้อ, ฟังก์ชันปิด, เนื้อหา (children) | - |
| 4 | กล่อง modal ของ daisyUI ที่ **แสดงตลอด** (`modal-open`) | - |
| 5-8 | กล่องสีขาวกลางจอ มีหัวข้อ และเนื้อหา (ฟอร์ม) | - |
| 9 | พื้นหลังมืด คลิกแล้วเรียก onClose | คลิกนอกกล่องเพื่อปิด |

📖 **เปิด/ปิด modal ทำอย่างไร?** modal แสดงตลอดเวลาที่ถูกวาด ดังนั้น **หน้าแม่เป็นคนเลือกว่าจะวาดหรือไม่**

```jsx
{editing && <TopicModal item={editing} onClose={() => setEditing(null)} />}
```

- `editing` เป็น null → ไม่วาด → modal หาย
- `editing` เป็น object → วาด → modal แสดง

### ขั้นที่ 8.2.2 StatusBadge (ป้ายสถานะ)

> 🎯 **ขั้นนี้จะได้:** ป้ายสีแสดงสถานะการประเมินของกรรมการ ใช้หลายหน้า

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/components/StatusBadge.js`

```jsx
import { STATUS } from "@/lib/constants";

// ป้ายสถานะการประเมินของกรรมการ
export default function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return <span className={`badge ${s.badge} whitespace-nowrap`}>{s.label}</span>;
}
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5 | หาข้อมูลของสถานะใน `STATUS` (บท 07 ขั้น 7.11.1) ถ้าไม่พบใช้ pending | - |
| 6 | ป้าย daisyUI สีตามสถานะ ข้อความภาษาไทย ไม่ตัดบรรทัด | `<StatusBadge status="draft" />` → ป้ายเหลือง "บันทึกร่าง" |

### ขั้นที่ 8.2.3 หน้าแรกของ hr (ชั่วคราว)

> 🎯 **ขั้นนี้จะได้:** login เป็น hr แล้วไม่เจอหน้า 404 (บท 11 จะเปลี่ยนเป็น Dashboard จริง)

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/pages/hr/index.js`

```jsx
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";

// หน้าแรกของ hr (ชั่วคราว บท 11 จะเปลี่ยนเป็น Dashboard)
export default function HrHome() {
  const user = useAuth(["hr"]);
  if (!user) return null;
  return (
    <Layout user={user}>
      <h1 className="text-2xl font-bold">สวัสดี {user.full_name}</h1>
      <p className="opacity-70">เลือกเมนูด้านบนเพื่อเริ่มทำงาน</p>
    </Layout>
  );
}
```

> 🧩 โครงหน้าที่ต้อง login แบบสั้นที่สุด (บท 07 ขั้น 7.6.3): `useAuth` → `if (!user) return null` → `<Layout>`

✅ **ลองเลย:** เปิด http://localhost:3000/hr เห็น "สวัสดี สมศรี ใจดี" พร้อมแถบเมนู กดเมนูอื่นยังเป็น 404 (สร้างในขั้นต่อไป)

## 8.3 หน้าหัวข้อและตัวชี้วัด (เกณฑ์ 5.1.1-5.1.4)

### ขั้นที่ 8.3.1 schema ฝั่งหน้าของหัวข้อ

> 🎯 **ขั้นนี้จะได้:** กฎตรวจฟอร์มหัวข้อ

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/schemas/topic.js`

```js
import { z } from "zod";

export const topicSchema = z
  .object({
    title: z.string().trim().min(1, "กรุณากรอกชื่อหัวข้อ").max(200, "ชื่อหัวข้อต้องไม่เกิน 200 ตัวอักษร"),
    description: z.string().trim().max(2000, "ต้องไม่เกิน 2000 ตัวอักษร"),
    start_date: z.string().min(1, "กรุณาเลือกวันเริ่มประเมิน"),
    end_date: z.string().min(1, "กรุณาเลือกวันสิ้นสุดการประเมิน"),
  })
  .refine((d) => d.end_date >= d.start_date, {
    message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม",
    path: ["end_date"],
  });
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5-6 | ชื่อบังคับ ไม่เกิน 200 / รายละเอียดไม่บังคับ ไม่เกิน 2000 | กฎเดียวกับ backend (บท 04 ขั้น 4.3.4) |
| 7-8 | วันที่ต้องเลือก | ช่อง `<input type="date">` ที่ไม่เลือกส่ง `""` จึงใช้ `min(1)` |
| 10-13 | วันสิ้นสุดต้องไม่ก่อนวันเริ่ม error แสดงที่ช่องวันสิ้นสุด | `"2026-12-31" >= "2026-11-01"` เทียบข้อความได้ เพราะเรียง ปี-เดือน-วัน |

### ขั้นที่ 8.3.2 TopicModal: สร้างฟอร์มและการบันทึก

> 🎯 **ขั้นนี้จะได้:** ส่วนการทำงานของฟอร์มหัวข้อ ที่ใช้ได้ทั้ง "เพิ่ม" และ "แก้ไข"

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/components/hr/TopicModal.js` (สร้างโฟลเดอร์ `hr` ใน components ก่อน)

```jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import api, { errorMessage } from "@/lib/api";
import { validateWith } from "@/lib/validate";
import { formValues } from "@/lib/format";
import { topicSchema } from "@/schemas/topic";
import Modal from "@/components/Modal";
import Field from "@/components/Field";

// เพิ่ม/แก้ไขหัวข้อ (item.id มีค่า = แก้ไข)
export default function TopicModal({ item, onClose, onSaved }) {
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: validateWith(topicSchema),
    defaultValues: formValues({ title: "", description: "", start_date: "", end_date: "", ...item }),
  });

  const onSubmit = async (data) => {
    try {
      if (item.id) await api.put(`/topics/${item.id}`, data);
      else await api.post("/topics", data);
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // (ขั้น 8.3.3 จะเขียนต่อตรงนี้)
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 11 | รับ 3 props: ข้อมูลที่จะแก้ (`{}` = เพิ่มใหม่), ฟังก์ชันปิด, ฟังก์ชันเมื่อบันทึกสำเร็จ | หน้าแม่ส่งมา |
| 15 | **ค่าเริ่มต้นของฟอร์ม:** ค่าว่างทุกช่องก่อน แล้ว `...item` ทับด้วยข้อมูลเดิม แล้วแปลง null เป็น "" | เพิ่มใหม่ = ฟอร์มว่าง / แก้ไข = ฟอร์มมีข้อมูลเดิม |
| 20 | มี id → PUT (แก้ไข) | **modal เดียวใช้ได้ทั้งเพิ่มและแก้** |
| 21 | ไม่มี id → POST (เพิ่ม) | - |
| 22 | สำเร็จ → บอกหน้าแม่ | หน้าแม่ปิด modal และโหลดรายการใหม่ |
| 24 | ผิดพลาด → แสดงข้อความในกล่อง | เช่น "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม" จาก backend |

🧩 **Syntax ใหม่: `defaultValues` + กระจาย object ทับค่า**

```js
{ title: "", description: "", ...{ id: 1, title: "ด้านการสอน", description: null } }
// { title: "ด้านการสอน", description: null, id: 1 }   ← ตัวหลังทับตัวหน้า
```

- ช่องที่ item มี → ใช้ค่าของ item / ช่องที่ item ไม่มี → ใช้ค่าว่าง
- แล้ว `formValues` (บท 07 ขั้น 7.11.2) เปลี่ยน null เป็น ""

> 🧩 syntax ใหม่: `if (…) คำสั่ง; else คำสั่ง;` แบบบรรทัดเดียว (บท 05 ขั้น 5.4.3) ใช้กับ `await` ได้

### ขั้นที่ 8.3.3 TopicModal: หน้าตาฟอร์ม

> 🎯 **ขั้นนี้จะได้:** TopicModal ครบ

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 8.3.3 จะเขียนต่อตรงนี้)`

```jsx
  return (
    <Modal title={item.id ? "แก้ไขหัวข้อการประเมิน" : "เพิ่มหัวข้อการประเมิน"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {error && <div className="alert alert-error">{error}</div>}
        <Field label="ชื่อหัวข้อ" error={errors.title}>
          <input className="input w-full" {...register("title")} />
        </Field>
        <Field label="รายละเอียด" error={errors.description}>
          <textarea className="textarea w-full" rows={2} {...register("description")} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-x-4">
          <Field label="วันเริ่มประเมิน" error={errors.start_date}>
            <input type="date" className="input w-full" {...register("start_date")} />
          </Field>
          <Field label="วันสิ้นสุดการประเมิน" error={errors.end_date}>
            <input type="date" className="input w-full" {...register("end_date")} />
          </Field>
        </div>
        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button className="btn btn-primary" disabled={isSubmitting}>
            บันทึก
          </button>
        </div>
      </form>
    </Modal>
  );
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | หัวข้อ modal เปลี่ยนตามโหมด | ผู้ใช้รู้ว่ากำลังเพิ่มหรือแก้ |
| 4 | กล่อง error จาก backend | - |
| 9 | ช่องข้อความหลายบรรทัด สูง 2 แถว | รายละเอียด |
| 11-18 | วันที่ 2 ช่องเรียงคู่บนจอใหญ่ (มือถือเรียงลง) | `type="date"` ได้ปฏิทินเลือกวัน และส่งค่ารูปแบบ `YYYY-MM-DD` |
| 19 | แถบปุ่มท้าย modal ของ daisyUI | - |
| 20 | ปุ่มยกเลิก **`type="button"`** | ปุ่มใน `<form>` เป็นปุ่มส่งโดยอัตโนมัติ ถ้าไม่ใส่ กดยกเลิกแล้วจะบันทึก |
| 23 | ปุ่มบันทึก (ปุ่มส่ง) | - |

> 🧩 syntax ใหม่: `rows={2}` ตัวเลขใน JSX ต้องอยู่ใน `{ }` (ถ้าเขียน `rows="2"` ก็ได้แต่เป็นข้อความ)

<details>
<summary>📄 ไฟล์ components/hr/TopicModal.js ทั้งไฟล์ (กดดูไว้เทียบ)</summary>

ไฟล์จริงในโปรเจกต์: [frontend/components/hr/TopicModal.js](../../frontend/components/hr/TopicModal.js)

</details>

### ขั้นที่ 8.3.4 หน้าหัวข้อ: state และฟังก์ชัน

> 🎯 **ขั้นนี้จะได้:** ส่วนการทำงานของหน้า /hr/topics ตามแพตเทิร์นขั้น 8.1.1

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/pages/hr/topics.js`

```jsx
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { thaiDate } from "@/lib/format";
import { SCORE_TYPES, EVIDENCE_TYPES } from "@/lib/constants";
import Layout from "@/components/Layout";
import TopicModal from "@/components/hr/TopicModal";
import IndicatorModal from "@/components/hr/IndicatorModal";

export default function Topics() {
  const user = useAuth(["hr"]);
  const [topics, setTopics] = useState([]);
  const [error, setError] = useState("");
  const [editTopic, setEditTopic] = useState(null); // null = ปิด modal, {} = เพิ่มใหม่
  const [editIndicator, setEditIndicator] = useState(null);

  const load = () =>
    api
      .get("/topics")
      .then((res) => setTopics(res.data.data))
      .catch((err) => setError(errorMessage(err)));

  useEffect(() => {
    if (user) load();
  }, [user]);

  // ลบแล้วโหลดใหม่ (ใช้ได้ทั้งหัวข้อและตัวชี้วัด)
  const remove = async (url, name) => {
    if (!confirm(`ลบ "${name}" ? ข้อมูลการประเมินที่เกี่ยวข้องจะถูกลบด้วย`)) return;
    try {
      await api.delete(url);
      load();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  const saved = () => {
    setEditTopic(null);
    setEditIndicator(null);
    load();
  };

  if (!user) return null;

  // (ขั้น 8.3.5 จะเขียนต่อตรงนี้)
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 9 | ดึง IndicatorModal ที่ยังไม่มี (สร้างในขั้น 8.3.8) | ระหว่างนี้หน้าจะ error `Module not found` เป็นเรื่องปกติ (ใส่ `//` หน้าบรรทัดนี้ชั่วคราวได้) |
| 15-16 | state ของ modal 2 ตัว: หัวข้อ และตัวชี้วัด | หน้านี้จัดการ 2 อย่าง |
| 18-22 | `load` ดึงหัวข้อทั้งหมด (มีตัวชี้วัดซ้อนมาด้วย บท 03 ขั้น 3.10.4) | - |
| 24-26 | เมื่อรู้ผู้ใช้แล้ว โหลดครั้งแรก | - |
| 29-37 | `remove` รับ URL และชื่อ → ถามก่อน → ลบ → โหลดใหม่ / ผิดพลาดแจ้งด้วย alert | ใช้ได้ทั้งลบหัวข้อและตัวชี้วัด |
| 30 | ผู้ใช้กดยกเลิก → จบ ไม่ลบ | **ทุกการลบต้องถามก่อน** |
| 39-43 | `saved` ปิด modal ทั้ง 2 แล้วโหลดใหม่ | ส่งให้ modal เรียกเมื่อบันทึกสำเร็จ |

🧩 **Syntax ใหม่: `confirm()` และ `alert()`**

| คำสั่ง | ทำอะไร |
|---|---|
| `alert("ข้อความ")` | กล่องแจ้งของเบราว์เซอร์ มีปุ่มตกลงปุ่มเดียว |
| `confirm("ข้อความ")` | กล่องถาม มีปุ่ม ตกลง/ยกเลิก ได้ `true` ถ้ากดตกลง |

> 💡 ทั้งคู่เป็น 🟣 ของเบราว์เซอร์ ใช้ได้ใน event (ตอนกดปุ่ม) ไม่ต้อง import

### ขั้นที่ 8.3.5 หน้าหัวข้อ: หัวหน้า และการ์ดหัวข้อ

> 🎯 **ขั้นนี้จะได้:** เห็นการ์ดหัวข้อพร้อมช่วงวันที่ ป้ายเปิด/ปิด และปุ่มแก้/ลบ (เกณฑ์ 5.1.1, 5.1.2)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 8.3.5 จะเขียนต่อตรงนี้)`

```jsx
  return (
    <Layout user={user}>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <div className="flex justify-between items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold">หัวข้อและตัวชี้วัด</h1>
        <button className="btn btn-primary" onClick={() => setEditTopic({})}>
          <Plus size={18} /> เพิ่มหัวข้อ
        </button>
      </div>

      <div className="space-y-4">
        {topics.map((t) => (
          <div key={t.id} className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h2 className="card-title">{t.title}</h2>
                  <p className="text-sm opacity-70">{t.description}</p>
                  <p className="text-sm mt-1">
                    ช่วงประเมิน {thaiDate(t.start_date)} - {thaiDate(t.end_date)}{" "}
                    {t.is_open ? <span className="badge badge-success">เปิดอยู่</span> : <span className="badge">ปิด</span>}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-sm" onClick={() => setEditTopic(t)} title="แก้ไขหัวข้อ">
                    <Pencil size={16} />
                  </button>
                  <button className="btn btn-sm btn-error btn-outline" onClick={() => remove(`/topics/${t.id}`, t.title)} title="ลบหัวข้อ">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* (ขั้น 8.3.6 จะเขียนต่อตรงนี้) */}
            </div>
          </div>
        ))}
        {topics.length === 0 && <p className="text-center opacity-60">ยังไม่มีหัวข้อการประเมิน</p>}
      </div>

      {editTopic && <TopicModal item={editTopic} onClose={() => setEditTopic(null)} onSaved={saved} />}
      {editIndicator && <IndicatorModal item={editIndicator} onClose={() => setEditIndicator(null)} onSaved={saved} />}
    </Layout>
  );
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | กล่อง error ตอนโหลด | - |
| 4-9 | หัวหน้า: ชื่อหน้าซ้าย ปุ่มเพิ่มขวา | กดแล้ว `setEditTopic({})` = เปิด modal เพิ่มใหม่ |
| 11 | `space-y-4` = เว้นระยะระหว่างการ์ดแนวตั้ง | - |
| 12-13 | วนสร้างการ์ด 1 ใบต่อหัวข้อ | - |
| 15 | แถวบนของการ์ด ล้นแล้วขึ้นบรรทัดใหม่ (มือถือ) | - |
| 20 | ช่วงวันที่แบบไทย (`{" "}` = เว้นวรรค 1 ช่อง) | เกณฑ์ 5.1.2 กำหนดช่วงเวลา |
| 21 | ป้ายเขียว "เปิดอยู่" หรือป้ายเทา "ปิด" จาก `is_open` | - |
| 25 | แก้ไข: ส่งหัวข้อทั้งก้อนให้ modal | modal รู้ว่าเป็นการแก้ไข (มี id) |
| 28 | ลบ: ส่ง URL และชื่อให้ `remove` | - |
| 38 | ไม่มีหัวข้อเลย แสดงข้อความ | หน้าไม่ว่างเปล่าแบบงงๆ |
| 41-42 | modal 2 ตัว แสดงเฉพาะตอน state ไม่ใช่ null | ขั้น 8.2.1 |

> 🧩 syntax ใหม่: `{" "}` = ข้อความเว้นวรรค ใช้เมื่อต้องการช่องว่างระหว่างข้อความกับแท็กที่อยู่คนละบรรทัด (JSX ตัดช่องว่างท้ายบรรทัดทิ้ง)

✅ **ลองเลย:** (ใส่ `//` หน้าบรรทัด import IndicatorModal และหน้าบรรทัด `{editIndicator && …}` ใน JSX ให้เป็น `{/* … */}` ชั่วคราว หรือข้ามไปทำขั้น 8.3.7-8.3.9 ก่อนแล้วกลับมาทดสอบ)
1. เปิด http://localhost:3000/hr/topics เห็น 2 การ์ด ป้าย "เปิดอยู่"
2. กด "เพิ่มหัวข้อ" ไม่กรอก กดบันทึก → error ใต้ช่อง
3. วันสิ้นสุดก่อนวันเริ่ม → "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม"
4. เพิ่ม → การ์ดใหม่โผล่ / แก้ → ข้อมูลเดิมอยู่ในฟอร์ม / ลบ → ถามก่อน แล้วหาย

### ขั้นที่ 8.3.6 ตารางตัวชี้วัดในการ์ด

> 🎯 **ขั้นนี้จะได้:** เห็นตัวชี้วัดของแต่ละหัวข้อ พร้อมน้ำหนักรวม (เกณฑ์ 5.1.3, 5.1.4)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 8.3.6 จะเขียนต่อตรงนี้) */}`

```jsx
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>ตัวชี้วัด</th>
                      <th>รูปแบบ</th>
                      <th className="text-right">น้ำหนัก</th>
                      <th>หลักฐาน</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.indicators.map((i) => (
                      <tr key={i.id}>
                        <td>
                          <div className="font-medium">{i.name}</div>
                          <div className="text-xs opacity-60">{i.description}</div>
                        </td>
                        <td className="whitespace-nowrap">{SCORE_TYPES[i.score_type]}</td>
                        <td className="text-right">{i.weight}</td>
                        <td>
                          <div>{EVIDENCE_TYPES[i.evidence_type]}</div>
                          <div className="text-xs opacity-60">{i.evidence_note}</div>
                        </td>
                        <td className="whitespace-nowrap text-right">
                          <button className="btn btn-xs btn-ghost" onClick={() => setEditIndicator(i)} title="แก้ไขตัวชี้วัด">
                            <Pencil size={14} />
                          </button>
                          <button className="btn btn-xs btn-ghost text-error" onClick={() => remove(`/indicators/${i.id}`, i.name)} title="ลบตัวชี้วัด">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2}>รวม {t.indicators.length} ตัวชี้วัด</td>
                      <td className="text-right">{t.indicators.reduce((s, i) => s + i.weight, 0)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div>
                <button className="btn btn-sm btn-outline" onClick={() => setEditIndicator({ topic_id: t.id })}>
                  <Plus size={16} /> เพิ่มตัวชี้วัด
                </button>
              </div>
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | ครอบตารางให้เลื่อนซ้าย-ขวาได้ | **มือถือตารางไม่ล้นจอ** (เกณฑ์ 7.10) |
| 2 | ตารางขนาดเล็กของ daisyUI | - |
| 3-11 | หัวตาราง 5 คอลัมน์ (คอลัมน์สุดท้ายว่างไว้ใส่ปุ่ม) | - |
| 13 | วนตัวชี้วัดของหัวข้อนี้ (`t.indicators` มาจาก API) | - |
| 19 | รูปแบบคะแนนภาษาไทย จาก `SCORE_TYPES` | "สเกล 1-4" แทน `scale_4` |
| 22 | ชนิดหลักฐานภาษาไทย | - |
| 26 | แก้ไข: ส่งตัวชี้วัดทั้งก้อนให้ modal | - |
| 29 | ลบ: ใช้ `remove` ตัวเดียวกับหัวข้อ เปลี่ยนแค่ URL | - |
| 36-42 | ท้ายตาราง: จำนวนตัวชี้วัด และ **ผลรวมน้ำหนัก** | hr เห็นว่าน้ำหนักรวมของทุกหัวข้อครบ 100 หรือยัง |
| 38 | `colSpan={2}` = ช่องนี้กว้าง 2 คอลัมน์ | ให้ "น้ำหนักรวม" ตรงกับคอลัมน์น้ำหนัก |
| 46 | เพิ่มตัวชี้วัด: ส่ง `{ topic_id: t.id }` (ไม่มี id) | modal รู้ว่า "เพิ่มใหม่" ในหัวข้อนี้ |

> 🧩 syntax สอนไปแล้ว: `.reduce()` (บท 06 ขั้น 6.3.1) ตั้งชื่อตัวสะสมว่า `s` (sum)

### ขั้นที่ 8.3.7 schema ฝั่งหน้าของตัวชี้วัด

> 🎯 **ขั้นนี้จะได้:** กฎตรวจฟอร์มตัวชี้วัด

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/schemas/indicator.js`

```js
import { z } from "zod";

export const indicatorSchema = z.object({
  topic_id: z.coerce.number().int().positive("กรุณาเลือกหัวข้อ"),
  name: z.string().trim().min(1, "กรุณากรอกชื่อตัวชี้วัด").max(200, "ชื่อตัวชี้วัดต้องไม่เกิน 200 ตัวอักษร"),
  description: z.string().trim().max(2000, "ต้องไม่เกิน 2000 ตัวอักษร"),
  weight: z.coerce.number({ error: "น้ำหนักต้องเป็นตัวเลข" }).positive("น้ำหนักต้องมากกว่า 0").max(100, "น้ำหนักต้องไม่เกิน 100"),
  score_type: z.enum(["yes_no", "scale_4"], { error: "กรุณาเลือกรูปแบบการประเมิน" }),
  evidence_type: z.enum(["none", "file", "url", "any"], { error: "กรุณาเลือกหลักฐานที่ต้องแนบ" }),
  evidence_note: z.string().trim().max(255, "ต้องไม่เกิน 255 ตัวอักษร"),
});
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4 | topic_id แปลงเป็นตัวเลข | ค่ามาจาก `{ topic_id: t.id }` (ไม่มีช่องให้กรอก แต่ต้องส่งไป) |
| 7 | น้ำหนัก: แปลงข้อความในช่องตัวเลขเป็นตัวเลข แล้วตรวจ 0-100 | `<input type="number">` ส่งค่าเป็นข้อความ |
| 8-9 | ค่าต้องอยู่ในรายการ (ตรงกับ ENUM ของฐานข้อมูล) | ช่อง select |

### ขั้นที่ 8.3.8 IndicatorModal: ฟอร์ม และดูค่าที่เลือกแบบสด

> 🎯 **ขั้นนี้จะได้:** ส่วนการทำงานของฟอร์มตัวชี้วัด ที่รู้ว่าผู้ใช้เลือกรูปแบบคะแนนอะไรอยู่

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/components/hr/IndicatorModal.js`

```jsx
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import api, { errorMessage } from "@/lib/api";
import { validateWith } from "@/lib/validate";
import { formValues } from "@/lib/format";
import { SCORE_TYPES, EVIDENCE_TYPES, SCALE_LABELS } from "@/lib/constants";
import { indicatorSchema } from "@/schemas/indicator";
import Modal from "@/components/Modal";
import Field from "@/components/Field";

// เพิ่ม/แก้ไขตัวชี้วัด (item.id มีค่า = แก้ไข, item.topic_id = หัวข้อที่สังกัด)
export default function IndicatorModal({ item, onClose, onSaved }) {
  const [error, setError] = useState("");
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    resolver: validateWith(indicatorSchema),
    defaultValues: formValues({
      name: "",
      description: "",
      weight: "",
      score_type: "scale_4",
      evidence_type: "any",
      evidence_note: "",
      ...item,
    }),
  });

  const scoreType = useWatch({ control, name: "score_type" }); // ใช้แสดงคำอธิบายระดับ 1-4

  const onSubmit = async (data) => {
    try {
      if (item.id) await api.put(`/indicators/${item.id}`, data);
      else await api.post("/indicators", data);
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // (ขั้น 8.3.9 จะเขียนต่อตรงนี้)
}
```

🔍 **อ่านโค้ดทีละบรรทัด** (ส่วนที่ต่างจาก TopicModal)

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | ดึง `useWatch` เพิ่ม | ดูค่าในฟอร์มแบบสด |
| 14 | แกะ `control` เพิ่มจาก useForm | ส่งให้ useWatch |
| 16-24 | ค่าเริ่มต้น: เลือก "สเกล 1-4" และ "ไฟล์หรือลิงก์" ไว้ก่อน แล้ว `...item` ทับ | ตอนเพิ่ม item = `{ topic_id }` / ตอนแก้ item = ตัวชี้วัดทั้งก้อน |
| 27 | `scoreType` = ค่าปัจจุบันของช่อง score_type **เปลี่ยนทันทีเมื่อผู้ใช้เลือกใหม่** | แสดง/ซ่อนคำอธิบายระดับ 1-4 ในขั้น 8.3.9 |
| 31-32 | PUT / POST ไปที่ `/indicators` | - |

🧩 **Syntax ใหม่: `useWatch`**

```syntax
[k:const] [n:ค่า] [s:=] [p:useWatch][s:(][s:{] [p:control][s:,] [p:name][s::] [v:"ชื่อช่อง"] [s:}][s:)][s:;]
```

- ได้ค่าปัจจุบันของช่องนั้น เมื่อผู้ใช้เปลี่ยน หน้าวาดใหม่ทันที (ไม่ต้องรอกดบันทึก)

### ขั้นที่ 8.3.9 IndicatorModal: select จากค่าคงที่ และแสดงตามเงื่อนไข

> 🎯 **ขั้นนี้จะได้:** IndicatorModal ครบ เลือกรูปแบบการประเมินได้ 2 แบบ (เกณฑ์ 5.1.4)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 8.3.9 จะเขียนต่อตรงนี้)`

```jsx
  return (
    <Modal title={item.id ? "แก้ไขตัวชี้วัด" : "เพิ่มตัวชี้วัด"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {error && <div className="alert alert-error">{error}</div>}
        <Field label="ชื่อตัวชี้วัด" error={errors.name}>
          <input className="input w-full" {...register("name")} />
        </Field>
        <Field label="รายละเอียด" error={errors.description}>
          <textarea className="textarea w-full" rows={2} {...register("description")} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-x-4">
          <Field label="น้ำหนักคะแนน" error={errors.weight}>
            <input type="number" step="0.01" className="input w-full" {...register("weight")} />
          </Field>
          <Field label="รูปแบบการประเมิน" error={errors.score_type}>
            <select className="select w-full" {...register("score_type")}>
              {Object.entries(SCORE_TYPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
        </div>
        {scoreType === "scale_4" && (
          <ul className="text-xs bg-base-200 rounded p-2 my-1">
            {Object.entries(SCALE_LABELS).map(([level, label]) => (
              <li key={level}>ระดับ {level} = {label}</li>
            ))}
          </ul>
        )}
        <div className="grid sm:grid-cols-2 gap-x-4">
          <Field label="หลักฐานที่ต้องแนบ" error={errors.evidence_type}>
            <select className="select w-full" {...register("evidence_type")}>
              {Object.entries(EVIDENCE_TYPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="คำอธิบายหลักฐาน" error={errors.evidence_note}>
            <input className="input w-full" placeholder="เช่น ไฟล์ PDF แผนการสอน" {...register("evidence_note")} />
          </Field>
        </div>
        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button className="btn btn-primary" disabled={isSubmitting}>
            บันทึก
          </button>
        </div>
      </form>
    </Modal>
  );
```

🔍 **อ่านโค้ดทีละบรรทัด** (ส่วนใหม่)

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 13 | ช่องตัวเลข ทศนิยมได้ 2 ตำแหน่ง (`step="0.01"`) | น้ำหนักเช่น 12.5 |
| 17-19 | สร้างตัวเลือกจาก `SCORE_TYPES` | ไม่ต้องพิมพ์ `<option>` ทีละตัว เพิ่มรูปแบบใหม่แก้ที่ constants ที่เดียว |
| 23-29 | ถ้าเลือก "สเกล 1-4" แสดงคำอธิบายระดับ 1-4 | ช่วย hr เข้าใจความหมายของแต่ละระดับ เลือก "มี/ไม่มี" แล้วกล่องนี้หายทันที |
| 33-35 | ตัวเลือกชนิดหลักฐานจาก `EVIDENCE_TYPES` | - |
| 39 | `placeholder` = ข้อความจางในช่องว่าง | บอกตัวอย่างที่ควรกรอก |

🧩 **Syntax ใหม่: สร้าง `<option>` จาก object**

```syntax
[s:{][p:Object][s:.][p:entries][s:(][n:ค่าคงที่][s:)][s:.][p:map][s:(][s:(\[][n:value][s:,] [n:label][s:\])] [s:=>] [s:(]
  [s:<][p:option] [p:key][s:={][n:value][s:}] [p:value][s:={][n:value][s:}][s:>][s:{][n:label][s:}][s:</][p:option][s:>]
[s:))][s:}]
```

- `Object.entries({ yes_no: "มี / ไม่มี", scale_4: "สเกล 1-4" })` → `[["yes_no", "มี / ไม่มี"], ["scale_4", "สเกล 1-4"]]` (บท 07 ขั้น 7.11.2)
- `value` = ค่าที่ส่งไป API (`scale_4`), ข้อความระหว่างแท็ก = ที่ผู้ใช้เห็น ("สเกล 1-4")

✅ **ลองเลย:** (เอา `//` ที่ใส่ชั่วคราวในขั้น 8.3.5 ออก)
1. กด "เพิ่มตัวชี้วัด" ในหัวข้อแรก → modal เด้ง เลือก "สเกล 1-4" อยู่ และเห็นคำอธิบาย 4 ระดับ
2. เปลี่ยนเป็น "มี / ไม่มี" → คำอธิบายหายทันที
3. น้ำหนัก 0 → "น้ำหนักต้องมากกว่า 0"
4. บันทึก → แถวใหม่ในตาราง น้ำหนักรวมเพิ่มขึ้น แล้ว**ลบตัวชี้วัดที่เพิ่มทิ้ง** (ถ้าไม่ลบ ตัวเลขบทต่อไปจะไม่ตรง เช่น สมชายจะเหลือ 85.71% เพราะมีตัวชี้วัดที่ยังไม่กรอก)
5. แก้ตัวชี้วัดที่ 1 เปลี่ยนเป็น "มี / ไม่มี" แล้วบันทึก → กล่องแดงใน modal "ตัวชี้วัดนี้มีการให้คะแนนแล้ว…" (จาก backend บท 05 ขั้น 5.5.4)

<details>
<summary>📄 ไฟล์ทั้งหมดของขั้น 8.3 (กดดูไว้เทียบ)</summary>

- [frontend/schemas/topic.js](../../frontend/schemas/topic.js)
- [frontend/schemas/indicator.js](../../frontend/schemas/indicator.js)
- [frontend/components/hr/TopicModal.js](../../frontend/components/hr/TopicModal.js)
- [frontend/components/hr/IndicatorModal.js](../../frontend/components/hr/IndicatorModal.js)
- [frontend/pages/hr/topics.js](../../frontend/pages/hr/topics.js)

</details>

## 8.4 หน้าผู้ใช้งาน (เกณฑ์ 5.1.5-5.1.7)

### ขั้นที่ 8.4.1 UserModal: ใช้ schema ต่างกันตามโหมด

> 🎯 **ขั้นนี้จะได้:** ส่วนการทำงานของฟอร์มผู้ใช้ ที่เพิ่มแล้วแจ้งรหัสชั่วคราว

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/components/hr/UserModal.js`

```jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import api, { errorMessage } from "@/lib/api";
import { validateWith } from "@/lib/validate";
import { formValues } from "@/lib/format";
import { userSchema, userUpdateSchema } from "@/schemas/user";
import Modal from "@/components/Modal";
import Field from "@/components/Field";

// เพิ่ม/แก้ไขผู้รับการประเมินหรือกรรมการ (item.id มีค่า = แก้ไข)
export default function UserModal({ item, onClose, onSaved }) {
  const isEdit = !!item.id;
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: validateWith(isEdit ? userUpdateSchema : userSchema),
    defaultValues: formValues({
      username: "",
      full_name: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      role: "evaluatee",
      ...item,
    }),
  });

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await api.put(`/users/${item.id}`, data);
      } else {
        const res = await api.post("/users", data);
        alert(`เพิ่มผู้ใช้สำเร็จ\nรหัสผ่านชั่วคราวของ ${data.username} คือ ${res.data.data.temp_password}`);
      }
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // (ขั้น 8.4.2 จะเขียนต่อตรงนี้)
}
```

🔍 **อ่านโค้ดทีละบรรทัด** (ส่วนที่ต่างจาก TopicModal)

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 12 | เก็บโหมดไว้ในตัวแปร `isEdit` (true/false) | ใช้หลายที่ อ่านง่ายกว่าเขียน `item.id` ซ้ำ |
| 15 | แก้ไข → schema ไม่มี role / เพิ่ม → schema เต็ม | แก้ไขผู้ใช้เปลี่ยนบทบาทไม่ได้ (เหมือน backend) |
| 23 | บทบาทเริ่มต้น "ผู้รับการประเมิน" | - |
| 33-34 | เพิ่มสำเร็จ → แจ้ง **รหัสผ่านชั่วคราว** จากคำตอบของ API | hr ต้องเอารหัสไปแจ้งผู้ใช้ (บท 05 ขั้น 5.3.4) |

> 🧩 syntax ใหม่: `\n` ในข้อความ = ขึ้นบรรทัดใหม่ (ใน alert จะแสดงเป็น 2 บรรทัด)

### ขั้นที่ 8.4.2 UserModal: หน้าตาฟอร์ม (ช่องบทบาทเฉพาะตอนเพิ่ม)

> 🎯 **ขั้นนี้จะได้:** UserModal ครบ

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 8.4.2 จะเขียนต่อตรงนี้)`

```jsx
  return (
    <Modal title={isEdit ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="grid sm:grid-cols-2 gap-x-4">
          <Field label="ชื่อผู้ใช้" error={errors.username}>
            <input className="input w-full" {...register("username")} />
          </Field>
          {!isEdit && (
            <Field label="บทบาท" error={errors.role}>
              <select className="select w-full" {...register("role")}>
                <option value="evaluatee">ผู้รับการประเมิน</option>
                <option value="committee">กรรมการ</option>
              </select>
            </Field>
          )}
          <Field label="ชื่อ-สกุล" error={errors.full_name}>
            <input className="input w-full" {...register("full_name")} />
          </Field>
          <Field label="อีเมล" error={errors.email}>
            <input className="input w-full" {...register("email")} />
          </Field>
          <Field label="เบอร์โทร" error={errors.phone}>
            <input className="input w-full" {...register("phone")} />
          </Field>
          <Field label="ตำแหน่ง" error={errors.position}>
            <input className="input w-full" {...register("position")} />
          </Field>
          <Field label="แผนก/หน่วยงาน" error={errors.department}>
            <input className="input w-full" {...register("department")} />
          </Field>
        </div>
        {!isEdit && <p className="text-sm opacity-70 mt-2">ระบบจะสร้างรหัสผ่านชั่วคราวให้ ผู้ใช้ต้องเปลี่ยนเมื่อเข้าครั้งแรก</p>}
        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button className="btn btn-primary" disabled={isSubmitting}>
            บันทึก
          </button>
        </div>
      </form>
    </Modal>
  );
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5 | ช่องกรอกเรียง 2 คอลัมน์บนจอใหญ่ | - |
| 9-16 | ช่องบทบาท **แสดงเฉพาะตอนเพิ่ม** (`!isEdit &&`) | hr เพิ่มได้ทั้งผู้รับการประเมิน (5.1.5) และกรรมการ (5.1.6) |
| 11-14 | select ที่พิมพ์ตัวเลือกเอง 2 ตัว | มีแค่ 2 ค่า (hr สร้าง hr ไม่ได้) |
| 33 | ข้อความอธิบายเรื่องรหัสผ่าน เฉพาะตอนเพิ่ม | - |

### ขั้นที่ 8.4.3 หน้าผู้ใช้: state โหลดข้อมูล และแท็บกรองบทบาท

> 🎯 **ขั้นนี้จะได้:** ส่วนการทำงานของหน้า /hr/users ที่กดแท็บแล้วโหลดใหม่เอง

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/pages/hr/users.js`

```jsx
import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, KeyRound, Upload, Download } from "lucide-react";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ROLE_NAMES } from "@/lib/constants";
import Layout from "@/components/Layout";
import UserModal from "@/components/hr/UserModal";

const TABS = { "": "ทั้งหมด", evaluatee: "ผู้รับการประเมิน", committee: "กรรมการ" };

export default function Users() {
  const user = useAuth(["hr"]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null); // null = ปิด modal, {} = เพิ่มใหม่
  const fileRef = useRef(null); // ช่องเลือกไฟล์ CSV

  // GET /users?role=...&q=...
  const load = () =>
    api
      .get("/users", { params: { role, q } })
      .then((res) => setUsers(res.data.data))
      .catch((err) => setError(errorMessage(err)));

  useEffect(() => {
    if (user) load();
  }, [user, role]); // eslint-disable-line react-hooks/exhaustive-deps

  // (ขั้น 8.4.4 จะเขียนต่อตรงนี้)
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | ดึง `useRef` เพิ่ม | ใช้ในขั้น 8.4.7 |
| 9 | แท็บ: ค่าที่ส่ง API → ชื่อที่แสดง (`""` = ไม่กรอง) | อยู่นอก component เพราะไม่เปลี่ยนค่า |
| 15 | บทบาทที่เลือกในแท็บ | - |
| 16 | คำค้นหา | - |
| 18 | ตัวอ้างอิงถึงช่องเลือกไฟล์ (ขั้น 8.4.7) | - |
| 21-25 | โหลดผู้ใช้ ส่ง role และ q ไปเป็น query string | `params: { role, q }` → `/users?role=evaluatee&q=สม` (axios สร้างให้) |
| 27-29 | โหลดใหม่ **เมื่อ user หรือ role เปลี่ยน** | กดแท็บ (setRole) แล้วรายการเปลี่ยนเอง ไม่ต้องสั่งโหลด |

> 🧩 syntax ใหม่: `{ params: { … } }` ตัวเลือกของ axios ใส่ query string ให้ (ค่าว่างถูกส่งเป็น `role=` ซึ่ง backend มองว่าไม่กรอง)
> 💡 คอมเมนต์ `eslint-disable-line` = บอก ESLint ว่าตั้งใจไม่ใส่ `load` และ `q` ใน dependency (ไม่อยากให้โหลดใหม่ทุกครั้งที่พิมพ์ค้นหา)

### ขั้นที่ 8.4.4 รีเซ็ตรหัสผ่าน และลบผู้ใช้

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชันของปุ่มในตาราง (เกณฑ์ 5.1.7)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 8.4.4 จะเขียนต่อตรงนี้)`

```jsx
  const resetPassword = async (u) => {
    if (!confirm(`รีเซ็ตรหัสผ่านของ ${u.full_name} ?`)) return;
    try {
      const res = await api.put(`/users/${u.id}/reset-password`);
      alert(`รหัสผ่านชั่วคราวของ ${u.username} คือ ${res.data.data.temp_password}`);
      load();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  const remove = async (u) => {
    if (!confirm(`ลบผู้ใช้ ${u.full_name} ? ข้อมูลการประเมินของผู้ใช้นี้จะถูกลบด้วย`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      load();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  // (ขั้น 8.4.7 จะเขียนต่อตรงนี้)

  if (!user) return null;

  // (ขั้น 8.4.5 จะเขียนต่อตรงนี้)
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1-10 | ถามก่อน → รีเซ็ต → แจ้งรหัสใหม่ → โหลดใหม่ | ป้าย "รอเปลี่ยน" โผล่ในตาราง |
| 12-20 | ถามก่อน (เตือนว่าข้อมูลประเมินหายด้วย) → ลบ → โหลดใหม่ | ลบผิดคนเสียข้อมูลมาก จึงเตือนชัดๆ |

> 🧩 แพตเทิร์นเดียวกับ `remove` ของหน้าหัวข้อ (ขั้น 8.3.4) ไม่มี syntax ใหม่

### ขั้นที่ 8.4.5 หัวหน้า แท็บ และช่องค้นหา

> 🎯 **ขั้นนี้จะได้:** ส่วนบนของหน้าผู้ใช้

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 8.4.5 จะเขียนต่อตรงนี้)`

```jsx
  return (
    <Layout user={user}>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold">ผู้ใช้งาน</h1>
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          <Plus size={18} /> เพิ่มผู้ใช้
        </button>
      </div>

      {/* (ขั้น 8.4.7 จะเขียนต่อตรงนี้) */}

      <div className="flex flex-wrap gap-2 mb-3">
        <div role="tablist" className="tabs tabs-box">
          {Object.entries(TABS).map(([value, label]) => (
            <button key={value} role="tab" className={`tab ${role === value ? "tab-active" : ""}`} onClick={() => setRole(value)}>
              {label}
            </button>
          ))}
        </div>
        <form
          className="flex gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
        >
          <input className="input" placeholder="ค้นหาชื่อ" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn">ค้นหา</button>
        </form>
      </div>

      {/* (ขั้น 8.4.6 จะเขียนต่อตรงนี้) */}

      {editing && (
        <UserModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </Layout>
  );
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 14-20 | ปุ่มแท็บ 3 ปุ่มจาก `TABS` แท็บที่ตรงกับ role ได้ class `tab-active` | กดแล้ว setRole → useEffect โหลดใหม่ (ขั้น 8.4.3) |
| 21-30 | ฟอร์มค้นหา: กด Enter หรือปุ่ม "ค้นหา" แล้วโหลดใหม่ | - |
| 24 | `e.preventDefault()` | **กันหน้าโหลดใหม่** (ฟอร์ม HTML ปกติจะโหลดหน้าใหม่เมื่อส่ง) |
| 28 | ช่องค้นหาที่ผูกกับ state `q` | - |
| 35-44 | modal ผู้ใช้ เขียน `onSaved` เป็นฟังก์ชันในที่เลย | ปิด modal + โหลดใหม่ |

🧩 **Syntax ใหม่: controlled input (ช่องกรอกที่ผูกกับ state)**

```syntax
[s:<][p:input] [p:value][s:={][n:state][s:}] [p:onChange][s:={][s:(][n:e][s:)] [s:=>] [n:setState][s:(][n:e][s:.][p:target][s:.][p:value][s:)][s:}] [s:/>]
```

| ส่วน | ทำอะไร |
|---|---|
| `value={q}` | ช่องแสดงค่าจาก state |
| `onChange={(e) => setQ(e.target.value)}` | ทุกครั้งที่พิมพ์ เอาค่าในช่อง (`e.target.value`) ไปเก็บใน state |
| `e` | ข้อมูลของเหตุการณ์ (event) `e.target` = ช่องที่ถูกพิมพ์ |

> 💡 ฟอร์มที่ใช้ RHF ไม่ต้องทำแบบนี้ (`register` จัดการให้) แต่ช่องเดี่ยวๆ ที่ไม่ได้อยู่ในฟอร์ม RHF อย่างช่องค้นหา ใช้แบบนี้

### ขั้นที่ 8.4.6 ตารางผู้ใช้ (ซ่อนปุ่มของบัญชี hr)

> 🎯 **ขั้นนี้จะได้:** ตารางผู้ใช้พร้อมปุ่มแก้ รีเซ็ตรหัส ลบ

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 8.4.6 จะเขียนต่อตรงนี้) */}`

```jsx
      <div className="overflow-x-auto bg-base-100 rounded-box shadow">
        <table className="table">
          <thead>
            <tr>
              <th>ชื่อผู้ใช้</th>
              <th>ชื่อ-สกุล</th>
              <th>บทบาท</th>
              <th>ตำแหน่ง / แผนก</th>
              <th>รหัสผ่าน</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>
                  <div>{u.full_name}</div>
                  <div className="text-xs opacity-60">{u.email}</div>
                </td>
                <td className="whitespace-nowrap">{ROLE_NAMES[u.role]}</td>
                <td>
                  <div>{u.position}</div>
                  <div className="text-xs opacity-60">{u.department}</div>
                </td>
                <td>{u.must_change_password ? <span className="badge badge-warning whitespace-nowrap">รอเปลี่ยน</span> : "-"}</td>
                <td className="whitespace-nowrap text-right">
                  {u.role !== "hr" && (
                    <>
                      <button className="btn btn-xs btn-ghost" onClick={() => setEditing(u)} title="แก้ไข">
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-xs btn-ghost" onClick={() => resetPassword(u)} title="รีเซ็ตรหัสผ่าน">
                        <KeyRound size={14} />
                      </button>
                      <button className="btn btn-xs btn-ghost text-error" onClick={() => remove(u)} title="ลบ">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-center opacity-60 p-4">ไม่พบผู้ใช้</p>}
      </div>
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | ตารางเลื่อนได้บนมือถือ พื้นขาวมุมมน | - |
| 21 | บทบาทเป็นภาษาไทย | - |
| 26 | ป้ายเหลือง "รอเปลี่ยน" ถ้ายังไม่ได้เปลี่ยนรหัส | hr รู้ว่าใครยังไม่เคยเข้าระบบ |
| 28 | **ปุ่มทั้งหมดแสดงเฉพาะผู้ใช้ที่ไม่ใช่ hr** | backend ก็ไม่ยอมอยู่แล้ว (บท 05) แต่ซ่อนไว้ไม่ให้ผู้ใช้กดแล้วเจอ error |
| 29, 39 | `<>…</>` ห่อปุ่ม 3 ปุ่มเป็นก้อนเดียว | `&&` ต้องตามด้วยของ 1 ก้อน (ขั้น 7.1.1) |
| 46 | ไม่พบผู้ใช้ (เช่น ค้นหาไม่เจอ) แสดงข้อความ | - |

✅ **ลองเลย:** เปิด http://localhost:3000/hr/users
1. สลับแท็บ → รายการเปลี่ยน
2. ค้นหา "สมชาย" แล้วกด Enter → เหลือ 1 คน
3. เพิ่มผู้ใช้ → alert รหัสชั่วคราว / เพิ่ม username ซ้ำ → กล่องแดง "ข้อมูลซ้ำกับที่มีอยู่แล้ว"
4. รีเซ็ตรหัสของผู้ใช้ที่เพิ่มในข้อ 3 → ป้าย "รอเปลี่ยน" (อย่ารีเซ็ตบัญชี `teach1`-`teach2` หรือ `comm1`-`comm3`) แล้วลบผู้ใช้นั้นทิ้ง
5. แถวของ hr ไม่มีปุ่ม

### ขั้นที่ 8.4.7 นำเข้า CSV (อัปโหลดไฟล์จากหน้าเว็บ)

> 🎯 **ขั้นนี้จะได้:** เลือกไฟล์ CSV แล้วเพิ่มผู้ใช้หลายคนในครั้งเดียว

⌨️ **พิมพ์โค้ด (ส่วนที่ 1):** พิมพ์แทนบรรทัด `// (ขั้น 8.4.7 จะเขียนต่อตรงนี้)` (ฟังก์ชัน)

```jsx
  // อัปโหลดไฟล์ CSV เพื่อเพิ่มผู้ใช้หลายคน
  const importCsv = async () => {
    const file = fileRef.current.files[0];
    if (!file) return alert("กรุณาเลือกไฟล์ CSV");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await api.post("/users/import", form);
      const lines = res.data.data.map((u) => `${u.username} : ${u.temp_password}`);
      alert(`${res.data.message}\nรหัสผ่านชั่วคราว\n${lines.join("\n")}`);
      fileRef.current.value = ""; // ล้างช่องเลือกไฟล์
      load();
    } catch (err) {
      const rows = err.response?.data?.data;
      const detail = Array.isArray(rows) ? rows.map((r) => `แถว ${r.row}: ${r.message}`).join("\n") : "";
      alert(`${errorMessage(err)}\n${detail}`);
    }
  };
```

🔍 **อ่านโค้ดทีละบรรทัด** (ส่วนที่ 1)

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | อ่านไฟล์ที่เลือกจากช่องเลือกไฟล์ (ผ่าน ref) | `files[0]` = ไฟล์แรก |
| 4 | ยังไม่เลือก แจ้งเตือนแล้วจบ | - |
| 5-6 | ห่อไฟล์ใน FormData ชื่อช่อง `file` | ชื่อต้องตรงกับ `req.files.file` ของ backend (บท 05 ขั้น 5.4.2) |
| 8 | ส่งแบบ form-data (axios ตั้ง Content-Type ให้เอง) | - |
| 9-10 | สร้างรายการ "username : รหัส" แล้วแจ้ง | hr จดรหัสไปแจ้งทุกคน |
| 11 | ล้างช่องเลือกไฟล์ | - |
| 14-16 | ผิดพลาด: ถ้าได้รายการแถวที่ผิด (`data` เป็น array) แสดงทุกแถว | "แถว 3: รูปแบบอีเมลไม่ถูกต้อง" แก้ไฟล์ได้ตรงจุด |

⌨️ **พิมพ์โค้ด (ส่วนที่ 2):** พิมพ์แทนบรรทัด `{/* (ขั้น 8.4.7 จะเขียนต่อตรงนี้) */}` (ใน JSX)

```jsx
      {/* นำเข้าจาก CSV */}
      <div className="card bg-base-100 shadow mb-4">
        <div className="card-body py-4 flex-row flex-wrap items-center gap-2">
          <span className="font-medium">นำเข้าจากไฟล์ CSV</span>
          <input ref={fileRef} type="file" accept=".csv" className="file-input file-input-sm w-full sm:w-auto" />
          <button className="btn btn-sm" onClick={importCsv}>
            <Upload size={16} /> นำเข้า
          </button>
          <a href="/users-template.csv" download className="btn btn-sm btn-ghost">
            <Download size={16} /> ไฟล์ตัวอย่าง
          </a>
        </div>
      </div>
```

🔍 **อ่านโค้ดทีละบรรทัด** (ส่วนที่ 2)

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5 | ช่องเลือกไฟล์ ผูกกับ `fileRef` รับเฉพาะ `.csv` | `accept` กรองไฟล์ในหน้าต่างเลือกไฟล์ |
| 9 | ลิงก์ดาวน์โหลดไฟล์ตัวอย่างจาก `public/` | ไฟล์ใน `frontend/public` เปิดได้ที่ `/ชื่อไฟล์` โดยตรง |

🧩 **Syntax ใหม่ 1: `useRef` (จับช่องจริงในหน้า)**

```syntax
[k:const] [n:fileRef] [s:=] [p:useRef][s:(][v:null][s:)][s:;]
[s:<][p:input] [p:ref][s:={][n:fileRef][s:}] [p:type][s:=][v:"file"] [s:/>]
[n:fileRef][s:.][p:current][s:.][p:files][s:\[][v:0][s:\]]
```

- `ref={fileRef}` ผูกตัวแปรกับช่องจริง แล้วอ่านผ่าน `fileRef.current`
- ใช้กับช่องเลือกไฟล์ เพราะไฟล์เก็บใน state แบบช่องข้อความไม่ได้

🧩 **Syntax ใหม่ 2: `FormData` และ `Array.isArray`**

| คำสั่ง | ทำอะไร |
|---|---|
| `new FormData()` | สร้าง "ฟอร์ม" เปล่าสำหรับส่งไฟล์ |
| `form.append("ชื่อ", ค่า)` | ใส่ช่องลงฟอร์ม (ไฟล์หรือข้อความ) |
| `Array.isArray(x)` | x เป็น array ไหม (true/false) |
| `new ชื่อ()` | สร้างของใหม่จากแม่แบบ (🔵 syntax) |

> ❗ **ห้ามใส่ `key` ที่เปลี่ยนค่าให้ช่องเลือกไฟล์** React จะสร้างช่องใหม่ ไฟล์ที่เลือกจะหาย

✅ **ลองเลย:**
1. กด "ไฟล์ตัวอย่าง" → ได้ `users-template.csv`
2. เลือกไฟล์นั้นแล้วกด "นำเข้า" → alert "นำเข้าผู้ใช้สำเร็จ 2 คน" พร้อมรหัส และตารางมี teach10, comm10
3. นำเข้าซ้ำ → "ข้อมูลซ้ำกับที่มีอยู่แล้ว"
4. ทดสอบเสร็จแล้วลบ teach10 และ comm10 ทิ้ง

<details>
<summary>📄 ไฟล์ทั้งหมดของขั้น 8.4 (กดดูไว้เทียบ)</summary>

- [frontend/components/hr/UserModal.js](../../frontend/components/hr/UserModal.js)
- [frontend/pages/hr/users.js](../../frontend/pages/hr/users.js)

</details>

## 8.5 หน้ามอบหมายกรรมการ (เกณฑ์ 5.1.8, 5.1.9, 5.1.11)

📖 **หน้าตา:** การ์ดผู้รับการประเมินแต่ละคน ข้างในมีรายชื่อกรรมการ + เลือกบทบาท + สถานะ + แถวเพิ่มกรรมการ

### ขั้นที่ 8.5.1 โหลดข้อมูล 4 อย่างพร้อมกัน

> 🎯 **ขั้นนี้จะได้:** state และการโหลดของหน้า /hr/assignments

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/pages/hr/assignments.js`

```jsx
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { COMMITTEE_ROLES } from "@/lib/constants";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";

export default function Assignments() {
  const user = useAuth(["hr"]);
  const [evaluatees, setEvaluatees] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [indicatorCount, setIndicatorCount] = useState(0);
  const [error, setError] = useState("");
  const [form, setForm] = useState({}); // ค่าที่เลือกในแถวเพิ่มกรรมการ แยกตาม evaluatee_id

  // โหลด 4 อย่างพร้อมกัน
  const load = () =>
    Promise.all([
      api.get("/users", { params: { role: "evaluatee" } }),
      api.get("/users", { params: { role: "committee" } }),
      api.get("/assignments"),
      api.get("/indicators"),
    ]).then(([e, c, a, i]) => {
      setEvaluatees(e.data.data);
      setCommittees(c.data.data);
      setAssignments(a.data.data);
      setIndicatorCount(i.data.data.length);
    }).catch((err) => setError(errorMessage(err)));

  useEffect(() => {
    if (user) load();
  }, [user]);

  // (ขั้น 8.5.2 จะเขียนต่อตรงนี้)
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 11-14 | state ผู้รับประเมิน, กรรมการ, การมอบหมาย, จำนวนตัวชี้วัด | - |
| 16 | state ฟอร์มเพิ่มกรรมการ (ขั้น 8.5.2) | - |
| 20-25 | ยิง 4 คำขอ **พร้อมกัน** | เร็วกว่ายิงทีละตัว |
| 25 | ได้ผลครบทั้ง 4 แล้ว แกะเป็น e, c, a, i ตามลำดับ | - |
| 26-29 | เก็บลง state (ตัวชี้วัดเก็บแค่จำนวน) | แสดง "2/6 ข้อ" |
| 30 | ถ้าตัวไหนพัง แสดง error | - |

🧩 **Syntax ใหม่: `Promise.all`**

```syntax
[p:Promise][s:.][p:all][s:(][s:\[][n:งาน1][s:,] [n:งาน2][s:\]][s:)][s:.][p:then][s:(][s:(\[][n:ผล1][s:,] [n:ผล2][s:\])] [s:=>] [s:{] [s:...] [s:}][s:)]
```

- รอ **ทุกงาน** เสร็จ แล้วได้ผลเป็น array เรียงตามลำดับงาน
- ถ้างานไหน error → ไป `.catch` ทันที

### ขั้นที่ 8.5.2 ฟังก์ชันเพิ่มกรรมการ และฟอร์มหลายชุดในหน้าเดียว

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชันเรียก API แบบสั้น และการเก็บค่า select แยกตามการ์ด

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 8.5.2 จะเขียนต่อตรงนี้)`

```jsx
  // เรียก API แล้วโหลดใหม่ ถ้า error แสดง alert
  const run = async (request) => {
    try {
      await request;
      load();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  const add = (evaluateeId) => {
    const f = form[evaluateeId] || {};
    if (!f.committee_id) return alert("กรุณาเลือกกรรมการ");
    run(
      api.post("/assignments", {
        evaluatee_id: evaluateeId,
        committee_id: f.committee_id,
        committee_role: f.committee_role || "member",
      })
    );
    setForm({ ...form, [evaluateeId]: {} });
  };

  const setField = (evaluateeId, key, value) =>
    setForm({ ...form, [evaluateeId]: { ...form[evaluateeId], [key]: value } });

  if (!user) return null;

  // (ขั้น 8.5.3 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2-9 | `run` รับคำขอที่ส่งไปแล้ว → รอผล → โหลดใหม่ / error → alert | ใช้กับทุกปุ่มในหน้านี้ (เพิ่ม เปลี่ยนบทบาท ยกเลิก) ไม่ต้องเขียน try/catch ซ้ำ |
| 11-22 | `add` เพิ่มกรรมการให้ผู้รับประเมินคนหนึ่ง | - |
| 12 | ค่าที่เลือกไว้ของการ์ดนี้ (ยังไม่เลือก = object ว่าง) | - |
| 13 | ไม่ได้เลือกกรรมการ → แจ้งแล้วจบ | - |
| 18 | ไม่ได้เลือกบทบาท ใช้ "กรรมการร่วม" | - |
| 21 | ล้างค่าที่เลือกของการ์ดนี้ | - |
| 24-25 | `setField` เปลี่ยนค่า 1 ช่องของการ์ด 1 ใบ | ใช้ใน onChange ของ select |

📖 **ทำไม `form` เป็น object?** ทุกการ์ดมี select ของตัวเอง ถ้าใช้ state ตัวเดียว เลือกในการ์ดหนึ่งแล้วการ์ดอื่นจะเปลี่ยนตาม จึงเก็บแยกตาม id ของผู้รับการประเมิน

```js
form = {
  5: { committee_id: "3", committee_role: "member" },   ← การ์ดของ teach1
  6: { committee_id: "2" },                               ← การ์ดของ teach2
}
```

🧩 **Syntax ใหม่: `[ตัวแปร]` เป็นชื่อช่องตอนสร้าง object**

```syntax
[s:{] [s:...][n:form][s:,] [s:\[][n:evaluateeId][s:\]][s::] [v:ค่าใหม่] [s:}]
```

- `{ [evaluateeId]: {} }` ถ้า evaluateeId = 5 ได้ `{ 5: {} }` (ใช้ **ค่า** ของตัวแปรเป็นชื่อช่อง)
- `{ ...form[evaluateeId], [key]: value }` = ค่าเดิมของการ์ดนี้ + เปลี่ยนช่อง key

> 💡 `run(api.post(…))` ส่ง "คำขอที่เริ่มแล้ว" เข้าไป แล้วข้างใน `await request` รอผล

### ขั้นที่ 8.5.3 การ์ดผู้รับการประเมิน และรายชื่อกรรมการ

> 🎯 **ขั้นนี้จะได้:** เห็นกรรมการของแต่ละคน พร้อมบทบาท สถานะ และความคืบหน้า (เกณฑ์ 5.1.9, 5.1.11)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 8.5.3 จะเขียนต่อตรงนี้)`

```jsx
  return (
    <Layout user={user}>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <h1 className="text-2xl font-bold mb-1">มอบหมายกรรมการ</h1>
      <p className="text-sm opacity-70 mb-4">กำหนดกรรมการและบทบาท (ประธาน 1 คนต่อผู้รับการประเมิน) และติดตามสถานะการประเมิน</p>

      <div className="grid lg:grid-cols-2 gap-4">
        {evaluatees.map((e) => {
          const mine = assignments.filter((a) => a.evaluatee_id === e.id);
          const available = committees.filter((c) => !mine.some((a) => a.committee_id === c.id));
          const f = form[e.id] || {};
          return (
            <div key={e.id} className="card bg-base-100 shadow">
              <div className="card-body p-4">
                <h2 className="card-title text-base">
                  {e.full_name}
                  <span className="text-sm font-normal opacity-60">{e.department}</span>
                </h2>

                <ul className="divide-y divide-base-200">
                  {mine.map((a) => (
                    <li key={a.id} className="py-2 flex flex-wrap items-center gap-2">
                      <span className="flex-1 min-w-32">{a.committee_name}</span>
                      <select
                        className="select select-sm w-36"
                        value={a.committee_role}
                        onChange={(ev) => run(api.put(`/assignments/${a.id}`, { committee_role: ev.target.value }))}
                      >
                        {Object.entries(COMMITTEE_ROLES).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <StatusBadge status={a.status} />
                      <span className="text-xs opacity-60 w-16">
                        {a.scored_count}/{indicatorCount} ข้อ
                      </span>
                      <button
                        className="btn btn-xs btn-ghost text-error"
                        title="ยกเลิกการมอบหมาย"
                        onClick={() => confirm(`ยกเลิก ${a.committee_name} ? คะแนนที่ให้ไว้จะถูกลบ`) && run(api.delete(`/assignments/${a.id}`))}
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                  {mine.length === 0 && <li className="py-2 text-sm opacity-60">ยังไม่มีกรรมการ</li>}
                </ul>

                {/* (ขั้น 8.5.4 จะเขียนต่อตรงนี้) */}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 7 | การ์ด 2 คอลัมน์บนจอใหญ่ | - |
| 8 | วนผู้รับประเมิน ใช้ `=> {` (มีปีกกา) เพราะต้องคำนวณก่อน return | - |
| 9 | กรรมการของคนนี้ | - |
| 10 | กรรมการที่ **ยังไม่ได้** มอบหมายให้คนนี้ | ตัวเลือกในแถวเพิ่ม ไม่ให้เลือกคนซ้ำ |
| 11 | ค่าที่เลือกไว้ของการ์ดนี้ | - |
| 20 | รายการเส้นคั่นระหว่างแถว | - |
| 24-32 | select บทบาท: ค่าปัจจุบันจากข้อมูล เปลี่ยนแล้ว **บันทึกทันที** | เกณฑ์ 5.1.9 เปลี่ยนประธาน/กรรมการร่วม |
| 27 | ถ้าเปลี่ยนเป็นประธานซ้ำ backend ตอบ 400 → alert → ไม่ load → select แสดงค่าเดิม | - |
| 33 | ป้ายสถานะ | เกณฑ์ 5.1.11 ติดตามสถานะ |
| 34-36 | ให้คะแนนไปกี่ข้อ เช่น "2/6 ข้อ" | - |
| 40 | ถามก่อน ถ้าตกลงค่อยลบ | `confirm(…) && run(…)` = ถ้าซ้ายจริงค่อยทำขวา |
| 46 | ยังไม่มีกรรมการ แสดงข้อความ | - |

> 🧩 syntax สอนไปแล้ว: `.some()` (บท 06 ขั้น 6.8.2), `&&` แบบ "ถ้าจริงค่อยทำ" (บท 05 ขั้น 5.6.3)
> 💡 `.map((e) => { … return (…); })` = ใช้ปีกกาเมื่อต้องมีคำสั่งก่อนส่งกลับ JSX ต่างจาก `.map((e) => (…))` ที่ส่งกลับทันที

### ขั้นที่ 8.5.4 แถวเพิ่มกรรมการ

> 🎯 **ขั้นนี้จะได้:** มอบหมายกรรมการใหม่ได้ (เกณฑ์ 5.1.8)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 8.5.4 จะเขียนต่อตรงนี้) */}`

```jsx
                {available.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    <select
                      className="select select-sm flex-1 min-w-40"
                      value={f.committee_id || ""}
                      onChange={(ev) => setField(e.id, "committee_id", ev.target.value)}
                    >
                      <option value="">เลือกกรรมการ</option>
                      {available.map((c) => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                    <select
                      className="select select-sm w-36"
                      value={f.committee_role || "member"}
                      onChange={(ev) => setField(e.id, "committee_role", ev.target.value)}
                    >
                      {Object.entries(COMMITTEE_ROLES).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <button className="btn btn-sm btn-primary" onClick={() => add(e.id)}>
                      <Plus size={16} /> เพิ่ม
                    </button>
                  </div>
                )}
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | แสดงเฉพาะเมื่อยังมีกรรมการให้เลือก | ครบทุกคนแล้วแถวนี้หาย |
| 3-12 | select กรรมการ (controlled: ค่าจาก `form` เปลี่ยนผ่าน `setField`) | ตัวเลือกแรก "เลือกกรรมการ" ค่าว่าง |
| 13-21 | select บทบาท (ค่าเริ่มต้น member) | - |
| 22 | ปุ่มเพิ่ม เรียก `add` ของการ์ดนี้ | - |

> 💡 ตัวแปรใน onChange ชื่อ `ev` (ไม่ใช่ `e`) เพราะ `e` ถูกใช้เป็นชื่อผู้รับประเมินในขั้น 8.5.3 แล้ว ถ้าตั้งชื่อซ้ำ `e.id` จะกลายเป็นของ event

✅ **ลองเลย:** เปิด http://localhost:3000/hr/assignments
1. การ์ดของ "สมชาย รักเรียน" มีกรรมการ 3 คน สถานะ ยืนยันผลแล้ว / บันทึกร่าง / ยังไม่ประเมิน และ "6/6 ข้อ", "2/6 ข้อ", "0/6 ข้อ"
2. เปลี่ยน "วิไล สายทอง" ในการ์ดสมชายเป็นประธาน → alert "ผู้รับการประเมินคนนี้มีประธานกรรมการแล้ว" และ select กลับเป็นค่าเดิม
3. ในการ์ดของ "มาลี ศรีสุข" กด ยกเลิก "ชัยวัฒน์ แก้วมา" (ถามก่อน) แล้วเลือกเพิ่มกลับเป็นกรรมการร่วม → เพิ่มได้

<details>
<summary>📄 ไฟล์ pages/hr/assignments.js ทั้งไฟล์ (กดดูไว้เทียบ)</summary>

ไฟล์จริงในโปรเจกต์: [frontend/pages/hr/assignments.js](../../frontend/pages/hr/assignments.js)

</details>

## 8.6 หน้ารายงาน (เกณฑ์ 5.1.10-5.1.13)

### ขั้นที่ 8.6.1 โหลดรายงาน (เรียงที่ backend) และฟังก์ชันส่งออก CSV

> 🎯 **ขั้นนี้จะได้:** ส่วนการทำงานของหน้า /hr/reports

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/pages/hr/reports/index.js` (สร้างโฟลเดอร์ `reports` ก่อน)

```jsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Printer } from "lucide-react";
import api, { errorMessage } from "@/lib/api";
import { downloadCsv } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";

export default function Reports() {
  const user = useAuth(["hr"]);
  const [tab, setTab] = useState("evaluatees");
  const [sort, setSort] = useState("");
  const [evaluatees, setEvaluatees] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api.get("/reports/evaluatees", { params: { sort } }).then((res) => setEvaluatees(res.data.data)).catch((err) => setError(errorMessage(err)));
    api.get("/reports/committees").then((res) => setCommittees(res.data.data)).catch((err) => setError(errorMessage(err)));
  }, [user, sort]);

  // ส่งออกตารางเป็น CSV
  const exportEvaluatees = () =>
    downloadCsv(
      "evaluation-summary.csv",
      ["ชื่อ-สกุล", "แผนก", "บันทึกครบ (ตัวชี้วัด)", "ร้อยละการบันทึก", "กรรมการยืนยัน", "คะแนนกรรมการ", "คะแนนเต็ม", "ร้อยละ"],
      evaluatees.map((e) => [e.full_name, e.department, `${e.filled}/${e.indicator_count}`, e.progress, `${e.confirmed_count}/${e.committee_count}`, e.committee_total, e.total_weight, e.committee_percent])
    );
  const exportCommittees = () =>
    downloadCsv(
      "committee-status.csv",
      ["กรรมการ", "ตำแหน่ง", "ได้รับมอบหมาย", "ยังไม่ประเมิน", "บันทึกร่าง", "ยืนยันผลแล้ว"],
      committees.map((c) => [c.full_name, c.position, c.total, c.pending, c.draft, c.confirmed])
    );

  if (!user) return null;

  // (ขั้น 8.6.2 จะเขียนต่อตรงนี้)
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 11 | แท็บที่เลือก: `evaluatees` หรือ `committees` | - |
| 12 | การเรียงที่เลือก (`""` = ตามลำดับในระบบ) | - |
| 17-21 | โหลดรายงาน 2 อย่าง **ใหม่ทุกครั้งที่ sort เปลี่ยน** | backend เรียงให้ (บท 06 ขั้น 6.8.3) |
| 24-29 | ส่งออกรายงานรายผู้รับการประเมิน: ชื่อไฟล์, หัวตาราง, แถวข้อมูล | ปุ่ม "ดาวน์โหลด CSV" (ใช้ `downloadCsv` บท 07 ขั้น 7.11.3) |
| 28 | แปลงแต่ละคนเป็น array ค่าเรียงตามหัวตาราง | จำนวนค่าต้องเท่าหัวตาราง (8 ช่อง) |
| 30-35 | ส่งออกรายงานรายกรรมการ | - |

### ขั้นที่ 8.6.2 หัวหน้า ปุ่ม และแท็บ

> 🎯 **ขั้นนี้จะได้:** ส่วนบนของหน้ารายงาน พร้อมปุ่ม CSV และพิมพ์/PDF

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 8.6.2 จะเขียนต่อตรงนี้)`

```jsx
  return (
    <Layout user={user}>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold">รายงานผลการประเมิน</h1>
        <div className="flex gap-2 print:hidden">
          <button className="btn btn-sm" onClick={tab === "evaluatees" ? exportEvaluatees : exportCommittees}>
            <Download size={16} /> ดาวน์โหลด CSV
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => window.print()}>
            <Printer size={16} /> พิมพ์ / PDF
          </button>
        </div>
      </div>
      <p className="hidden print:block mb-2">พิมพ์เมื่อ {new Date().toLocaleString("th-TH")}</p>
      <div role="tablist" className="tabs tabs-box mb-3 w-fit print:hidden">
        <button role="tab" className={`tab ${tab === "evaluatees" ? "tab-active" : ""}`} onClick={() => setTab("evaluatees")}>
          รายผู้รับการประเมิน
        </button>
        <button role="tab" className={`tab ${tab === "committees" ? "tab-active" : ""}`} onClick={() => setTab("committees")}>
          รายกรรมการ
        </button>
      </div>

      {/* (ขั้น 8.6.3 จะเขียนต่อตรงนี้) */}

      {/* (ขั้น 8.6.4 จะเขียนต่อตรงนี้) */}
    </Layout>
  );
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 6 | ปุ่มทั้งหมด **ซ่อนตอนพิมพ์** | กระดาษ/PDF มีแต่รายงาน |
| 7 | ปุ่ม CSV ส่งออกตามแท็บที่เปิดอยู่ (ternary เลือกฟังก์ชัน) | - |
| 10 | `window.print()` = เปิดหน้าต่างพิมพ์ของเบราว์เซอร์ เลือก "บันทึกเป็น PDF" ได้ | **ทำ PDF โดยไม่ลง package** (กฎของโจทย์) |
| 15 | วันเวลาที่พิมพ์ **แสดงเฉพาะตอนพิมพ์** (`hidden print:block`) | รายงานบนกระดาษมีวันที่ |
| 16-23 | แท็บ 2 แท็บ | - |

> 🧩 syntax ใหม่: `new Date().toLocaleString("th-TH")` = วันเวลาปัจจุบันแบบไทย เช่น "8/11/2569 10:30:00"

### ขั้นที่ 8.6.3 ตารางรายผู้รับการประเมิน

> 🎯 **ขั้นนี้จะได้:** สรุป % การบันทึก กรรมการที่ยืนยัน และคะแนน พร้อมเรียงลำดับ (เกณฑ์ 5.1.10, 5.1.12)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 8.6.3 จะเขียนต่อตรงนี้) */}`

```jsx
      {tab === "evaluatees" && (
        <>
          <select className="select select-sm mb-3 print:hidden" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="">เรียงตามรายชื่อในระบบ</option>
            <option value="score">เรียงตามคะแนน (มาก-น้อย)</option>
            <option value="progress">เรียงตาม % การบันทึก (มาก-น้อย)</option>
            <option value="name">เรียงตามชื่อ (ก-ฮ)</option>
          </select>
          <div className="overflow-x-auto bg-base-100 rounded-box shadow">
            <table className="table">
              <thead>
                <tr>
                  <th>ผู้รับการประเมิน</th>
                  <th>บันทึกข้อมูลตามตัวชี้วัด</th>
                  <th className="text-center">กรรมการยืนยัน</th>
                  <th className="text-right">คะแนน</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {evaluatees.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div>{e.full_name}</div>
                      <div className="text-xs opacity-60">{e.department}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <progress className="progress progress-primary w-24" value={e.progress} max="100" />
                        <span className="text-sm whitespace-nowrap">
                          {e.progress}% ({e.filled}/{e.indicator_count})
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      {e.confirmed_count}/{e.committee_count}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {e.committee_total != null ? `${e.committee_total} / ${e.total_weight}` : "-"}
                    </td>
                    <td className="text-right">
                      <Link href={`/hr/reports/evaluatees/${e.id}`} className="btn btn-xs">
                        ดูรายงาน
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | แสดงเฉพาะแท็บนี้ | - |
| 3-8 | select การเรียง (controlled) เปลี่ยนแล้ว setSort → โหลดใหม่ | ค่า `score` / `progress` / `name` ตรงกับที่ backend รู้จัก |
| 28-31 | แถบความคืบหน้า + "33.33% (2/6)" | **% การบันทึกข้อมูลตามตัวชี้วัด (เกณฑ์ 5.1.12)** |
| 35-37 | กรรมการยืนยันแล้ว / ทั้งหมด | ติดตามสถานะ |
| 38-40 | ยังไม่มีผลยืนยัน (null) แสดง "-" ไม่ใช่ 0 | ขั้น 6.3.7 |
| 41-45 | ลิงก์ไปรายงานรายบุคคล | **หน้านี้สร้างในบท 09 ขั้น 9.4.4** (ตอนนี้กดแล้วเจอ 404) |

> 🧩 syntax ใหม่: `<progress value={…} max="100" />` แถบความคืบหน้าของ HTML ตกแต่งด้วย class `progress` ของ daisyUI

### ขั้นที่ 8.6.4 ตารางรายกรรมการ

> 🎯 **ขั้นนี้จะได้:** ติดตามสถานะงานของกรรมการแต่ละคน (เกณฑ์ 5.1.11)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 8.6.4 จะเขียนต่อตรงนี้) */}`

```jsx
      {tab === "committees" && (
        <div className="overflow-x-auto bg-base-100 rounded-box shadow">
          <table className="table">
            <thead>
              <tr>
                <th>กรรมการ</th>
                <th className="text-center">ได้รับมอบหมาย</th>
                <th className="text-center">ยังไม่ประเมิน</th>
                <th className="text-center">บันทึกร่าง</th>
                <th className="text-center">ยืนยันผลแล้ว</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {committees.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div>{c.full_name}</div>
                    <div className="text-xs opacity-60">{c.position}</div>
                  </td>
                  <td className="text-center">{c.total}</td>
                  <td className="text-center">{c.pending}</td>
                  <td className="text-center">{c.draft}</td>
                  <td className="text-center">
                    <progress className="progress progress-success w-16 mr-2" value={c.confirmed} max={c.total || 1} />
                    {c.confirmed}
                  </td>
                  <td className="text-right">
                    <Link href={`/hr/reports/committees/${c.id}`} className="btn btn-xs">
                      ดูสรุป
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 21-23 | จำนวนงานทั้งหมด / ยังไม่ประเมิน / ร่าง / ยืนยัน (จาก `SUM(status = …)` บท 06 ขั้น 6.8.5) | - |
| 24-27 | แถบสีเขียว ยืนยันแล้วกี่ส่วน (`max={c.total \|\| 1}` กันหารด้วย 0 เมื่อไม่มีงาน) | เห็นภาพรวมเร็ว |
| 28-32 | ลิงก์ไปหน้าสรุปรายกรรมการ (ขั้น 8.6.5) | - |

✅ **ลองเลย:** เปิด http://localhost:3000/hr/reports
1. เลือก "เรียงตาม % การบันทึก" → สมชาย (100%) อยู่บนสุด ตามด้วยมาลี (33.33%)
2. แท็บ "รายกรรมการ" → ประเสริฐ: ได้รับมอบหมาย 2, ยังไม่ประเมิน 1, ยืนยันผลแล้ว 1
3. ดาวน์โหลด CSV → เปิดใน Excel ภาษาไทยอ่านออก
4. พิมพ์ / PDF → ตัวอย่างก่อนพิมพ์ไม่มีเมนูและปุ่ม มีวันที่พิมพ์

### ขั้นที่ 8.6.5 หน้าสรุปรายกรรมการ (dynamic route)

> 🎯 **ขั้นนี้จะได้:** ตารางคะแนนของกรรมการ 1 คน: แถว = ผู้รับประเมิน, คอลัมน์ = ตัวชี้วัด (เกณฑ์ 5.1.10)

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/pages/hr/reports/committees/[id].js` (ชื่อไฟล์มีวงเล็บเหลี่ยมจริงๆ)

```jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { COMMITTEE_ROLES } from "@/lib/constants";
import { scoreLabel } from "@/lib/format";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";

// สรุปการประเมินรายกรรมการ: แถว = ผู้รับประเมิน, คอลัมน์ = ตัวชี้วัด
export default function CommitteeReport() {
  const user = useAuth(["hr"]);
  const { id } = useRouter().query;
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !id) return;
    api
      .get(`/reports/committees/${id}`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(errorMessage(err)));
  }, [user, id]);

  if (!user) return null;

  // (ขั้น 8.6.6 จะเขียนต่อตรงนี้)
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 14 | อ่าน `id` จากชื่อไฟล์ `[id]` | `/hr/reports/committees/2` → id = `"2"` |
| 19 | **ยังไม่มี id ก็ยังไม่โหลด** | รอบแรก Next.js ยังอ่าน URL ไม่เสร็จ `id` เป็น undefined ถ้าไม่รอจะยิง API ไป `/reports/committees/undefined` |
| 24 | โหลดใหม่เมื่อ user หรือ id เปลี่ยน | id มาถึงในรอบถัดไป แล้วโหลดเอง |

> 🧩 syntax ใหม่: `useRouter().query` เรียกต่อกันได้เลยโดยไม่ต้องเก็บ router ไว้ก่อน และ `!user || !id` = "ยังไม่มีอย่างใดอย่างหนึ่ง"

### ขั้นที่ 8.6.6 ตารางคะแนนที่คอลัมน์ไม่ตายตัว

> 🎯 **ขั้นนี้จะได้:** หน้าสรุปรายกรรมการครบ

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 8.6.6 จะเขียนต่อตรงนี้)`

```jsx
  return (
    <Layout user={user}>
      <Link href="/hr/reports" className="btn btn-sm btn-ghost mb-2">
        ← กลับ
      </Link>
      {error && <div className="alert alert-error">{error}</div>}
      {data && (
        <>
          <h1 className="text-2xl font-bold">สรุปการประเมินของ {data.committee.full_name}</h1>
          <p className="text-sm opacity-70 mb-4">{data.committee.position}</p>
          <div className="overflow-x-auto bg-base-100 rounded-box shadow">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>ผู้รับการประเมิน</th>
                  <th>สถานะ</th>
                  {data.indicators.map((i, n) => (
                    <th key={i.id} className="text-center" title={i.name}>
                      ข้อ {n + 1}
                    </th>
                  ))}
                  <th className="text-right">คะแนนรวม</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div>{r.evaluatee_name}</div>
                      <div className="text-xs opacity-60">{COMMITTEE_ROLES[r.committee_role]}</div>
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    {data.indicators.map((i) => (
                      <td key={i.id} className="text-center">
                        {scoreLabel(r.scores[i.id], i.score_type)}
                      </td>
                    ))}
                    <td className="text-right">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ol className="list-decimal list-inside text-sm mt-3 opacity-80">
            {data.indicators.map((i) => (
              <li key={i.id}>
                {i.name} (น้ำหนัก {i.weight})
              </li>
            ))}
          </ol>
        </>
      )}
    </Layout>
  );
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 6 | error (เช่น id ไม่ใช่กรรมการ → "ไม่พบกรรมการ") | - |
| 7 | แสดงเนื้อหาเมื่อมีข้อมูลแล้ว | - |
| 17-21 | หัวคอลัมน์ "ข้อ 1, ข้อ 2, …" **ตามจำนวนตัวชี้วัด** (map ได้ลำดับ `n` เริ่ม 0 จึง +1) | เพิ่มตัวชี้วัดแล้วตารางขยายเอง ไม่ต้องแก้โค้ด, `title` = ชื่อเต็มเมื่อชี้เมาส์ |
| 35-39 | ทุกแถว วนตัวชี้วัดชุดเดียวกับหัวตาราง แสดงคะแนน (มี/ไม่มี หรือตัวเลข หรือ "-") | คอลัมน์ตรงกันเสมอ |
| 37 | `r.scores[i.id]` = คะแนนของตัวชี้วัดนี้ (object ที่ backend ส่ง `{ 1: 4, 2: 3 }`) | - |
| 46-52 | รายการชื่อตัวชี้วัดใต้ตาราง | อธิบายว่า "ข้อ 1" คืออะไร |

✅ **ลองเลย:** หน้ารายงาน → แท็บรายกรรมการ → "ดูสรุป" ของประเสริฐ → ตาราง 2 แถว สมชายมีคะแนนครบ 6 ข้อ มาลีเป็น "-"

<details>
<summary>📄 ไฟล์ทั้งหมดของขั้น 8.6 (กดดูไว้เทียบ)</summary>

- [frontend/pages/hr/reports/index.js](../../frontend/pages/hr/reports/index.js)
- [frontend/pages/hr/reports/committees/[id].js](../../frontend/pages/hr/reports/committees/[id].js)

</details>

---

## ❗ ปัญหาที่พบบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| modal ไม่ปิดหลังบันทึก | ไม่ได้ `setEditing(null)` ใน onSaved | ตรวจฟังก์ชัน `saved` |
| แก้ไขแล้วฟอร์มว่าง | ไม่ได้ส่ง `...item` เข้า defaultValues | ตรวจ `formValues({ ..., ...item })` |
| กดยกเลิกแล้วฟอร์มถูกส่ง | ปุ่มยกเลิกไม่มี `type="button"` | ใส่ `type="button"` |
| เพิ่มแล้วรายการไม่อัปเดต | ลืมเรียก `load()` หลังบันทึก | เรียกใน onSaved |
| กดค้นหาแล้วหน้าโหลดใหม่ | ลืม `e.preventDefault()` | ใส่ใน onSubmit ของฟอร์มค้นหา |
| พิมพ์ในช่องค้นหาไม่ได้ | ใส่ `value={q}` แต่ไม่มี onChange | ใส่ `onChange={(e) => setQ(e.target.value)}` |
| เลือก select ในการ์ดหนึ่งแล้วการ์ดอื่นเปลี่ยนตาม | ใช้ state ตัวเดียวสำหรับทุกการ์ด | เก็บแยกตาม id (ขั้น 8.5.2) |
| หน้า `[id]` ยิง API ไป `/undefined` | ไม่ได้รอ `id` | ใส่ `if (!user \|\| !id) return;` |
| เลือกไฟล์แล้วหาย | ใส่ `key` ที่เปลี่ยนให้ input file | ใช้ `useRef` ไม่ใส่ key |
| นำเข้า CSV ได้ 400 "กรุณาเลือกไฟล์ CSV" ทั้งที่เลือกแล้ว | ชื่อช่องใน FormData ไม่ใช่ `file` | `form.append("file", file)` |
| ตารางล้นจอมือถือ | ไม่ได้ครอบ `overflow-x-auto` | `<div className="overflow-x-auto">` |
| `Module not found: Can't resolve '@/components/hr/IndicatorModal'` | ยังไม่ได้สร้างไฟล์ | ทำขั้น 8.3.8 หรือใส่ `//` ชั่วคราว |

---

⬅️ [บทที่ 07](07-frontend-basics.md) | ➡️ [บทที่ 09: หน้าจอผู้รับการประเมิน](09-frontend-evaluatee.md)
