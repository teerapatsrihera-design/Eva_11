// ยิง API ทุกเส้นบน DB ว่าง แล้วเก็บ request/response จริงไว้ใช้ในเอกสาร
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BACKEND = path.join(import.meta.dirname.replace(/[\\/]docs[\\/]tools$/, ""), "backend");
const OUT = path.join(import.meta.dirname, "captures.json");
const PORT = 15000;
const BASE = `http://127.0.0.1:${PORT}/api`;
const env = { ...process.env, PORT: String(PORT), DB_HOST: "127.0.0.1", DB_PORT: "13306", DB_USER: "root", DB_PASSWORD: "testpw", DB_NAME: "eva_test", DB_CONTAINER: "eva_api_test", JWT_SECRET: "test_secret_for_flow", JWT_EXPIRES_IN: "8h" };

const backupsBefore = new Set(fs.readdirSync(`${BACKEND}/backups`));
const server = spawn("node", ["server.js"], { cwd: BACKEND, env, stdio: "ignore" });
const sql = (q) => execFileSync("docker", ["exec", "eva_api_test", "mysql", "-h127.0.0.1", "-uroot", "-ptestpw", "eva_test", "-N", "-e", q], { stdio: ["ignore", "pipe", "ignore"] }).toString();

for (let i = 0; i < 40; i++) {
  try { if ((await fetch(`${BASE}/health`)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 250));
}

const captures = {};
const problems = [];
async function call(key, method, url, { token, body, form, expect = 200, save = true } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(BASE + url, { method, headers, body: form ?? (body ? JSON.stringify(body) : undefined) });
  const type = res.headers.get("content-type") || "";
  const buf = Buffer.from(await res.arrayBuffer());
  const data = type.includes("json") ? JSON.parse(buf.toString()) : { binary: true, contentType: type, bytes: buf.length };
  if (res.status !== expect) problems.push(`${key}: expected ${expect} got ${res.status} ${JSON.stringify(data).slice(0, 200)}`);
  if (save) captures[key] = { method, url, status: res.status, auth: !!token, body: body ?? (form ? "form-data" : undefined), response: data };
  return { status: res.status, data: data.data, raw: buf };
}

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
try {
  await call("GET /api/health", "GET", "/health");

  // บัญชีแรก: สมัคร แล้วเปลี่ยนเป็น hr ใน DB
  await call("POST /api/auth/register", "POST", "/auth/register", { expect: 201, body: { username: "hr_admin", password: "123456", full_name: "สมศรี ใจดี", email: "hr@school.ac.th", phone: "0810000001", position: "เจ้าหน้าที่งานบุคลากร", department: "งานบุคลากร" } });
  sql("UPDATE users SET role='hr' WHERE username='hr_admin'");
  const hr = (await call("POST /api/auth/login", "POST", "/auth/login", { body: { username: "hr_admin", password: "123456" } })).data.token;
  const reg = await call("x", "POST", "/auth/register", { expect: 201, save: false, body: { username: "teach_a", password: "123456", full_name: "สมชาย รักเรียน", department: "แผนกเทคโนโลยีสารสนเทศ" } });
  const teacherId = reg.data.id;
  const teacher = (await call("x", "POST", "/auth/login", { save: false, body: { username: "teach_a", password: "123456" } })).data.token;

  // กรรมการ
  const c1 = await call("POST /api/users", "POST", "/users", { token: hr, expect: 201, body: { username: "comm_a", full_name: "ประเสริฐ วงศ์ดี", email: "comm@school.ac.th", phone: "0810000002", position: "รองผู้อำนวยการ", department: "ฝ่ายวิชาการ", role: "committee" } });
  const tempLogin = await call("x", "POST", "/auth/login", { save: false, body: { username: "comm_a", password: c1.data.temp_password } });
  await call("PUT /api/auth/change-password", "PUT", "/auth/change-password", { token: tempLogin.data.token, body: { old_password: c1.data.temp_password, new_password: "newpass1" } });
  const committee = (await call("x", "POST", "/auth/login", { save: false, body: { username: "comm_a", password: "newpass1" } })).data.token;

  await call("GET /api/users", "GET", "/users?role=committee&q=ประเสริฐ".replace("ประเสริฐ", encodeURIComponent("ประเสริฐ")), { token: hr });
  await call("GET /api/users/{id}", "GET", `/users/${c1.data.id}`, { token: hr });
  await call("PUT /api/users/{id}", "PUT", `/users/${c1.data.id}`, { token: hr, body: { username: "comm_a", full_name: "ประเสริฐ วงศ์ดี", email: "comm@school.ac.th", phone: "0810000002", position: "รองผู้อำนวยการฝ่ายวิชาการ", department: "ฝ่ายวิชาการ" } });

  const csv = new FormData();
  csv.append("file", new Blob(["username,full_name,role\nimp_a,นำเข้า หนึ่ง,evaluatee\nimp_b,นำเข้า สอง,committee\n"], { type: "text/csv" }), "users.csv");
  const imported = await call("POST /api/users/import", "POST", "/users/import", { token: hr, form: csv, expect: 201 });
  const importedList = (await call("x", "GET", "/users?q=imp_", { token: hr, save: false })).data;
  await call("PUT /api/users/{id}/reset-password", "PUT", `/users/${importedList[0].id}/reset-password`, { token: hr });
  await call("DELETE /api/users/{id}", "DELETE", `/users/${importedList[0].id}`, { token: hr });
  await call("x", "DELETE", `/users/${importedList[1].id}`, { token: hr, save: false });

  // หัวข้อ
  const topic = (await call("POST /api/topics", "POST", "/topics", { token: hr, expect: 201, body: { title: "ด้านการจัดการเรียนการสอน", description: "ประเมินการวางแผนและการจัดการเรียนรู้", start_date: "2026-11-01", end_date: "2026-12-31" } })).data.id;
  const topic2 = (await call("x", "POST", "/topics", { token: hr, expect: 201, save: false, body: { title: "หัวข้อที่จะลบ", start_date: "2026-11-01", end_date: "2026-12-31" } })).data.id;
  await call("PUT /api/topics/{id}", "PUT", `/topics/${topic}`, { token: hr, body: { title: "ด้านการจัดการเรียนการสอน", description: "ประเมินการวางแผนและการจัดการเรียนรู้", start_date: "2026-11-01", end_date: "2026-12-31" } });
  await call("DELETE /api/topics/{id}", "DELETE", `/topics/${topic2}`, { token: hr });

  // ตัวชี้วัด
  const ind1 = (await call("POST /api/indicators", "POST", "/indicators", { token: hr, expect: 201, body: { topic_id: topic, name: "การจัดทำแผนการจัดการเรียนรู้", description: "มีแผนครบทุกรายวิชา", weight: 60, score_type: "scale_4", evidence_type: "any", evidence_note: "ไฟล์ PDF แผนการสอน" } })).data.id;
  const ind2 = (await call("x", "POST", "/indicators", { token: hr, expect: 201, save: false, body: { topic_id: topic, name: "การทำวิจัยในชั้นเรียน", weight: 40, score_type: "yes_no", evidence_type: "none" } })).data.id;
  const ind3 = (await call("x", "POST", "/indicators", { token: hr, expect: 201, save: false, body: { topic_id: topic, name: "ตัวชี้วัดที่จะลบ", weight: 1, score_type: "yes_no", evidence_type: "none" } })).data.id;
  await call("GET /api/indicators", "GET", `/indicators?topic_id=${topic}`, { token: hr });
  await call("GET /api/indicators/{id}", "GET", `/indicators/${ind1}`, { token: hr });
  await call("PUT /api/indicators/{id}", "PUT", `/indicators/${ind1}`, { token: hr, body: { topic_id: topic, name: "การจัดทำแผนการจัดการเรียนรู้", description: "มีแผนครบทุกรายวิชาที่สอน", weight: 60, score_type: "scale_4", evidence_type: "any", evidence_note: "ไฟล์ PDF แผนการสอน" } });
  await call("DELETE /api/indicators/{id}", "DELETE", `/indicators/${ind3}`, { token: hr });
  await call("GET /api/topics", "GET", "/topics", { token: hr });
  await call("GET /api/topics/{id}", "GET", `/topics/${topic}`, { token: hr });

  // มอบหมาย
  const asg = (await call("POST /api/assignments", "POST", "/assignments", { token: hr, expect: 201, body: { committee_id: c1.data.id, evaluatee_id: teacherId, committee_role: "member" } })).data.id;
  const c2 = await call("x", "POST", "/users", { token: hr, expect: 201, save: false, body: { username: "comm_b", full_name: "วิไล สายทอง", role: "committee" } });
  const asg2 = (await call("x", "POST", "/assignments", { token: hr, expect: 201, save: false, body: { committee_id: c2.data.id, evaluatee_id: teacherId, committee_role: "member" } })).data.id;
  await call("PUT /api/assignments/{id}", "PUT", `/assignments/${asg}`, { token: hr, body: { committee_role: "chair" } });
  await call("GET /api/assignments", "GET", `/assignments?evaluatee_id=${teacherId}`, { token: hr });
  await call("DELETE /api/assignments/{id}", "DELETE", `/assignments/${asg2}`, { token: hr });

  // ผู้รับการประเมิน
  await call("GET /api/profile", "GET", "/profile", { token: teacher });
  await call("PUT /api/profile", "PUT", "/profile", { token: teacher, body: { full_name: "สมชาย รักเรียน", email: "teach@school.ac.th", phone: "0810000005", position: "ครู", department: "แผนกเทคโนโลยีสารสนเทศ" } });
  await call("PUT /api/self-evaluations/{indicatorId}", "PUT", `/self-evaluations/${ind1}`, { token: teacher, body: { score: 4 } });
  await call("x", "PUT", `/self-evaluations/${ind2}`, { token: teacher, save: false, body: { score: 1 } });
  const f = new FormData();
  f.append("description", "แผนการจัดการเรียนรู้วิชาการเขียนโปรแกรมเว็บ");
  f.append("file", new Blob([PDF], { type: "application/pdf" }), "plan.pdf");
  const ev1 = (await call("POST /api/self-evaluations/{indicatorId}/evidences", "POST", `/self-evaluations/${ind1}/evidences`, { token: teacher, form: f, expect: 201 })).data.id;
  const f2 = new FormData();
  f2.append("description", "ลิงก์สื่อการสอน");
  f2.append("url", "https://example.com/plan");
  const ev2 = (await call("x", "POST", `/self-evaluations/${ind1}/evidences`, { token: teacher, form: f2, expect: 201, save: false })).data.id;
  await call("GET /api/self-evaluations", "GET", "/self-evaluations", { token: teacher });
  await call("GET /api/evidences/{id}/file", "GET", `/evidences/${ev1}/file`, { token: teacher });
  await call("DELETE /api/evidences/{id}", "DELETE", `/evidences/${ev2}`, { token: teacher });

  // กรรมการ
  await call("GET /api/committee/assignments", "GET", "/committee/assignments", { token: committee });
  await call("PUT /api/committee/assignments/{id}/scores", "PUT", `/committee/assignments/${asg}/scores`, { token: committee, body: { scores: [{ indicator_id: ind1, score: 3 }, { indicator_id: ind2, score: 1 }], summary_comment: "ปฏิบัติงานได้ดี มีหลักฐานครบถ้วน" } });
  await call("GET /api/committee/assignments/{id}", "GET", `/committee/assignments/${asg}`, { token: committee });
  await call("PUT /api/committee/assignments/{id}/confirm", "PUT", `/committee/assignments/${asg}/confirm`, { token: committee, body: { signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" } });

  // รายงาน
  await call("GET /api/reports/overview", "GET", "/reports/overview", { token: hr });
  await call("GET /api/reports/evaluatees", "GET", "/reports/evaluatees?sort=score", { token: hr });
  await call("GET /api/reports/evaluatees/{id}", "GET", `/reports/evaluatees/${teacherId}`, { token: teacher });
  await call("GET /api/reports/committees", "GET", "/reports/committees", { token: hr });
  await call("GET /api/reports/committees/{id}", "GET", `/reports/committees/${c1.data.id}`, { token: hr });

  // สำรอง/กู้คืน
  const name = (await call("POST /api/backups", "POST", "/backups", { token: hr, expect: 201 })).data.name;
  await call("GET /api/backups", "GET", "/backups", { token: hr });
  const dl = await call("GET /api/backups/{name}/download", "GET", `/backups/${name}/download`, { token: hr });
  await call("POST /api/backups/{name}/restore", "POST", `/backups/${name}/restore`, { token: hr });
  const up = new FormData();
  up.append("file", new Blob([dl.raw], { type: "application/sql" }), name);
  await call("POST /api/backups/restore", "POST", "/backups/restore", { token: hr, form: up });
  await call("DELETE /api/backups/{name}", "DELETE", `/backups/${name}`, { token: hr });

  // ลบไฟล์หลักฐานที่ทดสอบ (ไม่เก็บผล เส้นนี้เก็บไปแล้ว)
  await call("x", "DELETE", `/evidences/${ev1}`, { token: teacher, save: false });
} finally {
  server.kill();
  for (const f of fs.readdirSync(`${BACKEND}/backups`)) if (!backupsBefore.has(f)) fs.rmSync(`${BACKEND}/backups/${f}`);
}

fs.writeFileSync(OUT, JSON.stringify(captures, null, 2));
console.log("captured:", Object.keys(captures).length);
console.log(problems.length ? "PROBLEMS:\n" + problems.join("\n") : "no problems");
process.exit(0);
