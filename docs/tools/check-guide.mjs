// ตรวจคู่มือหลังแก้: ไม่เหลือ seed, โค้ดที่เพิ่มตรงไฟล์จริง, สร้าง HTML ใหม่
import fs from "node:fs";
import path from "node:path";
import { build } from "./render-guide.mjs";
const ROOT = import.meta.dirname.replace(/[\\/]docs[\\/]tools$/, ""), G = `${ROOT}/docs/guide`;
const problems = [];
const mds = fs.readdirSync(G).filter((f) => f.endsWith(".md"));
const banned = /seed|ข้อมูลตัวอย่าง|teach[3-5]\b(?!.*(ทดสอบ|teach3))|รีเซ็ตฐานข้อมูล.*ก่อน/;
for (const f of mds) {
  fs.readFileSync(`${G}/${f}`, "utf8").split(/\r?\n/).forEach((l, i) => {
    if (/seed/i.test(l)) problems.push(`เหลือคำว่า seed: ${f}:${i + 1}: ${l.slice(0, 100)}`);
    if (/ข้อมูลตัวอย่าง/.test(l)) problems.push(`เหลือ ข้อมูลตัวอย่าง: ${f}:${i + 1}: ${l.slice(0, 100)}`);
    if (/teach[45]\b|teach9\b/.test(l)) problems.push(`อ้างบัญชีที่ไม่มี: ${f}:${i + 1}: ${l.slice(0, 100)}`);
  });
}
// โค้ดในบล็อกที่เพิ่มต้องมีอยู่ในไฟล์จริง
const real = (files) => new Set(files.flatMap((f) => fs.readFileSync(`${ROOT}/${f}`, "utf8").split(/\r?\n/).map((l) => l.trim())));
const ck = (file, marker, files) => {
  const text = fs.readFileSync(`${G}/${file}`, "utf8").replace(/\r\n/g, "\n");
  const start = text.indexOf(marker);
  if (start < 0) { problems.push(`ไม่พบ ${marker}`); return; }
  const next = text.indexOf("\n## ", start + 5);
  const sec = text.slice(start, next < 0 ? undefined : next);
  const set = real(files);
  let lines = 0;
  for (const m of sec.matchAll(/```(?:js|jsx)\n([\s\S]*?)\n```/g)) for (const l of m[1].split("\n")) {
    const t = l.trim();
    if (!t || t.startsWith("// (ขั้น") || t.startsWith("{/* (ขั้น")) continue;
    lines++;
    if (!set.has(t)) problems.push(`โค้ดไม่ตรงไฟล์จริง [${marker}]: ${t.slice(0, 100)}`);
  }
  console.log(`ตรวจโค้ด ${marker}: ${lines} บรรทัด`);
};
ck("04-auth.md", "### ขั้นที่ 4.4.4", ["backend/schemas/user.js", "backend/schemas/auth.js", "backend/routes/auth.js"]);
ck("07-frontend-basics.md", "## 7.15", ["frontend/schemas/auth.js", "frontend/pages/register.js", "frontend/pages/login.js"]);
ck("12-testing.md", "## 12.7", ["backend/tests/api.test.js"]);

// ลิงก์ .md ระหว่างบท และลิงก์ไฟล์
for (const f of mds) for (const m of fs.readFileSync(`${G}/${f}`, "utf8").matchAll(/\]\((\.\.\/[^)#\s]+|[0-9A-Za-z-]+\.md)[^)]*\)/g)) {
  const t = path.resolve(G, decodeURIComponent(m[1]));
  if (!fs.existsSync(t)) problems.push(`ลิงก์เสีย: ${f} -> ${m[1]}`);
}
const html = build(G, `${G}/eva-guide.html`, new Date().toLocaleDateString("sv-SE"));
fs.writeFileSync(`${G}/eva-guide.html`, html);
console.log("eva-guide.html", Math.round(html.length / 1024), "KB; seed ใน HTML:", (html.match(/seed/gi) || []).length);
console.log(problems.length ? "PROBLEMS:\n" + problems.join("\n") : "no problems");
