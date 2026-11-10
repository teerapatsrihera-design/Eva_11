// เปิดเอกสาร HTML ใน Edge จริง: ตรวจ error, จำนวนเส้น, โค้ด/เลขบรรทัด, ลิงก์, ค้นหา, มือถือ
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SP = path.join(import.meta.dirname, ".out"), DIR = path.join(import.meta.dirname.replace(/[\\/]docs[\\/]tools$/, ""), "docs/api-map");
fs.mkdirSync(SP, { recursive: true });
const FILES = ["shared", "person-1-hr", "person-2-evaluatee", "person-3-committee"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const edge = spawn((process.env.EDGE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"), ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=9334", `--user-data-dir=${path.join(SP, "edge-profile2")}`, "about:blank"], { stdio: "ignore" });
let ws, id = 0; const pending = new Map(); const errors = [];
const send = (m, p = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const ev = async (e) => { const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || e); return r.result.value; };
try {
  let t; for (let i = 0; i < 60; i++) { try { t = await (await fetch("http://127.0.0.1:9334/json/new?about:blank", { method: "PUT" })).json(); break; } catch { await sleep(300); } }
  ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); return; }
    if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") errors.push(d.params.args.map((a) => a.value).join(" ")); };
  for (const d of ["Page", "Runtime"]) await send(`${d}.enable`);
  let total = 0;
  for (const f of FILES) {
    await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url: `file:///${DIR}/${f}.html` }); await sleep(1500);
    const r = await ev(`(() => {
      const ids = new Set([...document.querySelectorAll('[id]')].map(e => e.id));
      const broken = [...document.querySelectorAll('a[href^="#"]')].filter(a => a.getAttribute('href').length > 1 && !ids.has(a.getAttribute('href').slice(1))).map(a => a.getAttribute('href'));
      return { steps: document.querySelectorAll('.step').length, code: document.querySelectorAll('.code').length, numbered: document.querySelectorAll('pre.numbered').length, loc: document.querySelectorAll('.loc').length, layers: document.querySelectorAll('h4.layer').length, broken: [...new Set(broken)].slice(0,8), md: document.documentElement.innerHTML.includes('.md#'), raw: document.body.innerText.includes('**') };
    })()`);
    total += r.steps;
    console.log(f, JSON.stringify(r));
    // เลขบรรทัดแรกของท่อนโค้ดตรงกับปุ่ม 📍
    const ln = await ev(`(() => { const b = document.querySelector('.step .loc'); const c = b.closest('p').nextElementSibling; while (c && !c.classList.contains('code') && false); let n = b.closest('p').nextElementSibling; while (n && !n.classList.contains('code')) n = n.nextElementSibling; return { loc: b.dataset.loc, reset: n.querySelector('code').style.counterReset, first: getComputedStyle(n.querySelector('.ln'), '::before').content }; })()`);
    console.log("  first snippet:", JSON.stringify(ln));
    await send("Page.captureScreenshot", { format: "png" }).then(({ data }) => fs.writeFileSync(path.join(SP, `map-${f}.png`), Buffer.from(data, "base64")));
    // ค้นหาในสารบัญ
    const s = await ev(`(() => { const i = document.querySelector('.toc-search'); i.value = 'POST /users'; i.dispatchEvent(new Event('input')); const v = [...document.querySelectorAll('.toc-ch ul li')].filter(l => l.style.display !== 'none').length; i.value=''; i.dispatchEvent(new Event('input')); return v; })()`);
    console.log("  search hits:", s);
    // ติ๊ก + คัดลอกตำแหน่ง
    const tick = await ev(`(() => { const c = document.querySelector('.step-foot input'); c.click(); const p = document.querySelector('.prog').textContent; c.click(); return { label: document.querySelector('.step-foot label').innerText.trim(), prog: p }; })()`);
    console.log("  checkbox:", JSON.stringify(tick));
    await ev(`document.querySelector('.loc').click(); 1`); await sleep(100);
    console.log("  loc copied class:", await ev(`document.querySelector('.loc').classList.contains('copied')`));
    await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 780, deviceScaleFactor: 1, mobile: true }); await sleep(500);
    console.log("  mobile overflow:", await ev(`document.documentElement.scrollWidth + ' <= 375 ' + (document.documentElement.scrollWidth <= 375 ? 'OK' : 'OVERFLOW ' + [...document.querySelectorAll('main *')].filter((e) => e.getBoundingClientRect().right > 376).slice(-3).map((e) => e.tagName + '.' + e.className + ':' + (e.textContent || '').slice(0, 40)).join(' | '))`));
  }
  // ภาพส่วนของเส้น API
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 950, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: `file:///${DIR}/shared.html#post-api-auth-register` }); await sleep(1500);
  await ev(`document.getElementById('post-api-auth-register').scrollIntoView(); 1`); await sleep(300);
  await send("Page.captureScreenshot", { format: "png" }).then(({ data }) => fs.writeFileSync(path.join(SP, "map-endpoint.png"), Buffer.from(data, "base64")));
  console.log("TOTAL endpoints as steps:", total, "| page errors:", errors.length ? errors.slice(0, 5) : "none");
} catch (e) { console.log("ERROR", e.message); } finally { try { ws?.close(); } catch {} edge.kill(); process.exit(0); }
