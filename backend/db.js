import "./env.js";
import mysql from "mysql2/promise";

// pool เดียวใช้ทั้งระบบ
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true, // คืนวันที่เป็นข้อความ ไม่ต้องกังวลเรื่อง timezone
  decimalNumbers: true, // DECIMAL (เช่น weight) คืนเป็นตัวเลข ไม่ใช่ข้อความ
});

export default pool;
