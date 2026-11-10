// กดหน้าเว็บจริงตามคู่มือบท 07-11 (Edge headless + Chrome DevTools Protocol)
// ต้องรัน replay.mjs (KEEP_UPLOADS=1) บน DB ว่างก่อน เพื่อให้ข้อมูลตรงกับตอนจบบท 06
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SP = path.join(import.meta.dirname, ".out");
fs.mkdirSync(SP, { recursive: true });
const ROOT = import.meta.dirname.replace(/[\\/]docs[\\/]tools$/, "");
// APP_ROOT = ทดสอบโปรเจกต์อื่น (เช่น โปรเจกต์ที่นักเรียนสร้างตามแผนที่ API) แทนโค้ดเฉลย
const APP = process.env.APP_ROOT || ROOT;
const DOCKER = !!process.env.DOCKER;
const WEB = DOCKER ? "http://localhost:3000" : "http://127.0.0.1:13000", API = DOCKER ? "http://localhost:5000/api" : "http://127.0.0.1:15000/api";
const DL = path.join(SP, "dl");
fs.rmSync(DL, { recursive: true, force: true });
fs.mkdirSync(DL);
const env = { ...process.env, PORT: "15000", DB_HOST: "127.0.0.1", DB_PORT: "13306", DB_USER: "root", DB_PASSWORD: "testpw", DB_NAME: "eva_test", DB_CONTAINER: "eva_api_test", JWT_SECRET: "replay_secret", JWT_EXPIRES_IN: "8h", API_URL: "http://127.0.0.1:15000" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const compose = (...a) => execFileSync("docker", ["compose", ...a], { cwd: APP, stdio: "ignore" });
const startBackend = () => DOCKER ? (compose("start", "backend"), { kill: () => compose("stop", "backend") }) : spawn("node", ["server.js"], { cwd: APP + "/backend", env, stdio: "ignore" });
let backend = DOCKER ? { kill: () => compose("stop", "backend") } : startBackend();
const web = DOCKER ? null : spawn("cmd.exe", ["/c", "npx next dev -p 13000"], { cwd: APP + "/frontend", env, stdio: "ignore" });
const edge = spawn((process.env.EDGE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"), ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=9336", `--user-data-dir=${path.join(SP, "edge-profile4")}`, "about:blank"], { stdio: "ignore" });

// ---------- ผลการตรวจ ----------
const results = [];
let chapter = "";
const check = (name, ok, got = "") => { results.push({ chapter, name, ok }); console.log(`${ok ? "PASS" : "FAIL"}  [${chapter}] ${name}${!ok || got !== "" ? "  -> " + (typeof got === "string" ? got : JSON.stringify(got)) : ""}`); };
const obs = (name, value) => console.log(`OBS   [${chapter}] ${name}: ${typeof value === "string" ? value : JSON.stringify(value)}`);

// ---------- CDP ----------
const dialogs = [], consoleErrors = [], requests = [];
let ws, id = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || r.exceptionDetails.text) + " :: " + expression.slice(0, 200));
  return r.result.value;
};
const waitFor = async (expression, ms = 15000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { try { if (await ev(expression)) return true; } catch {} await sleep(120); }
  return false;
};
const J = JSON.stringify;
const text = () => ev("document.body.innerText");
const has = (s, ms = 8000) => waitFor(`document.body.innerText.includes(${J(s)})`, ms);
const path_ = () => ev("location.pathname");
// รอจน React hydrate (มี __reactFiber บน element)
const hydrated = (sel) => `(() => { const e = document.querySelector(${J(sel)}); return !!e && Object.keys(e).some((k) => k.startsWith("__reactFiber")); })()`;
const open = async (url, sel = "main") => { await send("Page.navigate", { url: WEB + url }); await waitFor(`location.href.startsWith(${J(WEB)})`); return waitFor(hydrated(sel), 40000); };

// หา element: ปุ่ม/ลิงก์ที่มีข้อความ (ภายใน scope)
const byText = (t, scope = "document", tags = "button,a,[role=tab],label") => `[...(${scope}).querySelectorAll(${J(tags)})].find((e) => e.offsetParent !== null && e.innerText.trim().includes(${J(t)}))`;
const byTitle = (t, scope = "document") => `[...(${scope}).querySelectorAll(${J(`[title="${t}"]`)})].find((e) => e.offsetParent !== null)`;
const card = (t, sel = ".card") => `[...document.querySelectorAll(${J(sel)})].find((c) => c.innerText.includes(${J(t)}))`;
const clickEl = async (expr) => {
  const b = await ev(`(() => { const e = ${expr}; if (!e) throw new Error("ไม่พบ element"); e.scrollIntoView({ block: "center" }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: b.x, y: b.y, button: type === "mouseMoved" ? "none" : "left", clickCount: type === "mouseMoved" ? 0 : 1 });
  await sleep(150);
};
// พิมพ์จริงด้วยคีย์บอร์ด (แทนข้อความเดิมทั้งหมด)
const type = async (expr, t) => {
  await ev(`(() => { const e = ${expr}; e.scrollIntoView({ block: "center" }); e.focus(); e.select(); return 1; })()`);
  if (t === "") await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 });
  else await send("Input.insertText", { text: t });
};
const MO = "document.querySelector('.modal-open')";
const input = (name, scope = "document") => `(${scope}).querySelector('[name="${name}"]')`;
// ช่องวันที่/select: ตั้งค่าแล้วส่ง event แบบที่ React ฟัง
const setVal = (expr, v) => ev(`(() => { const e = ${expr}; const P = e instanceof HTMLSelectElement ? HTMLSelectElement : e instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement; Object.getOwnPropertyDescriptor(P.prototype, "value").set.call(e, ${J(v)}); e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); return e.value; })()`);
const setFile = async (expr, file) => {
  const r = await send("Runtime.evaluate", { expression: expr });
  await send("DOM.setFileInputFiles", { objectId: r.result.objectId, files: [file] });
  await sleep(200);
};
const size = (width, height, mobile) => send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
const media = (m) => send("Emulation.setEmulatedMedia", { media: m });
const visible = (expr) => ev(`(() => { const e = ${expr}; return !!e && getComputedStyle(e).display !== "none" && e.getClientRects().length > 0; })()`);
const dialogCount = () => dialogs.length;
const lastDialogs = (from) => dialogs.slice(from).join(" | ");
const newDownload = async (before, ms = 10000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const f = fs.readdirSync(DL).filter((x) => !before.includes(x) && !x.endsWith(".crdownload") && !x.endsWith(".tmp"));
    if (f.length) { await sleep(300); return f[0]; }
    await sleep(200);
  }
  return null;
};
const pdf = async (name) => { const { data } = await send("Page.printToPDF", { printBackground: true }); fs.writeFileSync(path.join(SP, name), Buffer.from(data, "base64")); return Buffer.from(data, "base64").length; };

// ---------- API ตรง (ใช้แทน Thunder Client ตามคู่มือ) ----------
async function call(method, url, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(API + url, { method, headers, body: body ? J(body) : undefined });
  return { code: res.status, ...(await res.json()) };
}
const apiLogin = async (u, p = "123456") => (await call("POST", "/auth/login", { body: { username: u, password: p } })).data.token;
const SQL_C = process.env.SQL_CONTAINER || "eva_api_test";
// รูปแบบเดียวกับคำสั่งในคู่มือ: echo "SQL" | docker exec -i <กล่อง> sh -c 'mysql ... -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE'
const sql = (q) => execFileSync("docker", ["exec", "-i", SQL_C, "sh", "-c", "mysql --default-character-set=utf8mb4 -N -uroot -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE"], { input: q, stdio: ["pipe", "pipe", "ignore"] }).toString().trim();

// login ผ่านหน้าเว็บ
async function login(u, p = "123456") {
  await open("/login", "form");
  await ev("localStorage.clear(); 1");
  await open("/login", "form");
  await type(input("username"), u);
  await type(input("password"), p);
  await clickEl(`document.querySelector('form button.btn-primary')`);
  return waitFor(`location.pathname !== "/login" && !!localStorage.getItem("token") && !!document.querySelector("nav")`, 15000);
}
const dashText = async () => ev(`document.querySelector("main").innerText`);

const PDF = path.join(SP, "plan.pdf");
fs.writeFileSync(PDF, "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const PNG = path.join(SP, "cert.png");
fs.writeFileSync(PNG, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64"));
const TXT = path.join(SP, "note.txt");
fs.writeFileSync(TXT, "hello");

try {
  for (let i = 0; i < 200; i++) { try { if ((await fetch(API + "/health")).ok && (await fetch(WEB + "/login")).ok) break; } catch {} await sleep(500); }
  let target;
  for (let i = 0; i < 60; i++) { try { target = await (await fetch("http://127.0.0.1:9336/json/new?about:blank", { method: "PUT" })).json(); break; } catch { await sleep(300); } }
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); return; }
    if (d.method === "Page.javascriptDialogOpening") { dialogs.push(d.params.message); send("Page.handleJavaScriptDialog", { accept: true }); }
    if (d.method === "Runtime.exceptionThrown") consoleErrors.push(`${chapter}: ` + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
    if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") consoleErrors.push(`${chapter}: ` + d.params.args.map((a) => a.value ?? a.description).join(" "));
    if (d.method === "Network.requestWillBeSent" && d.params.request.url.includes("/api/")) requests.push(`${d.params.request.method} ${new URL(d.params.request.url).pathname}`);
  };
  for (const d of ["Page", "Runtime", "Network", "DOM"]) await send(`${d}.enable`);
  await send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: DL });
  await size(1280, 900, false);
  const hrToken = await apiLogin("hr1");

  // ================= บท 07 =================
  chapter = "7.9.3";
  await open("/login", "form");
  await type(input("username"), "hr1");
  await type(input("password"), "999999");
  await clickEl(`document.querySelector('form button.btn-primary')`);
  check("รหัสผิด กล่องแดง", await waitFor(`document.querySelector(".alert-error")?.innerText === "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"`), await ev(`document.querySelector(".alert-error")?.innerText`));
  check("รหัสผิด ไม่ถูก logout วน", (await path_()) === "/login");
  check("hr1 / 123456 ไปหน้า /hr", await login("hr1"), await path_());
  check("Local Storage มี token และ user", await ev(`!!localStorage.getItem("token") && JSON.parse(localStorage.getItem("user")).username === "hr1"`));

  chapter = "7.10";
  await open("/");
  check("เปิด / ตอน login อยู่ ไปที่ /hr", await waitFor(`location.pathname === "/hr"`), await path_());
  await ev(`localStorage.removeItem("token"); localStorage.removeItem("user"); 1`);
  await open("/");
  check("ลบ token แล้วเปิด / ไปที่ /login", await waitFor(`location.pathname === "/login"`), await path_());

  chapter = "7.13";
  const t7 = await call("POST", "/users", { token: hrToken, body: { username: "teach7", full_name: "ครูทดสอบ", role: "evaluatee" } });
  check("POST /api/users ได้ temp_password", t7.code === 201 && !!t7.data.temp_password, t7.code);
  check("login teach7 ถูกพามาหน้าเปลี่ยนรหัส", await login("teach7", t7.data.temp_password) && (await waitFor(`location.pathname === "/change-password"`)), await path_());
  check("กล่องเหลือง + แถบเมนู", (await has("กรุณาเปลี่ยนรหัสผ่านก่อนเริ่มใช้งานครั้งแรก")) && (await visible(`document.querySelector("nav")`)));
  await open("/evaluatee");
  check("พิมพ์ URL /evaluatee เอง ถูกพากลับ", await waitFor(`location.pathname === "/change-password"`), await path_());
  await waitFor(hydrated("form"));
  await type(input("old_password"), t7.data.temp_password);
  await type(input("new_password"), "654321");
  await type(input("confirm_password"), "000000");
  await clickEl(`document.querySelector('form button.btn-primary')`);
  check("ยืนยันไม่ตรง ใต้ช่อง", await has("ยืนยันรหัสผ่านไม่ตรงกัน"));
  await type(input("old_password"), "wrongpw");
  await type(input("confirm_password"), "654321");
  await clickEl(`document.querySelector('form button.btn-primary')`);
  check("รหัสเดิมผิด กล่องแดงจาก backend", await waitFor(`document.querySelector(".alert-error")?.innerText === "รหัสผ่านเดิมไม่ถูกต้อง"`), await ev(`document.querySelector(".alert-error")?.innerText`));
  await size(375, 780, true);
  await sleep(300);
  check("จอมือถือ มีปุ่ม ☰ และซ่อนเมนูแนวนอน", (await visible(`document.querySelector("nav .dropdown [role=button]")`)) && !(await visible(`document.querySelector("nav .menu-horizontal")`)));
  await size(1280, 900, false);
  await type(input("old_password"), t7.data.temp_password);
  let d0 = dialogCount();
  await clickEl(`document.querySelector('form button.btn-primary')`);
  check("เปลี่ยนรหัสสำเร็จ ไป /evaluatee", await waitFor(`location.pathname === "/evaluatee"`), await path_() + " " + lastDialogs(d0));
  await open("/evaluatee");
  await sleep(800);
  check("เปิดใหม่ไม่ถูกบังคับอีก", (await path_()) === "/evaluatee");
  check("ลบ teach7", (await call("DELETE", `/users/${t7.data.id}`, { token: hrToken })).code === 200);

  chapter = "7.14.3";
  await login("hr1");
  await clickEl(byTitle("ข้อมูลส่วนตัว"));
  check("กดไอคอนรูปคน ไป /profile", await waitFor(`location.pathname === "/profile" && !!document.querySelector('[name="full_name"]')`));
  await waitFor(`document.querySelector('[name="full_name"]').value !== ""`);
  check("ช่องกรอกมีข้อมูลเดิม", (await ev(`document.querySelector('[name="full_name"]').value`)) === "สมศรี ใจดี", await ev(`document.querySelector('[name="full_name"]').value`));
  let r0 = requests.length;
  await type(input("phone"), "123");
  await clickEl(`document.querySelector('form button.btn-primary')`);
  check("เบอร์ 123 ขึ้น error ใต้ช่อง", await has("เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก"));
  check("ไม่ยิง API", !requests.slice(r0).some((r) => r.startsWith("PUT")), requests.slice(r0));
  await type(input("phone"), "");
  await type(input("full_name"), "สมศรี ใจดีมาก");
  await clickEl(`document.querySelector('form button.btn-primary')`);
  check("แก้ชื่อแล้วบันทึก กล่องเขียว", await waitFor(`document.querySelector(".alert-success")?.innerText === "บันทึกข้อมูลส่วนตัวสำเร็จ"`), await ev(`document.querySelector(".alert-success")?.innerText`));
  obs("ชื่อใน DB หลังแก้", sql("select full_name from users where username='hr1'"));
  await type(input("full_name"), "สมศรี ใจดี");
  await clickEl(`document.querySelector('form button.btn-primary')`);
  await sleep(800);
  check("แก้ชื่อกลับเป็น สมศรี ใจดี", sql("select full_name from users where username='hr1'") === "สมศรี ใจดี");

  chapter = "7.14.4";
  const errBefore = consoleErrors.length;
  backend.kill();
  await sleep(1000);
  await open("/profile");
  check("backend ล่ม: แถบเมนู + กล่องแดง", (await waitFor(`document.querySelector(".alert-error")?.innerText === "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้"`)) && (await visible(`document.querySelector("nav")`)), await ev(`document.querySelector("main")?.innerText`));
  await sleep(500);
  const uncaught = consoleErrors.slice(errBefore).filter((e) => /Uncaught|unhandled/i.test(e));
  check("Console ไม่มี Uncaught (in promise)", uncaught.length === 0, uncaught);
  obs("console error ตอน backend ล่ม", consoleErrors.slice(errBefore));
  backend = startBackend();
  for (let i = 0; i < 40; i++) { try { if ((await fetch(API + "/health")).ok) break; } catch {} await sleep(250); }

  chapter = "7.15";
  await ev("localStorage.clear(); 1");
  await open("/login", "form");
  await clickEl(byText("สมัครสมาชิก", "document", "a"));
  check("ลิงก์ไปหน้าสมัคร", await waitFor(`location.pathname === "/register"`));
  await waitFor(hydrated("form"));
  await clickEl(`document.querySelector('form button.btn-primary')`);
  check("กดสมัครโดยไม่กรอก error 3 ช่อง", (await has("ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร")) && (await has("กรุณากรอกชื่อ-สกุล")) && (await has("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")));
  await type(input("username"), "teach8");
  await type(input("full_name"), "ครูทดสอบสมัคร");
  await type(input("password"), "123456");
  await type(input("confirm_password"), "000000");
  await clickEl(`document.querySelector('form button.btn-primary')`);
  check("รหัสยืนยันไม่ตรง", await has("ยืนยันรหัสผ่านไม่ตรงกัน"));
  await type(input("confirm_password"), "123456");
  d0 = dialogCount();
  await clickEl(`document.querySelector('form button.btn-primary')`);
  check("สมัคร teach8 สำเร็จ alert แล้วกลับหน้า login", await waitFor(`location.pathname === "/login"`), lastDialogs(d0));
  check("login teach8 ไป /evaluatee", (await login("teach8")) && (await waitFor(`location.pathname === "/evaluatee"`)), await path_());
  await ev("localStorage.clear(); 1");
  await open("/register", "form");
  await type(input("username"), "teach8");
  await type(input("full_name"), "ซ้ำ");
  await type(input("password"), "123456");
  await type(input("confirm_password"), "123456");
  await clickEl(`document.querySelector('form button.btn-primary')`);
  check("สมัครซ้ำ กล่องแดง", await waitFor(`document.querySelector(".alert-error")?.innerText === "ข้อมูลซ้ำกับที่มีอยู่แล้ว"`));
  const t8 = sql("select id from users where username='teach8'");
  check("ลบ teach8", (await call("DELETE", `/users/${t8}`, { token: hrToken })).code === 200);

  // ================= บท 08 =================
  chapter = "8.3.5";
  await login("hr1");
  await open("/hr/topics");
  await waitFor(`document.querySelectorAll("main .card").length >= 2`);
  check("เห็น 2 การ์ด ป้าย เปิดอยู่", (await ev(`[...document.querySelectorAll("main .card")].filter((c) => c.innerText.includes("เปิดอยู่")).length`)) === 2, await ev(`document.querySelectorAll("main .card").length`));
  await clickEl(byText("เพิ่มหัวข้อ"));
  await waitFor(`!!document.querySelector(".modal-open form")`);
  await clickEl(`document.querySelector(".modal-open button.btn-primary")`);
  check("ไม่กรอก กดบันทึก error ใต้ช่อง", await waitFor(`document.querySelectorAll(".modal-open .text-error").length > 0`), await ev(`[...document.querySelectorAll(".modal-open .text-error")].map((e) => e.innerText).join(" / ")`));
  obs("error ตอนไม่กรอก", await ev(`[...document.querySelectorAll(".modal-open .text-error")].map((e) => e.innerText).join(" / ")`));
  await type(input("title", MO), "หัวข้อทดสอบหน้าเว็บ");
  await setVal(input("start_date", "document.querySelector('.modal-open')"), "2026-12-10");
  await setVal(input("end_date", "document.querySelector('.modal-open')"), "2026-12-01");
  await clickEl(`document.querySelector(".modal-open button.btn-primary")`);
  check("วันสิ้นสุดก่อนวันเริ่ม", await has("วันสิ้นสุดต้องไม่ก่อนวันเริ่ม"));
  await setVal(input("end_date", "document.querySelector('.modal-open')"), "2026-12-31");
  await clickEl(`document.querySelector(".modal-open button.btn-primary")`);
  check("เพิ่ม การ์ดใหม่โผล่", await waitFor(`!document.querySelector(".modal-open") && document.querySelectorAll("main .card").length === 3`));
  await clickEl(`${card("หัวข้อทดสอบหน้าเว็บ", "main .card")}.querySelector('[title="แก้ไขหัวข้อ"]')`);
  check("แก้ ข้อมูลเดิมอยู่ในฟอร์ม", await waitFor(`document.querySelector('.modal-open [name="title"]')?.value === "หัวข้อทดสอบหน้าเว็บ" && document.querySelector('.modal-open [name="start_date"]').value === "2026-12-10"`), await ev(`document.querySelector('.modal-open [name="start_date"]')?.value`));
  await clickEl(byText("ยกเลิก", "document.querySelector('.modal-open')"));
  d0 = dialogCount();
  await clickEl(`${card("หัวข้อทดสอบหน้าเว็บ", "main .card")}.querySelector('[title="ลบหัวข้อ"]')`);
  check("ลบ ถามก่อน แล้วหาย", (await waitFor(`document.querySelectorAll("main .card").length === 2`)) && lastDialogs(d0).startsWith('ลบ "หัวข้อทดสอบหน้าเว็บ"'), lastDialogs(d0));

  chapter = "8.3.9";
  const topic1 = card("ด้านการจัดการเรียนการสอน", "main .card");
  await clickEl(byText("เพิ่มตัวชี้วัด", topic1));
  await waitFor(`!!document.querySelector(".modal-open form")`);
  check("modal เลือก สเกล 1-4 และเห็นคำอธิบาย 4 ระดับ", (await ev(`document.querySelector('.modal-open [name="score_type"]').value`)) === "scale_4" && (await ev(`document.querySelectorAll(".modal-open ul li").length`)) === 4);
  await setVal(input("score_type", "document.querySelector('.modal-open')"), "yes_no");
  check("เปลี่ยนเป็น มี/ไม่มี คำอธิบายหาย", await waitFor(`document.querySelectorAll(".modal-open ul li").length === 0`));
  await type(input("name", MO), "ตัวชี้วัดทดสอบหน้าเว็บ");
  await type(input("weight", MO), "0");
  await clickEl(`document.querySelector(".modal-open button.btn-primary")`);
  check("น้ำหนัก 0", await has("น้ำหนักต้องมากกว่า 0"));
  const sumBefore = await ev(`${topic1}.querySelector("tfoot").innerText`);
  await type(input("weight", MO), "5");
  await clickEl(`document.querySelector(".modal-open button.btn-primary")`);
  await waitFor(`!document.querySelector(".modal-open")`);
  const sumAfter = await ev(`${topic1}.querySelector("tfoot").innerText`);
  check("บันทึก แถวใหม่ น้ำหนักรวมเพิ่ม", (await ev(`${topic1}.innerText.includes("ตัวชี้วัดทดสอบหน้าเว็บ")`)) && sumBefore !== sumAfter, `${sumBefore} -> ${sumAfter}`);
  // ตรวจว่าถ้าไม่ลบ ตัวเลขบทต่อไปจะเปลี่ยน
  obs("progress ของ teach1 ตอนมีตัวชี้วัดเกิน", (await call("GET", "/self-evaluations", { token: await apiLogin("teach1") })).data.summary);
  d0 = dialogCount();
  await clickEl(`[...${topic1}.querySelectorAll("tbody tr")].find((r) => r.innerText.includes("ตัวชี้วัดทดสอบหน้าเว็บ")).querySelector('[title="ลบตัวชี้วัด"]')`);
  check("ลบตัวชี้วัดทดสอบทิ้ง", await waitFor(`!${topic1}.innerText.includes("ตัวชี้วัดทดสอบหน้าเว็บ")`), lastDialogs(d0));
  await clickEl(`[...${topic1}.querySelectorAll("tbody tr")].find((r) => r.innerText.includes("การจัดทำแผนการจัดการเรียนรู้")).querySelector('[title="แก้ไขตัวชี้วัด"]')`);
  await waitFor(`!!document.querySelector(".modal-open form")`);
  await setVal(input("score_type", "document.querySelector('.modal-open')"), "yes_no");
  await clickEl(`document.querySelector(".modal-open button.btn-primary")`);
  check("แก้ตัวที่ 1 เป็น มี/ไม่มี กล่องแดงใน modal", await waitFor(`document.querySelector(".modal-open .alert-error")?.innerText.startsWith("ตัวชี้วัดนี้มีการให้คะแนนแล้ว")`), await ev(`document.querySelector(".modal-open .alert-error")?.innerText`));
  await clickEl(byText("ยกเลิก", "document.querySelector('.modal-open')"));
  check("ยังมีตัวชี้วัด 6 ตัว", sql("select count(*) from indicators") === "6");

  chapter = "8.4.6";
  await open("/hr/users");
  const rows = () => ev(`[...document.querySelectorAll("main tbody tr")].map((r) => r.cells[0].innerText)`);
  await waitFor(`document.querySelectorAll("main tbody tr").length > 0`);
  obs("แท็บทั้งหมด", await rows());
  await clickEl(byText("ผู้รับการประเมิน", "document.querySelector('[role=tablist]')", "[role=tab]"));
  await sleep(600);
  const evRows = await rows();
  await clickEl(byText("กรรมการ", "document.querySelector('[role=tablist]')", "[role=tab]"));
  await sleep(600);
  const cmRows = await rows();
  check("สลับแท็บ รายการเปลี่ยน", J(evRows) === J(["teach1", "teach2"]) && J(cmRows) === J(["comm1", "comm2", "comm3"]), { evRows, cmRows });
  await clickEl(byText("ทั้งหมด", "document.querySelector('[role=tablist]')", "[role=tab]"));
  await sleep(500);
  await type(`document.querySelector('input[placeholder="ค้นหาชื่อ"]')`, "สมชาย");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  check("ค้นหา สมชาย + Enter เหลือ 1 คน", await waitFor(`document.querySelectorAll("main tbody tr").length === 1`), await rows());
  await type(`document.querySelector('input[placeholder="ค้นหาชื่อ"]')`, "");
  await clickEl(byText("ค้นหา", "document.querySelector('main form')", "button"));
  await waitFor(`document.querySelectorAll("main tbody tr").length === 6`);
  await clickEl(byText("เพิ่มผู้ใช้"));
  await waitFor(`!!document.querySelector(".modal-open form")`);
  await type(input("username", MO), "teach11");
  await type(input("full_name", MO), "ครูเพิ่มจากหน้าเว็บ");
  d0 = dialogCount();
  await clickEl(`document.querySelector(".modal-open button.btn-primary")`);
  check("เพิ่มผู้ใช้ alert รหัสชั่วคราว", await waitFor(`!document.querySelector(".modal-open")`) && lastDialogs(d0).includes("รหัสผ่านชั่วคราวของ teach11 คือ"), lastDialogs(d0));
  await clickEl(byText("เพิ่มผู้ใช้"));
  await waitFor(`!!document.querySelector(".modal-open form")`);
  await type(input("username", MO), "teach11");
  await type(input("full_name", MO), "ซ้ำ");
  await clickEl(`document.querySelector(".modal-open button.btn-primary")`);
  check("username ซ้ำ กล่องแดง", await waitFor(`document.querySelector(".modal-open .alert-error")?.innerText === "ข้อมูลซ้ำกับที่มีอยู่แล้ว"`));
  await clickEl(byText("ยกเลิก", "document.querySelector('.modal-open')"));
  const row11 = `[...document.querySelectorAll("main tbody tr")].find((r) => r.cells[0].innerText === "teach11")`;
  await sql("UPDATE users SET must_change_password = FALSE WHERE username='teach11'");
  await open("/hr/users");
  await waitFor(`!!${row11}`);
  d0 = dialogCount();
  await clickEl(`${row11}.querySelector('[title="รีเซ็ตรหัสผ่าน"]')`);
  check("รีเซ็ตรหัส ป้าย รอเปลี่ยน", await waitFor(`${row11}.innerText.includes("รอเปลี่ยน")`), lastDialogs(d0));
  await clickEl(`${row11}.querySelector('[title="ลบ"]')`);
  check("ลบผู้ใช้ที่เพิ่ม", await waitFor(`!${row11}`));
  check("แถวของ hr ไม่มีปุ่ม", (await ev(`[...document.querySelectorAll("main tbody tr")].find((r) => r.cells[0].innerText === "hr1").querySelectorAll("button").length`)) === 0);

  chapter = "8.4.7";
  let before = fs.readdirSync(DL);
  await clickEl(byText("ไฟล์ตัวอย่าง", "document", "a"));
  const tpl = await newDownload(before);
  check("ไฟล์ตัวอย่าง ได้ users-template.csv", tpl === "users-template.csv", tpl);
  await setFile(`document.querySelector('input[type=file][accept=".csv"]')`, path.join(DL, tpl || "x"));
  d0 = dialogCount();
  await clickEl(byText("นำเข้า", "document", "button"));
  await waitFor(`${dialogCount() > d0}` === "true" ? "true" : "true", 100);
  await sleep(1500);
  const imp = lastDialogs(d0);
  check("นำเข้า alert สำเร็จ 2 คน", imp.startsWith("นำเข้าผู้ใช้สำเร็จ 2 คน"), imp);
  check("ตารางมี teach10, comm10", await waitFor(`["teach10", "comm10"].every((u) => [...document.querySelectorAll("main tbody tr")].some((r) => r.cells[0].innerText === u))`));
  await setFile(`document.querySelector('input[type=file][accept=".csv"]')`, path.join(DL, tpl || "x"));
  d0 = dialogCount();
  await clickEl(byText("นำเข้า", "document", "button"));
  await sleep(1500);
  check("นำเข้าซ้ำ", lastDialogs(d0).includes("ข้อมูลซ้ำกับที่มีอยู่แล้ว"), lastDialogs(d0));
  for (const u of ["teach10", "comm10"]) await clickEl(`[...document.querySelectorAll("main tbody tr")].find((r) => r.cells[0].innerText === "${u}").querySelector('[title="ลบ"]')`), await sleep(700);
  check("ลบ teach10 และ comm10", sql("select count(*) from users") === "6");

  chapter = "8.5.4";
  await open("/hr/assignments");
  const somchai = card("สมชาย รักเรียน", "main .card");
  const malee = card("มาลี ศรีสุข", "main .card");
  await waitFor(`${somchai}?.querySelectorAll("li").length === 3`);
  const lines = await ev(`[...${somchai}.querySelectorAll("ul li")].map((l) => l.innerText.replace(/\\s+/g, " "))`);
  obs("การ์ดสมชาย", lines);
  check("สมชาย 3 กรรมการ 3 สถานะ 6/6, 2/6, 0/6", lines.length === 3 && lines[0].includes("ยืนยันผลแล้ว") && lines[0].includes("6/6 ข้อ") && lines[1].includes("บันทึกร่าง") && lines[1].includes("2/6 ข้อ") && lines[2].includes("ยังไม่ประเมิน") && lines[2].includes("0/6 ข้อ"));
  const wilaiSel = `[...${somchai}.querySelectorAll("ul li")].find((l) => l.innerText.includes("วิไล สายทอง")).querySelector("select")`;
  d0 = dialogCount();
  await setVal(wilaiSel, "chair");
  await sleep(1200);
  check("เปลี่ยนวิไลเป็นประธาน alert", lastDialogs(d0) === "ผู้รับการประเมินคนนี้มีประธานกรรมการแล้ว", lastDialogs(d0));
  check("select กลับเป็นค่าเดิม", (await ev(`${wilaiSel}.value`)) === "member", await ev(`${wilaiSel}.value`));
  d0 = dialogCount();
  await clickEl(`[...${malee}.querySelectorAll("ul li")].find((l) => l.innerText.includes("ชัยวัฒน์ แก้วมา")).querySelector('[title="ยกเลิกการมอบหมาย"]')`);
  check("ยกเลิกชัยวัฒน์ ถามก่อน", await waitFor(`![...${malee}.querySelectorAll("ul li")].some((l) => l.innerText.includes("ชัยวัฒน์"))`) && lastDialogs(d0).startsWith("ยกเลิก ชัยวัฒน์ แก้วมา"), lastDialogs(d0));
  const comm3 = sql("select id from users where username='comm3'");
  await setVal(`${malee}.querySelectorAll("div.flex select")[0]`, comm3);
  await setVal(`${malee}.querySelectorAll("div.flex select")[1]`, "member");
  await clickEl(byText("เพิ่ม", malee, "button"));
  check("เพิ่มชัยวัฒน์กลับเป็นกรรมการร่วม", await waitFor(`[...${malee}.querySelectorAll("ul li")].some((l) => l.innerText.includes("ชัยวัฒน์ แก้วมา") && l.querySelector("select").value === "member")`));

  chapter = "8.6.4";
  await open("/hr/reports");
  await waitFor(`document.querySelectorAll("main tbody tr").length === 2`);
  await setVal(`document.querySelector("main select")`, "progress");
  await sleep(1000);
  const repRows = await ev(`[...document.querySelectorAll("main tbody tr")].map((r) => r.innerText.replace(/\\s+/g, " "))`);
  check("เรียงตาม % สมชาย 100% บนสุด ตามด้วยมาลี 33.33%", repRows[0].includes("สมชาย") && repRows[0].includes("100%") && repRows[1].includes("มาลี") && repRows[1].includes("33.33%"), repRows);
  before = fs.readdirSync(DL);
  await clickEl(byText("ดาวน์โหลด CSV"));
  const csv1 = await newDownload(before);
  const csvBuf = csv1 ? fs.readFileSync(path.join(DL, csv1)) : Buffer.alloc(0);
  check("CSV มี BOM และภาษาไทย", csvBuf[0] === 0xef && csvBuf[1] === 0xbb && csvBuf[2] === 0xbf && csvBuf.toString("utf8").includes("สมชาย รักเรียน"), csv1);
  obs("CSV", csvBuf.toString("utf8").slice(1).split("\r\n"));
  await media("print");
  check("พิมพ์: ไม่มีเมนูและปุ่ม มีวันที่พิมพ์", !(await visible(`document.querySelector("nav")`)) && !(await visible(byText("ดาวน์โหลด CSV"))) && (await visible(`[...document.querySelectorAll("p")].find((p) => p.innerText.startsWith("พิมพ์เมื่อ"))`)));
  obs("PDF รายงาน (bytes)", await pdf("report-hr.pdf"));
  await media("");
  await clickEl(byText("รายกรรมการ", "document", "[role=tab]"));
  await waitFor(`document.querySelector("main thead")?.innerText.includes("ได้รับมอบหมาย")`);
  const prasert = await ev(`[...document.querySelector("main tbody").rows].find((r) => r.innerText.includes("ประเสริฐ")).innerText.replace(/\\s+/g, " ")`);
  obs("แถวประเสริฐ (กรรมการ / ได้รับมอบหมาย / ยังไม่ประเมิน / ร่าง / ยืนยัน)", prasert);
  check("ประเสริฐ: ได้รับมอบหมาย 2 ยังไม่ประเมิน 1 ร่าง 0 ยืนยันผลแล้ว 1", prasert === "ประเสริฐ วงศ์ดี 2 1 0 1 ดูสรุป", prasert);

  chapter = "8.6.6";
  await clickEl(`[...document.querySelector("main tbody").rows].find((r) => r.innerText.includes("ประเสริฐ")).querySelector("a")`);
  await waitFor(`location.pathname.startsWith("/hr/reports/committees/") && document.querySelectorAll("main tbody tr").length > 0`);
  const cRows = await ev(`[...document.querySelectorAll("main tbody tr")].map((r) => [...r.cells].map((c) => c.innerText.trim()))`);
  obs("ตารางสรุปประเสริฐ", cRows);
  check("2 แถว สมชายครบ 6 ข้อ มาลีเป็น -", cRows.length === 2 && cRows[0][0].includes("สมชาย") && cRows[0].slice(2, 8).every((v) => v !== "-") && cRows[1][0].includes("มาลี") && cRows[1].slice(2, 8).every((v) => v === "-"));

  // ================= บท 09 =================
  chapter = "9.2";
  await login("teach2");
  await waitFor(`document.body.innerText.includes("ความก้าวหน้าการประเมินตนเอง")`);
  const st = await ev(`[...document.querySelectorAll(".stat")].map((s) => s.innerText.replace(/\\s+/g, " "))`);
  obs("กล่อง stat", st);
  check("กล่องแรก 33.33% บันทึกครบ 2/6", st[0].includes("33.33%") && st[0].includes("บันทึกครบ 2/6 ตัวชี้วัด"));
  check("กล่องที่สอง 0/3", await waitFor(`document.querySelectorAll(".stat")[1].innerText.includes("0/3")`), st[1]);
  check("การทำวิจัยในชั้นเรียน แถบ 50%", (await ev(`[...document.querySelectorAll("main li")].find((l) => l.innerText.includes("การทำวิจัยในชั้นเรียน")).innerText`)).includes("50%"));

  chapter = "9.3";
  await open("/evaluatee/evaluation");
  await waitFor(`document.querySelectorAll("main .card").length === 6`);
  const icard = (t) => card(t, "main .card");
  const topBar = () => ev(`document.querySelector("main progress").value`);
  const bar0 = await topBar();
  await clickEl(`${icard("การใช้สื่อและเทคโนโลยีในการสอน")}.querySelectorAll("label")[2]`);
  await waitFor(`${icard("การใช้สื่อและเทคโนโลยีในการสอน")}.innerText.includes("ความคืบหน้า 50%")`);
  const bar1 = await topBar();
  obs("แถบรวมด้านบน ก่อน/หลัง เลือกคะแนนตัวที่ 2", [bar0, bar1]);
  check("เลือกคะแนนตัวที่ 2 (ยังไม่แนบ) แถบรวมด้านบนยังไม่เปลี่ยน บันทึกครบ 2/6", bar0 === bar1 && (await has("บันทึกครบ 2/6 ตัวชี้วัด")), [bar0, bar1]);
  check("การ์ดตัวที่ 2 เปลี่ยนเป็น 50%", await ev(`${icard("การใช้สื่อและเทคโนโลยีในการสอน")}.innerText.includes("ความคืบหน้า 50%")`));
  await clickEl(byText("เพิ่มรายละเอียด", icard("การใช้สื่อและเทคโนโลยีในการสอน"), "button"));
  check("เพิ่มรายละเอียดโดยไม่กรอก", await waitFor(`${icard("การใช้สื่อและเทคโนโลยีในการสอน")}.innerText.includes("กรุณากรอกรายละเอียดประกอบ")`));
  const research = icard("การทำวิจัยในชั้นเรียน");
  await type(`${research}.querySelector("textarea")`, "รายงานวิจัยในชั้นเรียน");
  await setFile(`${research}.querySelector("input[type=file]")`, PDF);
  await clickEl(byText("เพิ่มรายละเอียด", research, "button"));
  check("แนบ PDF ชื่อไฟล์ขึ้น ความคืบหน้า 100%", await waitFor(`${research}.innerText.includes("plan.pdf") && ${research}.innerText.includes("ความคืบหน้า 100%")`), await ev(`${research}.innerText.slice(0, 200)`));
  const bar2 = await topBar();
  check("แนบไฟล์แล้ว แถบรวมด้านบนขยับ บันทึกครบ 3/6", bar2 === 50 && (await has("บันทึกครบ 3/6 ตัวชี้วัด")), bar2);
  const evRow = sql("select id, file_path, file_name from evidences order by id desc limit 1").split("\t");
  obs("evidence ใน DB (id, path, name) / ขนาดไฟล์บนดิสก์ / ต้นฉบับ", [evRow, fs.statSync(`${APP}/backend/uploads/${evRow[1]}`).size, fs.statSync(PDF).size]);
  obs("fetch ผ่าน Next proxy (bytes)", await ev(`fetch("/api/evidences/${evRow[0]}/file", { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }).then(async (r) => [r.status, r.headers.get("content-type"), (await r.arrayBuffer()).byteLength])`));
  before = fs.readdirSync(DL);
  await clickEl(byText("plan.pdf", research, "button"));
  const dlPdf = await newDownload(before);
  const dlHead = dlPdf ? fs.readFileSync(path.join(DL, dlPdf)).subarray(0, 40).toString() : "";
  obs("ดาวน์โหลด PDF (เครื่องนี้มี IDM ดักไฟล์ .pdf)", `${dlPdf} ${J(dlHead)} ${dlPdf ? fs.statSync(path.join(DL, dlPdf)).size : 0}`);
  // ยืนยันโค้ดดาวน์โหลดด้วยไฟล์ PNG ที่ IDM ไม่ดัก แล้วลบทิ้ง
  await type(`${research}.querySelector("textarea")`, "รูปเกียรติบัตร");
  await setFile(`${research}.querySelector("input[type=file]")`, PNG);
  await clickEl(byText("เพิ่มรายละเอียด", research, "button"));
  await waitFor(`${research}.innerText.includes("cert.png")`);
  before = fs.readdirSync(DL);
  await clickEl(byText("cert.png", research, "button"));
  const dlPng = await newDownload(before);
  check("กดชื่อไฟล์ ดาวน์โหลดได้ (PNG ไฟล์ตรงต้นฉบับ)", dlPng === "cert.png" && fs.readFileSync(path.join(DL, dlPng)).equals(fs.readFileSync(PNG)), dlPng);
  await clickEl(`[...${research}.querySelectorAll("li")].find((l) => l.innerText.includes("cert.png")).querySelector('[title="ลบรายละเอียด"]')`);
  await waitFor(`!${research}.innerText.includes("cert.png")`);
  r0 = requests.length;
  await type(`${research}.querySelector("textarea")`, "ไฟล์ผิดชนิด");
  await setFile(`${research}.querySelector("input[type=file]")`, TXT);
  await clickEl(byText("เพิ่มรายละเอียด", research, "button"));
  check("แนบ .txt ฝั่งหน้าจับได้", (await waitFor(`${research}.innerText.includes("รองรับเฉพาะไฟล์ PDF, JPG และ PNG")`)) && !requests.slice(r0).some((r) => r.startsWith("POST")), requests.slice(r0));
  const part = icard("การมีส่วนร่วมในกิจกรรมสถานศึกษา");
  await type(`${part}.querySelector("textarea")`, "กิจกรรม");
  await type(`${part}.querySelector('[name="url"]')`, "abc");
  await clickEl(byText("เพิ่มรายละเอียด", part, "button"));
  check("URL abc", await waitFor(`${part}.innerText.includes("URL ต้องขึ้นต้นด้วย")`));
  d0 = dialogCount();
  await clickEl(`[...${research}.querySelectorAll("li")].find((l) => l.innerText.includes("plan.pdf")).querySelector('[title="ลบรายละเอียด"]')`);
  check("ลบหลักฐานข้อ 3 ถามก่อน แล้วหาย", await waitFor(`!${research}.innerText.includes("plan.pdf")`) && lastDialogs(d0).startsWith('ลบ "รายงานวิจัยในชั้นเรียน"'), lastDialogs(d0));
  const disc = icard("การปฏิบัติตามระเบียบวินัย");
  check("ระเบียบวินัย ไม่มีช่องไฟล์และ URL", (await ev(`${disc}.querySelectorAll("input[type=file], [name=url]").length`)) === 0);
  obs("teach2 summary หลังบท 9.3", (await call("GET", "/self-evaluations", { token: await apiLogin("teach2") })).data.summary);

  chapter = "9.4.4";
  await login("hr1");
  await open("/hr/reports");
  await waitFor(`document.querySelectorAll("main tbody tr").length === 2`);
  await clickEl(`[...document.querySelectorAll("main tbody tr")].find((r) => r.innerText.includes("สมชาย")).querySelector("a")`);
  await waitFor(`location.pathname.startsWith("/hr/reports/evaluatees/") && document.querySelectorAll("main thead th").length > 0`);
  const head = await ev(`[...document.querySelectorAll("main thead th")].map((t) => t.innerText.replace(/\\s+/g, " "))`);
  const body = await ev(`[...document.querySelectorAll("main tbody tr")].filter((r) => r.cells.length > 1).map((r) => [...r.cells].map((c) => c.innerText.trim()))`);
  obs("หัวตาราง", head);
  obs("แถว", body);
  const col = (name) => head.findIndex((h) => h.includes(name));
  check("comm1 ยืนยันแล้ว คะแนนครบ, comm2 ร่าง 2 ข้อ, comm3 -", body.every((r) => r[col("ประเสริฐ")] !== "-") && body.filter((r) => r[col("วิไล")] !== "-").length === 2 && body.every((r) => r[col("ชัยวัฒน์")] === "-"));
  const cards = await ev(`[...document.querySelectorAll("main .grid .card")].map((c) => c.innerText.replace(/\\s+/g, " "))`);
  obs("การ์ดกรรมการ", cards);
  check("เห็นความเห็น และลายเซ็นของ comm1", cards.some((c) => c.includes("ประเสริฐ") && c.includes("ปฏิบัติงานได้ดี")) && (await ev(`!!document.querySelector('main img[alt="ลายเซ็น"]')`)));

  chapter = "9.5.1";
  await login("teach1");
  await clickEl(byText("ผลการประเมิน", "document.querySelector('nav')", "a"));
  await waitFor(`location.pathname === "/evaluatee/result" && document.querySelectorAll("main thead th").length > 0 && document.body.innerText.includes("รายละเอียดประกอบการประเมินตนเอง")`);
  const h2 = await ev(`[...document.querySelectorAll("main thead th")].map((t) => t.innerText.replace(/\\s+/g, " "))`);
  const b2 = await ev(`[...document.querySelectorAll("main tbody tr")].filter((r) => r.cells.length > 1).map((r) => [...r.cells].map((c) => c.innerText.trim()))`);
  const c2 = await ev(`[...document.querySelectorAll("main .grid .card")].map((c) => c.innerText.replace(/\\s+/g, " "))`);
  check("เห็นคะแนนและความเห็นของ comm1 พร้อมลายเซ็น", b2.every((r) => r[h2.findIndex((h) => h.includes("ประเสริฐ"))] !== "-") && c2.some((c) => c.includes("ประเสริฐ") && c.includes("ปฏิบัติงานได้ดี")) && (await ev(`!!document.querySelector('main img[alt="ลายเซ็น"]')`)));
  check("ไม่เห็นคะแนนร่างของ comm2", b2.every((r) => r[h2.findIndex((h) => h.includes("วิไล"))] === "-") && c2.some((c) => c.includes("วิไล") && c.includes("ยังไม่มีความเห็น")), c2);
  await media("print");
  check("Export PDF: ไม่มีเมนูและปุ่ม", !(await visible(`document.querySelector("nav")`)) && !(await visible(byText("Export PDF"))));
  check("รายละเอียดประกอบขึ้นหน้าใหม่", (await ev(`getComputedStyle([...document.querySelectorAll("main .card")].find((c) => c.innerText.includes("รายละเอียดประกอบการประเมินตนเอง"))).breakBefore`)) === "page");
  obs("PDF ผลการประเมิน (bytes)", await pdf("result-teach1.pdf"));
  await media("");

  // ================= บท 10 =================
  chapter = "10.2";
  await login("comm1");
  await waitFor(`location.pathname === "/committee" && document.querySelectorAll("main tbody tr").length > 0`);
  const cst = await ev(`[...document.querySelectorAll(".stat")].map((s) => s.innerText.replace(/\\s+/g, " "))`);
  const crow = await ev(`[...document.querySelectorAll("main tbody tr")].map((r) => r.innerText.replace(/\\s+/g, " "))`);
  obs("stat", cst);
  obs("แถว", crow);
  check("ทั้งหมด 2 ยังไม่ประเมิน 1 ยืนยันผลแล้ว 1", cst[0].endsWith("2") && cst[1].endsWith("1") && cst[3].endsWith("1"));
  check("สมชายอยู่ล่างสุด ปุ่ม ดูผล", crow.at(-1).includes("สมชาย") && crow.at(-1).includes("ดูผล"));

  chapter = "10.6.1";
  await clickEl(`[...document.querySelectorAll("main tbody tr")].find((r) => r.innerText.includes("มาลี")).querySelector("a")`);
  await waitFor(`location.pathname.startsWith("/committee/evaluate/") && document.querySelectorAll("main section .card").length === 6`);
  const evalUrl = await path_();
  const t1 = await text();
  check("1 ข้อมูลผู้รับการประเมิน หลักฐาน คะแนนตนเอง", t1.includes("มาลี ศรีสุข") && t1.includes("แผนการจัดการเรียนรู้วิชาฐานข้อมูล") && t1.includes("ผู้รับการประเมินให้ตนเอง: 3"));
  const sc = (name, label) => `[...${card(name, "main section .card")}.querySelectorAll("input[type=radio]")].find((r) => r.getAttribute("aria-label") === ${J(label)})`;
  await clickEl(sc("การจัดทำแผนการจัดการเรียนรู้", "3"));
  await clickEl(sc("การใช้สื่อและเทคโนโลยีในการสอน", "2"));
  check("2 ให้คะแนนแล้ว 2/6", await has("ให้คะแนนแล้ว 2/6"));
  await type(`[...document.querySelectorAll("main .card")].find((c) => c.innerText.includes("ความเห็นสรุปโดยภาพรวม")).querySelector("textarea")`, "ควรแนบหลักฐานเพิ่ม");
  await clickEl(byText("บันทึกร่าง", "document", "button"));
  check("3 บันทึกร่างสำเร็จ สถานะ บันทึกร่าง ตารางอัปเดต", (await waitFor(`document.querySelector(".alert-success")?.innerText === "บันทึกร่างสำเร็จ"`)) && (await waitFor(`document.querySelector("main .badge-warning")?.innerText === "บันทึกร่าง"`)) && (await has("2/6 ตัวชี้วัด")), await ev(`document.querySelector(".alert")?.innerText`));
  await clickEl(byText("← กลับ", "document", "a"));
  await waitFor(`location.pathname === "/committee"`);
  await open(evalUrl);
  await waitFor(`document.querySelectorAll("main section .card").length === 6`);
  check("4 กลับแล้วเข้าใหม่ คะแนนร่างและความเห็นยังอยู่", (await has("ให้คะแนนแล้ว 2/6")) && (await ev(`[...document.querySelectorAll("main textarea")].some((t) => t.value === "ควรแนบหลักฐานเพิ่ม")`)));
  await clickEl(byText("ยืนยันและส่งผลการประเมิน", "document", "button"));
  check("5 ยังไม่ครบและไม่เซ็น ขึ้น 2 ข้อความ", (await has("กรุณาลงลายเซ็นก่อนยืนยัน")) && (await has("กรุณาให้คะแนนให้ครบทุกตัวชี้วัด")));
  for (const [n, l] of [["การทำวิจัยในชั้นเรียน", "มี"], ["การเข้ารับการอบรมพัฒนาตนเอง", "มี"], ["การปฏิบัติตามระเบียบวินัย", "4"], ["การมีส่วนร่วมในกิจกรรมสถานศึกษา", "3"]]) await clickEl(sc(n, l));
  const drawSig = async () => {
    const c = await ev(`(() => { const e = document.querySelector("main canvas"); e.scrollIntoView({ block: "center" }); const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: c.x + 20, y: c.y + 40, button: "none" });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: c.x + 20, y: c.y + 40, button: "left", buttons: 1, clickCount: 1 });
    for (let k = 1; k <= 12; k++) await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: c.x + 20 + k * 20, y: c.y + 40 + Math.sin(k) * 25, button: "left", buttons: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: c.x + 260, y: c.y + 60, button: "left", buttons: 0, clickCount: 1 });
  };
  await drawSig();
  check("วาดลายเซ็นบน canvas ได้", await ev(`(() => { const c = document.querySelector("main canvas"); return c.getContext("2d").getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v > 0); })()`));
  d0 = dialogCount();
  await clickEl(byText("ยืนยันและส่งผลการประเมิน", "document", "button"));
  check("6 ยืนยัน → ตกลง หน้าล็อก ปุ่มกดไม่ได้ เห็นรูปลายเซ็น", (await waitFor(`document.body.innerText.includes("ไม่สามารถแก้ไขได้")`)) && (await ev(`[...document.querySelectorAll("main input[type=radio]")].every((r) => r.disabled)`)) && (await ev(`!!document.querySelector('main img[alt="ลายเซ็น"]')`)) && lastDialogs(d0).startsWith("ยืนยันและส่งผลการประเมิน?"), lastDialogs(d0));
  chapter = "10.6.1 ข้อ 9";
  await media("print");
  check("9 พิมพ์: ไม่มีการ์ดตัวชี้วัด มีตารางผลและลายเซ็น", !(await visible(`document.querySelector("main section")`)) && (await visible(`document.querySelector("main table")`)) && (await visible(`document.querySelector('main img[alt="ลายเซ็น"]')`)));
  obs("PDF หน้าประเมิน (bytes)", await pdf("evaluate-comm1.pdf"));
  await media("");

  chapter = "10.6.1 ข้อ 7";
  await login("teach2");
  await open("/evaluatee/result");
  await waitFor(`document.querySelectorAll("main .grid .card").length === 3`);
  const c7 = await ev(`[...document.querySelectorAll("main .grid .card")].map((c) => c.innerText.replace(/\\s+/g, " "))`);
  check("teach2 เห็นความเห็นและลายเซ็นของ comm1", c7.some((c) => c.includes("ประเสริฐ") && c.includes("ควรแนบหลักฐานเพิ่ม")) && (await ev(`!!document.querySelector('main img[alt="ลายเซ็น"]')`)), c7);

  chapter = "10.6.1 ข้อ 8";
  const comm1Jobs = (await call("GET", "/committee/assignments", { token: await apiLogin("comm1") })).data.map((a) => a.status);
  obs("งานของ comm1 หลังยืนยันมาลี (ยังมีงานอื่นให้เซ็นไหม)", comm1Jobs);
  await login("comm2");
  await waitFor(`document.querySelectorAll("main tbody tr").length > 0`);
  await clickEl(`[...document.querySelectorAll("main tbody tr")].find((r) => r.innerText.includes("สมชาย")).querySelector("a")`);
  await waitFor(`!!document.querySelector("main canvas")`);
  await size(375, 780, true);
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  await sleep(400);
  const c = await ev(`(() => { const e = document.querySelector("main canvas"); e.scrollIntoView({ block: "center" }); const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, sy: scrollY }; })()`);
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: c.x + 20, y: c.y + 30 }] });
  for (let k = 1; k <= 10; k++) await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: c.x + 20 + k * 10, y: c.y + 30 + k * 8 }] });
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(300);
  check("มือถือ: ลากนิ้วแล้ววาดได้", await ev(`(() => { const c = document.querySelector("main canvas"); return c.getContext("2d").getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v > 0); })()`));
  check("มือถือ: หน้าไม่เลื่อนตามนิ้ว", (await ev("scrollY")) === c.sy, [c.sy, await ev("scrollY")]);
  check("มือถือ: ไม่มีแถบเลื่อนแนวนอน", await ev("document.documentElement.scrollWidth <= innerWidth"));
  await send("Emulation.setTouchEmulationEnabled", { enabled: false });
  await size(1280, 900, false);
  check("comm2 ยังเป็นร่าง (ไม่ได้กดยืนยัน)", sql("select status from assignments where id=2") === "draft");

  chapter = "10.6 เก็บกวาด";
  await login("hr1");
  await open("/hr/assignments");
  await waitFor(`${malee}?.querySelectorAll("li").length === 3`);
  await clickEl(`[...${malee}.querySelectorAll("ul li")].find((l) => l.innerText.includes("ประเสริฐ วงศ์ดี")).querySelector('[title="ยกเลิกการมอบหมาย"]')`);
  await waitFor(`![...${malee}.querySelectorAll("ul li")].some((l) => l.innerText.includes("ประเสริฐ"))`);
  await setVal(`${malee}.querySelectorAll("div.flex select")[0]`, sql("select id from users where username='comm1'"));
  await setVal(`${malee}.querySelectorAll("div.flex select")[1]`, "chair");
  await clickEl(byText("เพิ่ม", malee, "button"));
  check("ประเสริฐกลับเป็นประธานของมาลี", await waitFor(`[...${malee}.querySelectorAll("ul li")].some((l) => l.innerText.includes("ประเสริฐ วงศ์ดี") && l.querySelector("select").value === "chair" && l.innerText.includes("ยังไม่ประเมิน"))`));

  // ================= บท 11 =================
  chapter = "11.3.7";
  await clickEl(byText("Dashboard", "document.querySelector('nav')", "a"));
  await waitFor(`location.pathname === "/hr" && !!document.querySelector(".stats")`);
  const dash = async () => ({
    alert: await ev(`document.querySelector("main [role=alert]").innerText.replace(/\\s+/g, " ")`),
    stats: await ev(`[...document.querySelectorAll(".stat")].map((s) => s.innerText.replace(/\\s+/g, " "))`),
    radial: await ev(`document.querySelector(".radial-progress").innerText.trim()`),
    cards: await ev(`[...document.querySelectorAll("main .grid .card")].map((c) => c.innerText.replace(/\\s+/g, " "))`),
  });
  const D = await dash();
  console.log("OBS   [11.3.7] Dashboard:\n" + JSON.stringify(D, null, 1));
  check("กล่องเขียว ตรวจสอบข้อมูลแล้ว", D.alert.startsWith("ตรวจสอบข้อมูลแล้ว"));
  check("stats 2 / 3 / 2 (เปิดอยู่ 2) / 6", J(D.stats) === J(["ผู้รับการประเมิน 2 คน", "กรรมการ 3 คน", "หัวข้อการประเมิน 2 เปิดอยู่ 2 หัวข้อ", "ตัวชี้วัด 6 ตัว"]), D.stats);
  check("วงกลม 67% บันทึกครบ 1/2 คน", D.radial === "67%" && D.cards[0].includes("บันทึกครบ 1/2 คน"), D.cards[0]);
  check("แถบ 4/6, 1/6, 1/6 และครบทุกกรรมการ 0/2", D.cards[1].includes("ยังไม่ประเมิน 4/6 บันทึกร่าง 1/6 ยืนยันผลแล้ว 1/6 ประเมินครบทุกกรรมการแล้ว 0/2 คน"), D.cards[1]);
  check("คะแนน 91.25%", D.cards[2].includes("91.25%"));
  check("อันดับ 1. สมชาย รักเรียน 91.25%", D.cards.at(-1).includes("สมชาย รักเรียน 91.25%"));
  await size(375, 780, true);
  await sleep(400);
  check("มือถือ: การ์ดเรียงแถวเดียว ไม่มีแถบเลื่อนแนวนอน", (await ev(`(() => { const cs = [...document.querySelectorAll("main .grid .card")]; return cs.every((c, i) => i === 0 || c.getBoundingClientRect().top > cs[i - 1].getBoundingClientRect().top); })()`)) && (await ev("document.documentElement.scrollWidth <= innerWidth")));
  await size(1280, 900, false);

  chapter = "11.5";
  await open("/hr/backups");
  await waitFor(hydrated("main button.btn-primary"));
  await clickEl(byText("สำรองข้อมูลตอนนี้"));
  check("1 สำรอง กล่องเขียว ตารางมี 1 ไฟล์", (await waitFor(`document.querySelector(".alert-success")?.innerText.startsWith("สำรองข้อมูลสำเร็จ")`, 30000)) && (await waitFor(`document.querySelectorAll("main tbody tr").length === 1`)), await ev(`document.querySelector(".alert")?.innerText`));
  const firstBackup = await ev(`document.querySelector("main tbody tr").cells[0].innerText`);
  before = fs.readdirSync(DL);
  await clickEl(`document.querySelector('main tbody tr [title="ดาวน์โหลด"]')`);
  const sqlFile = await newDownload(before);
  check("2 ดาวน์โหลดได้ไฟล์ .sql", sqlFile === firstBackup && fs.readFileSync(path.join(DL, sqlFile), "utf8").includes("CREATE TABLE"), sqlFile);
  await open("/hr/topics");
  await waitFor(`document.querySelectorAll("main .card").length === 2`);
  await clickEl(byText("เพิ่มหัวข้อ"));
  await waitFor(`!!document.querySelector(".modal-open form")`);
  await type(input("title", MO), "หัวข้อใหม่ก่อนกู้คืน");
  await setVal(input("start_date", "document.querySelector('.modal-open')"), "2026-11-01");
  await setVal(input("end_date", "document.querySelector('.modal-open')"), "2026-12-31");
  await clickEl(`document.querySelector(".modal-open button.btn-primary")`);
  await waitFor(`document.querySelectorAll("main .card").length === 3`);
  await open("/hr");
  check("3 Dashboard กล่องเหลือง ยังไม่มีตัวชี้วัด", await waitFor(`document.querySelector("main .alert-warning")?.innerText.includes('หัวข้อ "หัวข้อใหม่ก่อนกู้คืน" ยังไม่มีตัวชี้วัด')`));
  await open("/hr/backups");
  await waitFor(`document.querySelectorAll("main tbody tr").length === 1`);
  d0 = dialogCount();
  await clickEl(`document.querySelector('main tbody tr [title="กู้คืน"]')`);
  check("4 กู้คืน ข้อความเขียว และมีไฟล์ before-restore", (await waitFor(`document.querySelector(".alert-success")?.innerText.startsWith("กู้คืนข้อมูลสำเร็จ")`, 30000)) && (await waitFor(`[...document.querySelectorAll("main tbody tr")].some((r) => r.innerText.includes("-before-restore.sql"))`)), await ev(`document.querySelector(".alert")?.innerText`));
  await open("/hr");
  check("5 Dashboard กลับเป็นกล่องเขียว", await waitFor(`document.querySelector("main .alert-success")?.innerText.startsWith("ตรวจสอบข้อมูลแล้ว")`));
  await open("/hr/backups");
  await waitFor(`document.querySelectorAll("main tbody tr").length === 2`);
  await clickEl(byText("อัปโหลดและกู้คืน"));
  check("7 ไม่เลือกไฟล์ กรุณาเลือกไฟล์ .sql", await waitFor(`document.querySelector(".alert-error")?.innerText === "กรุณาเลือกไฟล์ .sql"`));
  await setFile(`document.querySelector('input[type=file][accept=".sql"]')`, path.join(DL, sqlFile));
  d0 = dialogCount();
  await clickEl(byText("อัปโหลดและกู้คืน"));
  check("6 อัปโหลดและกู้คืน สำเร็จ", await waitFor(`document.querySelector(".alert-success")?.innerText.startsWith("กู้คืนข้อมูลสำเร็จ")`, 30000), await ev(`document.querySelector(".alert")?.innerText`) + " " + lastDialogs(d0));

  chapter = "11.7";
  // ข้อเสนอ: สำรองก่อนเริ่มทดสอบ แล้วกู้คืนตอนจบ
  const bkBefore = fs.readdirSync(APP + "/backend/backups");
  await sleep(1100); // ชื่อไฟล์ละเอียดถึงวินาที
  await clickEl(byText("สำรองข้อมูลตอนนี้"));
  await waitFor(`document.querySelector(".alert-success")?.innerText.startsWith("สำรองข้อมูลสำเร็จ")`, 30000);
  await sleep(800);
  // ตามคู่มือ: ไฟล์ใหม่อยู่บนสุดของตาราง
  const startBackup = await ev(`document.querySelector("main tbody tr").cells[0].innerText`);
  check("ไฟล์บนสุดของตาราง คือไฟล์ที่เพิ่งสำรอง", startBackup === fs.readdirSync(APP + "/backend/backups").find((f) => !bkBefore.includes(f)), startBackup);
  obs("ไฟล์สำรองตอนเริ่ม 11.7", startBackup);
  await open("/hr/topics");
  await waitFor(`document.querySelectorAll("main .card").length === 2`);
  await clickEl(byText("เพิ่มหัวข้อ"));
  await waitFor(`!!document.querySelector(".modal-open form")`);
  await type(input("title", MO), "หัวข้อว่าง");
  await setVal(input("start_date", "document.querySelector('.modal-open')"), "2026-11-01");
  await setVal(input("end_date", "document.querySelector('.modal-open')"), "2026-12-31");
  await clickEl(`document.querySelector(".modal-open button.btn-primary")`);
  await waitFor(`document.querySelectorAll("main .card").length === 3`);
  await clickEl(byText("เพิ่มตัวชี้วัด", card("ด้านการจัดการเรียนการสอน", "main .card")));
  await waitFor(`!!document.querySelector(".modal-open form")`);
  await type(input("name", MO), "ตัวชี้วัดน้ำหนักเกิน");
  await type(input("weight", MO), "10");
  await clickEl(`document.querySelector(".modal-open button.btn-primary")`);
  await waitFor(`!document.querySelector(".modal-open")`);
  await open("/hr/assignments");
  await waitFor(`${malee}?.querySelectorAll("li").length === 3`);
  await setVal(`[...${malee}.querySelectorAll("ul li")].find((l) => l.innerText.includes("ประเสริฐ")).querySelector("select")`, "member");
  await sleep(1200);
  await open("/hr");
  await waitFor(`!!document.querySelector("main .alert-warning")`);
  const warn = await ev(`document.querySelector("main .alert-warning").innerText`);
  obs("กล่องเหลือง", warn);
  check("8.2 แจ้ง 3 เรื่อง", warn.includes('หัวข้อ "หัวข้อว่าง" ยังไม่มีตัวชี้วัด') && warn.includes("เท่ากับ 110") && warn.includes("มาลี ศรีสุข ยังไม่มีประธานกรรมการ"));
  await open("/hr/backups");
  await waitFor(`[...document.querySelectorAll("main tbody tr")].some((r) => r.cells[0].innerText === ${J(startBackup)})`);
  await clickEl(`[...document.querySelectorAll("main tbody tr")].find((r) => r.cells[0].innerText === ${J(startBackup)}).querySelector('[title="กู้คืน"]')`);
  check("กู้คืนไฟล์ตอนเริ่ม 11.7", await waitFor(`document.querySelector(".alert-success")?.innerText.startsWith("กู้คืนข้อมูลสำเร็จ")`, 30000));
  await open("/hr");
  await waitFor(`!!document.querySelector(".stats")`);
  const D2 = await dash();
  check("หลังกู้คืน Dashboard เหมือนขั้น 11.3.7", J(D2) === J(D), D2);

  // ================= บท 12 ข้อ 7.10: ทุกหน้า 390px ไม่ล้น + เมนู ☰ =================
  chapter = "12 (7.10)";
  const pages = { hr1: ["/hr", "/hr/topics", "/hr/users", "/hr/assignments", "/hr/reports", "/hr/reports/evaluatees/5", "/hr/reports/committees/2", "/hr/backups", "/profile", "/change-password"], teach1: ["/evaluatee", "/evaluatee/evaluation", "/evaluatee/result"], comm1: ["/committee", "/committee/evaluate/1"] };
  const wide = [];
  for (const [u, list] of Object.entries(pages)) {
    await size(1280, 900, false);
    await login(u);
    await size(390, 844, true);
    for (const p of list) {
      await open(p);
      await sleep(1200);
      const w = await ev("[document.documentElement.scrollWidth, innerWidth]");
      if (w[0] > w[1]) wide.push(`${p} ${w[0]}>${w[1]}`);
    }
    if (u === "hr1") {
      await open("/hr");
      await clickEl(`document.querySelector("nav .dropdown [role=button]")`);
      check("กด ☰ แล้วเห็นเมนู 6 รายการ", await waitFor(`[...document.querySelectorAll("nav .dropdown-content a")].filter((a) => a.getClientRects().length).length === 6`));
      await clickEl(byText("รายงาน", "document.querySelector('nav .dropdown-content')", "a"));
      check("กดเมนูในมือถือ เปลี่ยนหน้าได้", await waitFor(`location.pathname === "/hr/reports"`));
    }
  }
  await ev("localStorage.clear(); 1");
  for (const p of ["/login", "/register"]) { await open(p, "form"); const w = await ev("[document.documentElement.scrollWidth, innerWidth]"); if (w[0] > w[1]) wide.push(`${p} ${w[0]}>${w[1]}`); }
  check("ทุกหน้า (17 หน้า) ที่ 390px ไม่มีแถบเลื่อนแนวนอน", wide.length === 0, wide);
  await size(1280, 900, false);
} catch (e) {
  check("สคริปต์ทำงานจนจบ", false, e.message);
} finally {
  console.log("\nConsole error:", consoleErrors.length ? "\n  " + [...new Set(consoleErrors)].map((e) => e.slice(0, 250)).join("\n  ") : "ไม่มี");
  const fails = results.filter((r) => !r.ok);
  console.log(`\nสรุป: ผ่าน ${results.length - fails.length}/${results.length}`);
  if (fails.length) console.log("ไม่ผ่าน:\n  " + fails.map((f) => `[${f.chapter}] ${f.name}`).join("\n  "));
  try { ws?.close(); } catch {}
  edge.kill();
  if (!DOCKER) backend.kill();
  if (web) try { execFileSync("taskkill", ["/PID", String(web.pid), "/T", "/F"], { stdio: "ignore" }); } catch {}
  process.exit(0);
}
