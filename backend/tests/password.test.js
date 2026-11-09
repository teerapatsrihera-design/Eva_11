// ทดสอบการ hash รหัสผ่านด้วย crypto.scrypt
import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../utils/password.js";

test("เก็บเป็น hash ไม่ใช่รหัสผ่านจริง และ hash ซ้ำได้ค่าไม่เหมือนเดิม (salt)", async () => {
  const a = await hashPassword("123456");
  const b = await hashPassword("123456");
  assert.equal(a.includes("123456"), false);
  assert.notEqual(a, b);
});

test("ตรวจรหัสผ่านถูก/ผิด", async () => {
  const stored = await hashPassword("123456");
  assert.equal(await verifyPassword("123456", stored), true);
  assert.equal(await verifyPassword("654321", stored), false);
});
