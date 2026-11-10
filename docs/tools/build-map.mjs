// แปลงแผนที่ API (Markdown ชั่วคราว) เป็น docs/api-map/*.html หน้าตาเดียวกับ eva-guide.html
import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";

const ROOT = import.meta.dirname.replace(/[\\/]docs[\\/]tools$/, "");
const MD = path.join(import.meta.dirname, ".out", "api-map-md"), OUT = path.join(ROOT, "docs/api-map");
const TPL = fs.readFileSync(path.join(ROOT, "docs/guide/eva-guide.html"), "utf8");
const DATE = new Date().toLocaleDateString("sv-SE");
const DOCS = [
  { f: "shared", nav: "ส่วนกลาง (อ่านก่อน)", eyebrow: "ทั้ง 3 คน อ่านก่อนเริ่ม", h1: "ส่วนกลาง", sub: "เริ่มต้นโปรเจกต์, ลำดับงานวันแข่ง, โค้ดส่วนกลาง, แม่แบบ CRUD และ API ส่วนกลาง 4 เส้น" },
  { f: "person-1-hr", nav: "คนที่ 1", eyebrow: "คนที่ 1", h1: "งานบุคลากร (hr)", sub: "API ของงานบุคลากร: ผู้ใช้ หัวข้อ ตัวชี้วัด และการมอบหมายกรรมการ" },
  { f: "person-2-evaluatee", nav: "คนที่ 2", eyebrow: "คนที่ 2", h1: "ผู้รับการประเมิน + สำรองข้อมูล + Dashboard", sub: "API ของผู้รับการประเมิน, Backup/Restore และ Dashboard" },
  { f: "person-3-committee", nav: "คนที่ 3", eyebrow: "คนที่ 3", h1: "กรรมการ + รายงาน", sub: "API ของกรรมการ และรายงานผลการประเมิน" },
];

const escCode = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const esc = (s) => escCode(s).replace(/'/g, "&#39;");
const strip = (s) => s.replace(/<[^>]+>/g, "");

const EXTRA_CSS = `<style>
:root{--m-get:#1a7f4b;--m-post:#1f5fbf;--m-put:#b0650f;--m-del:#c0392b;--fe:#1f5fbf;--be:#1a7f4b;--db:#b0650f;--test:#7a3fb5}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--m-get:#4fc98a;--m-post:#6fa8f0;--m-put:#eba95a;--m-del:#ef8378;--fe:#6fa8f0;--be:#4fc98a;--db:#eba95a;--test:#c196ee}}
:root[data-theme="dark"]{--m-get:#4fc98a;--m-post:#6fa8f0;--m-put:#eba95a;--m-del:#ef8378;--fe:#6fa8f0;--be:#4fc98a;--db:#eba95a;--test:#c196ee}
.doc-nav{display:grid;gap:4px}
.doc-nav a{display:block;padding:5px 10px;border-radius:8px;text-decoration:none;color:var(--text);font-size:14px;border:1px solid var(--line)}
.doc-nav a.current{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}
.method{display:inline-block;min-width:4.2em;text-align:center;padding:1px 8px;border-radius:6px;font-size:.78em;font-weight:700;letter-spacing:.02em;color:#fff;margin-right:6px;vertical-align:.08em;font-family:Consolas,"Cascadia Mono",monospace}
.m-get{background:var(--m-get)}.m-post{background:var(--m-post)}.m-put{background:var(--m-put)}.m-delete{background:var(--m-del)}
:root:not([data-theme="light"]) .method{color:#fff}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .method{color:#14161a}}
:root[data-theme="dark"] .method{color:#14161a}
.step>h3.step-h code{background:none;padding:0;font-size:1em;color:inherit;font-weight:700}
.api-name{margin:-4px 0 12px;font-weight:600}
h4.layer{margin:26px 0 10px;padding:6px 12px;border-left:5px solid;border-radius:0 8px 8px 0;font-size:1.05rem;background:var(--panel)}
.layer-fe{border-color:var(--fe);color:var(--fe)}.layer-be{border-color:var(--be);color:var(--be)}.layer-db{border-color:var(--db);color:var(--db)}.layer-test{border-color:var(--test);color:var(--test)}
.piece{margin:18px 0 6px;font-weight:600;display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px}
.loc{font:13px Consolas,"Cascadia Mono",monospace;padding:2px 9px;border-radius:999px;border:1px solid var(--line);background:var(--bg);color:var(--muted);cursor:pointer;overflow-wrap:anywhere;text-align:left}
.loc:hover{border-color:var(--accent);color:var(--accent)}
.loc.copied{background:var(--accent);border-color:var(--accent);color:#fff}
@media (max-width:900px){.step{padding:4px 12px 14px}}
main details{border:1px solid var(--line);border-radius:10px;padding:6px 12px;margin:8px 0;min-width:0;max-width:100%}
main details summary{cursor:pointer;font-weight:600;overflow-wrap:anywhere}
main details[open] summary{margin-bottom:6px}
</style>
`;

function renderDoc(doc) {
  const md = fs.readFileSync(path.join(MD, doc.f + ".md"), "utf8");
  const sections = [];
  const toc = [];
  let cur = null, pendingId = null, lastStart = null, secN = 0, heads = 0;
  const marked = new Marked({ gfm: true, breaks: false });
  const inlineLink = {
    renderer: {
      code({ text, lang }) {
        const label = lang || "text";
        const start = lastStart;
        lastStart = null;
        const canNumber = ["js", "sql"].includes(lang) && start != null;
        if (canNumber) {
          const body = text.split("\n").map((l) => `<span class="ln">${escCode(l)}</span>`).join("\n");
          return `<div class="code"><div class="code-bar"><span>${esc(label)}</span><button type="button" class="copy">คัดลอก</button></div><pre class="numbered"><code style="counter-reset:ln ${start - 1}">${body}</code></pre></div>\n`;
        }
        return `<div class="code"><div class="code-bar"><span>${esc(label)}</span><button type="button" class="copy">คัดลอก</button></div><pre><code>${escCode(text)}</code></pre></div>\n`;
      },
      table(token) {
        const cell = (c, tag) => `<${tag}${c.align ? ` align="${c.align}"` : ""}>${this.parser.parseInline(c.tokens)}</${tag}>\n`;
        const header = `<tr>\n${token.header.map((c) => cell(c, "th")).join("")}</tr>\n`;
        const body = token.rows.map((r) => `<tr>\n${r.map((c) => cell(c, "td")).join("")}</tr>\n`).join("");
        return `<div class="table-wrap"><table>\n<thead>\n${header}</thead>\n${body ? `<tbody>${body}</tbody>` : ""}</table>\n</div>\n`;
      },
      link({ href, tokens }) {
        const inner = this.parser.parseInline(tokens);
        const src = href.match(/^\.\.\/\.\.\/([^#]+)#L(\d+)(?:-L(\d+))?$/);
        if (src) {
          const file = decodeURIComponent(src[1]);
          lastStart = Number(src[2]);
          const label = strip(inner).replace(/&#39;/g, "'");
          return `<button type="button" class="loc" data-loc="${esc(file)}:${src[2]}" title="คัดลอกตำแหน่ง แล้วกด Ctrl + P ใน VS Code">📍 ${label}</button>`;
        }
        return `<a href="${esc(href.replace(/\.md(#|$)/, ".html$1"))}">${inner}</a>`;
      },
    },
  };
  marked.use(inlineLink);
  const tokens = marked.lexer(md);

  const parse = (ts) => marked.parser(ts);
  const open = (id, titleHtml, depth1) => {
    cur = { id, titleHtml, body: [], steps: 0, items: [] };
    sections.push(cur);
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === "space" || t.type === "hr") continue;
    if (t.type === "html") {
      const m = t.raw.match(/^<a id="([^"]+)"><\/a>/);
      if (m) {
        const next = tokens.slice(i + 1).find((x) => x.type !== "space");
        if (next?.type === "heading") { pendingId = m[1]; continue; }
      }
    }
    if (t.type === "heading") {
      const title = marked.parseInline ? marked.parseInline(t.text) : t.text;
      if (t.depth <= 2) {
        // หัวข้อแรกของเอกสารแสดงอยู่บนปก จึงไม่ต้องขึ้นซ้ำ
        if (t.depth === 1 && i === 0) { open("sec-intro", "เริ่มต้นอ่าน"); pendingId = null; continue; }
        open(pendingId || `sec-${++secN}`, title);
        pendingId = null;
        continue;
      }
      if (!cur) open("sec-intro", "เริ่มต้นอ่าน");
      if (t.depth === 3) {
        const api = t.text.match(/^(GET|POST|PUT|DELETE) (\/api\S+)$/);
        const id = pendingId || `h-${++heads}`;
        pendingId = null;
        if (api) {
          cur.steps++;
          cur.items.push({ id, method: api[1], url: api[2] });
          cur.body.push(`<h3 id="${id}" class="step-h"><span class="method m-${api[1].toLowerCase()}">${api[1]}</span><code>${esc(api[2])}</code></h3>\n`);
          const nx = tokens.slice(i + 1).find((x) => x.type !== "space");
          if (nx?.type === "paragraph" && /^\*\*[^*]+\*\*$/.test(nx.raw.trim())) {
            cur.body.push(`<p class="api-name">${marked.parseInline(nx.raw.trim().slice(2, -2))}</p>\n`);
            tokens.splice(tokens.indexOf(nx), 1);
          }
        } else cur.body.push(`<h3 id="${id}">${title}</h3>\n`);
        continue;
      }
      if (t.depth === 4) {
        const layer = /^1\. Frontend/.test(t.text) ? "fe" : /^2\. Backend/.test(t.text) ? "be" : /^3\. Database/.test(t.text) ? "db" : /^4\. วิธีทดสอบ/.test(t.text) ? "test" : "";
        cur.body.push(`<h4${layer ? ` class="layer layer-${layer}"` : ""}>${title}</h4>\n`);
        continue;
      }
    }
    if (!cur) open("sec-intro", "เริ่มต้นอ่าน");
    // หัวเรื่องของท่อนโค้ด: **1. ชื่อ** ([ไฟล์ บรรทัด](ลิงก์))
    if (t.type === "paragraph" && /^\*\*\d+\. [^*]+\*\* \(\[/.test(t.raw) || (t.type === "paragraph" && /^โครงตาราง `[^`]+` \(\[/.test(t.raw))) {
      const m = t.raw.trim().match(/^(.*?) \((\[.*\]\(.*\))\)$/s);
      cur.body.push(`<p class="piece"><span>${marked.parseInline(m[1])}</span>${marked.parseInline(m[2])}</p>\n`);
      continue;
    }
    cur.body.push(parse([t]));
  }

  const nav = DOCS.map((d) => `<a href="${d.f}.html"${d === doc ? ' class="current"' : ""}>${d.nav}</a>`).join("");
  const tocHtml = sections.map((s) => {
    const prog = s.steps ? `<span class="prog" data-ch="${s.id}" data-total="${s.steps}"></span>` : "";
    const sub = s.items.map((it) => `<li><a href="#${it.id}">${it.method} ${esc(it.url.replace("/api", ""))}</a></li>`).join("");
    return `<li class="toc-ch"><a href="#${s.id}" class="toc-main">${strip(s.titleHtml)}${prog}</a>\n<ul>${sub}</ul></li>`;
  }).join("\n");
  const sectionsHtml = sections.map((s) => `<section class="chapter" id="${s.id}">\n<h1 class="ch-title">${s.titleHtml}</h1>\n${s.body.join("")}</section>\n`).join("");

  const head = TPL.slice(0, TPL.indexOf("<body")).replace(/<title>[^<]*<\/title>/, `<title>แผนที่ API: ${doc.nav}</title>`).replace("</head>", `${EXTRA_CSS}</head>`);
  let tail = TPL.slice(TPL.lastIndexOf('<button type="button" class="top-btn"'));
  tail = tail.replace('".chapter, .chapter h2[id]"', '".chapter, .chapter h3.step-h[id]"').replace('"eva-guide-done"', '"eva-api-map-done"').replaceAll("ทำขั้นนี้แล้ว", "ทำเส้นนี้แล้ว");
  const copyLoc = `<script>
document.addEventListener("click", function (e) {
  var b = e.target.closest && e.target.closest(".loc");
  if (!b) return;
  var text = b.getAttribute("data-loc");
  var done = function () { b.classList.add("copied"); setTimeout(function () { b.classList.remove("copied"); }, 1200); };
  if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(done, function () { legacy(); done(); }); }
  else { legacy(); done(); }
  function legacy() { var t = document.createElement("textarea"); t.value = text; t.style.position = "fixed"; t.style.opacity = "0"; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (x) {} t.remove(); }
});
</script>
</body>`;
  tail = tail.replace("</body>", copyLoc);

  return `${head}<body>
<button type="button" class="menu-btn" aria-label="เปิดสารบัญ">☰ สารบัญ</button>
<aside class="sidebar">
  <div class="side-head">
    <strong>แผนที่โค้ดรายเส้น API</strong>
    <div class="doc-nav">${nav}</div>
    <input type="search" class="toc-search" placeholder="ค้นหาเส้น API...">
  </div>
  <nav><ul class="toc">${tocHtml}</ul></nav>
</aside>
<main>
  <header class="cover">
    <p class="eyebrow">แผนที่โค้ดรายเส้น API · ${doc.eyebrow}</p>
    <h1>${doc.h1}</h1>
    <p>${doc.sub}</p>
    <p class="muted">โค้ดตรงกับไฟล์จริง ณ ${DATE} · เปิดไฟล์นี้จากโฟลเดอร์ docs/api-map/ ใช้งานแบบออฟไลน์ได้</p>
  </header>
${sectionsHtml}</main>
${tail}`;
}

fs.mkdirSync(OUT, { recursive: true });
for (const doc of DOCS) {
  fs.writeFileSync(path.join(OUT, doc.f + ".html"), renderDoc(doc));
  const old = path.join(OUT, doc.f + ".md");
  if (fs.existsSync(old)) fs.rmSync(old);
}
console.log(fs.readdirSync(OUT));
