// ทดสอบการตรวจข้อมูล (เกณฑ์ 7.4, 8.2): Zod schema, ไฟล์แนบ, ความครบถ้วนของข้อมูล
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { loginSchema } from "../schemas/auth.js";
import { userSchema } from "../schemas/user.js";
import { topicSchema } from "../schemas/topic.js";
import { indicatorSchema } from "../schemas/indicator.js";
import { evidenceSchema } from "../schemas/evaluation.js";
import { confirmSchema } from "../schemas/committee.js";
import { checkFile, checkAttachment } from "../utils/upload.js";
import { findDataIssues } from "../utils/dataCheck.js";

// คืนข้อความ error แรก (หรือ null ถ้าผ่าน)
const firstError = (schema, data) => schema.safeParse(data).error?.issues[0].message ?? null;

const user = { username: "teach9", full_name: "ครูทดสอบ", role: "evaluatee" };

describe("ตรวจช่องว่าง", () => {
  test("login ไม่กรอกชื่อผู้ใช้", () => {
    assert.equal(firstError(loginSchema, { password: "123456" }), "กรุณากรอกชื่อผู้ใช้");
  });
  test("ช่องว่างล้วนถือว่าไม่ได้กรอก (trim)", () => {
    assert.equal(firstError(userSchema, { ...user, full_name: "   " }), "กรุณากรอกชื่อ-สกุล");
  });
  test("ข้อมูลครบผ่าน และช่องไม่บังคับที่ว่างเป็น null", () => {
    const result = userSchema.safeParse({ ...user, email: "", position: "" });
    assert.equal(result.success, true);
    assert.equal(result.data.email, null);
    assert.equal(result.data.position, null);
  });
});

describe("ตรวจรูปแบบ", () => {
  test("อีเมลผิดรูปแบบ", () => {
    assert.equal(firstError(userSchema, { ...user, email: "abc@" }), "รูปแบบอีเมลไม่ถูกต้อง");
    assert.equal(firstError(userSchema, { ...user, email: "a@b.com" }), null);
  });
  test("เบอร์โทรต้องขึ้นต้นด้วย 0 และยาว 9-10 หลัก", () => {
    assert.notEqual(firstError(userSchema, { ...user, phone: "12345678" }), null);
    assert.equal(firstError(userSchema, { ...user, phone: "0812345678" }), null);
  });
  test("ชื่อผู้ใช้ห้ามมีภาษาไทยหรือช่องว่าง", () => {
    assert.equal(firstError(userSchema, { ...user, username: "ครู 1" }), "ชื่อผู้ใช้ใช้ได้เฉพาะ a-z, 0-9, _ และ .");
  });
  test("URL หลักฐานต้องเป็น http/https", () => {
    assert.notEqual(firstError(evidenceSchema, { description: "x", url: "ftp://a.com" }), null);
    assert.equal(firstError(evidenceSchema, { description: "x", url: "https://a.com" }), null);
  });
  test("ลายเซ็นต้องเป็นรูป PNG แบบ data URL", () => {
    assert.equal(firstError(confirmSchema, { signature: "hello" }), "กรุณาลงลายเซ็น");
    assert.equal(firstError(confirmSchema, { signature: "data:image/png;base64,iVBORw0KGgo=" }), null);
  });
});

describe("ตรวจความยาวและช่วงค่า", () => {
  test("ชื่อผู้ใช้สั้นกว่า 3 ตัว", () => {
    assert.equal(firstError(userSchema, { ...user, username: "ab" }), "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร");
  });
  test("ชื่อ-สกุลยาวเกิน 100 ตัว", () => {
    assert.equal(firstError(userSchema, { ...user, full_name: "ก".repeat(101) }), "ต้องไม่เกิน 100 ตัวอักษร");
  });
  test("น้ำหนักตัวชี้วัดต้องมากกว่า 0 และไม่เกิน 100 (รับตัวเลขที่เป็นข้อความได้)", () => {
    const ind = { topic_id: "1", name: "ตัวชี้วัด", score_type: "scale_4", evidence_type: "file" };
    assert.equal(firstError(indicatorSchema, { ...ind, weight: 0 }), "น้ำหนักต้องมากกว่า 0");
    assert.equal(firstError(indicatorSchema, { ...ind, weight: 101 }), "น้ำหนักต้องไม่เกิน 100");
    assert.equal(indicatorSchema.parse({ ...ind, weight: "20" }).weight, 20);
  });
  test("วันสิ้นสุดต้องไม่ก่อนวันเริ่ม", () => {
    const topic = { title: "หัวข้อ", start_date: "2026-12-01", end_date: "2026-11-01" };
    assert.equal(firstError(topicSchema, topic), "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม");
  });
});

describe("ไฟล์และหลักฐานแนบ", () => {
  test("รับเฉพาะ PDF/JPG/PNG และนามสกุลต้องตรงกับชนิดไฟล์", () => {
    assert.equal(checkFile({ name: "ใบรับรอง.PDF", mimetype: "application/pdf" }), null);
    assert.notEqual(checkFile({ name: "virus.exe", mimetype: "application/octet-stream" }), null);
    assert.notEqual(checkFile({ name: "fake.pdf", mimetype: "image/png" }), null);
  });
  test("แนบตามชนิดหลักฐานของตัวชี้วัด", () => {
    assert.equal(checkAttachment("file", true, false), null);
    assert.equal(checkAttachment("file", false, true), "ตัวชี้วัดนี้ต้องแนบหลักฐานเป็นไฟล์");
    assert.equal(checkAttachment("url", true, false), "ตัวชี้วัดนี้ต้องแนบหลักฐานเป็น URL");
    assert.equal(checkAttachment("none", false, false), null);
    assert.equal(checkAttachment("any", true, true), "แนบได้รายการละ 1 อย่าง: ไฟล์ หรือ URL");
  });
});

describe("findDataIssues ตรวจความครบถ้วนของข้อมูล", () => {
  const topics = [{ id: 1, title: "การสอน" }];
  const indicators = [{ topic_id: 1, weight: 60 }, { topic_id: 1, weight: 40 }];
  const evaluatees = [{ id: 5, full_name: "ครู ก" }];

  test("ข้อมูลครบ ไม่มีคำเตือน", () => {
    const assignments = [{ evaluatee_id: 5, committee_role: "chair" }];
    assert.deepEqual(findDataIssues({ topics, indicators, evaluatees, assignments }), []);
  });
  test("น้ำหนักไม่ครบ 100 / หัวข้อไม่มีตัวชี้วัด / ไม่มีประธาน", () => {
    const issues = findDataIssues({
      topics: [...topics, { id: 2, title: "หัวข้อว่าง" }],
      indicators: [{ topic_id: 1, weight: 90 }],
      evaluatees,
      assignments: [{ evaluatee_id: 5, committee_role: "member" }],
    });
    assert.equal(issues.length, 3);
    assert.match(issues[0], /เท่ากับ 90/);
    assert.match(issues[1], /หัวข้อว่าง/);
    assert.match(issues[2], /ยังไม่มีประธานกรรมการ/);
  });
  test("ผู้รับประเมินที่ยังไม่มีกรรมการ", () => {
    const issues = findDataIssues({ topics, indicators, evaluatees, assignments: [] });
    assert.deepEqual(issues, ["ครู ก ยังไม่มีกรรมการประเมิน"]);
  });
});
