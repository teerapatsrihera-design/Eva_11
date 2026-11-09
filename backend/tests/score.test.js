// ทดสอบฟังก์ชันคำนวณคะแนน (เกณฑ์ 7.5) รัน: npm test
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { sum, average, percent, weighted, isValidScore, indicatorProgress, buildResult } from "../utils/score.js";

const scale = { id: 1, weight: 40, score_type: "scale_4", evidence_type: "file" };
const yesNo = { id: 2, weight: 60, score_type: "yes_no", evidence_type: "none" };

describe("sum / average / percent", () => {
  test("sum ปัดทศนิยม 2 ตำแหน่ง", () => {
    assert.equal(sum([0.1, 0.2]), 0.3);
    assert.equal(sum([]), 0);
  });
  test("average ไม่นับค่าว่าง และคืน null ถ้าไม่มีค่า", () => {
    assert.equal(average([4, null, 2]), 3);
    assert.equal(average([null, undefined]), null);
  });
  test("percent หารด้วย 0 ได้ 0", () => {
    assert.equal(percent(1, 3), 33.33);
    assert.equal(percent(5, 0), 0);
  });
});

describe("weighted คะแนนถ่วงน้ำหนัก", () => {
  test("สเกล 1-4: (คะแนน / 4) x น้ำหนัก", () => {
    assert.equal(weighted(4, scale), 40);
    assert.equal(weighted(3, scale), 30);
    assert.equal(weighted(1, scale), 10);
  });
  test("มี/ไม่มี: มี = เต็มน้ำหนัก, ไม่มี = 0", () => {
    assert.equal(weighted(1, yesNo), 60);
    assert.equal(weighted(0, yesNo), 0);
  });
  test("ยังไม่ได้ให้คะแนน = 0", () => {
    assert.equal(weighted(null, scale), 0);
  });
});

describe("isValidScore ตรวจช่วงคะแนนตามรูปแบบ", () => {
  test("มี/ไม่มี รับเฉพาะ 0 และ 1", () => {
    assert.equal(isValidScore(0, "yes_no"), true);
    assert.equal(isValidScore(1, "yes_no"), true);
    assert.equal(isValidScore(2, "yes_no"), false);
  });
  test("สเกล รับ 1-4 และต้องเป็นจำนวนเต็ม", () => {
    assert.equal(isValidScore(1, "scale_4"), true);
    assert.equal(isValidScore(4, "scale_4"), true);
    assert.equal(isValidScore(0, "scale_4"), false);
    assert.equal(isValidScore(5, "scale_4"), false);
    assert.equal(isValidScore(2.5, "scale_4"), false);
  });
});

describe("indicatorProgress ความคืบหน้ารายตัวชี้วัด", () => {
  test("ต้องแนบหลักฐาน: มีคะแนน + หลักฐาน = 100, มีแค่คะแนน = 50", () => {
    assert.equal(indicatorProgress(scale, 3, 1), 100);
    assert.equal(indicatorProgress(scale, 3, 0), 50);
    assert.equal(indicatorProgress(scale, null, 0), 0);
  });
  test("ไม่ต้องแนบหลักฐาน: มีคะแนนก็ครบ", () => {
    assert.equal(indicatorProgress(yesNo, 0, 0), 100);
  });
});

describe("buildResult สรุปผลผู้รับการประเมิน", () => {
  const selfData = { 1: { score: 3, evidence_count: 1 }, 2: { score: 1, evidence_count: 0 } };
  const assignments = [
    { id: 10, status: "confirmed" },
    { id: 11, status: "confirmed" },
    { id: 12, status: "draft" },
  ];
  const scores = [
    { assignment_id: 10, indicator_id: 1, score: 4 },
    { assignment_id: 10, indicator_id: 2, score: 1 },
    { assignment_id: 11, indicator_id: 1, score: 2 },
    { assignment_id: 11, indicator_id: 2, score: 0 },
    { assignment_id: 12, indicator_id: 1, score: 1 }, // ร่าง ไม่นำมาคิด
  ];

  test("ใช้ค่าเฉลี่ยจากกรรมการที่ยืนยันแล้วเท่านั้น", () => {
    const { rows, summary } = buildResult([scale, yesNo], selfData, assignments, scores);
    assert.equal(rows[0].avg_score, 3); // (4 + 2) / 2
    assert.equal(rows[0].committee_weighted, 30);
    assert.equal(rows[1].avg_score, 0.5); // (1 + 0) / 2
    assert.equal(rows[1].committee_weighted, 30);
    assert.equal(summary.committee_total, 60);
    assert.equal(summary.committee_percent, 60);
    assert.equal(summary.confirmed_count, 2);
    assert.equal(summary.committee_count, 3);
  });

  test("คะแนนตนเองและความคืบหน้า", () => {
    const { summary } = buildResult([scale, yesNo], selfData, assignments, scores);
    assert.equal(summary.self_total, 90); // 30 + 60
    assert.equal(summary.total_weight, 100);
    assert.equal(summary.filled, 2);
    assert.equal(summary.progress, 100);
  });

  test("ยังไม่มีกรรมการยืนยัน: คะแนนกรรมการเป็น null", () => {
    const { summary } = buildResult([scale, yesNo], {}, [{ id: 12, status: "draft" }], scores);
    assert.equal(summary.committee_total, null);
    assert.equal(summary.committee_percent, null);
    assert.equal(summary.progress, 0);
  });
});
