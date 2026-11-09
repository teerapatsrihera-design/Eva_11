import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const BACKUP_DIR = path.join(import.meta.dirname, "..", "backups");
fs.mkdirSync(BACKUP_DIR, { recursive: true });

// ชื่อไฟล์ที่ยอมรับ (กันการส่ง ../ เพื่อเข้าถึงไฟล์อื่น)
export const isBackupName = (name) => /^backup-[\w-]+\.sql$/.test(name);

// เรียก mysqldump / mysql แล้วรอจนจบ: input = ข้อมูลที่ส่งเข้า stdin, คืน stdout เป็น Buffer
// - รันบนเครื่อง (npm run dev, มี DB_CONTAINER): เรียกผ่าน docker exec ใน container ของ MySQL
// - รันใน Docker (docker compose): image ของ backend ติดตั้ง mysql client ไว้ เรียกตรงไปที่ DB_HOST
// ส่งรหัสผ่านทาง MYSQL_PWD เพื่อไม่ให้รหัสผ่านอยู่บน command line
function runMysql(tool, options, input) {
  const { DB_CONTAINER, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  const args = [`-u${DB_USER}`, "--default-character-set=utf8mb4", ...options, DB_NAME];
  const [cmd, cmdArgs] = DB_CONTAINER
    ? ["docker", ["exec", "-i", "-e", `MYSQL_PWD=${DB_PASSWORD}`, DB_CONTAINER, tool, ...args]]
    : [tool, [`-h${DB_HOST}`, `-P${DB_PORT}`, "--skip-ssl", ...args]];

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, { env: { ...process.env, MYSQL_PWD: DB_PASSWORD } });
    const output = [];
    let error = "";
    child.stdout.on("data", (chunk) => output.push(chunk));
    child.stderr.on("data", (chunk) => (error += chunk));
    child.on("error", reject); // เช่น เครื่องไม่มีคำสั่ง docker / mysqldump
    child.on("close", (code) => (code === 0 ? resolve(Buffer.concat(output)) : reject(new Error(error.trim()))));
    child.stdin.end(input);
  });
}

// สำรองฐานข้อมูลเป็นไฟล์ .sql คืนชื่อไฟล์ เช่น backup-2026-11-07-10-30-00.sql
export async function createBackup(suffix = "") {
  const stamp = new Date().toLocaleString("sv-SE").replace(/[: ]/g, "-"); // 2026-11-07 10:30:00 -> 2026-11-07-10-30-00
  const name = `backup-${stamp}${suffix}.sql`;
  const sql = await runMysql("mysqldump", ["--single-transaction", "--no-tablespaces"]);
  fs.writeFileSync(path.join(BACKUP_DIR, name), sql);
  return name;
}

// กู้คืนจากข้อความ SQL (ไฟล์สำรองมี DROP TABLE + CREATE TABLE + INSERT ครบ)
export const restoreBackup = (sql) => runMysql("mysql", [], sql);

// รายการไฟล์สำรอง ใหม่สุดก่อน
export function listBackups() {
  return fs
    .readdirSync(BACKUP_DIR)
    .filter(isBackupName)
    .map((name) => {
      const stat = fs.statSync(path.join(BACKUP_DIR, name));
      return { name, size: stat.size, created_at: stat.mtime };
    })
    .sort((a, b) => b.created_at - a.created_at);
}
