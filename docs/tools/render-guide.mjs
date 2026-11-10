// แปลง docs/guide/*.md เป็น eva-guide.html รูปแบบเดียวกับไฟล์เดิม
import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";

const escCode = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
export const LEGEND = '<div class="legend"><span class="tk tk-k">syntax</span><span class="tk tk-n">ชื่อที่ตั้งเอง</span><span class="tk tk-p">ชื่อที่ package/ระบบกำหนด</span><span class="tk tk-v">ค่า/ข้อมูล</span><span class="tk tk-s">เครื่องหมาย</span></div>';

function syntaxHtml(text) {
  let out = "", i = 0;
  while (i < text.length) {
    const m = text.slice(i).match(/^\[([knpvs]):((?:\\.|[^\]\\])*)\]/);
    if (m) {
      out += `<span class="tk tk-${m[1]}">${escCode(m[2].replace(/\\(.)/g, "$1"))}</span>`;
      i += m[0].length;
    } else { out += escCode(text[i]); i++; }
  }
  return `<div class="syntax"><pre>${out}</pre>${LEGEND}</div>\n`;
}

export const codeHtml = (text, lang) =>
  `<div class="code"><div class="code-bar"><span>${esc(lang === "mermaid" ? "แผนภาพ (mermaid)" : lang || "text")}</span><button type="button" class="copy">คัดลอก</button></div><pre><code>${escCode(text)}</code></pre></div>\n`;

export function renderChapter(md, chId, chapterMap) {
  let n = 0, title = "", steps = 0;
  const toc = [];
  const marked = new Marked({ gfm: true, breaks: true });
  marked.use({
    renderer: {
      heading({ tokens, depth, text }) {
        const inner = this.parser.parseInline(tokens);
        if (depth === 1 && !title) { title = inner.replace(/<[^>]+>/g, ""); return `<h1 class="ch-title">${inner}</h1>\n`; }
        n++;
        const id = `${chId}-h${n}`;
        const step = depth === 3 && /^ขั้นที่/.test(text);
        if (step) steps++;
        if (depth === 2) toc.push({ id, text: inner.replace(/<[^>]+>/g, "") });
        return `<h${depth} id="${id}"${step ? ' class="step-h"' : depth === 1 ? ' class="part"' : ""}><a class="anchor" href="#${id}" aria-hidden="true">#</a>${inner}</h${depth}>\n`;
      },
      code({ text, lang }) {
        if (lang === "syntax") return syntaxHtml(text);
        if (text.includes("\n") && !["text", "bash", "mermaid", "markdown", "", undefined].includes(lang)) {
          const body = text.split("\n").map((l) => `<span class="ln">${escCode(l)}</span>`).join("\n");
          return `<div class="code"><div class="code-bar"><span>${esc(lang || "text")}</span><button type="button" class="copy">คัดลอก</button></div><pre class="numbered"><code>${body}</code></pre></div>\n`;
        }
        return codeHtml(text, lang);
      },
      table(token) {
        let header = "", body = "";
        const cell = (c, tag) => `<${tag}${c.align ? ` align="${c.align}"` : ""}>${this.parser.parseInline(c.tokens)}</${tag}>\n`;
        header = `<tr>\n${token.header.map((c) => cell(c, "th")).join("")}</tr>\n`;
        body = token.rows.map((r) => `<tr>\n${r.map((c) => cell(c, "td")).join("")}</tr>\n`).join("");
        return `<div class="table-wrap"><table>\n<thead>\n${header}</thead>\n${body ? `<tbody>${body}</tbody>` : ""}</table>\n</div>\n`;
      },
      link({ href, tokens, title: t }) {
        const inner = this.parser.parseInline(tokens);
        const md = href.match(/^(?:\.\/)?([^/#]+)\.md(#.*)?$/);
        if (md && chapterMap[md[1]]) return `<a href="#${chapterMap[md[1]]}">${inner}</a>`;
        if (href.startsWith("../")) return `<a href="${esc(href)}" class="code-link">${inner}</a>`;
        if (/^https?:/.test(href)) return `<a href="${esc(href)}" target="_blank" rel="noopener">${inner}</a>`;
        return `<a href="${esc(href)}"${t ? ` title="${esc(t)}"` : ""}>${inner}</a>`;
      },
    },
  });
  const tokens = marked.lexer(md);
  const html = marked.parser(tokens);
  return { html, title, toc, steps };
}

export function build(guideDir, templatePath, date) {
  const tpl = fs.readFileSync(templatePath, "utf8");
  const head = tpl.slice(0, tpl.indexOf("<body"));
  const tail = tpl.slice(tpl.lastIndexOf('<button type="button" class="top-btn"'));
  const files = fs.readdirSync(guideDir).filter((f) => f.endsWith(".md")).sort((a, b) => (a === "README.md" ? -1 : b === "README.md" ? 1 : a.localeCompare(b)));
  const chapterMap = { README: "ch-00" };
  for (const f of files) if (f !== "README.md") chapterMap[f.replace(".md", "")] = `ch-${f.slice(0, 2)}`;
  const sections = [], tocItems = [];
  for (const f of files) {
    const chId = chapterMap[f.replace(".md", "")];
    const { html, title, toc, steps } = renderChapter(fs.readFileSync(path.join(guideDir, f), "utf8"), chId, chapterMap);
    sections.push(`<section class="chapter" id="${chId}">\n${html}</section>\n`);
    const prog = steps ? `<span class="prog" data-ch="${chId}" data-total="${steps}"></span>` : "";
    tocItems.push(`<li class="toc-ch"><a href="#${chId}" class="toc-main">${title}${prog}</a>\n<ul>${toc.map((t) => `<li><a href="#${t.id}">${t.text}</a></li>`).join("")}</ul></li>`);
  }
  const titleCount = files.length - 1;
  return `${head}<body>
<button type="button" class="menu-btn" aria-label="เปิดสารบัญ">☰ สารบัญ</button>
<aside class="sidebar">
  <div class="side-head">
    <strong>คู่มือ 0% → 100%</strong>
    <input type="search" class="toc-search" placeholder="ค้นหาหัวข้อ...">
  </div>
  <nav><ul class="toc">${tocItems.join("\n")}</ul></nav>
</aside>
<main>
  <header class="cover">
    <p class="eyebrow">ข้อสอบแข่งทักษะ ปวช. IT ข้อ 57</p>
    <h1>คู่มือสอนสร้างระบบประเมินบุคลากร</h1>
    <p>ตั้งแต่ 0% ถึง 100% · ${titleCount} บท · สำหรับครูและนักเรียน</p>
    <p class="muted">สร้างจาก docs/guide/*.md เมื่อ ${date} · ลิงก์ไปยังไฟล์โค้ดจะเปิดได้เมื่อไฟล์นี้อยู่ในโฟลเดอร์ docs/guide/ ของโปรเจกต์</p>
  </header>
${sections.join("")}</main>
${tail}`;
}

// รันตรงๆ เพื่อเทียบกับไฟล์เดิม
if (process.argv[2] === "compare") {
  const G = path.join(import.meta.dirname.replace(/[\\/]docs[\\/]tools$/, ""), "docs/guide");
  const orig = fs.readFileSync(`${G}/eva-guide.html`, "utf8").replace(/\r\n/g, "\n");
  const out = build(G, `${G}/eva-guide.html`, "2026-11-08").replace(/\r\n/g, "\n");
  fs.writeFileSync(path.join(import.meta.dirname, ".out", "guide-rt.html"), out);
  if (orig === out) console.log("IDENTICAL", orig.length);
  else {
    let i = 0; while (i < orig.length && orig[i] === out[i]) i++;
    let same = 0, a = orig.split("\n"), b = out.split("\n");
    for (let k = 0; k < Math.min(a.length, b.length); k++) if (a[k] === b[k]) same++;
    console.log(`DIFF at char ${i} / ${orig.length} (out ${out.length}); lines ${a.length} vs ${b.length}; same-index lines ${same}`);
    console.log("ORIG:", JSON.stringify(orig.slice(Math.max(0, i - 120), i + 200)));
    console.log("OUT :", JSON.stringify(out.slice(Math.max(0, i - 120), i + 200)));
  }
}
