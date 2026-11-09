import dotenv from "dotenv";
import path from "node:path";

// โหลด .env จากรากโปรเจกต์ (ไฟล์เดียวกับที่ docker-compose ใช้)
dotenv.config({ path: path.join(import.meta.dirname, "..", ".env"), quiet: true });
