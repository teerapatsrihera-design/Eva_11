// "2026-11-01" -> "1 พ.ย. 2569"
export function thaiDate(value) {
  if (!value) return "-";
  return new Date(value.replace(" ", "T")).toLocaleDateString("th-TH", { dateStyle: "medium" });
}

// แสดงคะแนนตามรูปแบบ: มี/ไม่มี หรือ ตัวเลข
export function scoreLabel(score, scoreType) {
  if (score == null) return "-";
  if (scoreType === "yes_no") return Number(score) >= 1 ? "มี" : "ไม่มี";
  return score;
}

// null -> "" เพื่อใช้เป็นค่าเริ่มต้นของฟอร์ม
export const formValues = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v ?? ""]));

// ดาวน์โหลดตารางเป็นไฟล์ CSV (ใส่ BOM ให้ Excel อ่านภาษาไทยได้)
export function downloadCsv(fileName, headers, rows) {
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const text = [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }));
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}
