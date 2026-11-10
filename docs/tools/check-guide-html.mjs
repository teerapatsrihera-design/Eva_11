// เปิด eva-guide.html ใน Edge จริง
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const SP = path.join(import.meta.dirname, ".out");
fs.mkdirSync(SP, { recursive: true });
const ROOT = import.meta.dirname.replace(/[\\/]docs[\\/]tools$/, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const edge = spawn((process.env.EDGE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"), ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=9335", `--user-data-dir=${path.join(SP, "edge-profile3")}`, "about:blank"], { stdio: "ignore" });
let ws, id = 0; const pending = new Map(); const errors = [];
const send = (m, p = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const ev = async (e) => { const r = await send("Runtime.evaluate", { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(e); return r.result.value; };
try {
  let t; for (let i = 0; i < 60; i++) { try { t = await (await fetch("http://127.0.0.1:9335/json/new?about:blank", { method: "PUT" })).json(); break; } catch { await sleep(300); } }
  ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); return; }
    if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); };
  for (const d of ["Page", "Runtime"]) await send(`${d}.enable`);
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: "file:///" + ROOT.replace(/\\/g, "/") + "/docs/guide/eva-guide.html" }); await sleep(2500);
  console.log(JSON.stringify(await ev(`(() => {
    const ids = new Set([...document.querySelectorAll('[id]')].map(e => e.id));
    const broken = [...document.querySelectorAll('a[href^="#"]')].filter(a => a.getAttribute('href').length > 1 && !ids.has(a.getAttribute('href').slice(1))).map(a => a.getAttribute('href'));
    const prog = [...document.querySelectorAll('.prog')].map(p => p.dataset.ch.slice(3) + ':' + p.dataset.total).join(' ');
    return { chapters: document.querySelectorAll('.chapter').length, steps: document.querySelectorAll('.step').length, broken: broken.length, prog, register: !!document.getElementById('ch-04') && document.getElementById('ch-04').innerText.includes('API สมัครสมาชิก'), page715: document.getElementById('ch-07').innerText.includes('7.15 หน้าสมัครสมาชิก') };
  })()`)));
  await ev(`[...document.querySelectorAll('h3.step-h')].find(h => h.textContent.includes('4.4.5')).scrollIntoView(); 1`); await sleep(400);
  const { data } = await send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(SP, "guide-445.png"), Buffer.from(data, "base64"));
  console.log("page errors:", errors.length ? errors.slice(0, 3) : "none");
} catch (e) { console.log("ERROR", e.message); } finally { try { ws?.close(); } catch {} edge.kill(); process.exit(0); }
