// ประกอบเอกสาร docs/api-map จากข้อมูลรายเส้น + โค้ดจริง + ผลทดสอบจริง
import fs from "node:fs";
import path from "node:path";
import { ROOT, resolve, link, fileLink, lang, slug, extractSql, compact } from "./lib.mjs";
import { b, z, one, R, BS, FS, P, C, common, person1 } from "./spec1.mjs";
import { person2, person3 } from "./spec2.mjs";
import { OWNERS, GENERATED, ownerOf } from "./owners.mjs";
import { execSync } from "node:child_process";

const OUT = path.join(import.meta.dirname, ".out", "api-map-md");
fs.mkdirSync(OUT, { recursive: true });
const captures = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "captures.json"), "utf8"));

const FILES = { 0: "shared.md", 1: "person-1-hr.md", 2: "person-2-evaluatee.md", 3: "person-3-committee.md" };
// เจ้าของโค้ดส่วนกลางแต่ละชิ้น (แบ่งกันทำในชั่วโมงแรก ดูบท 14 ขั้น 14.2.2) อ่านจาก owners.mjs
const sharedOwner = (f) => ownerOf(f) ?? 1;

// ทุกไฟล์ของระบบต้องมีเจ้าของใน owners.mjs (กันลืมใส่ไฟล์ใหม่ใน "ไฟล์เต็ม")
{
  const git = (a) => execSync(`git -C "${ROOT}" ls-files ${a}`).toString().split("\n").filter(Boolean);
  const deleted = new Set(git("-d"));
  const files = git("-co --exclude-standard").filter((f) => !deleted.has(f) && (/^(backend|frontend)\//.test(f) || [".gitignore", ".env.example", "docker-compose.yml"].includes(f)));
  const missing = files.filter((f) => !ownerOf(f) && !GENERATED.includes(f));
  if (missing.length) throw new Error(`ไฟล์ยังไม่มีเจ้าของใน owners.mjs: ${missing.join(", ")}`);
  const gone = OWNERS.filter(([f]) => !fs.existsSync(path.join(ROOT, f))).map(([f]) => f);
  if (gone.length) throw new Error(`owners.mjs มีไฟล์ที่ไม่มีแล้ว: ${gone.join(", ")}`);
}

// ส่วน "ไฟล์เต็ม": ทั้งไฟล์พร้อมเลขบรรทัด ซ่อนไว้ในกล่องกดเปิด
const LANG = (f) => (/\.m?js$/.test(f) ? "js" : f.endsWith(".sql") ? "sql" : f.endsWith(".css") ? "css" : f.endsWith(".json") ? "json" : f.endsWith(".yml") ? "yaml" : f.endsWith("Dockerfile") ? "dockerfile" : f.endsWith(".env.example") ? "ini" : "text");
function fullFile(f, n) {
  const ls = fs.readFileSync(path.join(ROOT, f), "utf8").split(/\r?\n/);
  while (ls.length && ls.at(-1) === "") ls.pop();
  return [
    "<details>",
    `<summary>📄 ${f} (${ls.length} บรรทัด)</summary>`,
    "",
    `**${n}. ${f}** ([\`${f}\` บรรทัด 1-${ls.length}](${link(f, 1, ls.length)}))`,
    "",
    "```" + LANG(f) + "\n" + ls.join("\n") + "\n```",
    "",
    "</details>",
  ].join("\n");
}
const fullFiles = (list) => list.map(([f], i) => fullFile(f, i + 1)).join("\n\n");
const filesOf = (person, kind) => OWNERS.filter(([, p, k]) => p === person && k === kind);
const OWNER = { 0: "ส่วนกลาง (backend: คนที่ 1, หน้าเว็บ: คนที่ 2)", 1: "คนที่ 1 (hr)", 2: "คนที่ 2 (ผู้รับการประเมิน)", 3: "คนที่ 3 (กรรมการ)" };
const ACCESS = { public: "ไม่ต้อง login", all: "ทุกบทบาทที่ login แล้ว", hr: "hr", evaluatee: "ผู้รับการประเมิน", committee: "กรรมการ" };
const TOKEN = { all: "token ของผู้ที่ login", hr: "token ของ hr", evaluatee: "token ของผู้รับการประเมิน", committee: "token ของกรรมการ" };
const ROUTE_FILE = { "self-evaluations": "selfEvaluations" };

const fence = (l, code) => "```" + l + "\n" + code + "\n```";

function renderPiece(p, n, owned = false) {
  const r = resolve(p);
  const range = r.start === r.end ? `บรรทัด ${r.start}` : `บรรทัด ${r.start}-${r.end}`;
  const who = owned ? ` · คนที่ ${sharedOwner(r.file)} ทำ` : "";
  return [
    `**${n}. ${r.title}${who}** ([\`${r.file}\` ${range}](${link(r.file, r.start, r.end)}))`,
    r.note,
    fence(lang(r.file), r.code),
  ].join("\n\n");
}

const seenTables = new Map();
function tableBlock(name, currentFile) {
  const key = `${currentFile}:${name}`;
  if (seenTables.has(key)) {
    return `โครงตาราง \`${name}\` ดูได้ที่[หัวข้อแรกที่ใช้ตารางนี้](#table-${name.replace(/_/g, "-")})`;
  }
  seenTables.set(key, true);
  const r = resolve(b("backend/sql/schema.sql", `CREATE TABLE ${name} (`, "", ""));
  return `<a id="table-${name.replace(/_/g, "-")}"></a>\n\nโครงตาราง \`${name}\` ([\`backend/sql/schema.sql\` บรรทัด ${r.start}-${r.end}](${link(r.file, r.start, r.end)}))\n\n${fence("sql", r.code)}`;
}

function renderTest(e) {
  const c = captures[e.key];
  if (!c) throw new Error(`ไม่มีผลทดสอบของ ${e.key}`);
  const out = [];
  const head = [`${c.method} http://localhost:5000/api${decodeURI(c.url)}`];
  if (c.auth) head.push(`Authorization: Bearer <${TOKEN[e.access] || "token ของผู้ที่มีสิทธิ์"}>`);
  out.push(fence("", head.join("\n")));
  if (e.form) out.push(`**ส่งแบบ** ${e.form}`);
  else if (c.body) out.push("**Body (JSON)**", fence("json", JSON.stringify(c.body, null, 2)));
  if (c.response.binary) out.push(`**ผลที่ได้จริง (HTTP ${c.status}):** ได้ไฟล์กลับมา ชนิด \`${c.response.contentType}\``);
  else out.push(`**ผลที่ได้จริง (HTTP ${c.status})**`, fence("json", JSON.stringify(compact(c.response), null, 2)));

  const rows = [];
  if (e.access !== "public") rows.push([401, "ไม่ส่ง token หรือ token ไม่ถูกต้อง"]);
  if (["hr", "evaluatee", "committee"].includes(e.access)) rows.push([403, `role ไม่ใช่${ACCESS[e.access]}`]);
  rows.push(...e.errors);
  if (rows.length) out.push("**กรณีผิดพลาด**", ["| HTTP | เกิดเมื่อ |", "|---|---|", ...rows.map(([s, w]) => `| ${s} | ${w} |`)].join("\n"));
  return out.join("\n\n");
}

function renderEndpoint(e, docFile) {
  const parts = [`<a id="${slug(e.key)}"></a>`, `### ${e.key}`, `**${e.name}**`];
  if (e.intro) parts.push(e.intro);
  parts.push([
    "| หัวข้อ | รายละเอียด |",
    "|---|---|",
    `| ผู้รับผิดชอบ | ${OWNER[e.owner]} |`,
    `| สิทธิ์ | ${ACCESS[e.access] || e.access} |`,
    `| เกณฑ์ | ${e.criteria} |`,
    `| ต้องมีข้อมูลก่อน | ${e.needs} |`,
    `| หน้าเว็บ | ${e.page ? "`" + e.page.replace(/ \(/, "` (") .replace(/ และ /g, "` และ `").replace(/, /g, "`, `") + (e.page.includes(" (") ? "" : "`") : "ไม่มี"} |`,
  ].join("\n"));
  parts.push(`**เส้นทางของข้อมูล:** ${e.flow}`);

  // Frontend
  parts.push("#### 1. Frontend");
  if (e.noFe) parts.push(`เส้นนี้ไม่มีหน้าเว็บเรียกใช้: ${e.noFe}`);
  else {
    if (e.feIntro) parts.push(e.feIntro);
    e.fe.forEach((p, i) => parts.push(renderPiece(p, i + 1)));
  }

  // Backend
  parts.push("#### 2. Backend");
  const be = [];
  if (e.mount) be.push(one("backend/app.js", `app.use("/api/${e.mount}"`, "ผูก URL เข้ากับไฟล์ route", `ทำให้ทุก URL ที่ขึ้นต้นด้วย \`/api/${e.mount}\` ไปที่ไฟล์ route นี้`));
  if (e.guard) be.push(one(R(ROUTE_FILE[e.mount] || e.mount), "router.use(verifyToken", "ตรวจ token ทุกเส้นในไฟล์", "ต้องผ่านด่านนี้ก่อนถึง route ด้านล่าง"));
  be.push(...e.be);
  be.forEach((p, i) => parts.push(renderPiece(p, i + 1)));

  // Database
  parts.push("#### 3. Database");
  const sql = extractSql(e.be.map((p) => resolve(p).code));
  if (e.db.length) {
    parts.push(["| ตาราง | ใช้ทำอะไร |", "|---|---|", ...e.db.map(([t, u]) => `| \`${t}\` | ${u} |`)].join("\n"));
    e.db.forEach(([t]) => parts.push(tableBlock(t, docFile)));
  } else parts.push(e.dbNote || "เส้นนี้ไม่ใช้ตารางในฐานข้อมูล");
  if (sql.length) parts.push("**คำสั่ง SQL ที่เส้นนี้ใช้**", fence("sql", sql.join(";\n\n") + ";"));

  // Test
  parts.push("#### 4. วิธีทดสอบ (Thunder Client)", renderTest(e));
  if (e.after) parts.push(e.after);
  parts.push("---");
  return parts.join("\n\n");
}

const piecesSection = (list, owned = false) => list.map((p, i) => renderPiece(p, i + 1, owned)).join("\n\n");
const all = [...common, ...person1, ...person2, ...person3];

const summaryRow = (e) => `| [\`${e.key}\`](${FILES[e.owner]}#${slug(e.key)}) | ${e.name} | ${OWNER[e.owner]} |`;
const miniTable = (list) => ["| เส้น API | ทำอะไร | สิทธิ์ | ต้องมีข้อมูลก่อน |", "|---|---|---|---|", ...list.map((e) => `| [\`${e.key}\`](#${slug(e.key)}) | ${e.name} | ${ACCESS[e.access] || "ตามสิทธิ์"} | ${e.needs} |`)].join("\n");

function sections(list, docFile) {
  const out = [];
  for (const e of list) {
    if (e.section) out.push(`## ${e.section}`);
    out.push(renderEndpoint(e, docFile));
  }
  return out.join("\n\n");
}

const HOWTO = `## วิธีอ่านเอกสารนี้

แต่ละเส้น API แบ่งเป็น 4 ส่วน เรียงตามทางที่ข้อมูลเดินทาง

1. **Frontend**: Zod ฝั่งหน้าเว็บ, ฟอร์ม, โค้ดเรียก API และการแสดงผล
2. **Backend**: เส้นทาง URL, การตรวจสิทธิ์, Zod และ route
3. **Database**: ตาราง คอลัมน์ และคำสั่ง SQL
4. **วิธีทดสอบ**: สิ่งที่ส่งไป และผลที่ได้จริง

- เลขบรรทัดในกล่องโค้ดตรงกับไฟล์จริง กดปุ่ม 📍 เพื่อคัดลอกตำแหน่ง แล้วกด \`Ctrl + P\` ใน VS Code วางแล้วกด Enter จะเปิดไฟล์ตรงบรรทัดนั้น
- โค้ดในเอกสารตรงกับไฟล์จริง ณ วันที่ ${new Date().toLocaleDateString("th-TH", { dateStyle: "long" })} ถ้าแก้โค้ดภายหลัง เลขบรรทัดอาจคลาดได้ (ครูสร้างใหม่ได้ด้วย \`npm run map\` ใน docs/tools)
- ผลทดสอบมาจากการยิง API จริงบนฐานข้อมูลว่าง ถ้าผลเป็นรายการยาวจะแสดงเพียงรายการแรก และข้อความยาวจะถูกตัดด้วย \`...\`
- โค้ดที่ทุกเส้นใช้ร่วมกันอยู่ที่[ส่วนกลาง](shared.md#shared-code) เส้นอื่นจะไม่เขียนซ้ำ`;

const FOLDER = `## โครงไฟล์และเจ้าของงาน

"ส่วนกลาง" คือโค้ดที่ทุกคนใช้ร่วมกัน แบ่งกันทำคนละชิ้นในชั่วโมงแรก (เช่น "ส่วนกลาง: คนที่ 1" = คนที่ 1 เป็นคนทำ) หลังจากนั้นถ้าต้องแก้ ให้บอกเจ้าของชิ้นนั้นก่อน

\`\`\`text
backend/
├── app.js  server.js  db.js  env.js    ส่วนกลาง: คนที่ 1
├── middleware/ auth.js  validate.js    ส่วนกลาง: คนที่ 1
├── utils/
│   ├── response.js  password.js        ส่วนกลาง: คนที่ 1
│   ├── upload.js  backup.js            คนที่ 2
│   ├── dataCheck.js                    ส่วนกลาง: คนที่ 2 (reports.js ของคนที่ 3 ใช้)
│   └── score.js                        ส่วนกลาง: คนที่ 3 (คนที่ 2 ใช้ด้วย)
├── sql/schema.sql                      ส่วนกลาง: คนที่ 2 (ล็อกให้จบก่อนแยกกันทำ)
├── schemas/
│   ├── common.js  auth.js  user.js     ส่วนกลาง: คนที่ 1
│   ├── topic.js  indicator.js  assignment.js   คนที่ 1
│   ├── evaluation.js                   คนที่ 2
│   └── committee.js                    คนที่ 3
└── routes/
    ├── auth.js                         ส่วนกลาง: คนที่ 1
    ├── users.js  topics.js  indicators.js  assignments.js   คนที่ 1
    ├── profile.js  selfEvaluations.js  evidences.js  backups.js   คนที่ 2
    ├── committee.js                    คนที่ 3
    └── reports.js                      คนที่ 3 (เส้น overview เป็นของคนที่ 2)

frontend/
├── lib/ api.js  auth.js  validate.js  format.js  constants.js   ส่วนกลาง: คนที่ 3
├── schemas/
│   ├── auth.js  user.js                ส่วนกลาง: คนที่ 3
│   ├── topic.js  indicator.js          คนที่ 1
│   ├── evaluation.js                   คนที่ 2
│   └── committee.js                    คนที่ 3
├── components/
│   ├── Field.js  Modal.js  Layout.js  StatusBadge.js   ส่วนกลาง: คนที่ 1
│   ├── hr/ TopicModal.js  IndicatorModal.js  UserModal.js   คนที่ 1
│   ├── evaluatee/IndicatorCard.js      คนที่ 2
│   └── SignaturePad.js  EvaluationReport.js   คนที่ 3
└── pages/
    ├── _app.js  _document.js  index.js             ส่วนกลาง: คนที่ 1 (ตอนสร้างโปรเจกต์)
    ├── register.js  login.js  change-password.js   ส่วนกลาง: คนที่ 2
    ├── hr/ users.js  topics.js  assignments.js     คนที่ 1
    ├── profile.js  evaluatee/*  hr/index.js  hr/backups.js   คนที่ 2
    └── committee/*  hr/reports/*       คนที่ 3
\`\`\``;

const START = `## เริ่มต้นโปรเจกต์ (ไม่มีข้อมูลตัวอย่าง)

ระบบนี้ไม่ใช้ seed หรือ mock data ทุกคนใช้ข้อมูลจริงที่สร้างผ่านหน้าเว็บ

1. รัน \`docker compose up -d mysql\` จะได้ตารางเปล่า
2. สมัครสมาชิกที่หน้า \`/register\` ตาม[เส้นสมัครสมาชิก](#post-api-auth-register)
3. เปลี่ยนบัญชีแรกเป็น hr ในฐานข้อมูล แล้ว login ใหม่
4. hr สร้างกรรมการ หัวข้อ ตัวชี้วัด และมอบหมายงานผ่านหน้าเว็บ

### ใช้ฐานข้อมูลร่วมกันผ่านวง LAN

- ให้เครื่องของคนที่ 2 เปิด MySQL เพราะฟังก์ชัน Backup เรียก \`docker exec\` ไปยัง container บนเครื่องเดียวกัน
- เครื่องอื่นแก้ \`DB_HOST\` ใน \`.env\` เป็น IP ของเครื่องนั้น และเครื่องคนที่ 2 ต้องเปิด port 3306 ใน Windows Firewall
- ไฟล์หลักฐานอยู่ใน \`backend/uploads/\` ของเครื่องที่รับอัปโหลด จึงต้องทดสอบการดาวน์โหลดไฟล์บน Backend ตัวเดียวกัน
- ก่อนทดสอบ Restore ต้องบอกเพื่อน เพราะข้อมูลของทุกคนจะถูกเขียนทับ
- ล็อก \`schema.sql\` ให้จบตั้งแต่ต้น ไฟล์นี้รันแค่ตอนสร้างฐานข้อมูลครั้งแรก ถ้าแก้ภายหลังต้อง \`docker compose down -v\` ซึ่ง**ลบข้อมูลทั้งหมด**

### ลำดับการทำงาน (วันแข่ง 6 ชั่วโมง)

ตารางเดียวกับคู่มือ[บท 14 ขั้น 14.2.2](../guide/eva-guide.html#ch-14-h10) 3 คน 3 เครื่อง ทำพร้อมกัน ช่องที่มีคำว่า **push** คือจุดที่เพื่อนต้องรอ แล้ว \`git pull\` ไปใช้

| เวลา | คนที่ 1 (hr) | คนที่ 2 (DB + ผู้รับการประเมิน) | คนที่ 3 (กรรมการ + รายงาน) |
|---|---|---|---|
| 09.00-09.20 | สร้างโปรเจกต์ตามบท 01 (git init, .gitignore, .env.example, docker-compose, backend/frontend init, Tailwind/daisyUI) → **push** | วาด Class Diagram + เขียน \`schema.sql\` รอไว้ | วาด Flow Diagram 5 แผ่น |
| 09.20-10.00 **ส่วนกลาง คนละชิ้น** | \`DB_HOST\` = IP คนที่ 2 แล้วทำ backend ส่วนกลาง: env, db, response, password, app/server, middleware, schemas/common·auth·user, routes/auth + component กลาง: Field, Modal, Layout, StatusBadge → **push** | clone → \`docker compose up -d mysql\` → รัน \`schema.sql\` → **push schema (ล็อก ห้ามแก้อีก)** → หน้า login, register, change-password + \`utils/dataCheck.js\` → **push** | clone → \`DB_HOST\` = IP คนที่ 2 → frontend lib: api, auth, validate, format, constants + schemas/auth·user ฝั่งหน้าเว็บ → **push ก่อน 09.45** (หน้า login ของคนที่ 2 ต้องใช้) → \`utils/score.js\` → **push** |
| 10.00-10.10 | ทุกคน \`git pull\` แล้วรันได้ → สมัครบัญชีแรก คนที่ 2 เปลี่ยนเป็น hr ในฐานข้อมูล แล้วสมัครกรรมการและครูไว้ทดสอบ | (ทำด้วยกัน) | (ทำด้วยกัน) |
| 10.10-11.30 | users, topics, indicators, assignments (POST/GET ก่อน) + หน้า topics, users | profile + หน้าข้อมูลส่วนตัว, backups + หน้าสำรองข้อมูล, วาด Template หน้าจอ 5 แผ่น | committee: รายการงาน + รายละเอียด, โครงหน้าประเมิน, SignaturePad |
| 11.30-12.00 | PUT/DELETE ที่เหลือ + หน้ามอบหมาย → **สร้างหัวข้อ ตัวชี้วัด มอบหมายจริงให้เพื่อนใช้** | self-evaluations, evidences, \`upload.js\` | ช่องให้คะแนน, บันทึกคะแนน (PUT scores) |
| 12.00-12.30 | พักกินข้าว | พักกินข้าว | พักกินข้าว |
| 12.30-13.30 | ตรวจหน้า hr ครบ, README ส่วนหลักการ + ความปลอดภัย | หน้าประเมินตนเอง (IndicatorCard) | บันทึกร่าง, ยืนยัน + ลายเซ็น, routes/reports, EvaluationReport |
| 13.30-14.15 | unit test + API test, รวมตาราง endpoint ใน README | Dashboard (เส้น overview ใน \`reports.js\` ของคนที่ 3), หน้าผลการประเมิน (ใช้ EvaluationReport ของคนที่ 3) | หน้ารายงาน hr + CSV + พิมพ์ |
| 14.15-14.30 | ช่วยเพื่อนที่ช้าที่สุด | ช่วยเพื่อนที่ช้าที่สุด | ช่วยเพื่อนที่ช้าที่สุด |
| 14.30-14.50 | **หยุดเพิ่มฟีเจอร์** ทดสอบทั้ง flow ด้วยกัน (hr → ครู → กรรมการ → ครูดูผล → Dashboard) ดู Console และโหมดมือถือ | (ทำด้วยกัน) | (ทำด้วยกัน) |
| 14.50-15.00 | \`git pull\` รวมงาน → push → deploy (ถ้าต้องทำ) | ลบข้อมูลทดสอบผ่านหน้าเว็บ | ตรวจ README สมบูรณ์ |

ช่วง 09.20-10.00 ทุกคนทำส่วนกลางคนละชิ้นพร้อมกัน ไฟล์ไม่ซ้ำกันจึงไม่ชน ชิ้นที่ต้องใช้ของเพื่อน (เช่น หน้า login ต้องใช้ \`lib/api.js\` และ \`Field\`) เขียน import ล่วงหน้าตามชื่อในคู่มือได้เลย แล้วทดสอบจริงหลัง pull รวมตอน 10.00 รวมกับเส้นของตัวเองแล้วได้งานใกล้กัน คนละประมาณ 1,350 บรรทัด

กฎ 3 ข้อของทีม

1. \`git pull\` ก่อนเริ่มทุกช่วงเวลา และ push ทุกครั้งที่เสร็จ 1 ชิ้น
2. ไฟล์ส่วนกลางแก้ได้ แต่ต้องบอกเจ้าของชิ้นนั้นก่อนและ push ทันที (\`app.js\`, \`Layout.js\` → คนที่ 1 / \`lib/*\`, \`constants.js\` → คนที่ 3 / \`schema.sql\` ห้ามแก้หลัง 10.00)
3. ห้ามกู้คืนข้อมูล หรือ \`down -v\` ที่เครื่องคนที่ 2 โดยไม่บอกเพื่อน`;

const shared = [
  b("backend/db.js", "const pool = mysql.createPool", "การเชื่อมต่อ MySQL", "สร้าง pool ครั้งเดียว ทุก route import ไปใช้ `dateStrings` ทำให้วันที่เป็นข้อความ และ `decimalNumbers` ทำให้ DECIMAL เป็นตัวเลข"),
  b("backend/utils/response.js", "export const ok", "ตอบเมื่อสำเร็จ", "ทุกเส้นตอบรูปแบบ `{ status, message, data }` เหมือนกัน"),
  b("backend/utils/response.js", "export const fail", "ตอบเมื่อผิดพลาด", "ใส่ `return` หน้า `fail(...)` เสมอเพื่อจบการทำงาน"),
  b("backend/middleware/validate.js", "export const validate", "ตรวจ body ด้วย Zod", "ถ้าไม่ผ่านตอบ 400 พร้อมรายการช่องที่ผิด ถ้าผ่าน `req.body` จะเป็นข้อมูลที่แปลงแล้ว"),
  b("backend/middleware/auth.js", "export function verifyToken", "ตรวจ token", "อ่านจาก header `Authorization: Bearer ...` ถ้าถูกต้องจะได้ `req.user` คือ `{ id, role, full_name }`"),
  b("backend/middleware/auth.js", "export const requireRole", "ตรวจบทบาท", "ใช้ต่อจาก `verifyToken` ถ้า role ไม่อยู่ในรายการตอบ 403"),
  z("backend/app.js", 'app.use("/api/auth"', 'app.use("/api/backups"', "ผูก URL ทุกกลุ่ม", "1 บรรทัดต่อ 1 ไฟล์ route"),
  b("backend/app.js", "app.use((err, req, res, next)", "จัดการ error กลาง", "Express 5 ส่ง error จาก async มาที่นี่เอง จึงไม่ต้องเขียน try/catch ทุก route"),
  b("frontend/lib/api.js", "const api = axios.create", "ตัวเรียก API กลาง", "ทุกหน้าใช้ `api` ตัวนี้ และ `/api` ถูกส่งต่อไป Backend ผ่าน rewrites ใน `next.config.mjs`"),
  b("frontend/lib/api.js", "api.interceptors.request.use", "แนบ token อัตโนมัติ", "ทำงานก่อนส่งทุก request"),
  b("frontend/lib/api.js", "api.interceptors.response.use", "จัดการ token หมดอายุ", "ถ้าได้ 401 จะออกจากระบบ ยกเว้นตอนกด login"),
  b("frontend/lib/api.js", "export const errorMessage", "อ่านข้อความ error", "ถ้า Backend ไม่ตอบจะได้ข้อความ เชื่อมต่อเซิร์ฟเวอร์ไม่ได้"),
  b("frontend/lib/validate.js", "export const validateWith", "ใช้ Zod กับ React Hook Form", "แปลงผลของ `safeParse` ให้อยู่ในรูปแบบที่ฟอร์มต้องการ"),
  b("frontend/lib/auth.js", "export function useAuth", "ตรวจการ login ทุกหน้า", "อ่าน localStorage ใน `useEffect` และคืน `null` จนกว่าจะผ่าน จึงต้องมี `if (!user) return null;` ในทุกหน้า"),
  b("frontend/lib/auth.js", "export function logout", "ออกจากระบบ", "ลบ token แล้วกลับหน้า login"),
  b("frontend/components/Field.js", "export default function Field", "ช่องกรอกพร้อมข้อความ error", "ใช้ในทุกฟอร์ม"),
  b("frontend/components/Modal.js", "export default function Modal", "กล่อง Modal", "แสดงเมื่อถูก render ปิดโดยให้หน้าแม่เลิก render"),
];

const CRUD = `## แม่แบบ CRUD (จำชุดนี้ชุดเดียว)

เกือบทุกเส้นมีรูปแบบเดียวกับชุดนี้ เส้นอื่นจะอธิบายเฉพาะจุดที่ต่างออกไป ตัวอย่างใช้ \`topics\`

${piecesSection([
  b("backend/sql/schema.sql", "CREATE TABLE evaluation_topics (", "สร้างตาราง", "เริ่มจากตารางเสมอ ชื่อคอลัมน์จะไปใช้ต่อในทุกชั้น"),
  b(BS("topic"), "export const topicSchema", "Zod ฝั่ง Backend", "ชื่อฟิลด์ตรงกับคอลัมน์"),
  z(R("topics"), "const router = Router();", "export default router;", "route ครบ GET/POST/PUT/DELETE", "ลำดับในแต่ละ route: รับข้อมูล → query ด้วย `?` → ถ้าไม่พบตอบ 404 → ตอบด้วย `ok`"),
  one("backend/app.js", 'app.use("/api/topics"', "ผูก URL", "ลืมบรรทัดนี้จะได้ 404"),
  b(FS("topic"), "export const topicSchema", "Zod ฝั่งหน้าเว็บ", "กติกาตรงกับ Backend"),
  b(P("hr/topics"), "const load = () =>", "โหลดรายการ", "เรียกใน `useEffect` และเรียกซ้ำหลังบันทึกหรือลบ"),
  b(C("hr/TopicModal"), "const onSubmit", "เพิ่มหรือแก้ไข", "มี `item.id` ใช้ PUT ไม่มีใช้ POST"),
  b(P("hr/topics"), "const remove = async", "ลบ", "ถามยืนยัน ลบ แล้วโหลดใหม่"),
])}`;

const TROUBLE = `## ปัญหาที่เจอบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| 401 กรุณาเข้าสู่ระบบ | ไม่ได้ส่ง header \`Authorization\` | ใส่ \`Bearer <token>\` |
| 401 Token ไม่ถูกต้องหรือหมดอายุ | token เกิน 8 ชั่วโมง หรือ \`JWT_SECRET\` เปลี่ยน | login ใหม่ |
| 403 ไม่มีสิทธิ์เข้าถึง | role ไม่ตรง หรือเพิ่งเปลี่ยน role ใน DB | login ใหม่ เพราะ role อยู่ใน token |
| 400 ข้อมูลซ้ำกับที่มีอยู่แล้ว | ชื่อผู้ใช้หรืออีเมลซ้ำ | เปลี่ยนค่าใหม่ |
| 404 ไม่พบ endpoint นี้ | URL หรือ method ผิด หรือลืม \`app.use\` | ตรวจ URL และ \`backend/app.js\` |
| 500 เกิดข้อผิดพลาดในระบบ | โค้ดหรือ SQL ผิด | ดูข้อความใน terminal ของ Backend |
| เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ | Backend ไม่ได้รัน | รัน \`npm run dev\` ใน \`backend\` |
| \`ECONNREFUSED\` ตอนเรียก DB | MySQL ไม่ได้เปิด หรือ \`.env\` ผิด | รัน \`docker compose up -d mysql\` และตรวจ \`.env\` |
| \`Cannot find module\` ใน Backend | import ไม่ลงท้าย \`.js\` | เติม \`.js\` |
| \`localStorage is not defined\` | อ่าน localStorage นอก \`useEffect\` | ย้ายเข้า \`useEffect\` |
| หน้าเว็บขาวทั้งหน้า | ยังไม่ login หรือ role ไม่ตรง | เปิด Console และ login ใหม่ |
| หัวข้อนี้ไม่อยู่ในช่วงเวลาการประเมิน | วันที่ปัจจุบันอยู่นอกช่วงของหัวข้อ | hr แก้ช่วงวันของหัวข้อ |
| สำรองข้อมูลไม่สำเร็จ | \`DB_CONTAINER\` ไม่ตรงชื่อ container | ตรวจด้วย \`docker ps\` |
| แก้ \`schema.sql\` แล้วตารางไม่เปลี่ยน | ไฟล์นี้รันแค่ครั้งแรก | \`docker compose down -v\` แล้ว up ใหม่ (ข้อมูลหายทั้งหมด) |`;

const headShared = `# ส่วนกลาง: อ่านก่อนเริ่ม (ทั้ง 3 คน)

แผนที่โค้ดรายเส้น API ทุกเส้นบอกว่าใช้โค้ดอะไร อยู่ไฟล์ไหน บรรทัดไหน ตั้งแต่ Frontend, Backend ไปจนถึง Database

**ทุกคนอ่านไฟล์นี้ก่อน** มีเรื่องที่ทั้งทีมใช้ร่วมกัน และโค้ดส่วนกลางที่ 3 คนแบ่งกันทำคนละชิ้นในชั่วโมงแรก (เจ้าของแต่ละชิ้นดูที่[โครงไฟล์และเจ้าของงาน](#folders)) จากนั้นเปิดไฟล์ของตัวเอง: [คนที่ 1 งานบุคลากร](person-1-hr.md) · [คนที่ 2 ผู้รับการประเมิน](person-2-evaluatee.md) · [คนที่ 3 กรรมการ](person-3-committee.md)

- [สารบัญทุกเส้น](#all-api)
- [เริ่มต้นโปรเจกต์](#start)
- [โครงไฟล์และเจ้าของงาน](#folders)
- [ส่วนกลาง: โค้ดที่ทุกเส้นใช้](#shared-code)
- [แม่แบบ CRUD](#crud)
- [ปัญหาที่เจอบ่อย](#trouble)
- [API ส่วนกลาง](#common-api)

${HOWTO}

<a id="all-api"></a>

## สารบัญทุกเส้น (${all.length} เส้น)

| เส้น API | ทำอะไร | ผู้รับผิดชอบ |
|---|---|---|
${all.map(summaryRow).join("\n")}

<a id="start"></a>

${START}

<a id="folders"></a>

${FOLDER}

<a id="shared-code"></a>

## ส่วนกลาง: โค้ดที่ทุกเส้นใช้

แต่ละชิ้นมีป้ายบอกว่าใครเป็นคนทำในชั่วโมงแรก ถ้าต้องแก้ภายหลังให้บอกเจ้าของชิ้นนั้นก่อน

${piecesSection(shared, true)}

<a id="crud"></a>

${CRUD}

<a id="trouble"></a>

${TROUBLE}

<a id="common-api"></a>

# API ส่วนกลาง (${common.length} เส้น backend: คนที่ 1, หน้าเว็บ: คนที่ 2)

${miniTable(common)}

${sections(common, FILES[0])}

<a id="full-files"></a>

## ไฟล์เต็ม: สร้างจากศูนย์ตามลำดับนี้

ทุกไฟล์ของระบบมีครบในแผนที่ API (ไฟล์ส่วนกลางอยู่ที่นี่ ไฟล์ของแต่ละคนอยู่ท้ายไฟล์ของคนนั้น) กดชื่อไฟล์เพื่อเปิดดูทั้งไฟล์พร้อมเลขบรรทัด

1. **คนที่ 1 สร้างโปรเจกต์** ตาม[คู่มือบท 01](../guide/eva-guide.html#ch-01) (git init, npm install, create-next-app) แล้วแทนไฟล์ตั้งค่าด้วยไฟล์เต็มในหัวข้อถัดไป จากนั้น push
2. **ทุกคนทำส่วนกลางของตัวเอง** (หัวข้อส่วนกลาง คนที่ 1 / 2 / 3 ด้านล่าง) แล้ว push
3. **ทุกคนทำเส้นของตัวเองทีละเส้น** ตามเนื้อหาในไฟล์ของตัวเอง ทำเสร็จ 1 เส้นให้ทดสอบตาม "วิธีทดสอบ" ของเส้นนั้นก่อนทำเส้นต่อไป

### ต้องรอใคร (ลองสร้างจริงแล้วเจอ)

ไฟล์บางไฟล์ต้องใช้ไฟล์ของเพื่อน ถ้าทำก่อนเพื่อน push จะพัง ตามตารางนี้

| ไฟล์ / หน้า | ต้องใช้ของ | ถ้าทำก่อนจะเกิดอะไร | ทำอย่างไร |
|---|---|---|---|
| \`backend/app.js\` (คนที่ 1) | route ของทุกคน | backend เปิดไม่ได้ \`ERR_MODULE_NOT_FOUND\` เครื่องทุกคนที่ pull มาเปิดไม่ได้ด้วย | ตอนเริ่มใส่เฉพาะ \`import\` และ \`app.use\` ของ route ที่มีไฟล์แล้ว ทำ route ใหม่เสร็จ เจ้าของบอกคนที่ 1 ให้เพิ่ม 2 บรรทัดนั้น |
| \`selfEvaluations.js\`, \`dataCheck.js\` (คนที่ 2) | \`utils/score.js\` (คนที่ 3) | backend เปิดไม่ได้ | \`score.js\` เป็นส่วนกลางของคนที่ 3 ทำเสร็จในชั่วโมงแรก |
| \`routes/reports.js\` (คนที่ 3) | \`utils/dataCheck.js\` (คนที่ 2) | backend เปิดไม่ได้ | \`dataCheck.js\` เป็นส่วนกลางของคนที่ 2 ทำเสร็จในชั่วโมงแรก |
| เส้น \`/api/reports/overview\` (คนที่ 2) | ไฟล์ \`routes/reports.js\` (คนที่ 3) | ไม่มีไฟล์ให้พิมพ์ต่อ | ทำหลังคนที่ 3 push \`reports.js\` แล้ว pull ก่อนแก้ไฟล์นี้ทุกครั้ง เพราะแก้ไฟล์เดียวกัน 2 คน |
| \`pages/evaluatee/result.js\` (คนที่ 2) | \`components/EvaluationReport.js\` (คนที่ 3) | **\`next dev\` ขึ้น error 500 ทุกหน้า** (รวมหน้า login) ไม่ใช่แค่หน้านี้ | **ห้ามสร้างไฟล์นี้ก่อนคนที่ 3 push \`EvaluationReport.js\`** |
| หน้า \`/hr\` Dashboard (คนที่ 2) | - | หลัง login hr จะเห็น 404 | ระหว่างรอ คนที่ 1 เปิด \`/hr/topics\` ตรงๆ |
| หน้า \`/evaluatee\` (คนที่ 2) | API \`/api/reports/evaluatees/:id\` (คนที่ 3) | กล่อง "กรรมการยืนยันผลแล้ว" แสดง \`-\` | ไม่เป็นไร ใช้งานส่วนอื่นได้ |

> ⚠️ **กฎจากตารางนี้:** ห้าม push ไฟล์ที่ import ไฟล์ของเพื่อนที่ยังไม่มี ถ้าจำเป็นต้องเริ่มก่อน ให้เก็บไว้ในเครื่องตัวเอง (ยังไม่ \`git add\`) จนกว่าเพื่อน push

## ไฟล์ตั้งค่าโปรเจกต์ (คนที่ 1)

${fullFiles(filesOf(1, "config"))}

## ส่วนกลาง คนที่ 1

${fullFiles(filesOf(1, "shared"))}

## ส่วนกลาง คนที่ 2

${fullFiles(filesOf(2, "shared"))}

## ส่วนกลาง คนที่ 3

${fullFiles(filesOf(3, "shared"))}

## ไฟล์ทดสอบ (บท 12)

${fullFiles(OWNERS.filter(([, , k]) => k === "test"))}
`;

const REPORTS_NOTE = "\n\n> 💡 `backend/routes/reports.js` ทั้งไฟล์อยู่ในไฟล์ของคนที่ 3 เส้น overview (Dashboard) ของคนที่ 2 อยู่ในไฟล์เดียวกันนั้น ให้พิมพ์ต่อในไฟล์ของคนที่ 3";

const head = (title, list, file, extra, person) => `# ${title}

แผนที่โค้ดรายเส้น API ของคนที่รับผิดชอบส่วนนี้ มี ${list.length} เส้น

**อ่านก่อนเริ่ม:** [ไฟล์ส่วนกลาง](shared.md) (ลำดับงาน, โค้ดส่วนกลาง, [แม่แบบ CRUD](shared.md#crud) และ[ปัญหาที่เจอบ่อย](shared.md#trouble))

${extra}

## สรุปงานในไฟล์นี้

${miniTable(list)}

${sections(list, file)}

<a id="full-files"></a>

## ไฟล์เต็มของคนที่ ${person}

ทุกไฟล์ที่คนที่ ${person} เป็นคนทำ (ไม่รวมส่วนกลาง ซึ่งอยู่ใน[ไฟล์ส่วนกลาง](shared.md#full-files)) กดชื่อไฟล์เพื่อเปิดดูทั้งไฟล์ ใช้เทียบเมื่อติด หรือพิมพ์ส่วนที่เนื้อหาข้างบนไม่ได้แสดง (import, หัวไฟล์, ส่วนแสดงผลของหน้าเว็บ)${person === 2 ? REPORTS_NOTE : ""}

${fullFiles(filesOf(person, "own"))}
`;

fs.writeFileSync(path.join(OUT, FILES[0]), headShared);
fs.writeFileSync(path.join(OUT, FILES[1]), head("คนที่ 1: งานบุคลากร (hr)", person1, FILES[1], "เกณฑ์หลัก: 5.1.1-5.1.9 งานบุคลากร (หัวข้อ ตัวชี้วัด ผู้ใช้ มอบหมายกรรมการ)\n\nส่วนกลางที่คนที่ 1 ทำในชั่วโมงแรก: สร้างโปรเจกต์, backend ส่วนกลาง และ Field, Modal, Layout, StatusBadge (ดูโค้ดใน[ไฟล์ส่วนกลาง](shared.md#shared-code))", 1));
fs.writeFileSync(path.join(OUT, FILES[2]), head("คนที่ 2: ผู้รับการประเมิน + สำรองข้อมูล + Dashboard", person2, FILES[2], "เกณฑ์หลัก: 5.2 ผู้รับการประเมิน (10 คะแนน), 8.1 Dashboard, 8.3 และ 8.4 Backup/Restore\n\nส่วนกลางที่คนที่ 2 ทำในชั่วโมงแรก: เปิด MySQL กลางที่เครื่องตัวเอง, schema.sql, หน้า login, register, change-password และ `utils/dataCheck.js` (ดูโค้ดใน[ไฟล์ส่วนกลาง](shared.md#shared-code))", 2));
fs.writeFileSync(path.join(OUT, FILES[3]), head("คนที่ 3: กรรมการ + รายงาน", person3, FILES[3], "เกณฑ์หลัก: 5.3 กรรมการ (10 คะแนน), 5.1.10-5.1.13 รายงาน และ 8.5 Reporting\n\nส่วนกลางที่คนที่ 3 ทำในชั่วโมงแรก: frontend lib (api, auth, validate, format, constants), schemas ฝั่งหน้าเว็บ และ `utils/score.js` (ดูโค้ดใน[ไฟล์ส่วนกลาง](shared.md#shared-code))", 3));

console.log("endpoints:", { common: common.length, p1: person1.length, p2: person2.length, p3: person3.length, total: all.length });
for (const f of Object.values(FILES)) console.log(f, fs.readFileSync(path.join(OUT, f), "utf8").split("\n").length, "lines");
const missing = Object.keys(captures).filter((k) => !all.some((e) => e.key === k));
console.log("captures not documented:", missing);
