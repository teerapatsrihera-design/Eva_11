# บทที่ 07: Frontend พื้นฐานและหน้า Login

## เป้าหมาย

เรียนจบบทนี้แล้ว นักเรียนจะ
- เข้าใจ React เท่าที่ระบบนี้ใช้: component, JSX, props, state, effect
- เข้าใจ Next.js Pages Router (1 ไฟล์ = 1 หน้าเว็บ)
- ใช้ class ของ Tailwind / daisyUI ตกแต่งหน้า และทำให้รองรับมือถือ
- สร้างไฟล์กลาง: เรียก API, จัดการ login, ตรวจฟอร์ม
- สร้างหน้า Login, เปลี่ยนรหัสผ่าน, ข้อมูลส่วนตัว และ Layout เมนู

🏆 ได้คะแนนข้อ: 5.2.1 บังคับเปลี่ยนรหัสครั้งแรก, 5.2.2 แก้ข้อมูลส่วนตัว, 7.1 Login ถูก/ผิด, 7.4 Validate ฝั่งหน้า, 7.10 Responsive

⏱️ ครั้งแรกที่เรียน: ประมาณ **6 ชั่วโมง** (แบ่งเรียน 2 ครั้ง) | วันแข่ง (เมื่อคล่องแล้ว): **45 นาที**

### บทนี้แบ่งเป็นขั้นเล็กๆ

| ภาค | ทำอะไร | จำนวนขั้น |
|---|---|---|
| ภาค ก (7.1-7.3) | React, Next.js, Tailwind เท่าที่ต้องใช้ (ตัวอย่างสั้นๆ ยังไม่แตะโปรเจกต์) | 8 ขั้น |
| ภาค ข (7.4-7.14) | สร้างไฟล์กลางและหน้าแรกๆ ของระบบ | 24 ขั้น |

### ไฟล์ที่จะสร้าง/แก้ในบทนี้

```
frontend/
├── next.config.mjs           ← ขั้น 7.4  (แก้) ส่งต่อ /api ไป backend
├── lib/
│   ├── api.js                ← ขั้น 7.5  ตัวเรียก API กลาง
│   ├── auth.js               ← ขั้น 7.6  จำผู้ใช้ที่ login + ยามเฝ้าหน้า
│   ├── validate.js           ← ขั้น 7.7  เชื่อม Zod กับฟอร์ม
│   ├── constants.js          ← ขั้น 7.11 ข้อความภาษาไทยที่ใช้หลายหน้า
│   └── format.js             ← ขั้น 7.11 จัดรูปแบบวันที่ คะแนน CSV
├── schemas/
│   ├── auth.js               ← ขั้น 7.7  กฎฟอร์ม login / เปลี่ยนรหัส
│   └── user.js               ← ขั้น 7.14 กฎฟอร์มผู้ใช้ / โปรไฟล์
├── components/
│   ├── Field.js              ← ขั้น 7.8  ช่องกรอก + ข้อความ error
│   └── Layout.js             ← ขั้น 7.12 แถบเมนู
└── pages/
    ├── login.js              ← ขั้น 7.9
    ├── index.js              ← ขั้น 7.10 (แก้) ส่งต่อตามบทบาท
    ├── change-password.js    ← ขั้น 7.13
    └── profile.js            ← ขั้น 7.14
```

> 💡 **ก่อนเริ่มบทนี้** ต้องทำบท 06 เสร็จ และเปิด 2 terminal ทิ้งไว้ตลอดบท
> - terminal 1: `cd backend` แล้ว `npm run dev` (port 5000)
> - terminal 2: `cd frontend` แล้ว `npm run dev` (port 3000)

---

# ภาค ก: React, Next.js และ Tailwind เท่าที่ต้องใช้

> 💡 ภาคนี้มีตัวอย่างโค้ดสั้นๆ ไว้อ่านทำความเข้าใจ **ยังไม่ต้องพิมพ์ลงโปรเจกต์** (ถ้าอยากลอง พิมพ์ลงไฟล์ `pages/index.js` ชั่วคราวได้ แล้วค่อยแก้กลับในขั้น 7.10)

## 7.1 React

### ขั้นที่ 7.1.1 Component และ JSX

> 🎯 **ขั้นนี้จะได้:** รู้ว่า "หน้าเว็บ" ใน React เขียนอย่างไร

📖 **Component** = ฟังก์ชันที่ส่งกลับ "หน้าตา" (เขียนด้วย JSX) ใช้ซ้ำได้เหมือนตัวต่อเลโก้ 1 หน้าเว็บประกอบจากหลาย component

```jsx
function Hello() {
  return <p className="text-xl">สวัสดี</p>;
}
```

🧩 **Syntax ใหม่: component**

```syntax
[k:function] [n:ชื่อขึ้นต้นตัวใหญ่][s:()] [s:{]
  [k:return] [s:<][p:แท็ก] [p:className][s:=][v:"class"][s:>][v:ข้อความ][s:</][p:แท็ก][s:>][s:;]
[s:}]
```

ใช้ component เหมือนแท็ก HTML

```jsx
<Hello />
```

**กฎ JSX ที่ต้องจำ (ต่างจาก HTML)**

| HTML | JSX | เหตุผล |
|---|---|---|
| `class="btn"` | `className="btn"` | `class` เป็นคำสงวนของ JavaScript |
| `onclick="..."` | `onClick={() => …}` | ส่ง **ฟังก์ชัน** ไม่ใช่ข้อความ และใช้ตัวใหญ่กลางคำ (camelCase) |
| `<input>` `<br>` | `<input />` `<br />` | **ต้องปิดแท็กเสมอ** |
| ส่งกลับหลายแท็กติดกัน | ห่อด้วย `<>…</>` หรือ `<div>…</div>` | ส่งกลับได้แค่ 1 ก้อน |
| `<!-- คอมเมนต์ -->` | `{/* คอมเมนต์ */}` | คอมเมนต์ใน JSX |

> ❗ **ชื่อ component ต้องขึ้นต้นด้วยตัวใหญ่** (`Hello` ✅ / `hello` ❌) React ใช้ตัวใหญ่แยก component ของเราออกจากแท็ก HTML ธรรมดา

### ขั้นที่ 7.1.2 Props และ children (ส่งค่าเข้า component)

> 🎯 **ขั้นนี้จะได้:** ทำ component เดียวแสดงข้อมูลต่างกันได้

```jsx
function Hello({ name }) {
  return <p>สวัสดี {name}</p>;
}

<Hello name="สมชาย" />   // แสดง: สวัสดี สมชาย
<Hello name="มาลี" />    // แสดง: สวัสดี มาลี
```

🧩 **Syntax ใหม่: props**

```syntax
[k:function] [n:Hello][s:(][s:{] [n:ชื่อprop1][s:,] [n:ชื่อprop2] [s:}][s:)] [s:{] [s:...] [s:}]
[s:<][n:Hello] [n:ชื่อprop1][s:=][v:"ค่า"] [n:ชื่อprop2][s:={][v:ค่าที่เป็นJavaScript][s:}] [s:/>]
```

| ส่วน | แปลว่า |
|---|---|
| `{ name }` ในวงเล็บของฟังก์ชัน | รับ props มาแกะเป็นตัวแปร (แกะ object บท 03 ขั้น 3.10.6) |
| `name="สมชาย"` | ส่งข้อความ ใช้ `" "` |
| `count={5}` | ส่งค่า JavaScript (ตัวเลข ตัวแปร ฟังก์ชัน) ใช้ `{ }` |
| `{name}` ใน JSX | **แทรกค่า JavaScript ลงในหน้าตา** |

**children** = สิ่งที่อยู่ระหว่างแท็กเปิด-ปิด

```jsx
function Box({ children }) {
  return <div className="card p-4">{children}</div>;
}

<Box>
  <p>ข้อความข้างใน</p>   ← ทั้งหมดนี้คือ children
</Box>
```

### ขั้นที่ 7.1.3 แสดงตามเงื่อนไข และแสดงรายการ

> 🎯 **ขั้นนี้จะได้:** ซ่อน/แสดงบางส่วน และวนแสดงข้อมูลหลายแถว

**แสดงตามเงื่อนไข**

```jsx
{error && <div className="alert alert-error">{error}</div>}
{isOpen ? <span>เปิด</span> : <span>ปิด</span>}
```

| รูปแบบ | แปลว่า | ใช้เมื่อ |
|---|---|---|
| `{เงื่อนไข && <แท็ก>}` | ถ้าจริง แสดงแท็ก ถ้าไม่จริง ไม่แสดงอะไร | มี/ไม่มี เช่น กล่อง error |
| `{เงื่อนไข ? <ก> : <ข>}` | ถ้าจริงแสดง ก ไม่งั้นแสดง ข (ternary บท 04) | เลือก 1 ใน 2 |

**แสดงรายการ**

```jsx
<ul>
  {users.map((u) => (
    <li key={u.id}>{u.full_name}</li>
  ))}
</ul>
```

🧩 **Syntax ใหม่: วนแสดงด้วย `.map()`**

```syntax
[s:{][n:array][s:.][p:map][s:(][s:(][n:แต่ละตัว][s:)] [s:=>] [s:(]
  [s:<][p:แท็ก] [p:key][s:={][n:แต่ละตัว][s:.][n:id][s:}][s:>][s:...][s:</][p:แท็ก][s:>]
[s:)][s:)][s:}]
```

- `.map()` แปลง array ของข้อมูล → array ของแท็ก (บท 04 ขั้น 4.3.5)
- `=> ( … )` ใช้ **วงเล็บกลม** ครอบ JSX หลายบรรทัด (ส่งกลับให้เอง ไม่ต้อง return)
- **ต้องมี `key` ที่ไม่ซ้ำกัน** ทุกแถว (ปกติใช้ id) ไม่งั้น console เตือน `Each child in a list should have a unique "key"`

### ขั้นที่ 7.1.4 useState: ตัวแปรที่เปลี่ยนแล้วหน้าจออัปเดต

> 🎯 **ขั้นนี้จะได้:** เก็บข้อมูลที่เปลี่ยนได้ในหน้า เช่น ข้อความ error รายการที่โหลดมา

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>กด {count} ครั้ง</button>;
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร |
|---|---|
| 1 | ดึง useState จาก React |
| 4 | สร้าง state: `count` = ค่าปัจจุบัน (เริ่ม 0), `setCount` = ฟังก์ชันเปลี่ยนค่า |
| 5 | ปุ่มแสดงค่า กดแล้วเรียก `setCount(count + 1)` → React วาดหน้าใหม่ด้วยค่าใหม่ |

🧩 **Syntax ใหม่: useState**

```syntax
[k:const] [s:\[][n:ค่า][s:,] [n:setค่า][s:\]] [s:=] [p:useState][s:(][v:ค่าเริ่มต้น][s:)][s:;]
```

กฎที่ต้องจำ
- ตั้งชื่อคู่กันเสมอ: `xxx` กับ `setXxx` (ธรรมเนียม)
- **ห้ามแก้ตรงๆ** `count = 5` ต้องใช้ `setCount(5)` หน้าจอถึงจะอัปเดต
- ต้องเรียก useState **บนสุดของ component** (ห้ามอยู่ใน if หรือ loop)

### ขั้นที่ 7.1.5 useEffect: ทำงานหลังหน้าแสดงผล (เช่น โหลดข้อมูล)

> 🎯 **ขั้นนี้จะได้:** โหลดข้อมูลจาก API ตอนเปิดหน้า

```jsx
import { useEffect, useState } from "react";

function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get("/users").then((res) => setUsers(res.data.data));
  }, []);

  return <ul>{users.map((u) => <li key={u.id}>{u.full_name}</li>)}</ul>;
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร |
|---|---|
| 4 | state เริ่มเป็น array ว่าง (หน้าแสดงรายการว่างก่อน) |
| 6-8 | หลังหน้าแสดงครั้งแรก: เรียก API แล้วเก็บผลลง state → หน้าวาดใหม่พร้อมข้อมูล |
| 8 | `[]` = ทำครั้งเดียวตอนเปิดหน้า |

🧩 **Syntax ใหม่: useEffect**

```syntax
[p:useEffect][s:(][s:()] [s:=>] [s:{]
  [v:สิ่งที่จะทำ]
[s:}][s:,] [s:\[][n:ตัวแปรที่ถ้าเปลี่ยนให้ทำใหม่][s:\]][s:);]
```

| ส่วนท้าย (dependency) | ทำเมื่อ |
|---|---|
| `[]` | ครั้งเดียวตอนเปิดหน้า |
| `[user]` | ตอนเปิดหน้า และทุกครั้งที่ `user` เปลี่ยน |

🧩 **Syntax ใหม่: `.then()` (ทำต่อเมื่อเสร็จ)**

- `api.get(...)` ใช้เวลา `.then((res) => …)` = "เสร็จแล้วค่อยทำสิ่งนี้" (อีกวิธีนอกจาก `await`)
- ใน useEffect ใช้ `.then()` เพราะฟังก์ชันใน useEffect ห้ามเป็น `async`

> 💡 **แค่นี้คือ React ทั้งหมดที่ระบบนี้ใช้:** component, props, JSX, useState, useEffect

## 7.2 Next.js Pages Router

### ขั้นที่ 7.2.1 ไฟล์ = หน้าเว็บ, ลิงก์ และเปลี่ยนหน้า

> 🎯 **ขั้นนี้จะได้:** รู้ว่าจะสร้างหน้าใหม่ที่ไหน และพาผู้ใช้ไปหน้าอื่นได้

| ไฟล์ใน `pages/` | URL |
|---|---|
| `pages/index.js` | `/` |
| `pages/login.js` | `/login` |
| `pages/hr/index.js` | `/hr` |
| `pages/hr/topics.js` | `/hr/topics` |
| `pages/committee/evaluate/[id].js` | `/committee/evaluate/4` (ได้ `id = "4"`) |

```jsx
import Link from "next/link";
import { useRouter } from "next/router";

<Link href="/hr/topics">หัวข้อ</Link>

const router = useRouter();
const { id } = router.query;
router.replace("/login");
```

| โค้ด | ทำอะไร | ใช้เมื่อ |
|---|---|---|
| `<Link href="…">` | ลิงก์ไปหน้าอื่น (ไม่โหลดใหม่ทั้งหน้า เร็ว) | เมนู ปุ่มไปหน้าอื่น |
| `useRouter()` | ตัวช่วยจัดการ URL | - |
| `router.query` | ค่าจากชื่อไฟล์ `[id]` | หน้ารายละเอียด เช่น `/hr/reports/evaluatees/5` |
| `router.replace("/login")` | เปลี่ยนหน้าด้วยโค้ด (กดย้อนกลับไม่กลับมาหน้าเดิม) | ส่งคนที่ยังไม่ login ไปหน้า login |

> ❗ **โจทย์ห้ามใช้ `getServerSideProps` / `getStaticProps`** ให้โหลดข้อมูลใน `useEffect` เท่านั้น

## 7.3 Tailwind และ daisyUI

### ขั้นที่ 7.3.1 class ของ daisyUI (ชิ้นส่วนสำเร็จรูป)

> 🎯 **ขั้นนี้จะได้:** รู้ชื่อ class ที่ใช้บ่อย ไม่ต้องเขียน CSS เลย

| ต้องการ | class | ตัวอย่าง |
|---|---|---|
| ปุ่ม | `btn` `btn-primary` `btn-sm` `btn-ghost` `btn-error` | `<button className="btn btn-primary">บันทึก</button>` |
| ช่องกรอก | `input` `select` `textarea` `file-input` | `<input className="input w-full" />` |
| การ์ด | `card` `card-body` `card-title` | กล่องมีเงา |
| ตาราง | `table` `table-sm` | ครอบด้วย `<div className="overflow-x-auto">` ให้เลื่อนได้บนมือถือ |
| กล่องข้อความ | `alert` `alert-error` `alert-success` `alert-warning` | แจ้ง error / สำเร็จ |
| ป้าย | `badge` `badge-success` `badge-warning` `badge-ghost` | สถานะ |
| สถิติ | `stats` `stat` `stat-title` `stat-value` `stat-desc` | ตัวเลขใหญ่บน Dashboard |
| แถบความคืบหน้า | `progress` `progress-primary` | `<progress className="progress" value={60} max="100" />` |
| แถบเมนู | `navbar` `menu` `dropdown` | - |
| แท็บ | `tabs` `tabs-box` `tab` `tab-active` | - |
| กล่องเด้ง | `modal` `modal-open` `modal-box` `modal-action` | - |
| กลุ่มช่องกรอก | `fieldset` `fieldset-legend` | - |

### ขั้นที่ 7.3.2 class ของ Tailwind และการรองรับมือถือ

> 🎯 **ขั้นนี้จะได้:** ปรับระยะ ขนาด จัดวาง และทำหน้าให้ใช้ได้ทั้งมือถือและคอม (เกณฑ์ 7.10)

| class | ความหมาย |
|---|---|
| `p-4` / `m-4` / `mb-2` / `mt-1` / `px-2` | padding / margin (1 หน่วย = 4px, `x` = ซ้ายขวา, `b` = ล่าง, `t` = บน) |
| `w-full` / `max-w-md` / `mx-auto` | กว้างเต็ม / กว้างไม่เกิน / จัดกึ่งกลาง |
| `flex` `items-center` `justify-between` `gap-2` | จัดเรียงแนวนอน กึ่งกลางแนวตั้ง ชิดสองข้าง เว้นช่อง |
| `flex-wrap` | ล้นแล้วขึ้นบรรทัดใหม่ (สำคัญบนมือถือ) |
| `grid` `grid-cols-2` | ตาราง 2 คอลัมน์ |
| `text-xl` `text-sm` `font-bold` `opacity-60` | ขนาด / น้ำหนัก / จางลง |
| `hidden` | ซ่อน |
| `print:hidden` | ซ่อนตอนพิมพ์ (ใช้ทำ PDF บท 09) |

📖 **Responsive: คิดแบบมือถือก่อน** class ปกติใช้กับจอเล็ก แล้วเติม `sm:` `md:` `lg:` สำหรับจอที่ใหญ่ขึ้น

| คำนำหน้า | ใช้เมื่อจอกว้าง |
|---|---|
| (ไม่มี) | ทุกขนาด |
| `sm:` | ≥ 640px |
| `md:` | ≥ 768px |
| `lg:` | ≥ 1024px |

```jsx
<div className="grid sm:grid-cols-2 gap-4">
<div className="hidden lg:flex">
<div className="lg:hidden">
```

| ตัวอย่าง | มือถือ | จอใหญ่ |
|---|---|---|
| `grid sm:grid-cols-2` | 1 คอลัมน์ | 2 คอลัมน์ |
| `hidden lg:flex` | ซ่อน | แสดง |
| `lg:hidden` | แสดง | ซ่อน |

> 💡 **ทดสอบมือถือ:** กด F12 → ไอคอนรูปมือถือ (Toggle device toolbar) แล้วเลือกขนาดจอ

---

# ภาค ข: สร้างไฟล์กลางและหน้าแรกๆ

## 7.4 ให้ frontend เรียก backend ได้

### ขั้นที่ 7.4.1 ส่งต่อ /api ไป backend (rewrites)

> 🎯 **ขั้นนี้จะได้:** หน้าเว็บเรียก `/api/...` แล้ว Next.js ส่งต่อให้ Express

📖 **rewrites คืออะไร?**

```text
เบราว์เซอร์ ── GET /api/topics ──▶ Next.js (port 3000) ── ส่งต่อ ──▶ Express (port 5000)
```

ข้อดี
1. **ไม่ต้องเขียน URL ของ backend ในโค้ด** เปิดเว็บจากเครื่องไหน IP อะไรก็ใช้ได้
2. ไม่ติดปัญหา CORS (เบราว์เซอร์คิดว่าเป็นเว็บเดียวกัน)

⌨️ **แก้โค้ด:** เปิด `frontend/next.config.mjs` เพิ่ม 2 ส่วน (บรรทัด 14-21 ด้านล่าง) ต่อจาก `devIndicators: false,`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  reactStrictMode: true,
  // ปิดปุ่ม dev indicator ของ Next (Next 16.4 มี bug ทำให้ console ขึ้น warning ตอนโหลดหน้า)
  devIndicators: false,
  // ส่งต่อ /api/... ไปที่ backend (API_URL: ตอนรันบนเครื่อง = localhost:5000, ใน Docker = http://backend:5000)
  async rewrites() {
    const api = process.env.API_URL || "http://localhost:5000";
    return [{ source: "/api/:path*", destination: `${api}/api/:path*` }];
  },
  // ตัวส่งต่อของ Next รับ body ได้ 10MB เป็นค่าเริ่มต้น (เกินแล้วไฟล์ถูกตัด)
  // เพิ่มให้มากกว่าขีดจำกัดของ backend (10MB) เพื่อให้ backend เป็นผู้ตอบ error เอง
  experimental: { proxyClientMaxBodySize: "20mb" },
};

export default nextConfig;
```

🔍 **อ่านโค้ดทีละบรรทัด** (เฉพาะส่วนที่เพิ่ม)

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 15 | ฟังก์ชัน `rewrites` (Next เรียกเองตอนเริ่ม) | 🟣 ชื่อที่ Next กำหนด |
| 16 | ที่อยู่ backend: ใช้จากตัวแปร `API_URL` ถ้าไม่มีใช้ localhost:5000 | ตอนรันใน Docker (บท 13) ตั้ง `API_URL=http://backend:5000` ได้โดยไม่แก้โค้ด |
| 17 | กฎ: URL ที่ขึ้นต้น `/api/` อะไรก็ได้ → ส่งไป backend ที่ path เดียวกัน | `:path*` = "ส่วนที่เหลือทั้งหมดของ URL" |
| 21 | ให้ตัวส่งต่อรับไฟล์ใหญ่ได้ถึง 20MB | ไฟล์ใหญ่เกิน 10MB จะถูกส่งถึง backend ครบ แล้ว backend ตอบ error ภาษาไทย "ไฟล์ต้องมีขนาดไม่เกิน 10MB" (ถ้าไม่ใส่ Next ตัดไฟล์เองแล้วได้ error 500) |

> 🧩 syntax ใหม่: `async rewrites() { … }` = ฟังก์ชันที่อยู่ใน object (เขียนชื่อ + วงเล็บได้เลย ไม่ต้องมี `:` และ `function`)

> ❗ **แก้ next.config แล้วต้องหยุด (`Ctrl + C`) แล้วรัน `npm run dev` ใหม่** ไม่งั้นไม่มีผล

✅ **ลองเลย:** เปิด http://localhost:3000/api/health (port **3000** ของหน้าเว็บ) ต้องได้ `{"status":"success","message":"API พร้อมใช้งาน",…}` เหมือนเปิด port 5000

## 7.5 ไฟล์กลาง: เรียก API (lib/api.js)

### ขั้นที่ 7.5.1 สร้างตัวเรียก API ที่แนบ token ให้อัตโนมัติ

> 🎯 **ขั้นนี้จะได้:** `api.get/post/put/delete` ที่ทุกหน้าใช้ได้ทันที ไม่ต้องแนบ token เอง

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/lib/api.js`

```js
import axios from "axios";
import { getToken, logout } from "./auth";

// ตัวเรียก API กลาง: ใส่ token ให้ทุก request
// เรียก /api ของเว็บเดียวกัน แล้ว Next.js ส่งต่อไปที่ backend (ดู rewrites ใน next.config.mjs)
// จึงเปิดเว็บจากเครื่องไหน IP อะไรก็ใช้ได้ ไม่ต้องแก้ URL
const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | ดึง axios (ตัวเรียก API) | - |
| 2 | ดึงฟังก์ชันจาก auth.js (สร้างในขั้น 7.6) | - |
| 7 | สร้างตัวเรียก API ที่ทุก URL ขึ้นต้นด้วย `/api` | เขียน `api.get("/topics")` = เรียก `/api/topics` |
| 9 | ติดตั้ง "ด่าน" ก่อนส่งคำขอทุกครั้ง (interceptor) | - |
| 10-11 | ถ้ามี token ใส่ header `Authorization: Bearer …` | **ทุกหน้าไม่ต้องแนบ token เอง** (บท 04 ขั้น 4.1.1) |
| 12 | ส่งการตั้งค่าคำขอต่อไป | ถ้าไม่ return คำขอจะไม่ถูกส่ง |

> 💡 **Interceptor = ด่านกลางของ axios** คล้าย middleware ของ Express แต่อยู่ฝั่งหน้าเว็บ
> 💡 import ในฝั่ง frontend **ไม่ต้องมี `.js`** (`"./auth"`) เพราะ Next.js หาไฟล์ให้เอง (ต่างจาก backend)

**วิธีใช้ในหน้า (จะใช้ตั้งแต่ขั้น 7.9)**

```js
const res = await api.get("/topics");
const topics = res.data.data;
await api.post("/topics", { title: "…" });
await api.put(`/topics/${id}`, data);
await api.delete(`/topics/${id}`);
```

| โค้ด | ได้อะไร |
|---|---|
| `res.data` | คำตอบทั้งก้อน `{ status, message, data }` |
| `res.data.data` | **ข้อมูลจริง** (data ซ้อน 2 ชั้น: ชั้นแรกของ axios, ชั้นที่สองของระบบเรา) |
| `res.data.message` | ข้อความภาษาไทยจาก backend |

### ขั้นที่ 7.5.2 จัดการ token หมดอายุ และดึงข้อความ error

> 🎯 **ขั้นนี้จะได้:** token หมดอายุแล้วพากลับหน้า login อัตโนมัติ และมีฟังก์ชันดึงข้อความ error ภาษาไทย

⌨️ **พิมพ์โค้ด:** เพิ่มต่อท้าย `lib/api.js`

```js

// token หมดอายุ/ไม่ถูกต้อง -> ออกจากระบบ (ยกเว้นตอนกด login เอง)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes("/auth/login")) logout();
    return Promise.reject(err);
  }
);

// ดึงข้อความ error จาก response ของ API
export const errorMessage = (err) => err.response?.data?.message || "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้";

export default api;
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | ติดตั้งด่านหลังได้คำตอบ รับ 2 ฟังก์ชัน: ตอนสำเร็จ / ตอน error | - |
| 4 | สำเร็จ: ส่งคำตอบต่อตามเดิม | - |
| 6 | ได้ 401 และไม่ใช่การกด login → ออกจากระบบ | token หมดอายุ (8 ชั่วโมง) ผู้ใช้ถูกพาไปหน้า login แทนการเห็นหน้าพังๆ (ตอนกด login ผิดก็ได้ 401 แต่ต้องไม่ logout) |
| 7 | ส่ง error ต่อให้หน้าเว็บจัดการเอง | หน้าเว็บใช้ `catch` แสดงข้อความ |
| 12 | ดึง `message` จากคำตอบของ backend ถ้าไม่มี (backend ไม่ตอบเลย) ใช้ "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" | **ทุกหน้าใช้ฟังก์ชันนี้แสดง error** |
| 14 | ส่ง `api` ออกเป็นตัวหลัก | `import api from "@/lib/api"` |

> 🧩 syntax ใหม่: `err.response?.data?.message` ใช้ `?.` ต่อกันหลายชั้น (บท 05 ขั้น 5.4.2) เพราะถ้า backend ล่ม `err.response` จะไม่มี ส่วน `Promise.reject(err)` = "ส่งต่อเป็น error" (ให้ `catch` ข้างนอกรับได้)

### ขั้นที่ 7.5.3 ดาวน์โหลดไฟล์ที่ต้องใช้ token

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชันดาวน์โหลดไฟล์หลักฐานและไฟล์สำรองข้อมูล (ใช้ในบท 09-11)

📖 **ปัญหา:** ลิงก์ `<a href="/api/evidences/1/file">` ธรรมดา **ส่ง token ไม่ได้** จะได้ 401
**วิธีแก้:** ใช้ api (ที่แนบ token) โหลดไฟล์มาก่อน แล้วสร้างลิงก์ชั่วคราวในเบราว์เซอร์ให้กดดาวน์โหลด

⌨️ **พิมพ์โค้ด:** เพิ่มต่อท้าย `lib/api.js`

```js

// ดาวน์โหลดไฟล์จาก API ที่ต้องใช้ token (ลิงก์ <a href> ธรรมดาส่ง token ไม่ได้)
export async function downloadFile(url, fileName) {
  const res = await api.get(url, { responseType: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(res.data);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}
```

| บรรทัด | ทำอะไร |
|---|---|
| 4 | โหลดไฟล์ผ่าน api (แนบ token) รับมาเป็นไฟล์ (`blob`) ไม่ใช่ JSON |
| 5 | สร้างแท็ก `<a>` ชั่วคราว (ไม่ได้ใส่ในหน้า) |
| 6 | สร้าง URL ชั่วคราวชี้ไปที่ไฟล์ในหน่วยความจำ |
| 7 | ตั้งชื่อไฟล์ตอนบันทึก |
| 8 | สั่งคลิก = เบราว์เซอร์เริ่มดาวน์โหลด |
| 9 | ลบ URL ชั่วคราว คืนหน่วยความจำ |

<details>
<summary>📄 ไฟล์ lib/api.js ทั้งไฟล์ (กดดูไว้เทียบ)</summary>

ไฟล์จริงในโปรเจกต์: [frontend/lib/api.js](../../frontend/lib/api.js) = ขั้น 7.5.1-7.5.3

</details>

## 7.6 ไฟล์กลาง: จัดการ login (lib/auth.js)

### ขั้นที่ 7.6.1 เก็บและอ่านข้อมูล login ใน localStorage

> 🎯 **ขั้นนี้จะได้:** จำ token และข้อมูลผู้ใช้ไว้ในเบราว์เซอร์ ปิดแท็บแล้วเปิดใหม่ยังอยู่

📖 **localStorage** = ที่เก็บข้อมูลในเบราว์เซอร์ เก็บได้เฉพาะ **ข้อความ** แบบ "ชื่อ → ค่า"

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/lib/auth.js`

```js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

// เก็บ token + ข้อมูลผู้ใช้ไว้ใน localStorage (เรียกใช้ใน useEffect/event เท่านั้น)
export function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export const getToken = () => localStorage.getItem("token");

export function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5-8 | เก็บ token และข้อมูลผู้ใช้ (แปลง object เป็นข้อความก่อน) | เรียกหลัง login สำเร็จ |
| 10 | อ่าน token (ไม่มี = null) | api.js ใช้แนบ header |
| 12-15 | อ่านข้อมูลผู้ใช้ แปลงข้อความกลับเป็น object (ไม่มี = null) | รู้ชื่อและบทบาทของคนที่ login |

🧩 **Syntax ใหม่: localStorage และ JSON**

| คำสั่ง | ทำอะไร |
|---|---|
| `localStorage.setItem("ชื่อ", "ค่า")` | เก็บ |
| `localStorage.getItem("ชื่อ")` | อ่าน (ไม่มี = null) |
| `localStorage.removeItem("ชื่อ")` | ลบ |
| `JSON.stringify(obj)` | object → ข้อความ `'{"id":1,"role":"hr"}'` |
| `JSON.parse(text)` | ข้อความ → object |

> ✅ **ดูของที่เก็บไว้:** F12 → แท็บ Application → Local Storage → `http://localhost:3000`

### ขั้นที่ 7.6.2 เปลี่ยนหน้า ออกจากระบบ และหน้าแรกของแต่ละบทบาท

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชันเล็กๆ 3 ตัวที่ใช้บ่อย

⌨️ **พิมพ์โค้ด:** เพิ่มต่อท้าย `lib/auth.js`

```js

// เปลี่ยนหน้าแบบโหลดใหม่ทั้งหน้า (ให้ทุกหน้าอ่าน localStorage ใหม่)
export function goTo(path) {
  window.location.href = path;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  goTo("/login");
}

// หน้าแรกของแต่ละ role
export const homePath = (role) => `/${role}`;
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3-5 | เปลี่ยนหน้าแบบ **โหลดใหม่ทั้งหน้า** | หลัง login / logout ทุกหน้าอ่าน localStorage ใหม่ ไม่มีข้อมูลค้างจากผู้ใช้คนก่อน (กฎของโจทย์: login สำเร็จใช้ `window.location.href`) |
| 7-11 | ลบ token และผู้ใช้ แล้วไปหน้า login | ปุ่มออกจากระบบ และตอน token หมดอายุ (ขั้น 7.5.2) |
| 14 | `"hr"` → `"/hr"`, `"evaluatee"` → `"/evaluatee"` | ชื่อโฟลเดอร์หน้าตรงกับชื่อบทบาท จึงไม่ต้องเขียน if |

> 💡 `<Link>` / `router.replace` = เปลี่ยนหน้าแบบเร็ว (ไม่โหลดใหม่) ส่วน `window.location.href` = โหลดใหม่ทั้งหน้า (ช้ากว่าแต่ล้างทุกอย่าง)

### ขั้นที่ 7.6.3 ยามเฝ้าหน้า: useAuth

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชันที่ทุกหน้าเรียกบรรทัดเดียว แล้วกันคนที่ไม่มีสิทธิ์ (เกณฑ์ 5.2.1)

⌨️ **พิมพ์โค้ด:** เพิ่มต่อท้าย `lib/auth.js`

```js

// Guard: ใช้ในทุกหน้าที่ต้อง login
// const user = useAuth(["hr"]); if (!user) return null;
export function useAuth(roles) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace("/login");
    } else if (u.must_change_password && router.pathname !== "/change-password") {
      router.replace("/change-password"); // บังคับเปลี่ยนรหัสผ่านครั้งแรก
    } else if (roles && !roles.includes(u.role)) {
      router.replace(homePath(u.role)); // role ไม่ตรง กลับหน้าของตัวเอง
    } else {
      // localStorage อ่านได้หลัง mount เท่านั้น จึงต้อง setState ใน effect
      setUser(u); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return user;
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4 | ฟังก์ชันรับรายชื่อบทบาทที่อนุญาต (ไม่ส่ง = ทุกบทบาท) | `useAuth(["hr"])` |
| 6 | state ผู้ใช้ เริ่มเป็น null (ยังไม่รู้) | - |
| 8-9 | ตอนเปิดหน้า อ่านผู้ใช้จาก localStorage | - |
| 10-11 | ยังไม่ login → ไปหน้า login | - |
| 12-13 | ต้องเปลี่ยนรหัส และไม่ได้อยู่หน้าเปลี่ยนรหัส → ไปหน้าเปลี่ยนรหัส | **บังคับเปลี่ยนรหัสครั้งแรก** ทุกหน้า (เกณฑ์ 5.2.1) |
| 14-15 | บทบาทไม่อยู่ในรายชื่อ → กลับหน้าแรกของตัวเอง | เช่น ครูพิมพ์ URL `/hr` ตรงๆ |
| 16-18 | ผ่านทุกด่าน → เก็บผู้ใช้ลง state | หน้าเริ่มแสดงผล |
| 20 | `[]` ทำครั้งเดียว (คอมเมนต์ `eslint-disable-line` = บอก ESLint ว่าตั้งใจ ไม่ต้องเตือน) | - |
| 22 | ส่งผู้ใช้กลับ (null ระหว่างตรวจ) | หน้ารู้ว่าตรวจเสร็จหรือยัง |

📖 **ทำไมอ่าน localStorage ได้แค่ใน useEffect?** Next.js สร้างหน้าเว็บบน server ก่อนส่งมาเบราว์เซอร์ **บน server ไม่มี localStorage** ถ้าเรียกตรงๆ จะ error `localStorage is not defined` ส่วน useEffect ทำงานบนเบราว์เซอร์เท่านั้น (กฎของโจทย์)

🧩 **Syntax ใหม่: `if … else if … else`**

```syntax
[k:if] [s:(][v:เงื่อนไข1][s:)] [s:{] [s:...] [s:}] [k:else if] [s:(][v:เงื่อนไข2][s:)] [s:{] [s:...] [s:}] [k:else] [s:{] [s:...] [s:}]
```

- ตรวจทีละเงื่อนไขจากบนลงล่าง **ทำแค่ก้อนแรกที่จริง** แล้วข้ามที่เหลือ

**วิธีใช้ (ทุกหน้าที่ต้อง login เขียนแบบนี้เหมือนกันหมด)**

```jsx
export default function HrPage() {
  const user = useAuth(["hr"]);
  if (!user) return null;
  return <Layout user={user}>…</Layout>;
}
```

| บรรทัด | ทำอะไร |
|---|---|
| 2 | อนุญาตเฉพาะ hr |
| 3 | ยังตรวจไม่เสร็จ → ยังไม่แสดงอะไร (`return null` = แสดงว่างเปล่า กันหน้ากระพริบ) |

> ❗ **useAuth เป็นแค่ความสะดวกฝั่งหน้า ไม่ใช่ความปลอดภัย** ความปลอดภัยจริงอยู่ที่ backend (`verifyToken`, `requireRole`) เพราะใครก็แก้ localStorage ได้

<details>
<summary>📄 ไฟล์ lib/auth.js ทั้งไฟล์ (กดดูไว้เทียบ)</summary>

ไฟล์จริงในโปรเจกต์: [frontend/lib/auth.js](../../frontend/lib/auth.js) = ขั้น 7.6.1-7.6.3

</details>

## 7.7 ตรวจฟอร์มด้วย Zod

### ขั้นที่ 7.7.1 ตัวเชื่อม Zod กับ React Hook Form (lib/validate.js)

> 🎯 **ขั้นนี้จะได้:** ใช้ schema ของ Zod ตรวจฟอร์มได้ โดยไม่ลง package เพิ่ม

📖 **React Hook Form (RHF)** จัดการฟอร์มให้: เก็บค่า ตรวจ แสดง error กันกดส่งซ้ำ
ปกติต้องลง `@hookform/resolvers` เพื่อใช้กับ Zod **แต่โจทย์ห้าม** เราจึงเขียนตัวเชื่อมเองไม่กี่บรรทัด

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/lib/validate.js`

```js
// ใช้ Zod กับ React Hook Form โดยไม่ต้องลง @hookform/resolvers
// useForm({ resolver: validateWith(schema) })
export const validateWith = (schema) => (values) => {
  const result = schema.safeParse(values);
  if (result.success) return { values: result.data, errors: {} };

  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (!errors[field]) errors[field] = { type: issue.code, message: issue.message };
  }
  return { values: {}, errors };
};
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | รับ schema แล้วส่งกลับฟังก์ชันที่รับค่าในฟอร์ม (2 ชั้นแบบ validate ของ backend บท 04 ขั้น 4.3.5) | RHF เรียกฟังก์ชันชั้นในทุกครั้งที่ต้องตรวจ |
| 4 | ตรวจค่าในฟอร์มด้วย Zod | - |
| 5 | ผ่าน → ส่งค่าที่ตรวจแล้ว และไม่มี error | RHF ส่งค่านี้ให้ onSubmit |
| 7-11 | ไม่ผ่าน → สร้าง `{ ชื่อช่อง: { type, message } }` เก็บเฉพาะ error แรกของแต่ละช่อง | รูปแบบที่ RHF ต้องการ แสดงใต้ช่องได้ |
| 12 | ส่ง error กลับ | RHF ไม่เรียก onSubmit |

### ขั้นที่ 7.7.2 schema ฝั่งหน้า: login และเปลี่ยนรหัส

> 🎯 **ขั้นนี้จะได้:** กฎตรวจฟอร์ม 2 ฟอร์มแรก

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/schemas/auth.js`

```js
import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "กรุณากรอกชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, "กรุณากรอกรหัสผ่านเดิม"),
    new_password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร").max(50, "รหัสผ่านต้องไม่เกิน 50 ตัวอักษร"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "ยืนยันรหัสผ่านไม่ตรงกัน",
    path: ["confirm_password"],
  });
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3-6 | กฎเดียวกับ backend (บท 04) | บอกผู้ใช้ทันทีโดยไม่ต้องยิง API |
| 12 | ช่อง "ยืนยันรหัสผ่าน" มีเฉพาะฝั่งหน้า | backend ไม่ต้องใช้ (ส่งไปแค่ old/new) |
| 14-17 | รหัสใหม่กับยืนยันต้องตรงกัน error แสดงที่ช่องยืนยัน | กันพิมพ์รหัสใหม่ผิด |

> 💡 **ทำไมเขียน schema ซ้ำทั้ง 2 ฝั่ง?** ฝั่งหน้าเพื่อ "ความสะดวก" (บอกทันที) ฝั่ง backend เพื่อ "ความปลอดภัย" (บท 04 ขั้น 4.1.3) โจทย์กำหนดให้ตรวจทั้งสองฝั่ง

## 7.8 Component ช่องกรอก

### ขั้นที่ 7.8.1 Field: ป้ายชื่อ + ช่องกรอก + ข้อความ error

> 🎯 **ขั้นนี้จะได้:** component ที่ทุกฟอร์มใช้ หน้าตาเหมือนกันทั้งระบบ

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/components/Field.js`

```jsx
// ช่องกรอก: ป้ายชื่อ + input + ข้อความ error
export default function Field({ label, error, children }) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">{label}</legend>
      {children}
      {error && <p className="text-error text-sm">{error.message}</p>}
    </fieldset>
  );
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | component รับ 3 props: ป้าย, error, ช่องกรอกข้างใน | - |
| 4 | กลุ่มช่องกรอกของ daisyUI | ระยะห่างสวยงามเท่ากันทุกช่อง |
| 5 | ป้ายชื่อช่อง | - |
| 6 | แสดงช่องกรอกที่ส่งมา (children ขั้น 7.1.2) | ใส่ได้ทั้ง input, select, textarea |
| 7 | ถ้ามี error แสดงข้อความสีแดง | ข้อความจาก Zod ใต้ช่องที่ผิด |

**วิธีใช้**

```jsx
<Field label="ชื่อผู้ใช้" error={errors.username}>
  <input className="input w-full" {...register("username")} />
</Field>
```

## 7.9 หน้า Login

### ขั้นที่ 7.9.1 หน้าตาของหน้า Login

> 🎯 **ขั้นนี้จะได้:** หน้า /login แสดงฟอร์ม (ยังกดไม่ได้)

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/pages/login.js`

```jsx
import Field from "@/components/Field";

export default function Login() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <form className="card bg-base-100 shadow w-full max-w-sm">
        <div className="card-body">
          <h1 className="card-title text-2xl justify-center">ระบบประเมินบุคลากร</h1>
          <Field label="ชื่อผู้ใช้">
            <input className="input w-full" autoComplete="username" />
          </Field>
          <Field label="รหัสผ่าน">
            <input type="password" className="input w-full" autoComplete="current-password" />
          </Field>
          <button className="btn btn-primary mt-2">เข้าสู่ระบบ</button>
        </div>
      </form>
    </main>
  );
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 5 | พื้นที่เต็มจอ จัดฟอร์มกึ่งกลางทั้งแนวตั้งแนวนอน พื้นหลังเทา เว้นขอบ 16px | ฟอร์มอยู่กลางจอทั้งมือถือและคอม |
| 6 | ฟอร์มเป็นการ์ดสีขาวมีเงา กว้างเต็มแต่ไม่เกิน `max-w-sm` | มือถือเต็มจอ คอมไม่กว้างเกิน |
| 8 | หัวข้อตัวใหญ่ จัดกลาง | - |
| 9-14 | ช่องชื่อผู้ใช้ และรหัสผ่าน (`type="password"` = แสดงเป็นจุด) | `autoComplete` ให้เบราว์เซอร์จำรหัสได้ |
| 15 | ปุ่มสีหลัก | ปุ่มใน `<form>` กดแล้วส่งฟอร์ม |

✅ **ลองเลย:** เปิด http://localhost:3000/login ต้องเห็นการ์ดกลางจอ ย่อจอเป็นมือถือ (F12 → ไอคอนมือถือ) การ์ดต้องเต็มความกว้าง

### ขั้นที่ 7.9.2 ผูกฟอร์มกับ React Hook Form และ Zod

> 🎯 **ขั้นนี้จะได้:** กดเข้าสู่ระบบโดยไม่กรอก แล้วเห็นข้อความ error ใต้ช่อง

⌨️ **แก้โค้ด:** เปิด `pages/login.js` แก้ให้เป็นแบบนี้ (ส่วนที่เพิ่ม: บรรทัด 1-3, 7-10, `onSubmit` ในบรรทัด 14, ช่อง `error=` และ `{...register}`, ปุ่ม `disabled`)

```jsx
import { useForm } from "react-hook-form";
import { validateWith } from "@/lib/validate";
import { loginSchema } from "@/schemas/auth";
import Field from "@/components/Field";

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: validateWith(loginSchema),
  });
  const onSubmit = (data) => alert(JSON.stringify(data));

  return (
    <main className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="card bg-base-100 shadow w-full max-w-sm">
        <div className="card-body">
          <h1 className="card-title text-2xl justify-center">ระบบประเมินบุคลากร</h1>
          <Field label="ชื่อผู้ใช้" error={errors.username}>
            <input className="input w-full" autoComplete="username" {...register("username")} />
          </Field>
          <Field label="รหัสผ่าน" error={errors.password}>
            <input type="password" className="input w-full" autoComplete="current-password" {...register("password")} />
          </Field>
          <button className="btn btn-primary mt-2" disabled={isSubmitting}>
            เข้าสู่ระบบ
          </button>
        </div>
      </form>
    </main>
  );
}
```

🔍 **อ่านโค้ดทีละบรรทัด** (เฉพาะส่วนที่เพิ่ม)

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 7-9 | สร้างฟอร์ม ผูกกับ loginSchema แกะเครื่องมือที่ต้องใช้ออกมา | - |
| 10 | onSubmit ชั่วคราว: แสดงค่าที่กรอก | ทดสอบก่อนต่อ API (ขั้น 7.9.3) |
| 14 | กดส่ง → RHF ตรวจ schema → **ผ่านแล้วถึงเรียก onSubmit** | ไม่ผ่านแสดง error ไม่ยิง API |
| 17, 20 | ส่ง error ของแต่ละช่องให้ Field แสดง | - |
| 18, 21 | ผูกช่องกรอกกับชื่อ `username` / `password` | **ชื่อต้องตรงกับ schema** |
| 23 | ปิดปุ่มขณะกำลังส่ง | กันกดซ้ำ |

🧩 **Syntax ใหม่ 1: แกะ object ซ้อน**

```syntax
[k:const] [s:{] [n:register][s:,] [n:handleSubmit][s:,] [p:formState][s::] [s:{] [n:errors][s:,] [n:isSubmitting] [s:}] [s:}] [s:=] [p:useForm][s:(][s:...][s:)][s:;]
```

- `formState: { errors, isSubmitting }` = เข้าไปในช่อง formState แล้วแกะ errors กับ isSubmitting ออกมาอีกชั้น

🧩 **Syntax ใหม่ 2: `{...register("ชื่อ")}` (กระจาย props)**

- `register("username")` ส่งกลับ object ของ props หลายตัว (`name`, `onChange`, `onBlur`, `ref`)
- `{...object}` ในแท็ก = ใส่ทุก props ลงไปในครั้งเดียว (ต่อยอดจาก `...` บท 03)

| ส่วนของ RHF | หน้าที่ |
|---|---|
| `useForm({ resolver: validateWith(schema) })` | สร้างฟอร์ม ผูกกับ schema |
| `{...register("username")}` | ผูกช่องกรอกกับชื่อ |
| `handleSubmit(onSubmit)` | ตรวจก่อน ผ่านแล้วค่อยเรียก onSubmit |
| `errors.username` | error ของช่องนั้น |
| `isSubmitting` | กำลังส่งอยู่ไหม |

✅ **ลองเลย:**
1. กดเข้าสู่ระบบโดยไม่กรอก → ข้อความแดงใต้ทั้ง 2 ช่อง
2. กรอกครบ → กล่อง alert แสดง `{"username":"…","password":"…"}`

### ขั้นที่ 7.9.3 ส่งไป API และไปหน้าตามบทบาท

> 🎯 **ขั้นนี้จะได้:** login ได้จริง (เกณฑ์ 7.1)

⌨️ **แก้โค้ด:** ใน `pages/login.js`
1. แก้ import ด้านบนให้เป็น

```jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import api, { errorMessage } from "@/lib/api";
import { saveAuth, homePath, goTo } from "@/lib/auth";
import { validateWith } from "@/lib/validate";
import { loginSchema } from "@/schemas/auth";
import Field from "@/components/Field";
```

2. เพิ่ม state error ใต้บรรทัด `export default function Login() {` และแทน `onSubmit` ชั่วคราวด้วยของจริง

```jsx
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: validateWith(loginSchema),
  });

  const onSubmit = async (data) => {
    setError("");
    try {
      const res = await api.post("/auth/login", data);
      const { token, user } = res.data.data;
      saveAuth(token, user);
      goTo(user.must_change_password ? "/change-password" : homePath(user.role));
    } catch (err) {
      setError(errorMessage(err));
    }
  };
```

🔍 **อ่านโค้ดทีละบรรทัด** (state และ onSubmit)

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 1 | state ข้อความ error จาก API | แสดงกล่องแดงเหนือฟอร์ม |
| 7 | ล้าง error เก่าก่อนส่ง | - |
| 9 | ส่ง username/password ไป backend | - |
| 10 | แกะ token และ user จากคำตอบ | - |
| 11 | เก็บลง localStorage | - |
| 12 | ต้องเปลี่ยนรหัส → หน้าเปลี่ยนรหัส ไม่งั้น → หน้าแรกของบทบาท (โหลดใหม่ทั้งหน้า) | - |
| 13-14 | ผิดพลาด (401, เชื่อมต่อไม่ได้) → แสดงข้อความ | "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" |

3. เพิ่มกล่อง error ใต้บรรทัด `<h1 …>ระบบประเมินบุคลากร</h1>`

```jsx
          {error && <div className="alert alert-error">{error}</div>}
```

**ลำดับการทำงานเมื่อกดปุ่ม**

```text
กด "เข้าสู่ระบบ"
   ▼
Zod ตรวจ (ฝั่งหน้า) ─ไม่ผ่าน─▶ แสดง "กรุณากรอกชื่อผู้ใช้" ใต้ช่อง (ไม่ยิง API)
   │ผ่าน
   ▼
POST /api/auth/login ─401─▶ catch → แสดง "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
   │200
   ▼
saveAuth(token, user) → ไปหน้าเปลี่ยนรหัส หรือหน้าของ role
```

> 🧩 syntax ใหม่: `import api, { errorMessage } from …` = ดึงทั้ง default (`api`) และแบบมีชื่อ (`errorMessage`) ในบรรทัดเดียว

✅ **ลองเลย:** เปิด http://localhost:3000/login
1. กรอกรหัสผิด → กล่องแดง "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
2. กรอก `hr` / `123456` → ไปที่ `/hr` (ยังไม่มีหน้า เห็น 404 ไม่เป็นไร บท 08 จะสร้าง)
3. F12 → Application → Local Storage ต้องเห็น `token` และ `user`

<details>
<summary>📄 ไฟล์ pages/login.js ทั้งไฟล์ (กดดูไว้เทียบ)</summary>

ไฟล์จริงในโปรเจกต์: [frontend/pages/login.js](../../frontend/pages/login.js)

</details>

## 7.10 หน้าแรก (/)

### ขั้นที่ 7.10.1 ส่งต่อไปหน้าตามบทบาท

> 🎯 **ขั้นนี้จะได้:** เปิด http://localhost:3000 แล้วไปหน้าที่ถูกต้องเอง

⌨️ **พิมพ์โค้ด:** เปิด `frontend/pages/index.js` (หน้าทดสอบจากบท 01) ลบของเดิมทั้งหมด แล้วพิมพ์

```jsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import { getUser, homePath } from "@/lib/auth";

// หน้าแรก: ส่งไปหน้าของ role หรือหน้า login
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const user = getUser();
    router.replace(user ? homePath(user.role) : "/login");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 8-11 | ตอนเปิดหน้า: login แล้ว → หน้าของบทบาท, ยังไม่ login → หน้า login | ผู้ใช้พิมพ์แค่ชื่อเว็บก็ไปถูกที่ |
| 12 | หน้านี้ไม่แสดงอะไรเลย | - |

✅ **ลองเลย:** เปิด http://localhost:3000 (login อยู่) → ไปที่ `/hr` / ลบ token ใน Local Storage แล้วเปิดใหม่ → ไปที่ `/login`

## 7.11 ค่าคงที่และฟังก์ชันจัดรูปแบบ

### ขั้นที่ 7.11.1 ข้อความภาษาไทยที่ใช้หลายหน้า (lib/constants.js)

> 🎯 **ขั้นนี้จะได้:** แปลงรหัสอย่าง `hr`, `draft` เป็นภาษาไทยได้ทุกหน้า โดยแก้ที่เดียว

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/lib/constants.js`

```js
// ค่าคงที่และข้อความที่ใช้หลายหน้า
export const ROLE_NAMES = { hr: "งานบุคลากร", evaluatee: "ผู้รับการประเมิน", committee: "กรรมการ" };

export const COMMITTEE_ROLES = { chair: "ประธานกรรมการ", member: "กรรมการร่วม" };

export const STATUS = {
  pending: { label: "ยังไม่ประเมิน", badge: "badge-ghost" },
  draft: { label: "บันทึกร่าง", badge: "badge-warning" },
  confirmed: { label: "ยืนยันผลแล้ว", badge: "badge-success" },
};

export const SCORE_TYPES = { yes_no: "มี / ไม่มี", scale_4: "สเกล 1-4" };

export const EVIDENCE_TYPES = { none: "ไม่ต้องแนบ", file: "ไฟล์ (PDF/รูปภาพ)", url: "ลิงก์ (URL)", any: "ไฟล์หรือลิงก์" };

// คำอธิบายระดับคะแนนสเกล 1-4
export const SCALE_LABELS = {
  1: "ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวังมาก",
  2: "ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวัง",
  3: "ปฏิบัติได้ตามระดับการปฏิบัติที่คาดหวัง",
  4: "ปฏิบัติได้สูงกว่าระดับการปฏิบัติที่คาดหวัง",
};
```

| ค่าคงที่ | แปลงอะไร | ใช้ที่ |
|---|---|---|
| `ROLE_NAMES` | บทบาท → ชื่อไทย | แถบเมนู หน้าผู้ใช้ |
| `COMMITTEE_ROLES` | chair/member → ประธาน/กรรมการร่วม | หน้ามอบหมาย รายงาน |
| `STATUS` | สถานะ → ชื่อไทย + สีป้าย | ป้ายสถานะ (บท 08) |
| `SCORE_TYPES`, `EVIDENCE_TYPES` | รูปแบบคะแนน/หลักฐาน → ไทย | ฟอร์มตัวชี้วัด |
| `SCALE_LABELS` | ระดับ 1-4 → คำอธิบาย | ปุ่มให้คะแนน (บท 09-10) |

> 🧩 ใช้แบบ `ROLE_NAMES[user.role]` → `"งานบุคลากร"` (object เป็นตารางค้นหา บท 06 ขั้น 6.4.1) แทนการเขียน if-else ทุกหน้า

### ขั้นที่ 7.11.2 จัดรูปแบบวันที่ คะแนน และค่าในฟอร์ม (lib/format.js)

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชัน 3 ตัวที่ใช้แสดงผลทั่วระบบ

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/lib/format.js`

```js
// "2026-11-01" -> "1 พ.ย. 2569"
export function thaiDate(value) {
  if (!value) return "-";
  return new Date(value.replace(" ", "T")).toLocaleDateString("th-TH", { dateStyle: "medium" });
}

// แสดงคะแนนตามรูปแบบ: มี/ไม่มี หรือ ตัวเลข
export function scoreLabel(score, scoreType) {
  if (score == null) return "-";
  if (scoreType === "yes_no") return Number(score) >= 1 ? "มี" : "ไม่มี";
  return score;
}

// null -> "" เพื่อใช้เป็นค่าเริ่มต้นของฟอร์ม
export const formValues = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v ?? ""]));
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | ไม่มีวันที่ แสดง "-" | - |
| 4 | แปลงข้อความวันที่เป็นวันที่ แล้วแสดงแบบไทย (พ.ศ.) | `"2026-11-01"` → `"1 พ.ย. 2569"` (`replace(" ", "T")` รองรับแบบมีเวลา `"2026-11-05 10:00:00"`) |
| 9-11 | ไม่มีคะแนน "-" / มี-ไม่มี แสดง "มี"/"ไม่มี" / สเกล แสดงตัวเลข | ตารางคะแนนทุกหน้า |
| 15 | ทุกช่องที่เป็น null เปลี่ยนเป็น `""` | **ข้อมูลจาก API มี null แต่ช่องกรอก HTML ต้องการ `""`** ถ้าส่ง null React จะเตือน |

🧩 **Syntax ใหม่: `Object.entries` + แกะ array ในพารามิเตอร์**

```js
Object.entries({ a: 1, b: null });              // [["a", 1], ["b", null]]
[["a", 1], ["b", null]].map(([k, v]) => [k, v ?? ""]);   // [["a", 1], ["b", ""]]
```

- `Object.entries` = กลับด้านของ `Object.fromEntries` (บท 05) ได้คู่ `[ชื่อ, ค่า]` ทุกช่อง
- `([k, v]) =>` = แกะ array **ในวงเล็บพารามิเตอร์ได้เลย**

### ขั้นที่ 7.11.3 ดาวน์โหลดตารางเป็น CSV

> 🎯 **ขั้นนี้จะได้:** ฟังก์ชันส่งออกรายงานเป็นไฟล์ที่เปิดใน Excel ได้ (ใช้ในบท 11)

⌨️ **พิมพ์โค้ด:** เพิ่มต่อท้าย `lib/format.js`

```js

// ดาวน์โหลดตารางเป็นไฟล์ CSV (ใส่ BOM ให้ Excel อ่านภาษาไทยได้)
export function downloadCsv(fileName, headers, rows) {
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const text = [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\uFEFF" + text], { type: "text/csv;charset=utf-8" }));
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}
```

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 4 | แปลงค่าเป็นช่อง CSV: ครอบ `" "` และ `"` ข้างในเขียนซ้ำ 2 ตัว | ค่าที่มี `,` หรือ `"` ไม่ทำให้คอลัมน์เลื่อน |
| 5 | หัวตาราง + ทุกแถว → ช่องคั่นด้วย `,` แถวคั่นด้วยการขึ้นบรรทัด | - |
| 7 | สร้างไฟล์จากข้อความ ใส่ BOM (`\uFEFF`) นำหน้า | **Excel อ่านภาษาไทยถูก** (ถ้าไม่ใส่จะเป็นตัวแปลก) |
| 6, 8-10 | ดาวน์โหลดแบบเดียวกับขั้น 7.5.3 | - |

> 💡 ในไฟล์เฉลยเขียน BOM เป็นตัวอักษรล่องหนตรงๆ (`"﻿"`) ทำงานเหมือน `"\uFEFF"` ทุกอย่าง แต่ `\uFEFF` มองเห็นชัดกว่า แนะนำให้พิมพ์แบบนี้
> 🧩 syntax ใหม่: `/"/g` = regex หา `"` **ทุกตัว** (`g` = global ทั้งข้อความ ถ้าไม่ใส่จะแทนแค่ตัวแรก)

<details>
<summary>📄 ไฟล์ lib/format.js ทั้งไฟล์ (กดดูไว้เทียบ)</summary>

ไฟล์จริงในโปรเจกต์: [frontend/lib/format.js](../../frontend/lib/format.js)

</details>

## 7.12 Layout: แถบเมนู

### ขั้นที่ 7.12.1 เมนูของแต่ละบทบาท

> 🎯 **ขั้นนี้จะได้:** รายการเมนูที่เปลี่ยนตามบทบาท และไฮไลต์หน้าปัจจุบัน

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/components/Layout.js`

```jsx
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, LogOut, KeyRound, UserRound } from "lucide-react";
import { logout } from "@/lib/auth";
import { ROLE_NAMES } from "@/lib/constants";

// เมนูของแต่ละ role
const MENUS = {
  hr: [
    { href: "/hr", label: "Dashboard" },
    { href: "/hr/topics", label: "หัวข้อ/ตัวชี้วัด" },
    { href: "/hr/users", label: "ผู้ใช้งาน" },
    { href: "/hr/assignments", label: "มอบหมายกรรมการ" },
    { href: "/hr/reports", label: "รายงาน" },
    { href: "/hr/backups", label: "สำรองข้อมูล" },
  ],
  evaluatee: [
    { href: "/evaluatee", label: "หน้าหลัก" },
    { href: "/evaluatee/evaluation", label: "ประเมินตนเอง" },
    { href: "/evaluatee/result", label: "ผลการประเมิน" },
  ],
  committee: [{ href: "/committee", label: "หน้าหลัก" }],
};

export default function Layout({ user, children }) {
  const { pathname } = useRouter();
  const home = `/${user.role}`;
  // เมนูที่ตรงกับหน้าปัจจุบัน (รวมหน้าย่อย เช่น /hr/reports/...) ยกเว้นหน้าหลัก
  const isActive = (href) => pathname === href || (href !== home && pathname.startsWith(href + "/"));
  const links = MENUS[user.role].map((m) => (
    <li key={m.href}>
      <Link href={m.href} className={isActive(m.href) ? "menu-active" : ""}>
        {m.label}
      </Link>
    </li>
  ));

  // (ขั้น 7.12.2 จะเขียนต่อตรงนี้)
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3 | ดึงไอคอน 4 ตัวจาก lucide-react | ปุ่มเมนู ออกจากระบบ เปลี่ยนรหัส โปรไฟล์ |
| 8-23 | ตารางเมนู: บทบาท → รายการ `{ href, label }` | เพิ่มหน้าใหม่ แก้ที่นี่ที่เดียว |
| 25 | Layout รับผู้ใช้ และเนื้อหาของหน้า (children) | ทุกหน้าครอบด้วย `<Layout user={user}>` |
| 26 | URL ปัจจุบัน เช่น `/hr/topics` | - |
| 29 | เมนูนี้ active ไหม: ตรงพอดี หรือเป็นหน้าย่อย (ยกเว้นหน้าหลัก ไม่งั้นทุกหน้าจะ active ที่ "Dashboard") | ไฮไลต์เมนูของหน้าที่เปิดอยู่ |
| 30-36 | สร้างรายการลิงก์ **ครั้งเดียว** | ใช้ 2 ที่ในขั้น 7.12.2 |
| 32 | active ใส่ class `menu-active` (ของ daisyUI) | - |

> 💡 **ไอคอน lucide-react:** `import { Menu } from "lucide-react"` แล้วใช้ `<Menu size={20} />` ชื่อไอคอนดูได้ที่ lucide.dev (ตอนออฟไลน์ พิมพ์ชื่อภาษาอังกฤษใน `{ }` ของ import แล้ว VS Code จะเติมให้)

### ขั้นที่ 7.12.2 แถบเมนูที่รองรับมือถือ

> 🎯 **ขั้นนี้จะได้:** มือถือเป็นเมนูพับ (dropdown) จอใหญ่เป็นเมนูแนวนอน (เกณฑ์ 7.10)

⌨️ **พิมพ์โค้ด:** ใน `components/Layout.js` พิมพ์แทนบรรทัด `// (ขั้น 7.12.2 จะเขียนต่อตรงนี้)`

```jsx
  return (
    <div className="min-h-screen bg-base-200 print:bg-white">
      <nav className="navbar bg-base-100 shadow print:hidden">
        <div className="navbar-start">
          {/* มือถือ: เมนูแบบ dropdown */}
          <div className="dropdown lg:hidden">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-square">
              <Menu size={20} />
            </div>
            <ul tabIndex={0} className="menu dropdown-content bg-base-100 rounded-box shadow w-52 z-10">
              {links}
            </ul>
          </div>
          <Link href={`/${user.role}`} className="btn btn-ghost text-lg">
            ระบบประเมิน
          </Link>
        </div>
        {/* desktop: เมนูแนวนอน */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal">{links}</ul>
        </div>
        <div className="navbar-end gap-1">
          <div className="text-right text-sm hidden sm:block">
            <div>{user.full_name}</div>
            <div className="text-xs opacity-60">{ROLE_NAMES[user.role]}</div>
          </div>
          <Link href="/profile" className="btn btn-ghost btn-square" title="ข้อมูลส่วนตัว">
            <UserRound size={18} />
          </Link>
          <Link href="/change-password" className="btn btn-ghost btn-square" title="เปลี่ยนรหัสผ่าน">
            <KeyRound size={18} />
          </Link>
          <button onClick={logout} className="btn btn-ghost btn-square" title="ออกจากระบบ">
            <LogOut size={18} />
          </button>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-4 print:p-0">{children}</main>
    </div>
  );
```

🔍 **อ่านโค้ดทีละส่วน**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 2 | พื้นหลังเทาเต็มจอ ตอนพิมพ์เป็นขาว | - |
| 3 | แถบด้านบน **ซ่อนตอนพิมพ์** (`print:hidden`) | บันทึก PDF แล้วไม่มีเมนู (บท 09) |
| 6-13 | **มือถือ:** ปุ่มไอคอน ☰ กดแล้วเมนูพับลงมา (`lg:hidden` = จอใหญ่ซ่อน) | `tabIndex={0}` ทำให้กด/โฟกัสได้ ซึ่ง dropdown ของ daisyUI ต้องใช้ |
| 11 | ใส่ `links` ที่สร้างไว้ | - |
| 14-16 | ชื่อระบบ กดแล้วกลับหน้าหลัก | - |
| 19-21 | **จอใหญ่:** เมนูแนวนอนกลางแถบ (`hidden lg:flex` = มือถือซ่อน) | ใส่ `links` ชุดเดียวกัน |
| 23-26 | ชื่อและบทบาท (มือถือซ่อน `hidden sm:block` ประหยัดที่) | - |
| 27-35 | ปุ่มไอคอน: โปรไฟล์, เปลี่ยนรหัส, ออกจากระบบ | `title` = ข้อความเมื่อเอาเมาส์ชี้ |
| 38 | เนื้อหาของหน้า กว้างไม่เกิน `max-w-6xl` กึ่งกลาง | ทุกหน้าหน้าตาเป็นระเบียบเหมือนกัน |

> 💡 **เมนูเดียว ใช้ 2 ที่:** `links` ถูกใส่ทั้งใน dropdown (มือถือ) และเมนูแนวนอน (จอใหญ่) **นี่คือหัวใจของ responsive (เกณฑ์ 7.10)**
> 🧩 syntax ใหม่: `onClick={logout}` ส่งฟังก์ชัน **โดยไม่มี `()`** (ถ้าใส่ `logout()` จะเรียกทันทีตอนวาดหน้า = ออกจากระบบทันที)

✅ **ลองเลย:** ยังไม่มีหน้าที่ใช้ Layout จะได้เห็นในขั้น 7.13

## 7.13 หน้าเปลี่ยนรหัสผ่าน

### ขั้นที่ 7.13.1 หน้า /change-password (เกณฑ์ 5.2.1)

> 🎯 **ขั้นนี้จะได้:** ผู้ใช้ใหม่ถูกบังคับเปลี่ยนรหัส และทุกคนเปลี่ยนรหัสเองได้

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/pages/change-password.js`

```jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import api, { errorMessage } from "@/lib/api";
import { useAuth, saveAuth, getToken, homePath, goTo } from "@/lib/auth";
import { validateWith } from "@/lib/validate";
import { changePasswordSchema } from "@/schemas/auth";
import Layout from "@/components/Layout";
import Field from "@/components/Field";

export default function ChangePassword() {
  const user = useAuth(); // ทุก role ใช้ได้
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: validateWith(changePasswordSchema),
  });

  const onSubmit = async ({ old_password, new_password }) => {
    setError("");
    try {
      await api.put("/auth/change-password", { old_password, new_password });
      saveAuth(getToken(), { ...user, must_change_password: false });
      alert("เปลี่ยนรหัสผ่านสำเร็จ");
      goTo(homePath(user.role));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (!user) return null;

  return (
    <Layout user={user}>
      <form onSubmit={handleSubmit(onSubmit)} className="card bg-base-100 shadow max-w-md mx-auto">
        <div className="card-body">
          <h1 className="card-title">เปลี่ยนรหัสผ่าน</h1>
          {user.must_change_password && (
            <div className="alert alert-warning">กรุณาเปลี่ยนรหัสผ่านก่อนเริ่มใช้งานครั้งแรก</div>
          )}
          {error && <div className="alert alert-error">{error}</div>}
          <Field label="รหัสผ่านเดิม" error={errors.old_password}>
            <input type="password" className="input w-full" {...register("old_password")} />
          </Field>
          <Field label="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)" error={errors.new_password}>
            <input type="password" className="input w-full" {...register("new_password")} />
          </Field>
          <Field label="ยืนยันรหัสผ่านใหม่" error={errors.confirm_password}>
            <input type="password" className="input w-full" {...register("confirm_password")} />
          </Field>
          <button className="btn btn-primary mt-2" disabled={isSubmitting}>
            บันทึก
          </button>
        </div>
      </form>
    </Layout>
  );
}
```

🔍 **อ่านโค้ดทีละบรรทัด** (จุดที่ต่างจากหน้า login)

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 11 | `useAuth()` ไม่ใส่บทบาท = ทุกบทบาทเข้าได้ | - |
| 17 | แกะเฉพาะ 2 ช่องจากข้อมูลฟอร์ม (ตัด confirm_password ทิ้ง) | ส่งไป backend แค่ที่ต้องใช้ |
| 21 | อัปเดตผู้ใช้ใน localStorage: สำเนาเดิมแล้วแก้ `must_change_password` เป็น false | **ถ้าไม่อัปเดต useAuth จะส่งกลับมาหน้านี้อีกไม่หยุด** |
| 22-23 | แจ้งสำเร็จ แล้วไปหน้าหลัก (โหลดใหม่) | - |
| 29 | ยังตรวจผู้ใช้ไม่เสร็จ ไม่แสดงอะไร | **กฎของโจทย์:** ทุกหน้าที่ต้อง login เช็กแล้ว return null จนกว่าจะผ่าน |
| 32 | ครอบด้วย Layout | ได้แถบเมนู |
| 36-38 | ถ้าต้องเปลี่ยนรหัส แสดงกล่องเหลืองเตือน | ผู้ใช้เข้าใจว่าทำไมถูกพามาหน้านี้ |

> 🧩 syntax สอนไปแล้ว: `{ ...user, must_change_password: false }` (กระจาย object บท 03 ขั้น 3.10.5) และแกะ object ในพารามิเตอร์ (ขั้น 7.11.2)

✅ **ลองเลย:**
1. login เป็น **teach1** / `123456` → ถูกพามาหน้านี้อัตโนมัติ พร้อมกล่องเหลือง และเห็นแถบเมนูด้านบน
2. ลองพิมพ์ URL `/evaluatee` เอง → ถูกพากลับมาหน้านี้
3. กรอกรหัสยืนยันไม่ตรง → "ยืนยันรหัสผ่านไม่ตรงกัน" ใต้ช่อง
4. กรอกรหัสเดิมผิด → กล่องแดง "รหัสผ่านเดิมไม่ถูกต้อง" (จาก backend)
5. ย่อจอเป็นมือถือ เมนูต้องเปลี่ยนเป็นปุ่ม ☰

> 💡 ถ้าเปลี่ยนรหัสจริงไปแล้ว รีเซ็ตฐานข้อมูลได้ (บท 02 ขั้น 2.6.1) แล้ว logout และ login ใหม่

## 7.14 หน้าข้อมูลส่วนตัว

### ขั้นที่ 7.14.1 schema ฝั่งหน้าของผู้ใช้

> 🎯 **ขั้นนี้จะได้:** กฎตรวจฟอร์มผู้ใช้และโปรไฟล์ (ใช้ซ้ำในบท 08)

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/schemas/user.js`

```js
import { z } from "zod";

export const userSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(50, "ชื่อผู้ใช้ต้องไม่เกิน 50 ตัวอักษร")
    .regex(/^[a-zA-Z0-9_.]+$/, "ชื่อผู้ใช้ใช้ได้เฉพาะ a-z, 0-9, _ และ ."),
  full_name: z.string().trim().min(1, "กรุณากรอกชื่อ-สกุล").max(100, "ชื่อ-สกุลต้องไม่เกิน 100 ตัวอักษร"),
  email: z.union([z.literal(""), z.email("รูปแบบอีเมลไม่ถูกต้อง")]),
  phone: z.union([z.literal(""), z.string().regex(/^0\d{8,9}$/, "เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก ขึ้นต้นด้วย 0")]),
  position: z.string().trim().max(100, "ต้องไม่เกิน 100 ตัวอักษร"),
  department: z.string().trim().max(100, "ต้องไม่เกิน 100 ตัวอักษร"),
  role: z.enum(["evaluatee", "committee"], { error: "กรุณาเลือกบทบาท" }),
});

export const userUpdateSchema = userSchema.omit({ role: true });

export const profileSchema = userSchema.omit({ role: true, username: true });
```

| ต่างจาก backend (บท 05 ขั้น 5.2) | เพราะ |
|---|---|
| ไม่มี `.nullish().transform(…)` | ช่องกรอกในฟอร์มส่ง `""` เสมอ ไม่ส่ง null (backend แปลงเป็น null เอง) |
| เขียน `z.string().trim().min(1, …)` แทน `requiredText` | ฝั่งหน้าไม่มีไฟล์ common.js เขียนตรงๆ |
| ข้อความ error เหมือนกัน | ผู้ใช้เห็นข้อความเดียวกันไม่ว่าจะจับได้ฝั่งไหน |

### ขั้นที่ 7.14.2 หน้าโปรไฟล์: โหลดข้อมูลเดิมมาใส่ฟอร์ม

> 🎯 **ขั้นนี้จะได้:** เปิด /profile แล้วเห็นข้อมูลเดิมในช่องกรอก (แพตเทิร์น "ฟอร์มแก้ไข" ที่ใช้ทั้งระบบ)

⌨️ **พิมพ์โค้ด:** สร้างไฟล์ใหม่ `frontend/pages/profile.js`

```jsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api, { errorMessage } from "@/lib/api";
import { useAuth, saveAuth, getToken } from "@/lib/auth";
import { validateWith } from "@/lib/validate";
import { formValues } from "@/lib/format";
import { ROLE_NAMES } from "@/lib/constants";
import { profileSchema } from "@/schemas/user";
import Layout from "@/components/Layout";
import Field from "@/components/Field";

// แก้ไขข้อมูลส่วนตัว (ทุก role)
export default function Profile() {
  const user = useAuth();
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: validateWith(profileSchema),
  });

  useEffect(() => {
    if (!user) return;
    api.get("/profile").then((res) => {
      setProfile(res.data.data);
      reset(formValues(res.data.data));
    }).catch((err) => setMessage({ type: "error", text: errorMessage(err) }));
  }, [user, reset]);

  // (ขั้น 7.14.3 จะเขียนต่อตรงนี้)
}
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 15 | state ข้อมูลโปรไฟล์ (null = ยังโหลดไม่เสร็จ) | - |
| 16 | state ข้อความแจ้งผล เป็น object `{ type, text }` | type = `success` หรือ `error` ใช้เลือกสีกล่อง |
| 17 | แกะ `reset` เพิ่มจาก useForm | เติมค่าทุกช่องในฟอร์มทีเดียว |
| 21-27 | เมื่อรู้ผู้ใช้แล้ว: โหลดโปรไฟล์ → เก็บ state → เติมฟอร์ม (null เป็น "") / ผิดพลาด → แสดงข้อความ | **แพตเทิร์นโหลดข้อมูลเดิมมาใส่ฟอร์ม** |
| 22 | ยังไม่รู้ผู้ใช้ (useAuth ยังตรวจไม่เสร็จ) ยังไม่โหลด | `return` ใน useEffect = จบเลย |
| 27 | ทำใหม่เมื่อ user เปลี่ยน (จาก null เป็นผู้ใช้จริง) | ใส่ `reset` ด้วยตามกฎของ React (ฟังก์ชันที่ใช้ในเอฟเฟกต์) |

> ❗ **ห้ามลืม `.catch`** ถ้าลืม ตอน backend ล่ม console จะขึ้น `Uncaught (in promise) AxiosError` (เสียคะแนนข้อ 7.7) และผู้ใช้เห็นหน้าว่างโดยไม่รู้ว่าเกิดอะไรขึ้น

### ขั้นที่ 7.14.3 หน้าโปรไฟล์: ฟอร์มและการบันทึก

> 🎯 **ขั้นนี้จะได้:** แก้ข้อมูลส่วนตัวได้ (เกณฑ์ 5.2.2)

⌨️ **พิมพ์โค้ด:** พิมพ์แทนบรรทัด `// (ขั้น 7.14.3 จะเขียนต่อตรงนี้)`

```jsx
  const onSubmit = async (data) => {
    try {
      const res = await api.put("/profile", data);
      saveAuth(getToken(), { ...user, full_name: data.full_name }); // ชื่อบน navbar
      setMessage({ type: "success", text: res.data.message });
    } catch (err) {
      setMessage({ type: "error", text: errorMessage(err) });
    }
  };

  if (!user) return null;
  // โหลดไม่สำเร็จ (เช่น เซิร์ฟเวอร์ไม่ทำงาน) แสดงข้อความแทนหน้าว่าง
  if (!profile) return <Layout user={user}>{message.text && <div className="alert alert-error mb-4">{message.text}</div>}</Layout>;

  return (
    <Layout user={user}>
      <form onSubmit={handleSubmit(onSubmit)} className="card bg-base-100 shadow max-w-2xl mx-auto">
        <div className="card-body">
          <h1 className="card-title">ข้อมูลส่วนตัว</h1>
          <p className="text-sm opacity-70">
            ชื่อผู้ใช้ {profile.username} | {ROLE_NAMES[profile.role]}
          </p>
          {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}
          <div className="grid sm:grid-cols-2 gap-x-4">
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
          <button className="btn btn-primary mt-2 w-fit" disabled={isSubmitting}>
            บันทึก
          </button>
        </div>
      </form>
    </Layout>
  );
```

🔍 **อ่านโค้ดทีละบรรทัด**

| บรรทัด | ทำอะไร | เอาไว้ใช้ทำอะไร |
|---|---|---|
| 3-5 | บันทึก → อัปเดตชื่อใน localStorage → แสดงข้อความสำเร็จจาก backend | ชื่อบนแถบเมนูเปลี่ยนตาม (หลังโหลดหน้าใหม่) |
| 11 | ยังตรวจผู้ใช้ไม่เสร็จ ไม่แสดง | - |
| 13 | **ยังไม่มีข้อมูล:** แสดง Layout + กล่อง error (ถ้ามี) | **แพตเทิร์นแสดง error เมื่อโหลดไม่สำเร็จ (ใช้ทุกหน้า)** แทนหน้าว่าง |
| 20-22 | แสดง username และบทบาท (แก้ไม่ได้ จึงไม่ใช่ช่องกรอก) | - |
| 23 | กล่องข้อความ สีตาม type (`alert-success` / `alert-error`) | template string ใน className |
| 24 | ช่องกรอกจัด 2 คอลัมน์บนจอ ≥640px, มือถือ 1 คอลัมน์ | responsive |

> 🧩 syntax ใหม่: `` className={`alert alert-${message.type}`} `` = ใช้ template string (บท 03 ขั้น 3.9.1) สร้างชื่อ class จากตัวแปร

✅ **ลองเลย:** login เป็น hr → กดไอคอนรูปคน (ข้อมูลส่วนตัว)
1. ช่องกรอกมีข้อมูลเดิมของ "สมศรี ใจดี"
2. แก้เบอร์เป็น `123` → "เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก…" ใต้ช่อง (ฝั่งหน้าจับได้ ไม่ยิง API)
3. แก้ชื่อ แล้วบันทึก → กล่องเขียว "บันทึกข้อมูลส่วนตัวสำเร็จ"

### ขั้นที่ 7.14.4 ทดสอบตอน backend ล่ม

> 🎯 **ขั้นนี้จะได้:** มั่นใจว่าหน้าไม่ว่างเปล่าและ console ไม่มี error เมื่อเชื่อมต่อไม่ได้ (เกณฑ์ 7.7)

▶️ **ทดสอบ:**
1. ไปที่ terminal ของ backend กด `Ctrl + C` (หยุด backend)
2. รีเฟรชหน้า /profile

✅ **ต้องเห็น:** แถบเมนู + กล่องแดง "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" และ F12 → Console **ไม่มี** `Uncaught (in promise)`

3. เปิด backend กลับ (`npm run dev`)

**แพตเทิร์นนี้ใช้ทุกหน้าที่โหลดข้อมูล (จำให้ขึ้นใจ)**

```jsx
const [data, setData] = useState(null);
const [error, setError] = useState("");

useEffect(() => {
  if (!user) return;
  api.get("/…")
    .then((res) => setData(res.data.data))
    .catch((err) => setError(errorMessage(err)));
}, [user]);

if (!user) return null;
if (!data) return <Layout user={user}>{error && <div className="alert alert-error mb-4">{error}</div>}</Layout>;
```

| บรรทัด | ทำไม |
|---|---|
| 5 | รอให้ useAuth ตรวจเสร็จก่อนค่อยโหลด (ไม่งั้นยิง API โดยไม่มี token) |
| 8 | **ห้ามลืม `.catch`** |
| 11 | ยังตรวจผู้ใช้ไม่เสร็จ → ว่าง |
| 12 | ยังไม่มีข้อมูล → แสดง error (ถ้ามี) แทนหน้าว่าง |

<details>
<summary>📄 ไฟล์ pages/profile.js ทั้งไฟล์ (กดดูไว้เทียบ)</summary>

ไฟล์จริงในโปรเจกต์: [frontend/pages/profile.js](../../frontend/pages/profile.js)

</details>

---

## ❗ ปัญหาที่พบบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| `localStorage is not defined` | เรียก localStorage นอก useEffect | ย้ายเข้า useEffect หรือ event handler |
| เรียก API แล้วได้ 404 จาก Next.js | ไม่มี rewrites หรือยังไม่รีสตาร์ท dev | เพิ่ม rewrites (ขั้น 7.4.1) แล้วรัน `npm run dev` ใหม่ |
| `ECONNREFUSED` ใน terminal ของ frontend | backend ไม่ได้รัน | รัน `npm run dev` ใน backend |
| `Module not found: Can't resolve '@/lib/api'` | ชื่อไฟล์/โฟลเดอร์ผิด หรือไม่มี jsconfig.json | ตรวจที่อยู่ไฟล์ (`@/` = โฟลเดอร์ frontend) |
| กดส่งฟอร์มแล้วหน้าโหลดใหม่ | ไม่ได้ใช้ `handleSubmit` | `<form onSubmit={handleSubmit(onSubmit)}>` |
| error ไม่แสดงใต้ช่อง | ชื่อใน `register("...")` ไม่ตรงกับ schema | ตรวจการสะกด |
| `Each child in a list should have a unique "key"` | `.map()` ไม่ใส่ key | ใส่ `key={item.id}` |
| `A component is changing an uncontrolled input to be controlled` | ค่าเริ่มต้นเป็น null | ใช้ `formValues()` |
| หน้าเปลี่ยนรหัสวนกลับมาไม่หยุด | ไม่ได้อัปเดต `must_change_password` ใน localStorage | `saveAuth(getToken(), { ...user, must_change_password: false })` |
| กดปุ่มออกจากระบบแล้วออกทันทีตอนเปิดหน้า | เขียน `onClick={logout()}` | `onClick={logout}` (ไม่มีวงเล็บ) |
| `Uncaught (in promise) AxiosError` ใน console | ลืม `.catch` ตอนโหลดข้อมูล | ใส่ `.catch((err) => setError(errorMessage(err)))` |
| `Hydration failed` | อ่าน localStorage ตอนวาดหน้า (นอก useEffect) | อ่านใน useEffect เท่านั้น |
| class ของ Tailwind/daisyUI ไม่มีผล | พิมพ์ชื่อ class ผิด หรือสร้างชื่อ class ด้วยการต่อข้อความ แล้วชื่อเต็มนั้นไม่เคยถูกเขียนที่ไหนในโปรเจกต์ | Tailwind สร้างเฉพาะ class ที่เห็นเต็มคำในไฟล์ (`alert-${type}` ใช้ได้เพราะ `alert-success`, `alert-error` ถูกเขียนเต็มคำในไฟล์อื่นแล้ว) |

---

⬅️ [บทที่ 06](06-api-evaluatee-committee.md) | ➡️ [บทที่ 08: หน้าจองานบุคลากร](08-frontend-hr.md)
