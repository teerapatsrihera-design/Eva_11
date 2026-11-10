// ทำตามคู่มือบท 03-06 จริงบน DB ว่าง แล้วเทียบตัวเลขที่คู่มือเขียนไว้
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";

const BACKEND = (process.env.APP_ROOT || import.meta.dirname.replace(/[\\/]docs[\\/]tools$/, "")) + "/backend", PORT = 15001, BASE = process.env.API_BASE || `http://127.0.0.1:${PORT}/api`;
const env = { ...process.env, PORT: String(PORT), DB_HOST: "127.0.0.1", DB_PORT: "13306", DB_USER: "root", DB_PASSWORD: "testpw", DB_NAME: "eva_test", DB_CONTAINER: "eva_api_test", JWT_SECRET: "replay_secret", JWT_EXPIRES_IN: "8h" };
const server = process.env.API_BASE ? null : spawn("node", ["server.js"], { cwd: BACKEND, env, stdio: "ignore" });
const SQL_C = process.env.SQL_CONTAINER || "eva_api_test";
// รูปแบบเดียวกับคำสั่งในคู่มือ: echo "SQL" | docker exec -i <กล่อง> sh -c 'mysql ... -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE'
const sql = (q) => execFileSync("docker", ["exec", "-i", SQL_C, "sh", "-c", "mysql --default-character-set=utf8mb4 -N -uroot -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE"], { input: q, stdio: ["pipe", "pipe", "ignore"] }).toString().trim();
for (let i = 0; i < 40; i++) { try { if ((await fetch(`${BASE}/health`)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 250)); }

let pass = 0, fail = 0;
const eq = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  -> got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`); };
async function call(method, url, { token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(BASE + url, { method, headers, body: form ?? (body ? JSON.stringify(body) : undefined) });
  const type = res.headers.get("content-type") || "";
  return { code: res.status, ...(type.includes("json") ? await res.json() : {}) };
}
const PDF = Buffer.from("%PDF-1.4\n%%EOF\n");
const SIG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const evForm = (description, { url, file } = {}) => { const f = new FormData(); f.append("description", description); if (url) f.append("url", url); if (file) f.append("file", new Blob([PDF], { type: "application/pdf" }), "plan.pdf"); return f; };
const login = async (u, p = "123456") => (await call("POST", "/auth/login", { body: { username: u, password: p } })).data?.token;
const uploadsBefore = new Set(fs.readdirSync(`${BACKEND}/uploads`));

try {
  // บท 03 ก่อนมีด่าน login: ในเวอร์ชันสุดท้าย POST topics ต้องใช้ token จึงจำลองด้วย INSERT ลำดับเดียวกัน
  eq("3.7 ตาราง users ว่าง", sql("select count(*) from users"), "0");

  // บท 04: login ก่อนมีบัญชี
  eq("4.4.3 login ก่อนมีบัญชีได้ 401", (await call("POST", "/auth/login", { body: { username: "hr1", password: "123456" } })).code, 401);
  eq("4.4.3 ไม่กรอกได้ 400", (await call("POST", "/auth/login", { body: {} })).message, "กรุณากรอกชื่อผู้ใช้");

  // 4.4.5 สร้าง 6 บัญชี
  const people = [["hr1", "สมศรี ใจดี"], ["comm1", "ประเสริฐ วงศ์ดี"], ["comm2", "วิไล สายทอง"], ["comm3", "ชัยวัฒน์ แก้วมา"], ["teach1", "สมชาย รักเรียน"], ["teach2", "มาลี ศรีสุข"]];
  for (let i = 0; i < people.length; i++) {
    const r = await call("POST", "/auth/register", { body: { username: people[i][0], password: "123456", full_name: people[i][1] } });
    eq(`4.4.5 ${people[i][0]} ได้ id ${i + 1}`, [r.code, r.data?.id], [201, i + 1]);
  }
  sql("UPDATE users SET role='hr' WHERE username='hr1'");
  sql("UPDATE users SET role='committee' WHERE username LIKE 'comm%'");
  const hr = await login("hr1");
  eq("4.4.5 login hr ได้ role hr", (await call("POST", "/auth/login", { body: { username: "hr1", password: "123456" } })).data.user.role, "hr");
  eq("4.4.5 รหัสผิด 401", (await call("POST", "/auth/login", { body: { username: "hr1", password: "999999" } })).code, 401);
  eq("4.4.5 สมัครซ้ำ 400", (await call("POST", "/auth/register", { body: { username: "hr1", password: "123456", full_name: "x" } })).message, "ข้อมูลซ้ำกับที่มีอยู่แล้ว");
  await call("POST", "/auth/register", { body: { username: "hack1", password: "123456", full_name: "x", role: "hr" } });
  eq("4.4.5 แอบเป็น hr ไม่ได้", (await call("POST", "/auth/login", { body: { username: "hack1", password: "123456" } })).data.user.role, "evaluatee");
  sql("DELETE FROM users WHERE username='hack1'");

  // 3.10.6 หัวข้อจริง 2 + หัวข้อทดสอบ (เรียงตามคู่มือ ใช้ token เพราะ route ปัจจุบันมีด่านแล้ว)
  const tBody = (title) => ({ title, start_date: "2026-11-01", end_date: "2026-12-31" });
  eq("3.10.6 หัวข้อ id 1", (await call("POST", "/topics", { token: hr, body: { ...tBody("ด้านการจัดการเรียนการสอน"), description: "ประเมินการวางแผนและการจัดการเรียนรู้" } })).data.id, 1);
  eq("3.10.6 หัวข้อ id 2", (await call("POST", "/topics", { token: hr, body: { ...tBody("ด้านคุณลักษณะและการพัฒนาตนเอง"), description: "ประเมินวินัย การพัฒนาตนเอง และการมีส่วนร่วม" } })).data.id, 2);
  eq("3.10.6 หัวข้อทดสอบ id 3", (await call("POST", "/topics", { token: hr, body: tBody("ทดสอบ") })).data.id, 3);
  const topics = (await call("GET", "/topics", { token: hr })).data;
  eq("3.10.6 is_open = 1, indicators = [], วันที่ถูก", [topics[0].is_open, topics[0].indicators, topics[0].start_date], [1, [], "2026-11-01"]);
  eq("3.10.7 PUT id 3", (await call("PUT", "/topics/3", { token: hr, body: tBody("แก้แล้ว") })).code, 200);
  eq("3.10.8 DELETE id 3", (await call("DELETE", "/topics/3", { token: hr })).code, 200);

  // บท 05 ผู้ใช้
  eq("5.3.2 ทั้งหมด 6 คน", (await call("GET", "/users", { token: hr })).data.length, 6);
  eq("5.3.2 evaluatee 2 คน", (await call("GET", "/users?role=evaluatee", { token: hr })).data.length, 2);
  eq("5.3.2 ค้นหาสมชาย 1 คน", (await call("GET", `/users?q=${encodeURIComponent("สมชาย")}`, { token: hr })).data.length, 1);
  eq("5.3.2 กรรมการ q=comm 3 คน", (await call("GET", "/users?role=committee&q=comm", { token: hr })).data.length, 3);
  const teach1 = await login("teach1");
  eq("5.3.2 token teach1 ได้ 403", (await call("GET", "/users", { token: teach1 })).code, 403);
  eq("5.3.3 users/5 คือ teach1", (await call("GET", "/users/5", { token: hr })).data.username, "teach1");

  // 5.5 ตัวชี้วัด
  eq("5.5.1 ยังไม่มีตัวชี้วัด", (await call("GET", "/indicators?topic_id=2", { token: hr })).data, []);
  const inds = [[1, "การจัดทำแผนการจัดการเรียนรู้", 20, "scale_4", "file"], [1, "การใช้สื่อและเทคโนโลยีในการสอน", 15, "scale_4", "any"], [1, "การทำวิจัยในชั้นเรียน", 15, "yes_no", "file"], [2, "การเข้ารับการอบรมพัฒนาตนเอง", 10, "yes_no", "any"], [2, "การปฏิบัติตามระเบียบวินัย", 20, "scale_4", "none"], [2, "การมีส่วนร่วมในกิจกรรมสถานศึกษา", 20, "scale_4", "url"]];
  for (let i = 0; i < inds.length; i++) {
    const [topic_id, name, weight, score_type, evidence_type] = inds[i];
    eq(`5.5.2 ตัวชี้วัด id ${i + 1}`, (await call("POST", "/indicators", { token: hr, body: { topic_id, name, weight, score_type, evidence_type } })).data.id, i + 1);
  }
  eq("5.5.2 topic 2 มี id 4,5,6", (await call("GET", "/indicators?topic_id=2", { token: hr })).data.map((x) => x.id), [4, 5, 6]);
  const tmpInd = (await call("POST", "/indicators", { token: hr, body: { topic_id: 1, name: "ทดสอบ", weight: 5, score_type: "scale_4", evidence_type: "none" } })).data.id;
  eq("5.5.3 ลบตัวทดสอบ", (await call("DELETE", `/indicators/${tmpInd}`, { token: hr })).code, 200);

  // 5.6 มอบหมาย
  eq("5.6.1 ยังไม่มีการมอบหมาย", (await call("GET", "/assignments", { token: hr })).data, []);
  const asg = [[2, 5, "chair"], [3, 5, "member"], [4, 5, "member"], [2, 6, "chair"], [3, 6, "member"], [4, 6, "member"]];
  for (let i = 0; i < asg.length; i++) {
    const [committee_id, evaluatee_id, committee_role] = asg[i];
    const r = await call("POST", "/assignments", { token: hr, body: { committee_id, evaluatee_id, committee_role } });
    eq(`5.6.3 assignment id ${i + 1}`, [r.code, r.data?.id], [201, i + 1]);
  }
  eq("5.6.3 ประธานซ้ำ 400", (await call("POST", "/assignments", { token: hr, body: { committee_id: 3, evaluatee_id: 6, committee_role: "chair" } })).message, "ผู้รับการประเมินคนนี้มีประธานกรรมการแล้ว");
  eq("5.6.3 ไม่ใช่กรรมการ 400", (await call("POST", "/assignments", { token: hr, body: { committee_id: 5, evaluatee_id: 6, committee_role: "member" } })).message, "ผู้ใช้ที่เลือกไม่ใช่กรรมการ");
  eq("5.6.3 มอบหมายซ้ำ 400", (await call("POST", "/assignments", { token: hr, body: { committee_id: 4, evaluatee_id: 5, committee_role: "member" } })).message, "ข้อมูลซ้ำกับที่มีอยู่แล้ว");
  const a5 = (await call("GET", "/assignments?evaluatee_id=5", { token: hr })).data;
  eq("5.6.3 teach1 มี 3 แถว pending scored 0", [a5.length, a5.every((x) => x.status === "pending" && x.scored_count === 0)], [3, true]);
  eq("5.6.4 PUT assignment 2 เป็นประธาน 400", (await call("PUT", "/assignments/2", { token: hr, body: { committee_role: "chair" } })).code, 400);
  eq("5.6.4 PUT assignment 1 เป็นประธาน 200", (await call("PUT", "/assignments/1", { token: hr, body: { committee_role: "chair" } })).code, 200);

  // บท 06: teach3 เป็นบัญชีทดสอบ
  const t3id = (await call("POST", "/auth/register", { body: { username: "teach3", password: "123456", full_name: "ครูทดสอบ" } })).data.id;
  let testAsg = (await call("POST", "/assignments", { token: hr, body: { committee_id: 2, evaluatee_id: t3id, committee_role: "chair" } })).data.id;
  const t3 = await login("teach3"), comm1 = await login("comm1"), comm2 = await login("comm2"), teach2 = await login("teach2");
  const s0 = (await call("GET", "/self-evaluations", { token: t3 })).data.summary;
  eq("6.5 teach3 เริ่ม 0% ตัวชี้วัด 6", [s0.progress, s0.filled, s0.indicator_count], [0, 0, 6]);
  eq("6.5 teach3 PUT ตัวชี้วัด 2", (await call("PUT", "/self-evaluations/2", { token: t3, body: { score: 3 } })).code, 200);
  const ev = (await call("POST", "/self-evaluations/1/evidences", { token: t3, form: evForm("แผน", { file: true }) })).data.id;
  eq("6.6 teach1 โหลดไฟล์คนอื่น 403", (await call("GET", `/evidences/${ev}/file`, { token: teach1 })).code, 403);
  eq("6.6 ลบหลักฐาน", (await call("DELETE", `/evidences/${ev}`, { token: t3 })).code, 200);
  eq("6.7.3 comm1 มี 3 คน pending", (await call("GET", "/committee/assignments", { token: comm1 })).data.map((x) => x.status), ["pending", "pending", "pending"]);
  eq("6.7.5 งานทดสอบ scored 0", (await call("GET", `/committee/assignments/${testAsg}`, { token: comm1 })).data.summary.scored, 0);
  eq("6.7.5 งานของ comm2 ได้ 404", (await call("GET", "/committee/assignments/5", { token: comm1 })).code, 404);
  const six = [[1, 4], [2, 3], [3, 1], [4, 1], [5, 4], [6, 3]].map(([indicator_id, score]) => ({ indicator_id, score }));
  await call("PUT", `/committee/assignments/${testAsg}/scores`, { token: comm1, body: { scores: [{ indicator_id: 1, score: 4 }], summary_comment: "ดี" } });
  eq("6.7.8 ยังไม่ครบ 1/6", (await call("PUT", `/committee/assignments/${testAsg}/confirm`, { token: comm1, body: { signature: "data:image/png;base64,iVBORw0KGgo=" } })).message, "ยังให้คะแนนไม่ครบ (1/6 ตัวชี้วัด)");
  await call("PUT", `/committee/assignments/${testAsg}/scores`, { token: comm1, body: { scores: six, summary_comment: "ดีมาก" } });
  eq("6.7.8 ยืนยันงานทดสอบ", (await call("PUT", `/committee/assignments/${testAsg}/confirm`, { token: comm1, body: { signature: "data:image/png;base64,iVBORw0KGgo=" } })).code, 200);

  // 6.7.9 ข้อมูลจริง
  for (const [i, s] of [[1, 4], [2, 3], [3, 1], [4, 1], [5, 4], [6, 3]]) eq(`6.7.9 teach1 คะแนนตัวที่ ${i}`, (await call("PUT", `/self-evaluations/${i}`, { token: teach1, body: { score: s } })).code, 200);
  const evs = [[1, "แผนการจัดการเรียนรู้วิชาการเขียนโปรแกรมเว็บ", { file: true }], [2, "ใช้ Google Classroom ในทุกรายวิชา", { url: "https://classroom.google.com" }], [2, "ผลิตคลิปสอนบน YouTube 10 คลิป", { url: "https://youtube.com" }], [3, "วิจัยเรื่องการพัฒนาทักษะการเขียนโปรแกรมด้วย Pair Programming", { file: true }], [4, "อบรมหลักสูตร Full-stack Developer 30 ชั่วโมง", { url: "https://example.com/cert.pdf" }], [6, "ร่วมกิจกรรมจิตอาสาพัฒนาชุมชน", { url: "https://example.com/activity" }]];
  for (const [i, d, o] of evs) eq(`6.7.9 หลักฐาน ตัวที่ ${i}`, (await call("POST", `/self-evaluations/${i}/evidences`, { token: teach1, form: evForm(d, o) })).code, 201);
  for (const [i, s] of [[1, 3], [3, 0], [5, 3]]) eq(`6.7.9 teach2 คะแนนตัวที่ ${i}`, (await call("PUT", `/self-evaluations/${i}`, { token: teach2, body: { score: s } })).code, 200);
  eq("6.7.9 teach2 หลักฐาน", (await call("POST", "/self-evaluations/1/evidences", { token: teach2, form: evForm("แผนการจัดการเรียนรู้วิชาฐานข้อมูล", { file: true }) })).code, 201);
  eq("6.7.9 comm1 คะแนน", (await call("PUT", "/committee/assignments/1/scores", { token: comm1, body: { scores: six, summary_comment: "ปฏิบัติงานได้ดี มีหลักฐานครบถ้วน" } })).code, 200);
  eq("6.7.9 comm1 ยืนยัน", (await call("PUT", "/committee/assignments/1/confirm", { token: comm1, body: { signature: SIG } })).code, 200);
  eq("6.7.9 comm2 ร่าง", (await call("PUT", "/committee/assignments/2/scores", { token: comm2, body: { scores: [{ indicator_id: 1, score: 3 }, { indicator_id: 2, score: 2 }], summary_comment: "ควรเพิ่มหลักฐานด้านสื่อการสอน" } })).code, 200);
  eq("6.7.9 teach1 progress 100", (await call("GET", "/self-evaluations", { token: teach1 })).data.summary.progress, 100);
  const s2 = (await call("GET", "/self-evaluations", { token: teach2 })).data.summary;
  eq("6.7.9 teach2 33.33 filled 2", [s2.progress, s2.filled], [33.33, 2]);
  eq("6.7.9 เปลี่ยน score_type ไม่ได้", (await call("PUT", "/indicators/1", { token: hr, body: { topic_id: 1, name: "การจัดทำแผนการจัดการเรียนรู้", weight: 20, score_type: "yes_no", evidence_type: "file" } })).message, "ตัวชี้วัดนี้มีการให้คะแนนแล้ว เปลี่ยนรูปแบบการประเมินไม่ได้");

  // 6.8 รายงาน
  const sorted = (await call("GET", "/reports/evaluatees?sort=progress", { token: hr })).data;
  eq("6.8 teach1 บนสุด ตามด้วย teach2", sorted.slice(0, 2).map((x) => [x.username, x.progress]), [["teach1", 100], ["teach2", 33.33]]);
  const rep = (await call("GET", "/reports/evaluatees/5", { token: teach1 })).data;
  eq("6.8 teach1 confirmed 1", rep.summary.confirmed_count, 1);
  eq("6.8 ความเห็น comm2 ถูกซ่อน", rep.assignments.find((a) => a.id === 2).summary_comment, null);
  eq("6.8 ดูของ id 6 ไม่ได้", (await call("GET", "/reports/evaluatees/6", { token: teach1 })).code, 403);
  const comms = (await call("GET", "/reports/committees", { token: hr })).data;
  eq("6.8 มี 3 แถว comm1 total 3", [comms.length, comms[0].total], [3, 3]);

  // 6.9 ทดสอบรวม
  eq("6.9 teach3 progress 0", (await call("GET", "/self-evaluations", { token: t3 })).data.summary.progress, 0);
  eq("6.9 แบบมี/ไม่มี ให้ 3 ได้ 400", (await call("PUT", "/self-evaluations/3", { token: t3, body: { score: 3 } })).message, "คะแนนต้องเป็น 1 (มี) หรือ 0 (ไม่มี)");
  await call("DELETE", `/assignments/${testAsg}`, { token: hr });
  testAsg = (await call("POST", "/assignments", { token: hr, body: { committee_id: 2, evaluatee_id: t3id, committee_role: "chair" } })).data.id;
  eq("6.9 comm1 มีงาน 3 คน", (await call("GET", "/committee/assignments", { token: comm1 })).data.length, 3);
  eq("6.9 บันทึกร่าง", (await call("PUT", `/committee/assignments/${testAsg}/scores`, { token: comm1, body: { scores: [{ indicator_id: 1, score: 4 }], summary_comment: "ดี" } })).code, 200);
  eq("6.9 ยังไม่ครบ 1/6", (await call("PUT", `/committee/assignments/${testAsg}/confirm`, { token: comm1, body: { signature: "data:image/png;base64,iVBORw0KGgo=" } })).message, "ยังให้คะแนนไม่ครบ (1/6 ตัวชี้วัด)");
  eq("6.9 comm2 ดู teach3 ไม่ได้", (await call("GET", `/reports/evaluatees/${t3id}`, { token: comm2 })).message, "ไม่ได้รับมอบหมายให้ประเมินผู้นี้");
  eq("6.9 เก็บกวาด teach3", (await call("DELETE", `/users/${t3id}`, { token: hr })).code, 200);

  // บท 08-11
  const a5b = (await call("GET", "/assignments?evaluatee_id=5", { token: hr })).data.sort((x, y) => x.id - y.id);
  eq("8 สมชาย 3 สถานะ และ 6/2/0 ข้อ", a5b.map((x) => [x.status, x.scored_count]), [["confirmed", 6], ["draft", 2], ["pending", 0]]);
  const cr = (await call("GET", "/reports/committees/2", { token: hr })).data;
  eq("8 สรุปประเสริฐ 2 แถว", cr.rows.length, 2);
  const r6 = (await call("GET", "/reports/evaluatees/6", { token: teach2 })).data;
  eq("9 teach2 กรรมการ 0/3", [r6.summary.confirmed_count, r6.summary.committee_count], [0, 3]);
  const i3 = (await call("GET", "/self-evaluations", { token: teach2 })).data.topics[0].indicators.find((x) => x.id === 3);
  eq("9 วิจัยในชั้นเรียน แถบ 50%", i3.progress, 50);
  const cl = (await call("GET", "/committee/assignments", { token: comm1 })).data;
  eq("10 comm1 ทั้งหมด 2 ยังไม่ประเมิน 1 ยืนยัน 1", [cl.length, cl.filter((x) => x.status === "pending").length, cl.filter((x) => x.status === "confirmed").length], [2, 1, 1]);
  eq("10 สมชายอยู่ล่างสุด", cl[cl.length - 1].evaluatee_id, 5);
  const o = (await call("GET", "/reports/overview", { token: hr })).data;
  eq("11 counts", o.counts, { evaluatees: 2, committees: 3, topics: 2, open_topics: 2, indicators: 6 });
  eq("11 assignments", o.assignments, { total: 6, pending: 4, draft: 1, confirmed: 1 });
  eq("11 progress", o.progress, { average: 66.67, completed: 1, fully_evaluated: 0 });
  eq("11 scores", o.scores, { evaluated: 1, average: 91.25, max: 91.25, min: 91.25 });
  eq("11 topics avg", o.topics.map((t) => t.avg_percent), [92.5, 90]);
  eq("11 ranking", o.ranking.map((r) => [r.full_name, r.committee_percent]), [["สมชาย รักเรียน", 91.25]]);
  eq("11 issues", o.issues, []);
} catch (e) { fail++; console.log("ERROR", e.stack); }
finally {
  server?.kill();
  if (!process.env.KEEP_UPLOADS) for (const f of fs.readdirSync(`${BACKEND}/uploads`)) if (!uploadsBefore.has(f)) fs.rmSync(`${BACKEND}/uploads/${f}`);
}
console.log(`\nสรุป: ผ่าน ${pass} ไม่ผ่าน ${fail}`);
process.exit(0);
