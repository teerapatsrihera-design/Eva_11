// ตรวจเอกสาร: โค้ดตรงไฟล์จริง, ลิงก์ไม่เสีย, ครบทุกเส้น
import fs from "node:fs";
import path from "node:path";

const ROOT = import.meta.dirname.replace(/[\\/]docs[\\/]tools$/, ""), DIR = path.join(import.meta.dirname, ".out", "api-map-md"), BASE = path.join(ROOT, "docs/api-map");
const docs = fs.readdirSync(DIR).filter((f) => f.endsWith(".md"));
const problems = [];
let snippets = 0, links = 0;
const anchors = {};
for (const d of docs) anchors[d] = new Set([...fs.readFileSync(path.join(DIR, d), "utf8").matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => m[1]));

const allKeys = new Set();
for (const d of docs) {
  const text = fs.readFileSync(path.join(DIR, d), "utf8");
  for (const m of text.matchAll(/^### ((?:GET|POST|PUT|DELETE) \/api\S+)$/gm)) {
    if (allKeys.has(m[1])) problems.push(`เส้นซ้ำ: ${m[1]}`);
    allKeys.add(m[1]);
  }
  // โค้ดกับเลขบรรทัด
  const re = /\]\(\.\.\/\.\.\/([^)#]+)#L(\d+)(?:-L(\d+))?\)\)\n\n[\s\S]*?```[a-z]*\n([\s\S]*?)\n```/g;
  for (const m of text.matchAll(re)) {
    const file = decodeURIComponent(m[1]);
    const a = Number(m[2]), b = Number(m[3] ?? m[2]);
    const lines = fs.readFileSync(path.join(ROOT, file), "utf8").split(/\r?\n/);
    const real = lines.slice(a - 1, b).join("\n");
    snippets++;
    if (real !== m[4]) problems.push(`โค้ดไม่ตรง: ${d} -> ${file}#L${a}-${b}`);
  }
  // ลิงก์
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const [p, hash] = m[1].split("#");
    if (/^https?:/.test(m[1])) continue;
    links++;
    if (p) {
      const target = decodeURIComponent(path.resolve(p.endsWith(".md") ? DIR : BASE, p));
      if (!fs.existsSync(target)) { problems.push(`ลิงก์เสีย: ${d} -> ${m[1]}`); continue; }
      if (hash && p.endsWith(".md") && !anchors[path.basename(p)]?.has(hash)) problems.push(`anchor หาย: ${d} -> ${m[1]}`);
      if (hash?.startsWith("L")) {
        const max = fs.readFileSync(target, "utf8").split(/\r?\n/).length;
        const n = Number(hash.match(/L(\d+)(?:-L(\d+))?/).slice(1).filter(Boolean).pop());
        if (n > max) problems.push(`บรรทัดเกินไฟล์: ${d} -> ${m[1]}`);
      }
    } else if (!anchors[d].has(hash)) problems.push(`anchor หาย: ${d} -> #${hash}`);
  }
  // code fence ต้องเปิด-ปิดครบ
  const fences = (text.match(/^```/gm) || []).length;
  if (fences % 2) problems.push(`code fence ไม่ครบ: ${d}`);
}

// เทียบกับตารางใน README และ route จริง
const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
const readmeKeys = [...readme.matchAll(/^\| (GET|POST|PUT|DELETE) \| `(\/api[^`]+)` \|/gm)].map((m) => `${m[1]} ${m[2]}`);
for (const k of readmeKeys) if (!allKeys.has(k)) problems.push(`README มี แต่เอกสารไม่มี: ${k}`);
for (const k of allKeys) if (!readmeKeys.includes(k)) problems.push(`เอกสารมี แต่ README ไม่มี: ${k}`);

let routes = 0;
for (const f of fs.readdirSync(path.join(ROOT, "backend/routes"))) routes += (fs.readFileSync(path.join(ROOT, "backend/routes", f), "utf8").match(/^router\.(get|post|put|delete)\(/gm) || []).length;
routes += (fs.readFileSync(path.join(ROOT, "backend/app.js"), "utf8").match(/^app\.(get|post|put|delete)\("/gm) || []).length;

console.log({ docs, endpoints: allKeys.size, readme: readmeKeys.length, routesInCode: routes, snippets, links });
console.log(problems.length ? "PROBLEMS:\n" + problems.join("\n") : "no problems");
