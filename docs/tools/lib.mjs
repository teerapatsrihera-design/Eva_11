// เครื่องมือดึงโค้ดจากไฟล์จริง และแปลงเป็น Markdown
import fs from "node:fs";
import path from "node:path";

export const ROOT = import.meta.dirname.replace(/[\\/]docs[\\/]tools$/, ""); // โฟลเดอร์หลักของโปรเจกต์
const cache = {};
export const lines = (f) => (cache[f] ??= fs.readFileSync(path.join(ROOT, f), "utf8").split(/\r?\n/));

function findOne(file, anchor, from = 0) {
  const ls = lines(file);
  const hits = [];
  for (let i = from; i < ls.length; i++) if (ls[i].includes(anchor)) hits.push(i);
  if (hits.length === 0) throw new Error(`ไม่พบ "${anchor}" ใน ${file}`);
  if (from === 0 && hits.length > 1) throw new Error(`"${anchor}" ซ้ำ ${hits.length} จุดใน ${file}: บรรทัด ${hits.map((h) => h + 1)}`);
  return hits[0];
}

export function resolve(p) {
  const ls = lines(p.file);
  let start, end;
  if (p.kind === "block") {
    start = findOne(p.file, p.anchor);
    let depth = 0, seen = false;
    for (end = start; end < ls.length; end++) {
      for (const c of ls[end]) {
        if ("([{".includes(c)) { depth++; seen = true; }
        if (")]}".includes(c)) depth--;
      }
      const t = ls[end].trim();
      const next = (ls[end + 1] ?? "").trim();
      const open = /(=>|=|,|\?|:|&&|\|\|)$/.test(t) || /^[.?:]/.test(next);
      if (depth === 0 && !open && (seen || t.endsWith(";"))) break;
    }
    if (end >= ls.length) throw new Error(`block ไม่จบ: ${p.anchor}`);
    while (start > 0 && ls[start - 1].trim().startsWith("//")) start--;
  } else {
    start = findOne(p.file, p.a);
    end = p.a === p.z ? start : findOne(p.file, p.z, start);
  }
  return { ...p, start: start + 1, end: end + 1, code: ls.slice(start, end + 1).join("\n") };
}

export const link = (file, a, b) =>
  `../../${file.split("/").map(encodeURIComponent).join("/")}#L${a}${b && b !== a ? `-L${b}` : ""}`;
export const fileLink = (file) => `../../${file.split("/").map(encodeURIComponent).join("/")}`;

export const lang = (file) => (file.endsWith(".sql") ? "sql" : "js");
export const slug = (key) => key.toLowerCase().replace(/[{}]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/-$/, "");

// ดึงคำสั่ง SQL จากโค้ด Backend
export function extractSql(codes) {
  const out = [];
  const add = (s) => {
    const clean = s.slice(1, -1).split("\n").map((l) => l.trim()).filter(Boolean).join("\n");
    if (!out.includes(clean)) out.push(clean);
  };
  for (const code of codes) {
    const base = code.match(/let sql = (`[\s\S]*?`)/);
    if (base) {
      const parts = [base[1].slice(1, -1).split("\n").map((l) => l.trim()).filter(Boolean).join("\n")];
      for (const m of code.matchAll(/sql \+= ("[^"]*")/g)) parts.push(`-- ต่อท้ายเมื่อมีตัวกรอง\n${m[1].slice(1, -1).trim()}`);
      const tail = code.match(/query\(sql \+ ("[^"]*")/);
      if (tail) parts.push(`-- ต่อท้ายเสมอ\n${tail[1].slice(1, -1).trim()}`);
      out.push(parts.join("\n"));
    }
    for (const m of code.matchAll(/\.query\(\s*(`[\s\S]*?`|"[^"]*")/g)) add(m[1]);
  }
  return out;
}

// ย่อ JSON ให้อ่านง่าย: array เหลือรายการแรก, ข้อความยาวถูกตัด
export function compact(v) {
  if (Array.isArray(v)) return v.length ? [compact(v[0])] : [];
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, compact(x)]));
  if (typeof v === "string" && v.length > 70) return v.slice(0, 40) + "...";
  return v;
}
