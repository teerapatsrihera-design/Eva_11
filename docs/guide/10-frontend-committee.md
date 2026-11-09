# บทที่ 10: หน้าจอกรรมการ

## เป้าหมาย

เรียนจบบทนี้แล้ว นักเรียนจะสร้างหน้าของกรรมการได้
- **หน้าหลัก:** รายชื่อคนที่ต้องประเมิน พร้อมสถานะ
- **หน้าประเมิน:** ดูข้อมูลและหลักฐาน → ให้คะแนน → เขียนความเห็น → บันทึกร่าง → ลงลายเซ็นด้วย `<canvas>` → ยืนยันผล

🏆 ได้คะแนนข้อ 5.3.1-5.3.10 (10 คะแนน)

⏱️ ครั้งแรกที่เรียน: ประมาณ **5 ชั่วโมง** | วันแข่ง (เมื่อคล่องแล้ว): **45 นาที**

### บทนี้แบ่งเป็นขั้นเล็กๆ

| ภาค | ทำอะไร | จำนวนขั้น |
|---|---|---|
| ภาค ก (10.1) | ขั้นตอนการทำงานของหน้าประเมิน | 1 ขั้น |
| ภาค ข (10.2-10.6) | สร้างหน้าทีละส่วน | 18 ขั้น |

### ไฟล์ที่จะสร้างในบทนี้

```
frontend/
├── schemas/committee.js              ← ขั้น 10.4  กฎก่อนบันทึก/ยืนยัน
├── components/SignaturePad.js        ← ขั้น 10.3  ช่องลงลายเซ็น
└── pages/committee/
    ├── index.js                      ← ขั้น 10.2  หน้าหลัก
    └── evaluate/[id].js              ← ขั้น 10.5  หน้าประเมิน
```

> 💡 **ก่อนเริ่มบทนี้** ต้องทำบท 09 เสร็จ **รีเซ็ตฐานข้อมูล** (บท 02 ขั้น 2.6.1) แล้ว login เป็น **comm1 / 123456** และเปลี่ยนรหัสผ่านก่อน

---

# ภาค ก: ภาพรวม

## 10.1 หน้าประเมินทำงานอย่างไร

### ขั้นที่ 10.1.1 ขั้นตอนการทำงานของหน้าประเมิน

> 🎯 **ขั้นนี้จะได้:** เห็นภาพรวมก่อนเขียนหน้าที่ยาวที่สุดของระบบ

```text
เปิดหน้า → โหลดข้อมูล + คะแนนร่างเดิม
   │
   ├─ กดปุ่มคะแนน → setScores (ยังไม่บันทึก เก็บในหน้าเว็บก่อน)
   ├─ พิมพ์ความเห็น → setComment
   ├─ [บันทึกร่าง] → ตรวจ draftSchema → PUT /scores → โหลดใหม่ (สถานะ = draft)
   │
   └─ วาดลายเซ็น → [ยืนยัน] → ตรวจ confirmSchema (ครบ? มีความเห็น? มีลายเซ็น?)
                              → กล่องยืนยัน → PUT /scores → PUT /confirm
                              → โหลดใหม่ (สถานะ = confirmed, หน้าล็อก)
```

| ส่วนของหน้า | เกณฑ์ |
|---|---|
| ข้อมูลผู้รับการประเมิน | 5.3.2 |
| หลักฐานและคะแนนตนเอง | 5.3.3 |
| ปุ่มให้คะแนน | 5.3.4 |
| ความเห็นสรุป | 5.3.5 |
| ตารางผลลัพธ์ | 5.3.6 |
| ลายเซ็น | 5.3.7, 5.3.9 |
| บันทึกร่าง | 5.3.8 |
| ยืนยันแล้วแก้ไม่ได้ | 5.3.10 |

📖 **ต่างจากหน้าอื่นตรงไหน?** หน้านี้ **ไม่ใช้ React Hook Form** เพราะคะแนนเป็นปุ่มจำนวนมาก (ตัวชี้วัดละ 2-4 ปุ่ม) และต้องส่งรวมกันเป็น array เราจึงเก็บค่าใน state เอง แล้วเรียก `validateWith(schema)` ตรวจเองก่อนส่ง

---

# ภาค ข: สร้างหน้าทีละส่วน

## 10.2 หน้าหลักกรรมการ (เกณฑ์ 5.3.1)

### ขั้นที่ 10.2.1 โหลดรายชื่อ และฟังก์ชันนับตามสถานะ

> 🎯 **ขั้นนี้จะได้:** ส่วนการทำงานของหน้า /committee

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/pages/committee/index.js`

```jsx
import { useEffect, useState } from "react";
import Link from "next/link";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { COMMITTEE_ROLES } from "@/lib/constants";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";

// หน้าหลักกรรมการ: ผู้รับการประเมินที่ได้รับมอบหมาย
export default function CommitteeHome() {
  const user = useAuth(["committee"]);
  const [list, setList] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api
      .get("/committee/assignments")
      .then((res) => setList(res.data.data))
      .catch((err) => setError(errorMessage(err)));
  }, [user]);

  if (!user) return null;

  const count = (status) => list.filter((a) => a.status === status).length;

  // (ขั้น 10.2.2 จะเขียนต่อตรงนี้)
}
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 15-21 | โหลดงานของกรรมการคนนี้ (backend กรองให้ บท 06 ขั้น 6.7.3) | - |
| 25 | ฟังก์ชันนับงานตามสถานะ | กล่องสถิติ "ยังไม่ประเมิน 3" |

> 🧩 syntax สอนไปแล้วทั้งหมด (`.filter().length` = นับตัวที่ตรงเงื่อนไข)

### ขั้นที่ 10.2.2 กล่องสถิติ 4 ช่อง

> 🎯 **ขั้นนี้จะได้:** เห็นจำนวนงานทั้งหมด และแยกตามสถานะ

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 10.2.2 จะเขียนต่อตรงนี้)`

```jsx
  return (
    <Layout user={user}>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <h1 className="text-2xl font-bold mb-4">ผู้รับการประเมินที่ได้รับมอบหมาย</h1>

      <div className="stats stats-vertical sm:stats-horizontal shadow bg-base-100 w-full mb-4">
        <div className="stat">
          <div className="stat-title">ทั้งหมด</div>
          <div className="stat-value">{list.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">ยังไม่ประเมิน</div>
          <div className="stat-value">{count("pending")}</div>
        </div>
        <div className="stat">
          <div className="stat-title">บันทึกร่าง</div>
          <div className="stat-value text-warning">{count("draft")}</div>
        </div>
        <div className="stat">
          <div className="stat-title">ยืนยันผลแล้ว</div>
          <div className="stat-value text-success">{count("confirmed")}</div>
        </div>
      </div>

      {/* (ขั้น 10.2.3 จะเขียนต่อตรงนี้) */}
    </Layout>
  );
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 6 | กล่องสถิติ แนวตั้งบนมือถือ แนวนอนบนจอใหญ่ | บท 09 ขั้น 9.2.2 |
| 9 | จำนวนงานทั้งหมด | - |
| 13, 17, 21 | นับตามสถานะ บันทึกร่างสีเหลือง ยืนยันแล้วสีเขียว | กรรมการรู้ว่าเหลืองานเท่าไร |

### ขั้นที่ 10.2.3 ตารางรายชื่อ

> 🎯 **ขั้นนี้จะได้:** ตารางผู้รับการประเมิน ความคืบหน้า และปุ่มไปหน้าประเมิน

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 10.2.3 จะเขียนต่อตรงนี้) */}`

```jsx
      <div className="overflow-x-auto bg-base-100 rounded-box shadow">
        <table className="table">
          <thead>
            <tr>
              <th>ผู้รับการประเมิน</th>
              <th>บทบาทของท่าน</th>
              <th>ประเมินตนเองแล้ว</th>
              <th>ท่านให้คะแนนแล้ว</th>
              <th>สถานะ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id}>
                <td>
                  <div>{a.full_name}</div>
                  <div className="text-xs opacity-60">
                    {a.position} {a.department}
                  </div>
                </td>
                <td className="whitespace-nowrap">{COMMITTEE_ROLES[a.committee_role]}</td>
                <td className="whitespace-nowrap">
                  {a.self_count}/{a.indicator_count}
                </td>
                <td>
                  <progress className="progress progress-primary w-20 mr-2" value={a.scored_count} max={a.indicator_count || 1} />
                  {a.scored_count}/{a.indicator_count}
                </td>
                <td>
                  <StatusBadge status={a.status} />
                </td>
                <td className="text-right">
                  <Link href={`/committee/evaluate/${a.id}`} className="btn btn-sm btn-primary">
                    {a.status === "confirmed" ? "ดูผล" : "ประเมิน"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="text-center opacity-60 p-4">ยังไม่ได้รับมอบหมาย</p>}
      </div>
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 22 | บทบาทของกรรมการในคู่นี้ (ประธาน/ร่วม) | - |
| 23-25 | ผู้รับการประเมินกรอกคะแนนตัวเองไปกี่ข้อ | กรรมการรู้ว่าเขาพร้อมให้ประเมินหรือยัง |
| 26-29 | ฉันให้คะแนนไปกี่ข้อ พร้อมแถบ | - |
| 34-36 | ปุ่มไปหน้าประเมิน ด้วย **id ของการมอบหมาย** ข้อความเปลี่ยนตามสถานะ | ยืนยันแล้วเขียน "ดูผล" |

✅ **ลองเลย:** (login comm1) เปิด http://localhost:3000/committee → ทั้งหมด 4, ยังไม่ประเมิน 3, ยืนยันผลแล้ว 1 สมชายอยู่ล่างสุดปุ่ม "ดูผล"

## 10.3 ช่องลงลายเซ็น (เกณฑ์ 5.3.7, 5.3.9)

📖 **โจทย์ห้ามใช้ react-signature-canvas** เราจึงเขียนเองด้วยแท็ก `<canvas>` (กระดานวาดรูปของ HTML) แล้วแปลงรูปเป็นข้อความด้วย `toDataURL()` (เก็บลงฐานข้อมูลได้ บท 06 ขั้น 6.7.2)

```text
กดเมาส์/นิ้ว (pointerdown) → เริ่มเส้น (beginPath + moveTo)
ลาก (pointermove)          → ลากเส้นไปจุดใหม่ (lineTo + stroke)
ปล่อย (pointerup)          → จบเส้น → ส่งรูปให้หน้าแม่ (toDataURL)
```

### ขั้นที่ 10.3.1 แปลงตำแหน่งเมาส์เป็นพิกัดบน canvas

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชันที่ทำให้เส้นตรงกับตำแหน่งนิ้ว/เมาส์เสมอ แม้ canvas ถูกย่อบนมือถือ

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/components/SignaturePad.js`

```jsx
import { useRef } from "react";

// ช่องลงลายเซ็นด้วย <canvas> ใช้ได้ทั้งเมาส์และนิ้ว (pointer events)
// วาดเสร็จแต่ละเส้นจะเรียก onChange(dataURL รูป PNG), กดล้างจะได้ ""
export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  // ตำแหน่งเมาส์/นิ้ว -> พิกัดบน canvas (canvas อาจถูกย่อตามขนาดจอ)
  const point = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  // (ขั้น 10.3.2 จะเขียนต่อตรงนี้)
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5 | รับ prop `onChange` | ส่งรูปลายเซ็นกลับให้หน้าแม่ |
| 6 | ตัวอ้างอิงถึงแท็ก canvas | ใช้วาดและอ่านรูป |
| 7 | สถานะ "กำลังวาดอยู่ไหม" เก็บใน **useRef** | ดูคำอธิบายด้านล่าง |
| 10-17 | แปลงตำแหน่งบนจอเป็นพิกัดบน canvas | - |
| 12 | ตำแหน่งและขนาดของ canvas ที่แสดงบนจอจริง | - |
| 14 | (ตำแหน่งเมาส์ - ขอบซ้าย) × (ความกว้างจริง ÷ ความกว้างที่แสดง) | canvas กว้างจริง 500 แต่บนมือถืออาจแสดงแค่ 300 ถ้าไม่ปรับ เส้นจะเพี้ยนไปจากนิ้ว |

📖 **ทำไม `drawing` ใช้ useRef ไม่ใช้ useState?**

| | useState | useRef |
|---|---|---|
| เปลี่ยนค่าแล้ว | หน้าวาดใหม่ | **ไม่วาดใหม่** |
| อ่านค่า/เปลี่ยนค่า | `x` / `setX(…)` | `x.current` / `x.current = …` |
| เหมาะกับ | ค่าที่ต้องแสดงบนหน้า | ค่าที่ใช้ภายใน ไม่ต้องแสดง |

ตอนลากเส้น ฟังก์ชันถูกเรียกหลายสิบครั้งต่อวินาที ถ้าใช้ state หน้าจะวาดใหม่ทุกครั้ง ช้าและเส้นขาด

### ขั้นที่ 10.3.2 วาดเส้นตามการลาก

> 🎯 **ขั้นนี้จะได้:** กด-ลาก-ปล่อย แล้วได้เส้นลายเซ็น และรูปส่งให้หน้าแม่

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 10.3.2 จะเขียนต่อตรงนี้)`

```jsx
  const start = (e) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e3a8a";
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    drawing.current = true;
  };

  const move = (e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvasRef.current.toDataURL("image/png"));
  };

  // (ขั้น 10.3.3 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | เอา "พู่กัน" 2 มิติของ canvas | คำสั่งวาดทั้งหมดเรียกผ่าน ctx |
| 3-5 | เส้นหนา 3 ปลายมน สีน้ำเงินเข้ม | หน้าตาลายเซ็น |
| 7 | เริ่มเส้นใหม่ | ไม่งั้นทุกเส้นจะต่อกันเป็นเส้นเดียว |
| 8 | ยกพู่กันไปวางที่จุดเริ่ม (ยังไม่วาด) | - |
| 9 | จำว่ากำลังวาด | - |
| 13 | ไม่ได้กดอยู่ (แค่เลื่อนเมาส์ผ่าน) ไม่ต้องวาด | - |
| 16-17 | ลากเส้นไปจุดใหม่ แล้ววาดให้เห็น | - |
| 21-23 | จบเส้น แล้ว **แปลงรูปทั้ง canvas เป็นข้อความ** ส่งให้หน้าแม่ | หน้าแม่เก็บไว้ส่ง API ตอนยืนยัน |

🧩 **Syntax ใหม่: คำสั่งวาดของ canvas (🟣 ของเบราว์เซอร์)**

| คำสั่ง | ทำอะไร |
|---|---|
| `canvas.getContext("2d")` | เอาเครื่องมือวาด 2 มิติ |
| `ctx.beginPath()` | เริ่มเส้นใหม่ |
| `ctx.moveTo(x, y)` | ย้ายพู่กันไปจุดนี้ (ไม่วาด) |
| `ctx.lineTo(x, y)` | ลากเส้นไปจุดนี้ |
| `ctx.stroke()` | วาดเส้นที่ลากไว้ให้เห็น |
| `canvas.toDataURL("image/png")` | แปลงรูปทั้งหมดเป็นข้อความ `data:image/png;base64,…` |

### ขั้นที่ 10.3.3 ปุ่มล้าง และแท็ก canvas

> 🎯 **ขั้นนี้จะได้:** SignaturePad ครบ ใช้ได้ทั้งเมาส์และนิ้ว

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 10.3.3 จะเขียนต่อตรงนี้)`

```jsx
  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={500}
        height={160}
        className="border border-base-300 rounded-box bg-white w-full max-w-md touch-none cursor-crosshair"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <button type="button" className="btn btn-xs mt-1" onClick={clear}>
        ล้างลายเซ็น
      </button>
    </div>
  );
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1-5 | ลบทั้ง canvas แล้วบอกหน้าแม่ว่าลายเซ็นว่าง (`""`) | ปุ่ม "ล้างลายเซ็น" |
| 11-12 | ขนาด **จริง** ของรูป 500×160 | ความละเอียดของรูปที่บันทึก |
| 13 | ขนาดที่ **แสดง**: กว้างเต็มแต่ไม่เกิน `max-w-md`, `touch-none`, เคอร์เซอร์รูป + | `touch-none` **สำคัญมาก** ไม่งั้นลากนิ้วบนมือถือแล้วหน้าเลื่อนแทนการวาด |
| 14-17 | ผูกเหตุการณ์ของเมาส์/นิ้ว (pointer events) | `onPointerLeave={end}` = ลากออกนอกกรอบก็จบเส้น |
| 19 | ปุ่มล้าง `type="button"` | ไม่ไปส่งฟอร์มของหน้าแม่ |

> 💡 **Pointer events** (`onPointerDown`, `onPointerMove`, `onPointerUp`) ใช้ได้ทั้งเมาส์ นิ้ว และปากกา ไม่ต้องเขียนแยก mouse/touch

## 10.4 กฎตรวจก่อนบันทึกและยืนยัน

### ขั้นที่ 10.4.1 schema ฝั่งหน้าของกรรมการ

> 🎯 **ขั้นนี้จะได้:** กฎตรวจก่อนบันทึกร่าง และก่อนยืนยัน (บอกผู้ใช้ก่อนยิง API)

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/schemas/committee.js`

```js
import { z } from "zod";

const comment = z.string().trim().max(2000, "ความเห็นต้องไม่เกิน 2000 ตัวอักษร");

// บันทึกร่าง: ความเห็นว่างได้
export const draftSchema = z.object({ summary_comment: comment });

// ก่อนยืนยันผล: ให้คะแนนครบ มีความเห็นสรุป และลงลายเซ็นแล้ว
export const confirmSchema = z
  .object({
    scored: z.number(),
    total: z.number(),
    summary_comment: comment.min(1, "กรุณากรอกความเห็นสรุปก่อนยืนยัน"),
    signature: z.string().min(1, "กรุณาลงลายเซ็นก่อนยืนยัน"),
  })
  .refine((d) => d.scored === d.total, { message: "กรุณาให้คะแนนให้ครบทุกตัวชี้วัด", path: ["scores"] });
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | กฎความเห็น เก็บในตัวแปร | ใช้ซ้ำ 2 schema |
| 6 | บันทึกร่าง: ความเห็นว่างได้ | ร่างระหว่างทางยังไม่ต้องครบ |
| 11-12 | จำนวนข้อที่ให้คะแนน และจำนวนทั้งหมด (หน้าเว็บนับแล้วส่งมาตรวจ) | - |
| 13 | ความเห็น **บังคับ** (ต่อกฎเดิมด้วย `.min(1, …)`) | - |
| 14 | ลายเซ็นบังคับ (ข้อความว่าง = ยังไม่เซ็น) | - |
| 16 | ให้คะแนนครบทุกข้อ error ใส่ชื่อ `scores` | แสดงรวมกับ error อื่นในขั้น 10.5.10 |

> 💡 schema นี้ไม่ได้ตรวจข้อมูลที่ส่ง API ตรงๆ แต่ตรวจ "ความพร้อม" ของหน้า (ครบไหม เซ็นหรือยัง) backend ก็ตรวจซ้ำทุกข้อ (บท 06 ขั้น 6.7.8)

## 10.5 หน้าประเมิน

### ขั้นที่ 10.5.1 ตัวเลือกคะแนน และ state ของหน้า

> 🎯 **ขั้นนี้จะได้:** ส่วนต้นของหน้า /committee/evaluate/[id]

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/pages/committee/evaluate/[id].js` (สร้างโฟลเดอร์ `evaluate` ก่อน)

```jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Paperclip, Printer } from "lucide-react";
import api, { errorMessage, downloadFile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { validateWith } from "@/lib/validate";
import { COMMITTEE_ROLES, SCALE_LABELS, EVIDENCE_TYPES } from "@/lib/constants";
import { scoreLabel, thaiDate } from "@/lib/format";
import { draftSchema, confirmSchema } from "@/schemas/committee";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import SignaturePad from "@/components/SignaturePad";

// ตัวเลือกคะแนนของกรรมการ
const scoreOptions = (type) =>
  type === "yes_no"
    ? [{ value: 1, label: "มี" }, { value: 0, label: "ไม่มี" }]
    : [1, 2, 3, 4].map((v) => ({ value: v, label: String(v), title: SCALE_LABELS[v] }));

export default function Evaluate() {
  const user = useAuth(["committee"]);
  const { id } = useRouter().query;
  const [data, setData] = useState(null);
  const [scores, setScores] = useState({}); // { indicator_id: score } ที่กำลังแก้
  const [comment, setComment] = useState("");
  const [signature, setSignature] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });

  // (ขั้น 10.5.2 จะเขียนต่อตรงนี้)
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 16-19 | ตัวเลือกคะแนน: มี/ไม่มี หรือ 1-4 (label สั้นเป็นตัวเลข คำอธิบายเก็บใน `title`) | ปุ่มเล็กเรียงแนวนอน ชี้เมาส์แล้วเห็นคำอธิบาย |
| 23 | id ของ **การมอบหมาย** จาก URL | - |
| 24 | ข้อมูลทั้งหมดจาก API | - |
| 25 | คะแนนที่กำลังเลือก `{ 1: 4, 2: 3 }` (ยังไม่บันทึก) | เลือกได้หลายข้อก่อนกดบันทึกร่าง |
| 26 | ความเห็นที่กำลังพิมพ์ | - |
| 27 | ลายเซ็น (ข้อความรูป) จาก SignaturePad | - |
| 28 | error จากการตรวจ schema | - |
| 29 | ข้อความแจ้งผล `{ type, text }` | แพตเทิร์นบท 07 ขั้น 7.14.2 |

> 🧩 syntax ใหม่: `String(v)` = แปลงตัวเลขเป็นข้อความ (`String(3)` → `"3"`)

### ขั้นที่ 10.5.2 โหลดข้อมูล และเติมคะแนนร่างเดิม

> 🎯 **ขั้นนี้จะได้:** เปิดหน้าแล้วคะแนนที่เคยบันทึกร่างไว้ยังอยู่

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 10.5.2 จะเขียนต่อตรงนี้)`

```jsx
  const load = () =>
    api.get(`/committee/assignments/${id}`).then((res) => {
      const d = res.data.data;
      const saved = {};
      for (const t of d.topics) for (const i of t.indicators) if (i.score != null) saved[i.id] = i.score;
      setData(d);
      setScores(saved);
      setComment(d.assignment.summary_comment || "");
    }).catch((err) => setMessage({ type: "error", text: errorMessage(err) }));

  useEffect(() => {
    if (user && id) load();
  }, [user, id]); // eslint-disable-line react-hooks/exhaustive-deps

  // (ขั้น 10.5.3 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | โหลดข้อมูลสำหรับประเมิน (บท 06 ขั้น 6.7.4) | - |
| 4-5 | วนทุกหัวข้อ ทุกตัวชี้วัด เก็บคะแนนที่บันทึกไว้แล้วเป็น `{ id: score }` | **ออกแล้วเข้าใหม่ คะแนนร่างยังอยู่** |
| 6-8 | เก็บข้อมูล, คะแนน, ความเห็นเดิม ลง state | - |
| 9 | ผิดพลาด (เช่น id ไม่ใช่งานของฉัน → 404) แสดงข้อความ | - |
| 11-13 | โหลดเมื่อมีทั้ง user และ id | - |

> 🧩 syntax ใหม่: `for … of` ซ้อนกัน + `if` ในบรรทัดเดียว = "ทุกหัวข้อ → ทุกตัวชี้วัด → ถ้ามีคะแนนเก็บไว้" (ถ้าอ่านยาก เขียนแยกบรรทัดพร้อม `{ }` ได้ผลเหมือนกัน)

### ขั้นที่ 10.5.3 บันทึกร่าง (เกณฑ์ 5.3.8)

> 🎯 **ขั้นนี้จะได้:** กด "บันทึกร่าง" แล้วคะแนนและความเห็นถูกบันทึก (ยังแก้ได้)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 10.5.3 จะเขียนต่อตรงนี้)`

```jsx
  // ส่งคะแนน + ความเห็นไปบันทึกร่าง
  const sendDraft = () =>
    api.put(`/committee/assignments/${id}/scores`, {
      scores: Object.entries(scores).map(([indicatorId, score]) => ({ indicator_id: Number(indicatorId), score })),
      summary_comment: comment,
    });

  const saveDraft = async () => {
    const check = validateWith(draftSchema)({ summary_comment: comment });
    setErrors(check.errors);
    if (Object.keys(check.errors).length) return;
    try {
      const res = await sendDraft();
      setMessage({ type: "success", text: res.data.message });
      load();
    } catch (err) {
      setMessage({ type: "error", text: errorMessage(err) });
    }
  };

  // (ขั้น 10.5.4 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2-6 | `sendDraft`: แปลง `{ 1: 4, 2: 3 }` เป็น `[{ indicator_id: 1, score: 4 }, …]` แล้วส่ง | รูปแบบที่ backend ต้องการ (บท 06 ขั้น 6.7.1) ใช้ซ้ำตอนยืนยัน |
| 4 | `Number(indicatorId)` | ชื่อช่องของ object เป็นข้อความเสมอ (`"1"`) ต้องแปลงกลับเป็นตัวเลข |
| 9 | **เรียก `validateWith` เอง** (ไม่ผ่าน RHF) ได้ `{ values, errors }` | ตรวจความเห็นไม่เกิน 2000 ตัว |
| 10-11 | เก็บ error และถ้ามี error ไม่ส่ง | - |
| 13-15 | ส่ง → แจ้งสำเร็จ → โหลดใหม่ | สถานะเป็น "บันทึกร่าง" ตารางผลอัปเดต |

> 🧩 syntax ใหม่: `Object.keys(obj).length` = จำนวนช่องใน object (`{}` → 0) ใช้ตรวจว่ามี error ไหม

### ขั้นที่ 10.5.4 ยืนยันผล (เกณฑ์ 5.3.9, 5.3.10)

> 🎯 **ขั้นนี้จะได้:** ตรวจความพร้อม ถามยืนยัน บันทึกค่าล่าสุด แล้วยืนยันพร้อมลายเซ็น

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 10.5.4 จะเขียนต่อตรงนี้)`

```jsx
  const confirmResult = async () => {
    const indicators = data.topics.flatMap((t) => t.indicators);
    const check = validateWith(confirmSchema)({
      scored: indicators.filter((i) => scores[i.id] != null).length,
      total: indicators.length,
      summary_comment: comment,
      signature,
    });
    setErrors(check.errors);
    if (Object.keys(check.errors).length) return;
    if (!confirm("ยืนยันและส่งผลการประเมิน? หลังยืนยันแล้วจะแก้ไขไม่ได้")) return;
    try {
      await sendDraft(); // บันทึกค่าล่าสุดก่อน
      const res = await api.put(`/committee/assignments/${id}/confirm`, { signature });
      setMessage({ type: "success", text: res.data.message });
      load();
    } catch (err) {
      setMessage({ type: "error", text: errorMessage(err) });
    }
  };

  // (ขั้น 10.5.5 จะเขียนต่อตรงนี้)
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | รวมตัวชี้วัดทุกหัวข้อเป็น array เดียว | นับจำนวนทั้งหมด |
| 3-8 | ตรวจความพร้อม: นับข้อที่ให้คะแนนแล้ว, ทั้งหมด, ความเห็น, ลายเซ็น | - |
| 9-10 | มี error → แสดง ไม่ไปต่อ | "กรุณาลงลายเซ็นก่อนยืนยัน" ฯลฯ |
| 11 | ถามยืนยัน เพราะ **ยืนยันแล้วแก้ไม่ได้** | กันกดพลาด |
| 13 | บันทึกคะแนนและความเห็นล่าสุดก่อน | ถ้าแก้คะแนนแล้วไม่ได้กดบันทึกร่าง ค่าล่าสุดจะไม่หาย |
| 14 | ยืนยัน + ลายเซ็น | - |
| 16 | โหลดใหม่ | สถานะเป็น confirmed หน้าล็อก (ขั้น 10.5.5) |

> 🧩 syntax ใหม่: `.flatMap((t) => t.indicators)` = map แล้ว "แผ่" array ซ้อนให้เหลือชั้นเดียว (`[[a, b], [c]]` → `[a, b, c]`)
> 💡 `signature,` ในบรรทัด 7 = object แบบย่อชื่อ (บท 03 ขั้น 3.8.1)

### ขั้นที่ 10.5.5 ข้อมูลผู้รับการประเมิน และสถานะล็อก (เกณฑ์ 5.3.2)

> 🎯 **ขั้นนี้จะได้:** ส่วนบนของหน้าประเมิน

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 10.5.5 จะเขียนต่อตรงนี้)`

```jsx
  if (!user) return null;
  if (!data) return <Layout user={user}>{message.text && <div className="alert alert-error">{message.text}</div>}</Layout>;

  const { assignment, evaluatee, topics, summary } = data;
  const locked = assignment.status === "confirmed";
  const allIndicators = topics.flatMap((t) => t.indicators);

  return (
    <Layout user={user}>
      <div className="flex justify-between items-center gap-2 mb-2 print:hidden">
        <Link href="/committee" className="btn btn-sm btn-ghost">
          ← กลับ
        </Link>
        <button className="btn btn-sm" onClick={() => window.print()}>
          <Printer size={16} /> พิมพ์ / PDF
        </button>
      </div>

      {/* ข้อมูลผู้รับการประเมิน */}
      <div className="card bg-base-100 shadow mb-4 print:shadow-none">
        <div className="card-body">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <h1 className="card-title text-2xl">{evaluatee.full_name}</h1>
              <p className="opacity-70">
                {evaluatee.position} {evaluatee.department}
              </p>
              <p className="text-sm opacity-70">
                {evaluatee.email} {evaluatee.phone}
              </p>
            </div>
            <div className="text-right space-y-1">
              <div className="badge badge-outline">{COMMITTEE_ROLES[assignment.committee_role]}</div>
              <div>
                <StatusBadge status={assignment.status} />
              </div>
              <div className="text-sm">
                ให้คะแนนแล้ว {Object.keys(scores).length}/{allIndicators.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {message.text && <div className={`alert alert-${message.type} mb-4`}>{message.text}</div>}
      {locked && (
        <div className="alert alert-success mb-4">ยืนยันผลแล้วเมื่อ {thaiDate(assignment.confirmed_at)} ไม่สามารถแก้ไขได้</div>
      )}

      {/* (ขั้น 10.5.6 จะเขียนต่อตรงนี้) */}
    </Layout>
  );
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | ยังไม่มีข้อมูล แสดงข้อความ (ถ้ามี) | - |
| 4 | แกะ 4 ส่วนจากข้อมูล | - |
| 5 | **`locked`** = ยืนยันแล้วหรือยัง | ใช้ปิดทุกปุ่มและช่องกรอก (เกณฑ์ 5.3.10) |
| 6 | ตัวชี้วัดทั้งหมด | นับ "ให้คะแนนแล้ว x/y" |
| 10-17 | ปุ่มกลับ และปุ่มพิมพ์ (ซ่อนตอนพิมพ์) | - |
| 20-43 | การ์ดข้อมูลผู้รับการประเมิน: ชื่อ ตำแหน่ง แผนก อีเมล โทร | **เกณฑ์ 5.3.2** |
| 33 | บทบาทของฉันในคู่นี้ (ป้ายขอบ) | - |
| 38 | ให้คะแนนแล้วกี่ข้อ **นับจาก state** | อัปเดตทันทีที่กดปุ่มคะแนน (ยังไม่ต้องบันทึก) |
| 45 | ข้อความแจ้งผล สีตาม type | - |
| 46-48 | ยืนยันแล้ว แสดงกล่องเขียวพร้อมวันที่ | - |

### ขั้นที่ 10.5.6 การ์ดตัวชี้วัด: ข้อมูล หลักฐาน และคะแนนตนเอง (เกณฑ์ 5.3.3)

> 🎯 **ขั้นนี้จะได้:** เห็นหลักฐานและคะแนนที่ผู้รับการประเมินให้ตนเองทุกตัวชี้วัด

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 10.5.6 จะเขียนต่อตรงนี้) */}`

```jsx
      {/* ตัวชี้วัด + หลักฐาน + คะแนนตนเอง + ช่องให้คะแนน */}
      {topics.map((t) => (
        <section key={t.id} className="mb-4 print:hidden">
          <h2 className="text-lg font-bold mb-2">{t.title}</h2>
          <div className="space-y-3">
            {t.indicators.map((i) => (
              <div key={i.id} className="card bg-base-100 shadow">
                <div className="card-body p-4 gap-2">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div className="flex-1 min-w-48">
                      <h3 className="font-bold">{i.name}</h3>
                      <p className="text-sm opacity-70">{i.description}</p>
                      <p className="text-xs">
                        น้ำหนัก {i.weight} | หลักฐาน: {EVIDENCE_TYPES[i.evidence_type]}
                      </p>
                    </div>
                    <div className="text-sm">
                      ผู้รับการประเมินให้ตนเอง: <b>{scoreLabel(i.self_score, i.score_type)}</b>
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="font-medium">รายละเอียดประกอบ / หลักฐาน ({i.evidences.length})</div>
                    <ul className="list-disc list-inside">
                      {i.evidences.map((ev) => (
                        <li key={ev.id} className="break-all">
                          {ev.description}{" "}
                          {ev.file_name && (
                            <button
                              type="button"
                              className="link link-primary"
                              onClick={() => downloadFile(`/evidences/${ev.id}/file`, ev.file_name).catch((err) => alert(errorMessage(err)))}
                            >
                              <Paperclip size={12} className="inline" /> {ev.file_name}
                            </button>
                          )}
                          {ev.url && (
                            <a href={ev.url} target="_blank" rel="noreferrer" className="link link-primary">
                              {ev.url}
                            </a>
                          )}
                        </li>
                      ))}
                      {i.evidences.length === 0 && <li className="opacity-60">ไม่มี</li>}
                    </ul>
                  </div>

                  {/* (ขั้น 10.5.7 จะเขียนต่อตรงนี้) */}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      <p className="text-xs opacity-60 mb-4 print:hidden">
        ระดับ 1 = {SCALE_LABELS[1]}, 2 = {SCALE_LABELS[2]}, 3 = {SCALE_LABELS[3]}, 4 = {SCALE_LABELS[4]}
      </p>

      {/* (ขั้น 10.5.8 จะเขียนต่อตรงนี้) */}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | หัวข้อและการ์ดทั้งหมด **ซ่อนตอนพิมพ์** | PDF ของกรรมการมีแค่ตารางผลและลายเซ็น (สั้นกว่า) |
| 10-16 | ชื่อ คำอธิบาย น้ำหนัก ชนิดหลักฐาน | - |
| 17-19 | คะแนนที่ผู้รับการประเมินให้ตนเอง (ตัวหนา) | กรรมการเทียบได้ |
| 25 | วนหลักฐาน | - |
| 28-36 | มีไฟล์: ปุ่มดาวน์โหลดผ่าน API (ถ้าพลาด แจ้งด้วย alert) | backend ตรวจว่ากรรมการคนนี้ได้รับมอบหมายจริง (บท 06 ขั้น 6.6.2) |
| 37-41 | มี URL: ลิงก์เปิดแท็บใหม่ | - |
| 44 | ไม่มีหลักฐาน แสดง "ไม่มี" | - |
| 55-57 | คำอธิบายระดับ 1-4 ใต้การ์ดทั้งหมด | ปุ่มคะแนนเป็นแค่ตัวเลข จึงอธิบายรวมไว้ที่เดียว |

> 🧩 syntax สอนไปแล้วทั้งหมด (โครงคล้ายบท 09 ขั้น 9.3.7)

### ขั้นที่ 10.5.7 ปุ่มให้คะแนน (เกณฑ์ 5.3.4)

> 🎯 **ขั้นนี้จะได้:** กดปุ่มคะแนนแต่ละตัวชี้วัด เลือกแล้วปุ่มเปลี่ยนสี

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 10.5.7 จะเขียนต่อตรงนี้) */}`

```jsx
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">คะแนนของท่าน:</span>
                    {scoreOptions(i.score_type).map((o) => (
                      <input
                        key={o.value}
                        type="radio"
                        name={`score-${i.id}`}
                        className="btn btn-sm min-w-12"
                        aria-label={o.label}
                        title={o.title}
                        checked={scores[i.id] === o.value}
                        disabled={locked}
                        onChange={() => setScores({ ...scores, [i.id]: o.value })}
                      />
                    ))}
                    {scores[i.id] == null && <span className="text-xs text-warning">ยังไม่ให้คะแนน</span>}
                  </div>
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | วนตัวเลือก (2 หรือ 4 ตัว) | - |
| 6-7 | radio ชื่อกลุ่มตามตัวชี้วัด | เลือกได้ทีละ 1 ต่อตัวชี้วัด |
| 8-9 | **radio ที่หน้าตาเป็นปุ่ม** (class `btn` + `aria-label` เป็นข้อความบนปุ่ม) | daisyUI ทำให้ radio ที่มี class btn แสดงเป็นปุ่ม เลือกแล้วเปลี่ยนสี |
| 10 | ชี้เมาส์แล้วเห็นคำอธิบายระดับ | - |
| 11 | ติ๊กตามคะแนนใน state | - |
| 12 | ยืนยันแล้วกดไม่ได้ | เกณฑ์ 5.3.10 |
| 13 | เลือก → เก็บใน state (สำเนาเดิม + เปลี่ยนข้อนี้) **ยังไม่บันทึก** | กดบันทึกร่างหรือยืนยันทีเดียว |
| 16 | ยังไม่ให้คะแนน แสดงข้อความเหลือง | เห็นทันทีว่าเหลือข้อไหน |

> 🧩 syntax สอนไปแล้ว: `{ ...scores, [i.id]: o.value }` (กระจาย + ชื่อช่องจากตัวแปร บท 08 ขั้น 8.5.2)

### ขั้นที่ 10.5.8 ความเห็นสรุป และปุ่มบันทึกร่าง (เกณฑ์ 5.3.5)

> 🎯 **ขั้นนี้จะได้:** ช่องความเห็น (ล็อกแล้วแสดงเป็นข้อความ)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 10.5.8 จะเขียนต่อตรงนี้) */}`

```jsx
      {/* ความเห็นสรุป */}
      <div className="card bg-base-100 shadow mb-4 print:shadow-none">
        <div className="card-body">
          <h2 className="card-title">ความเห็นสรุปโดยภาพรวม</h2>
          {locked ? (
            <p className="whitespace-pre-line">{assignment.summary_comment}</p>
          ) : (
            <>
              <textarea className="textarea w-full" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
              {errors.summary_comment && <p className="text-error text-sm">{errors.summary_comment.message}</p>}
              <button className="btn btn-outline w-fit" onClick={saveDraft}>
                บันทึกร่าง
              </button>
            </>
          )}
        </div>
      </div>

      {/* (ขั้น 10.5.9 จะเขียนต่อตรงนี้) */}
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5-6 | ล็อกแล้ว: แสดงความเห็นเป็นข้อความ | แก้ไม่ได้ |
| 7-14 | ยังไม่ล็อก: ช่องพิมพ์ (controlled) + error + ปุ่มบันทึกร่าง | - |
| 9 | ช่องข้อความผูกกับ state `comment` | บท 08 ขั้น 8.4.5 |
| 10 | แสดง error จากการตรวจ draftSchema | - |

> 🧩 syntax ใหม่: ternary ใน JSX ที่แต่ละฝั่งเป็น JSX หลายบรรทัด `{เงื่อนไข ? ( … ) : ( … )}` และฝั่งที่มีหลายแท็กห่อด้วย `<>…</>`

### ขั้นที่ 10.5.9 ตารางผลการประเมิน (เกณฑ์ 5.3.6)

> 🎯 **ขั้นนี้จะได้:** ตารางคะแนนที่บันทึกแล้ว พร้อมคะแนนรวม

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 10.5.9 จะเขียนต่อตรงนี้) */}`

```jsx
      {/* ตารางผลลัพธ์ */}
      <div className="card bg-base-100 shadow mb-4 print:shadow-none">
        <div className="card-body">
          <h2 className="card-title">ผลการประเมินรายตัวชี้วัด</h2>
          {!locked && <p className="text-xs opacity-60 print:hidden">แสดงคะแนนที่บันทึกแล้ว (กดบันทึกร่างเพื่ออัปเดตตาราง)</p>}
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>ตัวชี้วัด</th>
                  <th className="text-right">น้ำหนัก</th>
                  <th className="text-center">ตนเอง</th>
                  <th className="text-center">กรรมการ</th>
                  <th className="text-right">คะแนนที่ได้</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((t) => [
                  <tr key={`t${t.id}`} className="bg-base-200">
                    <td colSpan={5} className="font-bold">
                      {t.title}
                    </td>
                  </tr>,
                  ...t.indicators.map((i) => (
                    <tr key={i.id}>
                      <td>{i.name}</td>
                      <td className="text-right">{i.weight}</td>
                      <td className="text-center">{scoreLabel(i.self_score, i.score_type)}</td>
                      <td className="text-center">{scoreLabel(i.score, i.score_type)}</td>
                      <td className="text-right">{i.weighted_score}</td>
                    </tr>
                  )),
                ])}
              </tbody>
              <tfoot>
                <tr>
                  <td>รวม</td>
                  <td className="text-right">{summary.total_weight}</td>
                  <td colSpan={2} className="text-center">
                    {summary.scored}/{summary.indicator_count} ตัวชี้วัด
                  </td>
                  <td className="text-right">
                    {summary.total} ({summary.percent}%)
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* (ขั้น 10.5.10 จะเขียนต่อตรงนี้) */}
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5 | หมายเหตุ: ตารางแสดงค่าที่ **บันทึกแล้ว** (จาก API) ไม่ใช่ค่าที่กำลังกด | กดบันทึกร่างแล้วตารางอัปเดต |
| 18 | แถวหัวข้อ + แถวตัวชี้วัด (แพตเทิร์นเดียวกับบท 09 ขั้น 9.4.2) | คอลัมน์ตายตัว 5 คอลัมน์ จึง `colSpan={5}` |
| 28 | คะแนนที่ผู้รับการประเมินให้ตนเอง | - |
| 29 | คะแนนที่ฉันให้ (ที่บันทึกแล้ว) | - |
| 30 | คะแนนถ่วงน้ำหนักที่คำนวณจาก backend | - |
| 37-43 | รวม: ให้คะแนนแล้วกี่ข้อ คะแนนรวม และ % | **เกณฑ์ 5.3.6** |

### ขั้นที่ 10.5.10 ลงนาม และยืนยันผล (เกณฑ์ 5.3.7, 5.3.9)

> 🎯 **ขั้นนี้จะได้:** หน้าประเมินครบ วาดลายเซ็นแล้วยืนยันได้ ยืนยันแล้วแสดงรูปลายเซ็น

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `{/* (ขั้น 10.5.10 จะเขียนต่อตรงนี้) */}`

```jsx
      {/* ลงนาม + ยืนยัน */}
      <div className="card bg-base-100 shadow mb-4 print:shadow-none">
        <div className="card-body">
          <h2 className="card-title">ลงนามการประเมิน</h2>
          {locked ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assignment.signature} alt="ลายเซ็น" className="h-24 border border-base-300 rounded bg-white" />
              <p className="text-sm mt-1">
                {user.full_name} ({COMMITTEE_ROLES[assignment.committee_role]}) ลงนามเมื่อ {thaiDate(assignment.confirmed_at)}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm opacity-70">วาดลายเซ็นในกรอบด้านล่าง แล้วกดยืนยันและส่งผล</p>
              <SignaturePad onChange={setSignature} />
              {/* error ก่อนยืนยัน: คะแนนไม่ครบ / ไม่มีความเห็น / ไม่มีลายเซ็น */}
              {Object.entries(errors).map(([field, e]) => (
                <p key={field} className="text-error text-sm">
                  {e.message}
                </p>
              ))}
              <button className="btn btn-primary w-fit" onClick={confirmResult}>
                ยืนยันและส่งผลการประเมิน
              </button>
            </>
          )}
        </div>
      </div>
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5-12 | ล็อกแล้ว: แสดงรูปลายเซ็น ชื่อ บทบาท วันที่ | หลักฐานการลงนาม พิมพ์ออกมาได้ |
| 16 | SignaturePad ส่งรูปมาที่ `setSignature` | **ส่งฟังก์ชัน setState เป็น prop** ได้เลย ลูกเรียก = แม่เก็บค่า |
| 18-22 | แสดง error ทุกตัว (คะแนนไม่ครบ / ไม่มีความเห็น / ไม่มีลายเซ็น) | ผู้ใช้เห็นทุกเรื่องที่ต้องแก้พร้อมกัน |
| 23 | ปุ่มยืนยัน | - |

> 🧩 syntax สอนไปแล้ว: `Object.entries(errors).map(([field, e]) => …)` (บท 07 ขั้น 7.11.2) วนทุก error ใช้ชื่อช่องเป็น key

<details>
<summary>📄 ไฟล์ทั้งหมดของบทนี้ (กดดูไว้เทียบ)</summary>

- [frontend/pages/committee/index.js](../../frontend/pages/committee/index.js)
- [frontend/components/SignaturePad.js](../../frontend/components/SignaturePad.js)
- [frontend/schemas/committee.js](../../frontend/schemas/committee.js)
- [frontend/pages/committee/evaluate/[id].js](../../frontend/pages/committee/evaluate/[id].js)

</details>

## 10.6 ทดสอบรวม

### ขั้นที่ 10.6.1 ทดสอบหน้ากรรมการทั้งหมด

> 🎯 **ขั้นนี้จะได้:** มั่นใจว่าครบเกณฑ์ 5.3.1-5.3.10

login **comm1** → หน้าหลัก → ปุ่ม "ประเมิน" ของ **มาลี ศรีสุข**

| # | ทำ | ต้องเห็น |
|---|---|---|
| 1 | เปิดหน้า | ข้อมูลผู้รับการประเมิน หลักฐาน คะแนนตนเอง (เกณฑ์ 5.3.2-5.3.3) |
| 2 | ให้คะแนน 2 ข้อ | "ให้คะแนนแล้ว 2/6" เปลี่ยนทันที |
| 3 | พิมพ์ความเห็น → บันทึกร่าง | กล่องเขียว "บันทึกร่างสำเร็จ" สถานะ "บันทึกร่าง" ตารางผลอัปเดต |
| 4 | กลับหน้าหลัก แล้วเข้าใหม่ | คะแนนร่าง 2 ข้อและความเห็นยังอยู่ |
| 5 | กดยืนยันโดยยังให้คะแนนไม่ครบ และยังไม่เซ็น | "กรุณาลงลายเซ็นก่อนยืนยัน" และ "กรุณาให้คะแนนให้ครบทุกตัวชี้วัด" |
| 6 | ให้ครบ 6 ข้อ วาดลายเซ็น → ยืนยัน → ตกลง | หน้าล็อก ปุ่มคะแนนกดไม่ได้ เห็นรูปลายเซ็น |
| 7 | login teach2 → ผลการประเมิน | เห็นความเห็นและลายเซ็นของ comm1 |
| 8 | F12 → โหมดมือถือ แล้วลากเซ็นในงานอื่น | วาดได้ หน้าไม่เลื่อนตามนิ้ว |
| 9 | พิมพ์ / PDF | ไม่มีการ์ดตัวชี้วัด มีตารางผลและลายเซ็น |

✅ **ผ่านเมื่อ:** ครบ 9 ข้อ แล้ว **รีเซ็ตฐานข้อมูล** ก่อนไปบท 11

---

## ❗ ปัญหาที่พบบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| เส้นลายเซ็นไม่ตรงกับเมาส์ | ไม่ได้แปลงพิกัดตามอัตราส่วน | ใช้ฟังก์ชัน `point(e)` |
| ลากนิ้วบนมือถือแล้วหน้าเลื่อน | ไม่มี `touch-none` | ใส่ class `touch-none` ที่ canvas |
| เส้นต่อกันเป็นเส้นเดียวทั้งหมด | ไม่ได้ `beginPath()` ตอนเริ่มเส้นใหม่ | เรียกใน `start` |
| เส้นขาดๆ หรือช้า | ใช้ useState เก็บ drawing | ใช้ `useRef` |
| ปุ่มคะแนนไม่เปลี่ยนสี | `checked` เทียบผิดชนิด (ข้อความ vs ตัวเลข) | `scores[i.id] === o.value` ทั้งคู่เป็นตัวเลข |
| backend ตอบ "ไม่พบตัวชี้วัดรหัส NaN" | ไม่ได้แปลง key เป็นตัวเลข | `Number(indicatorId)` |
| ยืนยันแล้วยังแก้คะแนนได้ | ไม่ได้ใส่ `disabled={locked}` | ตรวจปุ่มคะแนน (backend ก็ปฏิเสธอยู่แล้ว) |
| เข้าหน้าประเมินแล้วได้ "ไม่พบงานที่ได้รับมอบหมาย" | id ใน URL เป็นงานของกรรมการคนอื่น | เข้าจากปุ่มในหน้าหลักของตัวเอง |
| แก้คะแนนแล้วกดยืนยัน ได้คะแนนเก่า | ไม่ได้เรียก `sendDraft()` ก่อน confirm | ตรวจขั้น 10.5.4 บรรทัด 13 |

---

⬅️ [บทที่ 09](09-frontend-evaluatee.md) | ➡️ [บทที่ 11: โจทย์ท้าทาย](11-challenges.md)
