// ทดสอบการเรียงข้อมูล (เกณฑ์ 7.5)
import { test } from "node:test";
import assert from "node:assert/strict";
import { sortBy } from "../utils/score.js";

const list = [
  { name: "ข", score: 70 },
  { name: "ก", score: null },
  { name: "ค", score: 90 },
  { name: "ง", score: 80 },
];
const names = (rows) => rows.map((r) => r.name).join("");

test("เรียงคะแนนมากไปน้อย ค่าว่างไว้ท้าย", () => {
  assert.equal(names(sortBy(list, "score", "desc")), "คงขก");
});

test("เรียงคะแนนน้อยไปมาก ค่าว่างยังอยู่ท้าย", () => {
  assert.equal(names(sortBy(list, "score")), "ขงคก");
});

test("เรียงตามชื่อภาษาไทย ก-ฮ", () => {
  assert.equal(names(sortBy(list, "name")), "กขคง");
});

test("ไม่แก้ไข array เดิม", () => {
  sortBy(list, "score", "desc");
  assert.equal(names(list), "ขกคง");
});
