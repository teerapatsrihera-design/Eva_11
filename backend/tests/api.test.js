// ทดสอบ Service API (เกณฑ์ 7.1, 7.2, 7.3, 7.6) ต้องเปิด MySQL (docker compose up -d) ก่อน
// เปิด app ที่ port สุ่ม จึงรันพร้อม npm run dev ได้ ข้อมูลที่เพิ่มระหว่างทดสอบจะถูกลบตอนจบ
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../app.js";
import pool from "../db.js";

let server, baseUrl, hrToken, evaluateeToken, newUserId;

// เรียก API คืน { code, body }
async function api(method, url, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(baseUrl + url, { method, headers, body: body && JSON.stringify(body) });
  return { code: res.status, body: await res.json() };
}

const login = (username, password) => api("POST", "/auth/login", { body: { username, password } });

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://localhost:${server.address().port}/api`;
});

after(async () => {
  if (newUserId) await pool.query("DELETE FROM users WHERE id = ?", [newUserId]);
  server.close();
  await pool.end();
});

describe("POST /api/auth/login", () => {
  test("username/password ถูก ได้ 200 + token", async () => {
    const { code, body } = await login("hr", "123456");
    assert.equal(code, 200);
    assert.equal(body.status, "success");
    assert.equal(body.data.user.role, "hr");
    assert.equal(body.data.user.password_hash, undefined); // ไม่ส่ง hash กลับ
    hrToken = body.data.token;
    evaluateeToken = (await login("teach1", "123456")).body.data.token;
  });

  test("รหัสผ่านผิด ได้ 401", async () => {
    const { code, body } = await login("hr", "wrong-password");
    assert.equal(code, 401);
    assert.deepEqual(body, { status: "error", message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", data: null });
  });

  test("ไม่มีผู้ใช้นี้ ได้ 401 ข้อความเดียวกัน (ไม่บอกว่าผิดช่องไหน)", async () => {
    const { code, body } = await login("nobody", "123456");
    assert.equal(code, 401);
    assert.equal(body.message, "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  });

  test("ไม่กรอกข้อมูล ได้ 400", async () => {
    const { code, body } = await login("", "");
    assert.equal(code, 400);
    assert.equal(body.message, "กรุณากรอกชื่อผู้ใช้");
  });
});

describe("ความปลอดภัย", () => {
  test("ไม่มี token ได้ 401", async () => {
    const { code } = await api("GET", "/users");
    assert.equal(code, 401);
  });
  test("token ปลอม ได้ 401", async () => {
    const { code } = await api("GET", "/users", { token: "fake.token.value" });
    assert.equal(code, 401);
  });
  test("ผู้รับการประเมินเรียก API ของ hr ได้ 403", async () => {
    const { code } = await api("GET", "/users", { token: evaluateeToken });
    assert.equal(code, 403);
  });
  test("endpoint ที่ไม่มี ได้ 404", async () => {
    const { code } = await api("GET", "/not-found", { token: hrToken });
    assert.equal(code, 404);
  });
});

describe("/api/users (POST, GET, PUT, DELETE)", () => {
  const username = `api_test_${Date.now()}`;

  test("POST เพิ่มผู้ใช้ ได้ 201 + รหัสผ่านชั่วคราว", async () => {
    const { code, body } = await api("POST", "/users", {
      token: hrToken,
      body: { username, full_name: "ครูทดสอบ API", email: "api@test.com", role: "evaluatee" },
    });
    assert.equal(code, 201);
    assert.match(body.data.temp_password, /^\d{6}$/);
    newUserId = body.data.id;
  });

  test("POST ข้อมูลไม่ถูกต้อง ได้ 400 พร้อมช่องที่ผิด", async () => {
    const { code, body } = await api("POST", "/users", {
      token: hrToken,
      body: { username, full_name: "ซ้ำ", email: "abc", role: "evaluatee" },
    });
    assert.equal(code, 400);
    assert.equal(body.data[0].field, "email");
  });

  test("POST username ซ้ำ ได้ 400", async () => {
    const { code } = await api("POST", "/users", {
      token: hrToken,
      body: { username, full_name: "ซ้ำ", role: "evaluatee" },
    });
    assert.equal(code, 400);
  });

  test("GET ข้อมูลที่เพิ่มถูกบันทึกจริง", async () => {
    const { code, body } = await api("GET", `/users/${newUserId}`, { token: hrToken });
    assert.equal(code, 200);
    assert.equal(body.data.username, username);
    assert.equal(body.data.full_name, "ครูทดสอบ API");
    assert.equal(body.data.must_change_password, 1);
  });

  test("ผู้ใช้ใหม่ login ด้วยรหัสชั่วคราวได้ และต้องเปลี่ยนรหัสผ่าน", async () => {
    const reset = await api("PUT", `/users/${newUserId}/reset-password`, { token: hrToken });
    const { code, body } = await login(username, reset.body.data.temp_password);
    assert.equal(code, 200);
    assert.equal(body.data.user.must_change_password, true);
  });

  test("PUT แก้ไขแล้ว GET ได้ค่าใหม่", async () => {
    const put = await api("PUT", `/users/${newUserId}`, {
      token: hrToken,
      body: { username, full_name: "ครูทดสอบ แก้ไขแล้ว", department: "ไอที", phone: "0812345678" },
    });
    assert.equal(put.code, 200);
    const { body } = await api("GET", `/users/${newUserId}`, { token: hrToken });
    assert.equal(body.data.full_name, "ครูทดสอบ แก้ไขแล้ว");
    assert.equal(body.data.department, "ไอที");
    assert.equal(body.data.phone, "0812345678");
  });

  test("PUT ผู้ใช้ที่ไม่มี ได้ 404", async () => {
    const { code } = await api("PUT", "/users/999999", { token: hrToken, body: { username: "nobody", full_name: "x" } });
    assert.equal(code, 404);
  });

  test("DELETE ลบแล้ว GET ได้ 404", async () => {
    const del = await api("DELETE", `/users/${newUserId}`, { token: hrToken });
    assert.equal(del.code, 200);
    const { code, body } = await api("GET", `/users/${newUserId}`, { token: hrToken });
    assert.equal(code, 404);
    assert.equal(body.message, "ไม่พบผู้ใช้");
    newUserId = null;
  });
});

describe("GET /api/reports/evaluatees/:id (สิทธิ์ตามบทบาท)", () => {
  test("ผู้รับการประเมินดูผลของตัวเองได้", async () => {
    const { code, body } = await api("GET", "/reports/evaluatees/5", { token: evaluateeToken });
    assert.equal(code, 200);
    assert.equal(body.data.evaluatee.username, "teach1");
    assert.equal(body.data.rows.length > 0, true);
  });
  test("ดูผลของคนอื่นไม่ได้ ได้ 403", async () => {
    const { code } = await api("GET", "/reports/evaluatees/6", { token: evaluateeToken });
    assert.equal(code, 403);
  });
  test("hr ขอผู้รับประเมินที่ไม่มี ได้ 404", async () => {
    const { code } = await api("GET", "/reports/evaluatees/999999", { token: hrToken });
    assert.equal(code, 404);
  });
});
