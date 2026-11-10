// ข้อมูลรายเส้น: ส่วนกลาง + คนที่ 1 (hr)
export const b = (file, anchor, title, note) => ({ kind: "block", file, anchor, title, note });
export const z = (file, a, zz, title, note) => ({ kind: "between", file, a, z: zz, title, note });
export const one = (file, a, title, note) => z(file, a, a, title, note);
export const R = (n) => `backend/routes/${n}.js`;
export const BS = (n) => `backend/schemas/${n}.js`;
export const FS = (n) => `frontend/schemas/${n}.js`;
export const P = (n) => `frontend/pages/${n}.js`;
export const C = (n) => `frontend/components/${n}.js`;
export const SCORE = "backend/utils/score.js";
const PW = "backend/utils/password.js";
const APP = "backend/app.js";
const AUTH = "frontend/lib/auth.js";

export const common = [
  {
    key: "POST /api/auth/register", name: "สมัครสมาชิก", owner: 0, mount: "auth", access: "public",
    criteria: "ข้อ 3.2.5.2 (1) ลงทะเบียนเพื่อใช้งานระบบ, 6.2, 6.7, 8.2", needs: "ไม่ต้องมีข้อมูลใดก่อน เป็นเส้นแรกของระบบ", page: "/register",
    flow: "กรอกฟอร์ม → Zod ฝั่งหน้าเว็บตรวจ → Axios ส่ง POST → Zod ฝั่ง Backend ตรวจซ้ำ → hash รหัสผ่าน → INSERT ลงตาราง users → ตอบ 201 → หน้าเว็บพาไป /login",
    intro: "เส้นนี้อธิบายละเอียดที่สุด ให้อ่านก่อนเส้นอื่น เพราะทุกเส้นใช้รูปแบบเดียวกัน\n\n> ⚠️ คำว่า `register` ในหน้าเว็บมี 2 ความหมาย: `register` จาก `useForm` คือฟังก์ชัน**ผูกช่องกรอกกับฟอร์ม** ส่วน `/auth/register` คือ API **สมัครสมาชิก**",
    fe: [
      b(FS("user"), "export const userSchema", "กติกาช่องข้อมูลผู้ใช้", "กำหนดว่าแต่ละช่องต้องกรอกแบบไหน เช่น ชื่อผู้ใช้ 3-50 ตัว อีเมลต้องถูกรูปแบบ สมัครสมาชิกนำชุดนี้มาใช้ต่อ จึงไม่ต้องเขียนกติกาซ้ำ"),
      b(FS("auth"), "export const registerSchema", "Zod ของฟอร์มสมัครสมาชิก", "`.omit({ role: true })` ตัดช่องบทบาทออก `.extend` เพิ่มช่องรหัสผ่าน และ `.refine` ตรวจว่ารหัสผ่านทั้งสองช่องตรงกัน ถ้าไม่ตรงจะขึ้นข้อความใต้ช่อง `confirm_password`"),
      b(P("register"), "const { register, handleSubmit", "ผูกฟอร์มกับ Zod", "`useForm` ดูแลค่าทุกช่อง `resolver: validateWith(registerSchema)` สั่งให้ตรวจด้วย Zod ก่อนส่ง ส่วน `errors` คือข้อความ error ของแต่ละช่อง"),
      b(P("register"), "const onSubmit", "ส่งข้อมูลไป API", "ทำงานเมื่อข้อมูลผ่าน Zod แล้วเท่านั้น `{ confirm_password, ...data }` แยกช่องยืนยันรหัสผ่านออก แล้วส่งส่วนที่เหลือด้วย `api.post` สำเร็จแล้วพาไปหน้า login ถ้าผิดพลาดเก็บข้อความไว้ใน `error`"),
      z(P("register"), "<form onSubmit", "</form>", "หน้าตาฟอร์ม", "`{...register(\"username\")}` ผูกช่องกรอกกับชื่อฟิลด์ ชื่อต้องตรงกับใน Zod และ Backend ส่วน `<Field>` แสดงป้ายชื่อกับข้อความ error"),
      z(P("login"), '<Link href="/register"', "</Link>", "ลิงก์จากหน้า login", "ทางเข้าหน้าสมัครสมาชิก"),
    ],
    be: [
      b(BS("common"), "export const passwordText", "กติกาของรหัสผ่าน", "รหัสผ่าน 6-50 ตัว ใช้ร่วมกับการเปลี่ยนรหัสผ่าน"),
      b(BS("user"), "export const userSchema", "กติกาช่องข้อมูลผู้ใช้ฝั่ง Backend", "ต้องตรวจซ้ำเพราะคนอื่นยิง API ตรงๆ โดยไม่ผ่านหน้าเว็บได้ `.transform` แปลงค่าว่างเป็น `null` ก่อนลง DB"),
      b(BS("auth"), "export const registerSchema", "Zod ของการสมัคร", "ตัด `role` ออก ถ้ามีคนแอบส่ง `role: \"hr\"` มา Zod จะทิ้งค่านี้ทันที จึงสมัครเป็น hr เองไม่ได้"),
      b(R("auth"), 'router.post("/register"', "route สมัครสมาชิก", "`validate(registerSchema)` ตรวจ body ก่อน จากนั้น hash รหัสผ่านแล้ว INSERT โดยเขียน `'evaluatee'` และ `FALSE` ไว้ใน SQL เลย จึงไม่มีทางรับ role จากภายนอก ไม่มี `verifyToken` เพราะคนสมัครยังไม่มีบัญชี"),
      b(PW, "export async function hashPassword", "hash รหัสผ่าน", "สุ่ม salt แล้วเข้ารหัสด้วย `crypto.scrypt` เก็บเป็น `salt:hash` ใน DB ไม่มีรหัสผ่านจริงเก็บอยู่เลย"),
      one(APP, 'if (err.code === "ER_DUP_ENTRY")', "จัดการข้อมูลซ้ำ", "ถ้า username หรือ email ซ้ำ MySQL จะ error เพราะเป็น UNIQUE จุดนี้แปลงเป็น 400 ให้ route ไม่ต้องเช็กเอง"),
    ],
    db: [["users", "เพิ่ม 1 แถว: `username`, `password_hash`, `full_name`, `email`, `phone`, `position`, `department`, `role` = evaluatee, `must_change_password` = FALSE"]],
    errors: [[400, "ข้อมูลไม่ผ่าน Zod เช่น รหัสผ่านสั้นกว่า 6 ตัว (`data` บอกช่องที่ผิด)"], [400, "username หรือ email ซ้ำ: ข้อมูลซ้ำกับที่มีอยู่แล้ว"]],
    after: "**หลังสมัครบัญชีแรก** ให้เปลี่ยนเป็น hr ใน DB แล้ว login ใหม่ เพราะ role ถูกเก็บไว้ใน token ตอน login\n\n```\necho \"UPDATE users SET role='hr' WHERE username='your_username'\" | docker exec -i eva_mysql sh -c 'mysql -uroot -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE'\n```\n\nใช้ได้ทั้ง PowerShell และ Git Bash หรือจะแก้ใน HeidiSQL/DBeaver ก็ได้",
  },
  {
    key: "POST /api/auth/login", name: "เข้าสู่ระบบ", owner: 0, mount: "auth", access: "public",
    criteria: "6.6, 7.1", needs: "ต้องมีบัญชีจาก `POST /api/auth/register` หรือ `POST /api/users`", page: "/login",
    flow: "กรอกชื่อผู้ใช้/รหัสผ่าน → Zod → POST → เทียบรหัสผ่านกับ hash → สร้าง JWT → หน้าเว็บเก็บ token ใน localStorage → ไปหน้าของ role",
    fe: [
      b(FS("auth"), "export const loginSchema", "Zod ของฟอร์ม login", "บังคับกรอกทั้งสองช่อง"),
      b(P("login"), "const { register, handleSubmit", "ผูกฟอร์มกับ Zod", "รูปแบบเดียวกับหน้าสมัครสมาชิก"),
      b(P("login"), "const onSubmit", "ส่งข้อมูลและจำการ login", "ได้ `token` กับ `user` กลับมาแล้ว `saveAuth` เก็บลง localStorage ถ้าต้องเปลี่ยนรหัสผ่านจะไปหน้า `/change-password` ก่อน"),
      z(P("login"), "<form onSubmit", "</form>", "หน้าตาฟอร์ม", "ช่องชื่อผู้ใช้กับรหัสผ่าน"),
      b(AUTH, "export function saveAuth", "เก็บ token ลงเครื่อง", "ทุก request ถัดไปจะหยิบ token จากที่นี่"),
      b(AUTH, "export function goTo", "เปลี่ยนหน้าแบบโหลดใหม่", "ใช้ `window.location.href` ให้ทุกหน้าอ่าน localStorage ใหม่"),
      b(AUTH, "export const homePath", "หน้าแรกของแต่ละ role", "เช่น hr ไป `/hr`"),
    ],
    be: [
      b(BS("auth"), "export const loginSchema", "Zod ของการ login", "ถ้าไม่กรอกจะตอบ 400 ทันที ไม่ต้องไปถาม DB"),
      b(R("auth"), 'router.post("/login"', "route login", "หา user จาก username เทียบรหัสผ่านด้วย `verifyPassword` ผ่านแล้ว `jwt.sign` เซ็น token ที่มี `id`, `role`, `full_name` ไม่ส่ง `password_hash` กลับ และถ้าผิดจะตอบข้อความเดียวกัน เพื่อไม่บอกว่าผิดช่องไหน"),
      b(PW, "export async function verifyPassword", "ตรวจรหัสผ่าน", "แยก salt ออกจากค่าที่เก็บ คำนวณ hash ใหม่จากรหัสที่กรอก แล้วเทียบกัน"),
    ],
    db: [["users", "อ่านทุกคอลัมน์ของแถวที่ `username` ตรง ใช้ `password_hash`, `role`, `must_change_password`"]],
    errors: [[400, "ไม่กรอกข้อมูล"], [401, "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"]],
  },
  {
    key: "PUT /api/auth/change-password", name: "เปลี่ยนรหัสผ่าน", owner: 0, mount: "auth", access: "all",
    criteria: "5.2.1 บังคับเปลี่ยนรหัสผ่านครั้งแรก", needs: "ต้อง login แล้ว", page: "/change-password",
    flow: "กรอกรหัสเดิม/ใหม่ → Zod → PUT พร้อม token → ตรวจรหัสเดิม → UPDATE hash ใหม่ และปิด must_change_password",
    fe: [
      b(FS("auth"), "export const changePasswordSchema", "Zod ของฟอร์ม", "รหัสใหม่ 6-50 ตัว และช่องยืนยันต้องตรงกัน"),
      b(P("change-password"), "const onSubmit", "ส่งข้อมูล", "สำเร็จแล้วอัปเดต user ใน localStorage ให้ `must_change_password: false` ไม่อย่างนั้นจะถูกพากลับหน้านี้อีก"),
      z(P("change-password"), "<form onSubmit", "</form>", "หน้าตาฟอร์ม", "แสดงคำเตือนถ้าเป็นการเข้าใช้ครั้งแรก"),
      one(AUTH, "else if (u.must_change_password", "บังคับเปลี่ยนรหัสผ่าน", "อยู่ใน `useAuth` ถ้ายังไม่เปลี่ยนรหัส ทุกหน้าจะถูกพามาหน้านี้"),
    ],
    be: [
      b(BS("auth"), "export const changePasswordSchema", "Zod ของการเปลี่ยนรหัส", "ใช้ `passwordText` กติกาเดียวกับการสมัคร"),
      b(R("auth"), 'router.put("/change-password"', "route เปลี่ยนรหัสผ่าน", "`req.user.id` มาจาก token จึงเปลี่ยนได้เฉพาะของตัวเอง ตรวจรหัสเดิมก่อน และรหัสใหม่ต้องไม่ซ้ำรหัสเดิม"),
    ],
    db: [["users", "อ่าน `password_hash` แล้ว UPDATE `password_hash`, `must_change_password` = FALSE"]],
    errors: [[400, "รหัสผ่านเดิมไม่ถูกต้อง หรือรหัสใหม่ซ้ำรหัสเดิม"], [404, "ไม่พบผู้ใช้"]],
  },
  {
    key: "GET /api/health", name: "เช็กว่าระบบทำงาน", owner: 0, access: "public",
    criteria: "ไม่มีข้อเกณฑ์โดยตรง ใช้เช็กระบบตอนเริ่มงาน", needs: "ไม่ต้องมี", noFe: "ใช้ทดสอบผ่าน Thunder Client หรือเปิด URL ในเบราว์เซอร์",
    flow: "เรียก URL → SELECT 1 จาก DB → ตอบ 200 ถ้าทั้ง API และ DB พร้อม",
    be: [b(APP, 'app.get("/api/health"', "route เช็กระบบ", "ถ้าเส้นนี้ได้ 200 แปลว่า Backend ต่อ DB ได้แล้ว ควรทดสอบเส้นนี้เป็นอันดับแรก")],
    db: [],
    errors: [[500, "ต่อฐานข้อมูลไม่ได้"]],
  },
];

const U = P("hr/users"), UM = C("hr/UserModal"), T = P("hr/topics"), TM = C("hr/TopicModal"), IM = C("hr/IndicatorModal"), A = P("hr/assignments");

export const person1 = [
  {
    key: "GET /api/users", name: "รายชื่อผู้ใช้ ค้นหาและกรองบทบาท", owner: 1, mount: "users", access: "hr", guard: true,
    criteria: "6.1", needs: "บัญชี hr", page: "/hr/users", section: "ผู้ใช้งาน (users)",
    flow: "เปิดหน้า → useEffect เรียก load → GET พร้อม query → SELECT ตามตัวกรอง → แสดงในตาราง",
    fe: [
      b(U, "const load = () =>", "โหลดรายชื่อ", "`params` ถูกแปลงเป็น `?role=...&q=...` ผลที่ได้เก็บใน `users`"),
      b(U, "useEffect(() => {", "เรียกตอนเปิดหน้า", "โหลดใหม่ทุกครั้งที่เปลี่ยนแท็บบทบาท"),
      z(U, '<div role="tablist" className="tabs tabs-box">', "</form>", "แท็บกรองและช่องค้นหา", "เปลี่ยนแท็บแล้วโหลดใหม่ ส่วนช่องค้นหาโหลดเมื่อกดปุ่ม"),
      z(U, '<div className="overflow-x-auto bg-base-100 rounded-box shadow">', "{users.length === 0", "ตารางรายชื่อ", "`users.map` สร้างแถวต่อคน ปุ่มแก้ไข/รีเซ็ต/ลบจะไม่แสดงกับบัญชี hr"),
    ],
    be: [
      b(R("users"), "const USER_FIELDS", "คอลัมน์ที่ตอบกลับ", "ระบุคอลัมน์เอง จึงไม่มี `password_hash` ติดออกไป"),
      b(R("users"), 'router.get("/", async', "route รายชื่อผู้ใช้", "เริ่มด้วย `WHERE 1 = 1` เพื่อให้ต่อเงื่อนไข `AND` ได้ง่าย และใช้ `?` แทนการต่อข้อความ เพื่อกัน SQL Injection"),
    ],
    db: [["users", "อ่าน: `id`, `username`, `full_name`, `email`, `phone`, `position`, `department`, `role`, `must_change_password`, `created_at`"]],
    errors: [],
  },
  {
    key: "GET /api/users/{id}", name: "ข้อมูลผู้ใช้ 1 คน", owner: 1, mount: "users", access: "hr", guard: true,
    criteria: "6.1", needs: "ต้องมีผู้ใช้อย่างน้อย 1 คน", noFe: "หน้าเว็บใช้ข้อมูลจาก `GET /api/users` แทน เส้นนี้ทดสอบผ่าน Thunder Client (เกณฑ์ 6.1 ต้องการ Path Parameter)",
    flow: "GET พร้อม id ใน URL → SELECT 1 แถว → ไม่เจอตอบ 404",
    be: [b(R("users"), 'router.get("/:id", async', "route อ่าน 1 คน", "`req.params.id` คือค่าจาก URL ถ้าไม่พบให้ `return fail(...)` เพื่อจบการทำงานทันที")],
    db: [["users", "อ่านคอลัมน์ตาม `USER_FIELDS` ของแถวที่ `id` ตรง"]],
    errors: [[404, "ไม่พบผู้ใช้"]],
  },
  {
    key: "POST /api/users", name: "เพิ่มผู้รับการประเมินหรือกรรมการ", owner: 1, mount: "users", access: "hr", guard: true,
    criteria: "5.1.5, 5.1.6, 6.2, 7.2", needs: "บัญชี hr", page: "/hr/users (ปุ่มเพิ่มผู้ใช้)",
    flow: "กดเพิ่ม → เปิด Modal → Zod → POST → สุ่มรหัสชั่วคราว → INSERT → แสดงรหัสชั่วคราวให้ hr",
    fe: [
      b(FS("user"), "export const userSchema", "Zod ของฟอร์ม", "กติกาเดียวกับ[หน้าสมัครสมาชิก](shared.md#post-api-auth-register) แต่มีช่อง `role`"),
      z(U, '<button className="btn btn-primary" onClick={() => setEditing({})}>', "</button>", "ปุ่มเพิ่ม", "`setEditing({})` ค่าว่างแปลว่าเพิ่มใหม่ ถ้าเป็น `null` แปลว่าปิด Modal"),
      z(U, "{editing && (", "      )}", "แสดง Modal", "`onSaved` ปิด Modal แล้วโหลดรายชื่อใหม่"),
      b(UM, "const { register, handleSubmit", "ผูกฟอร์มกับ Zod", "`isEdit` เลือกว่าจะใช้ schema ไหน ส่วน `formValues` แปลงค่า null เป็นค่าว่างให้ช่องกรอก"),
      b(UM, "const onSubmit", "ส่งข้อมูล", "สำเร็จแล้ว alert รหัสผ่านชั่วคราว แล้วเรียก `onSaved`"),
      z(UM, "<form onSubmit", "</form>", "หน้าตาฟอร์ม", "ช่องบทบาทแสดงเฉพาะตอนเพิ่มใหม่"),
    ],
    be: [
      b(BS("user"), "export const userSchema", "Zod ของ Backend", "`role` รับได้แค่ evaluatee หรือ committee จึงเพิ่ม hr ผ่าน API นี้ไม่ได้"),
      b(R("users"), "const tempPassword", "สุ่มรหัสชั่วคราว", "ตัวเลข 6 หลัก"),
      b(R("users"), 'router.post("/", validate', "route เพิ่มผู้ใช้", "ไม่ระบุ `must_change_password` จึงใช้ค่าเริ่มต้น TRUE ผู้ใช้ต้องเปลี่ยนรหัสตอนเข้าครั้งแรก ตอบ 201 พร้อมรหัสชั่วคราว"),
    ],
    db: [["users", "เพิ่ม 1 แถว: `username`, `password_hash`, `full_name`, `email`, `phone`, `position`, `department`, `role`"]],
    errors: [[400, "ข้อมูลไม่ถูกต้อง หรือ username/email ซ้ำ"]],
  },
  {
    key: "POST /api/users/import", name: "นำเข้าผู้ใช้จากไฟล์ CSV", owner: 1, mount: "users", access: "hr", guard: true,
    criteria: "3.5.8.3 Function การ Upload", needs: "บัญชี hr", page: "/hr/users (นำเข้าจากไฟล์ CSV)", form: "form-data ช่อง `file` เป็นไฟล์ .csv หัวตาราง `username,full_name,role,email,phone,position,department`",
    flow: "เลือกไฟล์ → FormData → POST → ตรวจทุกแถวด้วย Zod → INSERT ทีเดียวทุกแถว → แสดงรหัสชั่วคราว",
    fe: [
      b(U, "const importCsv", "อัปโหลดไฟล์", "ส่งไฟล์ต้องใช้ `FormData` ถ้ามีแถวผิด Backend จะบอกเลขแถวมาใน `data`"),
      z(U, '<input ref={fileRef} type="file" accept=".csv"', "</button>", "ช่องเลือกไฟล์", "`useRef` ใช้อ่านไฟล์จาก input"),
    ],
    be: [b(R("users"), 'router.post("/import"', "route นำเข้า CSV", "`req.files.file` มาจาก express-fileupload ตรวจทุกแถวด้วย `userSchema.safeParse` ก่อน ถ้ามีแถวผิดจะไม่บันทึกเลย จากนั้นรวมทุกแถวใน INSERT เดียว")],
    db: [["users", "เพิ่มหลายแถวในคำสั่งเดียว"]],
    errors: [[400, "ไม่เลือกไฟล์ / ไม่ใช่ .csv / ไม่มีหัวตาราง / มีแถวไม่ถูกต้อง / ข้อมูลซ้ำ"]],
  },
  {
    key: "PUT /api/users/{id}", name: "แก้ไขผู้ใช้", owner: 1, mount: "users", access: "hr", guard: true,
    criteria: "6.3, 7.3", needs: "ต้องมีผู้ใช้จาก `POST /api/users`", page: "/hr/users (ปุ่มดินสอ)",
    flow: "กดแก้ไข → Modal เติมค่าเดิม → Zod → PUT → UPDATE → โหลดรายชื่อใหม่",
    feIntro: "ใช้ฟอร์มเดียวกับ [`POST /api/users`](#post-api-users) ต่างกันแค่ส่วนด้านล่าง",
    fe: [
      b(FS("user"), "export const userUpdateSchema", "Zod ตอนแก้ไข", "เหมือนตอนเพิ่ม แต่ไม่มี `role` เพราะเปลี่ยนบทบาทไม่ได้"),
      one(U, "onClick={() => setEditing(u)}", "ปุ่มแก้ไข", "ส่งข้อมูลแถวนั้นเข้า Modal `item.id` มีค่าจึงเป็นโหมดแก้ไข"),
      one(UM, "await api.put(`/users/${item.id}`, data);", "เรียก API", "ใส่ id ใน URL"),
    ],
    be: [
      b(BS("user"), "export const userUpdateSchema", "Zod ตอนแก้ไข", "`omit` ตัด role ออก"),
      b(R("users"), 'router.put("/:id", validate', "route แก้ไข", "ถ้า `affectedRows` เป็น 0 แปลว่าไม่มีแถวนั้น จึงตอบ 404"),
    ],
    db: [["users", "UPDATE: `username`, `full_name`, `email`, `phone`, `position`, `department`"]],
    errors: [[400, "ข้อมูลไม่ถูกต้องหรือซ้ำ"], [404, "ไม่พบผู้ใช้"]],
  },
  {
    key: "DELETE /api/users/{id}", name: "ลบผู้ใช้", owner: 1, mount: "users", access: "hr", guard: true,
    criteria: "6.4", needs: "ต้องมีผู้ใช้ที่ไม่ใช่ hr", page: "/hr/users (ปุ่มถังขยะ)",
    flow: "กดลบ → confirm → DELETE → ข้อมูลการประเมินถูกลบตาม (ON DELETE CASCADE)",
    fe: [
      b(U, "const remove = async", "ฟังก์ชันลบ", "ถามยืนยันก่อน ลบแล้วโหลดรายชื่อใหม่"),
      one(U, "onClick={() => remove(u)}", "ปุ่มลบ", "ส่งข้อมูลแถวนั้นเข้าฟังก์ชัน"),
    ],
    be: [b(R("users"), 'router.delete("/:id"', "route ลบ", "ลบตัวเองไม่ได้ และเงื่อนไข `role <> 'hr'` กันการลบบัญชี hr")],
    db: [["users", "DELETE 1 แถว ตาราง `assignments` และ `self_evaluations` ที่อ้างถึงจะถูกลบตาม"]],
    errors: [[400, "ลบบัญชีของตัวเองไม่ได้"], [404, "ไม่พบผู้ใช้ หรือเป็นบัญชี hr"]],
  },
  {
    key: "PUT /api/users/{id}/reset-password", name: "รีเซ็ตรหัสผ่าน", owner: 1, mount: "users", access: "hr", guard: true,
    criteria: "5.1.7", needs: "ต้องมีผู้ใช้ที่ไม่ใช่ hr", page: "/hr/users (ปุ่มกุญแจ)",
    flow: "กดรีเซ็ต → confirm → PUT → สุ่มรหัสใหม่ → บังคับเปลี่ยนรหัส → แสดงรหัสชั่วคราว",
    fe: [
      b(U, "const resetPassword", "ฟังก์ชันรีเซ็ต", "แสดงรหัสใหม่ด้วย alert"),
      one(U, "onClick={() => resetPassword(u)}", "ปุ่มรีเซ็ต", "แสดงเฉพาะแถวที่ไม่ใช่ hr"),
    ],
    be: [b(R("users"), 'router.put("/:id/reset-password"', "route รีเซ็ตรหัส", "`tempPassword` ใช้ตัวเดียวกับ[ตอนเพิ่มผู้ใช้](#post-api-users) และตั้ง `must_change_password` กลับเป็น TRUE")],
    db: [["users", "อ่าน `id`, `role` แล้ว UPDATE `password_hash`, `must_change_password` = TRUE"]],
    errors: [[400, "รีเซ็ตบัญชี hr ไม่ได้"], [404, "ไม่พบผู้ใช้"]],
  },

  {
    key: "GET /api/topics", name: "หัวข้อทั้งหมด พร้อมตัวชี้วัด", owner: 1, mount: "topics", access: "all", guard: true,
    criteria: "6.1", needs: "ทำได้ทันที ถ้ายังไม่มีข้อมูลจะได้ `[]`", page: "/hr/topics", section: "หัวข้อการประเมิน (topics)",
    flow: "เปิดหน้า → GET → ดึงหัวข้อและตัวชี้วัด → จับคู่ตาม topic_id → แสดงเป็นการ์ด",
    fe: [
      b(T, "const load = () =>", "โหลดหัวข้อ", "เก็บผลใน `topics`"),
      z(T, "{topics.map((t) => (", "{topics.length === 0", "แสดงการ์ดหัวข้อและตัวชี้วัด", "`t.indicators.map` วนแสดงตัวชี้วัดในหัวข้อนั้น และ `is_open` บอกว่าเปิดประเมินอยู่หรือไม่"),
    ],
    be: [
      b(R("topics"), "const TOPIC_FIELDS", "คอลัมน์ที่ตอบกลับ", "`CURDATE() BETWEEN ...` คำนวณ `is_open` จากวันที่ปัจจุบัน"),
      b(R("topics"), 'router.get("/", requireRole', "route รายการหัวข้อ", "query 2 ครั้ง แล้วใช้ `filter` จับตัวชี้วัดใส่ในแต่ละหัวข้อ"),
    ],
    db: [["evaluation_topics", "อ่านทุกคอลัมน์ และคำนวณ `is_open`"], ["indicators", "อ่านทุกคอลัมน์ จับคู่ด้วย `topic_id`"]],
    errors: [],
  },
  {
    key: "GET /api/topics/{id}", name: "หัวข้อ 1 รายการ", owner: 1, mount: "topics", access: "all", guard: true,
    criteria: "6.1", needs: "ต้องมีหัวข้อจาก `POST /api/topics`", noFe: "หน้าเว็บใช้ข้อมูลจาก `GET /api/topics` แทน เส้นนี้ทดสอบผ่าน Thunder Client",
    flow: "GET พร้อม id → SELECT หัวข้อและตัวชี้วัด → ไม่เจอตอบ 404",
    be: [b(R("topics"), 'router.get("/:id", requireRole', "route อ่าน 1 หัวข้อ", "`{ ...rows[0], indicators }` รวมข้อมูลหัวข้อกับตัวชี้วัดเป็น object เดียว")],
    db: [["evaluation_topics", "อ่าน 1 แถว"], ["indicators", "อ่านแถวที่ `topic_id` ตรง"]],
    errors: [[404, "ไม่พบหัวข้อการประเมิน"]],
  },
  {
    key: "POST /api/topics", name: "เพิ่มหัวข้อและกำหนดช่วงเปิด-ปิด", owner: 1, mount: "topics", access: "hr", guard: true,
    criteria: "5.1.1, 5.1.2, 6.2", needs: "บัญชี hr", page: "/hr/topics (ปุ่มเพิ่มหัวข้อ)",
    flow: "กดเพิ่ม → Modal → Zod ตรวจวันที่ → POST → INSERT → โหลดรายการใหม่",
    fe: [
      b(FS("topic"), "export const topicSchema", "Zod ของฟอร์ม", "`.refine` ตรวจว่าวันสิ้นสุดต้องไม่ก่อนวันเริ่ม"),
      z(T, '<button className="btn btn-primary" onClick={() => setEditTopic({})}>', "</button>", "ปุ่มเพิ่ม", "`setEditTopic({})` เปิด Modal แบบเพิ่มใหม่"),
      one(T, "{editTopic && <TopicModal", "แสดง Modal", "แสดงเมื่อ `editTopic` มีค่า"),
      b(TM, "const { register, handleSubmit", "ผูกฟอร์มกับ Zod", "`defaultValues` เติมค่าเดิมตอนแก้ไข"),
      b(TM, "const onSubmit", "ส่งข้อมูล", "`item.id` มีค่าใช้ PUT ไม่มีใช้ POST"),
      z(TM, "<form onSubmit", "</form>", "หน้าตาฟอร์ม", "`type=\"date\"` ให้ค่ารูปแบบ `YYYY-MM-DD`"),
      b(T, "const saved = () =>", "หลังบันทึก", "ปิด Modal แล้วโหลดใหม่"),
    ],
    be: [
      b(BS("topic"), "export const topicSchema", "Zod ของ Backend", "ใช้ซ้ำกับ PUT"),
      b(R("topics"), 'router.post("/", requireRole', "route เพิ่มหัวข้อ", "`requireRole(\"hr\")` อยู่รายเส้น เพราะไฟล์นี้บางเส้นให้ทุก role อ่านได้"),
    ],
    db: [["evaluation_topics", "เพิ่ม 1 แถว: `title`, `description`, `start_date`, `end_date`"]],
    errors: [[400, "ไม่กรอกข้อมูล หรือวันสิ้นสุดก่อนวันเริ่ม"]],
  },
  {
    key: "PUT /api/topics/{id}", name: "แก้ไขหัวข้อและช่วงเปิด-ปิด", owner: 1, mount: "topics", access: "hr", guard: true,
    criteria: "5.1.2, 6.3, 7.3", needs: "ต้องมีหัวข้อจาก `POST /api/topics`", page: "/hr/topics (ปุ่มดินสอ)",
    flow: "กดแก้ไข → Modal เติมค่าเดิม → PUT → UPDATE",
    feIntro: "ใช้ Zod และฟอร์มเดียวกับ [`POST /api/topics`](#post-api-topics) ต่างกันแค่ส่วนด้านล่าง",
    fe: [
      one(T, "onClick={() => setEditTopic(t)}", "ปุ่มแก้ไข", "ส่งข้อมูลหัวข้อเข้า Modal"),
      one(TM, "if (item.id) await api.put(`/topics/${item.id}`, data);", "เรียก API", "มี id จึงใช้ PUT"),
    ],
    be: [b(R("topics"), 'router.put("/:id", requireRole', "route แก้ไขหัวข้อ", "ใช้ `topicSchema` เดียวกับ POST")],
    db: [["evaluation_topics", "UPDATE: `title`, `description`, `start_date`, `end_date`"]],
    errors: [[400, "ข้อมูลไม่ถูกต้อง"], [404, "ไม่พบหัวข้อการประเมิน"]],
  },
  {
    key: "DELETE /api/topics/{id}", name: "ลบหัวข้อ", owner: 1, mount: "topics", access: "hr", guard: true,
    criteria: "6.4", needs: "ต้องมีหัวข้อจาก `POST /api/topics`", page: "/hr/topics (ปุ่มถังขยะ)",
    flow: "กดลบ → confirm → DELETE → ตัวชี้วัดและคะแนนถูกลบตาม",
    fe: [
      b(T, "const remove = async", "ฟังก์ชันลบ", "รับ URL เข้ามา จึงใช้ลบได้ทั้งหัวข้อและตัวชี้วัด"),
      one(T, "onClick={() => remove(`/topics/${t.id}`, t.title)}", "ปุ่มลบ", "ส่ง URL ของหัวข้อนั้น"),
    ],
    be: [b(R("topics"), 'router.delete("/:id"', "route ลบหัวข้อ", "`affectedRows` เป็น 0 แปลว่าไม่พบ")],
    db: [["evaluation_topics", "DELETE 1 แถว `indicators` ที่อยู่ในหัวข้อจะถูกลบตาม"]],
    errors: [[404, "ไม่พบหัวข้อการประเมิน"]],
  },

  {
    key: "GET /api/indicators", name: "ตัวชี้วัด กรองตามหัวข้อได้", owner: 1, mount: "indicators", access: "all", guard: true,
    criteria: "6.1", needs: "ทำได้ทันที ถ้ายังไม่มีข้อมูลจะได้ `[]`", page: "/hr/assignments (ใช้นับจำนวนตัวชี้วัด)", section: "ตัวชี้วัด (indicators)",
    flow: "GET (มี ?topic_id หรือไม่ก็ได้) → SELECT → ตอบรายการ",
    fe: [
      one(A, 'api.get("/indicators"', "เรียก API", "หน้ามอบหมายกรรมการต้องรู้จำนวนตัวชี้วัด เพื่อแสดงว่าให้คะแนนแล้วกี่ข้อ"),
      one(A, "setIndicatorCount(i.data.data.length)", "เก็บจำนวน", "ใช้ `.length` ของผลลัพธ์"),
    ],
    be: [b(R("indicators"), 'router.get("/", requireRole', "route รายการตัวชี้วัด", "มี `topic_id` ใน query จะกรองตามหัวข้อ ไม่มีจะคืนทั้งหมด")],
    db: [["indicators", "อ่านทุกคอลัมน์"]],
    errors: [],
  },
  {
    key: "GET /api/indicators/{id}", name: "ตัวชี้วัด 1 รายการ", owner: 1, mount: "indicators", access: "all", guard: true,
    criteria: "6.1", needs: "ต้องมีตัวชี้วัดจาก `POST /api/indicators`", noFe: "หน้าเว็บใช้ข้อมูลจาก `GET /api/topics` แทน เส้นนี้ทดสอบผ่าน Thunder Client",
    flow: "GET พร้อม id → SELECT 1 แถว → ไม่เจอตอบ 404",
    be: [b(R("indicators"), 'router.get("/:id", requireRole', "route อ่าน 1 ตัวชี้วัด", "รูปแบบเดียวกับเส้น GET รายการเดียวอื่นๆ")],
    db: [["indicators", "อ่าน 1 แถว"]],
    errors: [[404, "ไม่พบตัวชี้วัด"]],
  },
  {
    key: "POST /api/indicators", name: "เพิ่มตัวชี้วัด", owner: 1, mount: "indicators", access: "hr", guard: true,
    criteria: "5.1.3, 5.1.4, 6.2", needs: "ต้องมีหัวข้อจาก `POST /api/topics`", page: "/hr/topics (ปุ่มเพิ่มตัวชี้วัด)",
    flow: "กดเพิ่มในหัวข้อ → Modal → Zod → POST → INSERT → โหลดหัวข้อใหม่",
    fe: [
      b(FS("indicator"), "export const indicatorSchema", "Zod ของฟอร์ม", "`z.coerce.number` แปลงค่าจากช่องกรอกที่เป็นข้อความให้เป็นตัวเลข"),
      z(T, "onClick={() => setEditIndicator({ topic_id: t.id })}", "</button>", "ปุ่มเพิ่ม", "ส่ง `topic_id` เข้า Modal เพื่อรู้ว่าอยู่หัวข้อไหน"),
      one(T, "{editIndicator && <IndicatorModal", "แสดง Modal", "แสดงเมื่อ `editIndicator` มีค่า"),
      b(IM, "const { register, handleSubmit", "ผูกฟอร์มกับ Zod", "ค่าเริ่มต้นเป็นสเกล 1-4 และแนบหลักฐานแบบใดก็ได้"),
      one(IM, "const scoreType = useWatch", "ดูค่ารูปแบบคะแนน", "ใช้ตัดสินว่าจะแสดงคำอธิบายระดับ 1-4 หรือไม่ ตามเกณฑ์ 5.1.4"),
      b(IM, "const onSubmit", "ส่งข้อมูล", "`item.id` มีค่าใช้ PUT ไม่มีใช้ POST"),
      z(IM, "<form onSubmit", "</form>", "หน้าตาฟอร์ม", "ตัวเลือกดึงจาก `SCORE_TYPES`, `EVIDENCE_TYPES` ใน `lib/constants.js`"),
    ],
    be: [
      b(BS("indicator"), "export const indicatorSchema", "Zod ของ Backend", "`z.enum` รับเฉพาะค่าที่กำหนด ตรงกับ ENUM ใน DB"),
      b(R("indicators"), 'router.post("/", requireRole', "route เพิ่มตัวชี้วัด", "ถ้า `topic_id` ไม่มีอยู่จริง MySQL จะ error แล้ว `app.js` แปลงเป็น 400"),
    ],
    db: [["indicators", "เพิ่ม 1 แถว: `topic_id`, `name`, `description`, `weight`, `score_type`, `evidence_type`, `evidence_note`"]],
    errors: [[400, "ข้อมูลไม่ถูกต้อง หรือไม่พบหัวข้อที่อ้างอิง"]],
  },
  {
    key: "PUT /api/indicators/{id}", name: "แก้ไขตัวชี้วัด", owner: 1, mount: "indicators", access: "hr", guard: true,
    criteria: "5.1.3, 5.1.4, 6.3", needs: "ต้องมีตัวชี้วัดจาก `POST /api/indicators`", page: "/hr/topics (ปุ่มดินสอในแถวตัวชี้วัด)",
    flow: "กดแก้ไข → Modal → PUT → ตรวจว่าเปลี่ยนรูปแบบคะแนนได้ไหม → UPDATE",
    feIntro: "ใช้ Zod และฟอร์มเดียวกับ [`POST /api/indicators`](#post-api-indicators) ต่างกันแค่ส่วนด้านล่าง",
    fe: [
      one(T, "onClick={() => setEditIndicator(i)}", "ปุ่มแก้ไข", "ส่งข้อมูลตัวชี้วัดเข้า Modal"),
      one(IM, "if (item.id) await api.put(`/indicators/${item.id}`, data);", "เรียก API", "มี id จึงใช้ PUT"),
    ],
    be: [b(R("indicators"), 'router.put("/:id", requireRole', "route แก้ไขตัวชี้วัด", "ต่างจาก PUT อื่นตรงที่เช็กก่อนว่ามีคะแนนแล้วหรือยัง ถ้ามีแล้วเปลี่ยน `score_type` ไม่ได้ เพราะคะแนนเดิมจะผิดความหมาย")],
    db: [["indicators", "อ่าน `score_type` แล้ว UPDATE ทุกคอลัมน์ที่แก้ได้"], ["self_evaluations", "นับแถวที่มีคะแนน"], ["committee_scores", "นับแถวที่มีคะแนน"]],
    errors: [[400, "ข้อมูลไม่ถูกต้อง หรือเปลี่ยนรูปแบบคะแนนหลังให้คะแนนแล้ว"], [404, "ไม่พบตัวชี้วัด"]],
  },
  {
    key: "DELETE /api/indicators/{id}", name: "ลบตัวชี้วัด", owner: 1, mount: "indicators", access: "hr", guard: true,
    criteria: "6.4", needs: "ต้องมีตัวชี้วัดจาก `POST /api/indicators`", page: "/hr/topics (ปุ่มถังขยะในแถวตัวชี้วัด)",
    flow: "กดลบ → confirm → DELETE → คะแนนของตัวชี้วัดนี้ถูกลบตาม",
    feIntro: "ใช้ฟังก์ชัน `remove` ตัวเดียวกับ [`DELETE /api/topics/{id}`](#delete-api-topics-id)",
    fe: [one(T, "onClick={() => remove(`/indicators/${i.id}`, i.name)}", "ปุ่มลบ", "ส่ง URL ของตัวชี้วัดนั้น")],
    be: [b(R("indicators"), 'router.delete("/:id"', "route ลบตัวชี้วัด", "`affectedRows` เป็น 0 แปลว่าไม่พบ")],
    db: [["indicators", "DELETE 1 แถว คะแนนที่อ้างถึงถูกลบตาม"]],
    errors: [[404, "ไม่พบตัวชี้วัด"]],
  },

  {
    key: "GET /api/assignments", name: "รายการมอบหมายกรรมการและสถานะ", owner: 1, mount: "assignments", access: "hr", guard: true,
    criteria: "5.1.11", needs: "ทำได้ทันที ถ้ายังไม่มีข้อมูลจะได้ `[]`", page: "/hr/assignments", section: "มอบหมายกรรมการ (assignments)",
    flow: "เปิดหน้า → โหลดผู้ใช้/การมอบหมาย/ตัวชี้วัดพร้อมกัน → จัดกลุ่มตามผู้รับการประเมิน → แสดงสถานะ",
    fe: [
      b(A, "const load = () =>", "โหลด 4 อย่างพร้อมกัน", "`Promise.all` รอให้ครบทุก request แล้วเก็บค่าลง state"),
      z(A, "{mine.map((a) => (", "{mine.length === 0", "แสดงกรรมการของแต่ละคน", "`StatusBadge` แสดงสถานะ และ `scored_count` บอกจำนวนข้อที่ให้คะแนนแล้ว"),
    ],
    be: [b(R("assignments"), 'router.get("/", async', "route รายการมอบหมาย", "JOIN ตาราง `users` 2 ครั้ง ครั้งหนึ่งเอาชื่อกรรมการ อีกครั้งเอาชื่อผู้รับการประเมิน")],
    db: [["assignments", "อ่าน `id`, `committee_id`, `evaluatee_id`, `committee_role`, `status`, `confirmed_at`"], ["users", "อ่าน `full_name` ของกรรมการและผู้รับการประเมิน"], ["committee_scores", "นับจำนวนคะแนนที่ให้แล้ว"]],
    errors: [],
  },
  {
    key: "POST /api/assignments", name: "มอบหมายกรรมการ", owner: 1, mount: "assignments", access: "hr", guard: true,
    criteria: "5.1.8, 5.1.9, 6.2", needs: "ต้องมีกรรมการจาก `POST /api/users` และผู้รับการประเมิน", page: "/hr/assignments (แถวเพิ่มกรรมการ)",
    flow: "เลือกกรรมการและบทบาท → POST → ตรวจ role และประธานซ้ำ → INSERT → โหลดใหม่",
    fe: [
      b(A, "const run = async", "ตัวช่วยเรียก API", "เรียก API แล้วโหลดใหม่ ใช้ซ้ำกับ PUT และ DELETE ในหน้านี้"),
      b(A, "const add = (evaluateeId)", "ส่งข้อมูล", "แยกค่าฟอร์มตาม `evaluateeId` เพราะหน้านี้มีหลายฟอร์มพร้อมกัน"),
      b(A, "const setField =", "เก็บค่าที่เลือก", "อัปเดตเฉพาะฟอร์มของคนนั้น"),
      z(A, "{available.length > 0 && (", "<Plus size={16} /> เพิ่ม", "ส่วนเลือกกรรมการ", "`available` แสดงเฉพาะกรรมการที่ยังไม่ถูกมอบหมายให้คนนี้"),
    ],
    be: [
      b(BS("assignment"), "export const assignmentSchema", "Zod ของ Backend", "ใช้ `idField` รับได้ทั้งตัวเลขและข้อความตัวเลข"),
      b(R("assignments"), "async function hasOtherChair", "เช็กประธานซ้ำ", "ผู้รับการประเมิน 1 คนมีประธานได้คนเดียว ใช้ร่วมกับ PUT"),
      b(R("assignments"), 'router.post("/", validate', "route มอบหมาย", "ตรวจว่า id ที่ส่งมาเป็น role ที่ถูกต้องจริง ก่อน INSERT"),
    ],
    db: [["users", "อ่าน `id`, `role` เพื่อตรวจบทบาท"], ["assignments", "เพิ่ม 1 แถว: `committee_id`, `evaluatee_id`, `committee_role` สถานะเริ่มต้น pending"]],
    errors: [[400, "id ไม่ตรงบทบาท / มีประธานแล้ว / มอบหมายซ้ำ"]],
  },
  {
    key: "PUT /api/assignments/{id}", name: "เปลี่ยนบทบาทกรรมการ", owner: 1, mount: "assignments", access: "hr", guard: true,
    criteria: "5.1.9, 6.3", needs: "ต้องมีการมอบหมายจาก `POST /api/assignments`", page: "/hr/assignments (ช่องเลือกบทบาท)",
    flow: "เปลี่ยนตัวเลือก → PUT → ตรวจประธานซ้ำ → UPDATE → โหลดใหม่",
    fe: [z(A, "value={a.committee_role}", "onChange={(ev) => run(api.put(`/assignments/${a.id}`, { committee_role: ev.target.value }))}", "ช่องเลือกบทบาท", "เปลี่ยนค่าแล้วบันทึกทันที โดยใช้ `run` ตัวเดียวกับ POST")],
    be: [
      b(BS("assignment"), "export const assignmentRoleSchema", "Zod ของ Backend", "รับแค่ `committee_role`"),
      b(R("assignments"), 'router.put("/:id", validate', "route เปลี่ยนบทบาท", "`rows[0].id` ถูกส่งเข้า `hasOtherChair` เพื่อไม่นับแถวตัวเอง"),
    ],
    db: [["assignments", "อ่าน 1 แถว แล้ว UPDATE `committee_role`"]],
    errors: [[400, "บทบาทไม่ถูกต้อง หรือมีประธานแล้ว"], [404, "ไม่พบการมอบหมาย"]],
  },
  {
    key: "DELETE /api/assignments/{id}", name: "ยกเลิกการมอบหมาย", owner: 1, mount: "assignments", access: "hr", guard: true,
    criteria: "6.4", needs: "ต้องมีการมอบหมายจาก `POST /api/assignments`", page: "/hr/assignments (ปุ่มถังขยะ)",
    flow: "กดลบ → confirm → DELETE → คะแนนของกรรมการคนนี้ถูกลบตาม",
    fe: [one(A, "onClick={() => confirm(`ยกเลิก", "ปุ่มยกเลิก", "ใช้ `run` ตัวเดียวกับ POST")],
    be: [b(R("assignments"), 'router.delete("/:id"', "route ยกเลิก", "`committee_scores` ถูกลบตามด้วย ON DELETE CASCADE")],
    db: [["assignments", "DELETE 1 แถว"]],
    errors: [[404, "ไม่พบการมอบหมาย"]],
  },
];
