// ข้อมูลรายเส้น: คนที่ 2 และคนที่ 3
import { b, z, one, R, BS, FS, P, C, SCORE } from "./spec1.mjs";

const CARD = C("evaluatee/IndicatorCard"), PR = P("profile"), EV = P("evaluatee/evaluation"), EH = P("evaluatee/index"), RES = P("evaluatee/result");
const BK = P("hr/backups"), UP = "backend/utils/upload.js", BU = "backend/utils/backup.js", API = "frontend/lib/api.js";
const DASH = P("hr/index"), CM = P("committee/index"), EVA = P("committee/evaluate/[id]"), SP = C("SignaturePad"), ER = C("EvaluationReport"), RI = P("hr/reports/index"), RE = P("hr/reports/evaluatees/[id]"), RC = P("hr/reports/committees/[id]");

export const person2 = [
  {
    key: "GET /api/profile", name: "ข้อมูลส่วนตัวของตัวเอง", owner: 2, mount: "profile", access: "all", guard: true,
    criteria: "5.2.2", needs: "ต้อง login แล้ว", page: "/profile", section: "ข้อมูลส่วนตัว (profile)",
    flow: "เปิดหน้า → GET → หา user จาก id ใน token → เติมค่าลงฟอร์ม",
    fe: [
      b(PR, "useEffect(() => {", "โหลดข้อมูล", "`reset(formValues(...))` เติมค่าที่ได้ลงทุกช่องของฟอร์ม"),
      one(PR, "if (!profile) return", "ระหว่างโหลด", "ถ้ายังไม่มีข้อมูลจะไม่ render ฟอร์ม และแสดงข้อความถ้าโหลดพลาด"),
    ],
    be: [b(R("profile"), 'router.get("/", async', "route ข้อมูลส่วนตัว", "ใช้ `req.user.id` จาก token จึงดูได้เฉพาะของตัวเอง ไม่ต้องส่ง id มา")],
    db: [["users", "อ่าน `id`, `username`, `full_name`, `email`, `phone`, `position`, `department`, `role`, `must_change_password`"]],
    errors: [[404, "ไม่พบผู้ใช้"]],
  },
  {
    key: "PUT /api/profile", name: "แก้ไขข้อมูลส่วนตัว", owner: 2, mount: "profile", access: "all", guard: true,
    criteria: "5.2.2, 6.3", needs: "ต้อง login แล้ว", page: "/profile",
    flow: "แก้ฟอร์ม → Zod → PUT → UPDATE แถวของตัวเอง → อัปเดตชื่อบน navbar",
    fe: [
      b(FS("user"), "export const profileSchema", "Zod ของฟอร์ม", "ตัด `role` และ `username` ออก เพราะแก้เองไม่ได้"),
      b(PR, "const { register, handleSubmit", "ผูกฟอร์มกับ Zod", "`reset` ใช้เติมค่าจาก GET"),
      b(PR, "const onSubmit", "ส่งข้อมูล", "`saveAuth` อัปเดตชื่อใน localStorage เพื่อให้ navbar แสดงชื่อใหม่"),
      z(PR, "<form onSubmit", "</form>", "หน้าตาฟอร์ม", "ใช้ `grid sm:grid-cols-2` จอมือถือเรียง 1 คอลัมน์ จอใหญ่ 2 คอลัมน์"),
    ],
    be: [
      b(BS("user"), "export const profileSchema", "Zod ของ Backend", "ถึงส่ง `role` มาก็ถูกทิ้ง"),
      b(R("profile"), 'router.put("/", validate', "route แก้ไข", "`WHERE id = req.user.id` จึงแก้ได้เฉพาะของตัวเอง"),
    ],
    db: [["users", "UPDATE: `full_name`, `email`, `phone`, `position`, `department`"]],
    errors: [[400, "ข้อมูลไม่ถูกต้อง หรืออีเมลซ้ำ"]],
  },

  {
    key: "GET /api/self-evaluations", name: "แบบประเมินตนเอง พร้อมคะแนนและความคืบหน้า", owner: 2, mount: "self-evaluations", access: "evaluatee", guard: true,
    criteria: "5.2.7", needs: "ควรมีหัวข้อและตัวชี้วัดจากคนที่ 1 ถ้ายังไม่มีจะได้ `topics: []`", page: "/evaluatee, /evaluatee/evaluation, /evaluatee/result", section: "ประเมินตนเอง (self-evaluations)",
    flow: "เปิดหน้า → GET → ดึงหัวข้อ ตัวชี้วัด คะแนน หลักฐาน → รวมเป็นโครงเดียว → คำนวณความคืบหน้า",
    fe: [
      b(EV, "const load = () =>", "โหลดแบบประเมิน", "หลังบันทึกคะแนนหรือหลักฐาน `IndicatorCard` จะเรียก `onChange` ซึ่งคือฟังก์ชันนี้"),
      z(EV, "{data.topics.map((t) => (", "</section>", "แสดงหัวข้อและตัวชี้วัด", "แต่ละตัวชี้วัดแยกเป็น component `IndicatorCard` และส่ง `isOpen` ไปล็อกการแก้ไข"),
      z(EH, "{data.topics.map((t) => (", "max=\"100\"", "หน้าหลักแสดงความก้าวหน้า", "แสดง progress รายตัวชี้วัด ตามเกณฑ์ 5.2.7"),
    ],
    be: [
      b(R("selfEvaluations"), 'router.get("/", async', "route แบบประเมินตนเอง", "query แยก 4 ครั้ง แล้วประกอบข้อมูลด้วย `filter`, `map` และ `find`"),
      b(SCORE, "export function indicatorProgress", "คำนวณความคืบหน้า", "กรอกคะแนนแล้ว 1 ขั้น แนบหลักฐานแล้วอีก 1 ขั้น (ถ้าตัวชี้วัดนั้นต้องแนบ)"),
      b(SCORE, "export const percent", "คำนวณร้อยละ", "ถ้าตัวหารเป็น 0 จะคืน 0"),
    ],
    db: [["evaluation_topics", "อ่านทุกคอลัมน์ และคำนวณ `is_open`"], ["indicators", "อ่านทุกคอลัมน์"], ["self_evaluations", "แถวของผู้ที่ login"], ["evidences", "หลักฐานของผู้ที่ login"]],
    errors: [],
  },
  {
    key: "PUT /api/self-evaluations/{indicatorId}", name: "กรอกหรือแก้คะแนนตนเอง", owner: 2, mount: "self-evaluations", access: "evaluatee", guard: true,
    criteria: "5.2.5, 5.2.6, 6.3", needs: "ต้องมีตัวชี้วัดจากคนที่ 1 และหัวข้ออยู่ในช่วงเปิด", page: "/evaluatee/evaluation",
    flow: "เลือกคะแนน → PUT → ตรวจช่วงวันและรูปแบบคะแนน → INSERT หรือ UPDATE → โหลดใหม่",
    fe: [
      b(CARD, "const scoreOptions", "ตัวเลือกคะแนน", "มี/ไม่มี ได้ 1 หรือ 0 สเกลได้ 1-4"),
      b(CARD, "const run = async", "ตัวช่วยเรียก API", "สำเร็จแล้วเรียก `onChange` ให้หน้าแม่โหลดใหม่"),
      one(CARD, "const saveScore", "บันทึกคะแนน", "เลือกแล้วบันทึกทันที"),
      z(CARD, "{scoreOptions(ind.score_type).map((o) => (", "</label>", "ปุ่มเลือกคะแนน", "`disabled={!isOpen}` ล็อกเมื่อหมดช่วงประเมิน"),
    ],
    be: [
      b(BS("evaluation"), "export const selfScoreSchema", "Zod ของ Backend", "ตรวจแค่ว่าเป็นจำนวนเต็ม ช่วงคะแนนตรวจใน route เพราะต้องรู้รูปแบบของตัวชี้วัด"),
      b(R("selfEvaluations"), "async function findIndicator", "หาตัวชี้วัด", "คำนวณ `is_open` จากช่วงวันของหัวข้อ ใช้ร่วมกับเส้นเพิ่มหลักฐาน"),
      b(SCORE, "export function isValidScore", "ตรวจช่วงคะแนน", "yes_no ได้ 0 หรือ 1, scale_4 ได้ 1-4"),
      b(R("selfEvaluations"), 'router.put("/:indicatorId"', "route บันทึกคะแนน", "`ON DUPLICATE KEY UPDATE`: ถ้ายังไม่มีแถวจะเพิ่มใหม่ ถ้ามีแล้วจะแก้คะแนน จึงใช้ทั้งกรอกและแก้"),
    ],
    db: [["indicators", "อ่านรูปแบบคะแนน"], ["evaluation_topics", "อ่านช่วงวัน"], ["self_evaluations", "INSERT หรือ UPDATE `score`"]],
    errors: [[400, "หมดช่วงประเมิน หรือคะแนนไม่ตรงรูปแบบ"], [404, "ไม่พบตัวชี้วัด"]],
  },
  {
    key: "POST /api/self-evaluations/{indicatorId}/evidences", name: "เพิ่มรายละเอียดประกอบและอัปโหลดไฟล์หรือ URL", owner: 2, mount: "self-evaluations", access: "evaluatee", guard: true,
    criteria: "5.2.3, 5.2.4, 6.5", needs: "ต้องมีตัวชี้วัดจากคนที่ 1 และหัวข้ออยู่ในช่วงเปิด", page: "/evaluatee/evaluation", form: "form-data ช่อง `description` (บังคับ), `file` (PDF/JPG/PNG) หรือ `url`",
    flow: "กรอกและเลือกไฟล์ → Zod → FormData → POST → ตรวจชนิดไฟล์ → บันทึกไฟล์ → INSERT หลักฐาน",
    fe: [
      b(FS("evaluation"), "export const evidenceSchema", "Zod ของฟอร์ม", "ตรวจนามสกุลและขนาดไฟล์ก่อนส่ง และแนบได้แค่ไฟล์หรือ URL อย่างใดอย่างหนึ่ง"),
      b(CARD, "const { register, handleSubmit", "ผูกฟอร์มกับ Zod", "`reset` ใช้ล้างฟอร์มหลังบันทึก"),
      b(CARD, "const addEvidence", "ส่งข้อมูล", "มีไฟล์จึงต้องใช้ `FormData` แทน JSON"),
      z(CARD, "<form onSubmit={handleSubmit(addEvidence)}", "</form>", "หน้าตาฟอร์ม", "`canFile` และ `canUrl` เลือกช่องที่จะแสดงตาม `evidence_type`"),
    ],
    be: [
      b(BS("evaluation"), "export const evidenceSchema", "Zod ของ Backend", "ตรวจเฉพาะช่องข้อความ ส่วนไฟล์อยู่ใน `req.files`"),
      b(UP, "export function checkFile", "ตรวจชนิดไฟล์", "นามสกุลต้องตรงกับ mimetype"),
      b(UP, "export function checkAttachment", "ตรวจตามชนิดหลักฐาน", "เช่น ตัวชี้วัดที่กำหนดเป็นไฟล์ แนบ URL ไม่ได้"),
      b(UP, "export async function saveFile", "บันทึกไฟล์", "ตั้งชื่อสุ่มกันชื่อซ้ำและปัญหาชื่อภาษาไทย คืนชื่อไฟล์ที่บันทึก"),
      b(R("selfEvaluations"), 'router.post("/:indicatorId/evidences"', "route เพิ่มหลักฐาน", "ต้องสร้างแถว `self_evaluations` ก่อน เพราะหลักฐานอ้างถึงแถวนั้น จึงเพิ่มหลักฐานก่อนกรอกคะแนนได้"),
    ],
    db: [["self_evaluations", "สร้างแถวถ้ายังไม่มี แล้วอ่าน `id`"], ["evidences", "เพิ่ม 1 แถว: `self_evaluation_id`, `description`, `file_path`, `file_name`, `url`"]],
    errors: [[400, "ไม่กรอกรายละเอียด / ไฟล์ผิดชนิด / เกิน 10MB / หมดช่วงประเมิน / ไม่ตรงชนิดหลักฐาน"], [404, "ไม่พบตัวชี้วัด"]],
  },
  {
    key: "GET /api/evidences/{id}/file", name: "ดาวน์โหลดไฟล์หลักฐาน", owner: 2, mount: "evidences", access: "all", guard: true,
    criteria: "3.5.8.3 Function การ Download, 5.3.2", needs: "ต้องมีหลักฐานที่แนบไฟล์", page: "/evaluatee/evaluation และ /committee/evaluate/{id}", section: "หลักฐาน (evidences)",
    flow: "กดชื่อไฟล์ → Axios โหลดแบบ blob พร้อม token → ตรวจสิทธิ์เจ้าของ → ส่งไฟล์ → เบราว์เซอร์ดาวน์โหลด",
    fe: [
      b(API, "export async function downloadFile", "ดาวน์โหลดพร้อม token", "ลิงก์ธรรมดาส่ง token ไม่ได้ จึงโหลดเป็น blob แล้วสร้างลิงก์ชั่วคราว"),
      one(CARD, "const download = (ev)", "เรียกใช้", "ส่ง URL และชื่อไฟล์จริง"),
      z(CARD, "{ev.file_name && (", "</button>", "ปุ่มชื่อไฟล์", "แสดงเฉพาะรายการที่มีไฟล์"),
    ],
    be: [
      b(R("evidences"), "async function findEvidence", "หาหลักฐานและเจ้าของ", "JOIN เพื่อรู้ว่าเป็นของใคร และหัวข้อเปิดอยู่หรือไม่ ใช้ร่วมกับ DELETE"),
      b(R("evidences"), 'router.get("/:id/file"', "route ดาวน์โหลด", "hr โหลดได้ทุกไฟล์ ผู้รับการประเมินโหลดของตัวเอง กรรมการโหลดเฉพาะคนที่ได้รับมอบหมาย"),
    ],
    db: [["evidences", "อ่าน `file_path`, `file_name`"], ["self_evaluations", "อ่าน `evaluatee_id`"], ["indicators", "ใช้ JOIN"], ["evaluation_topics", "ใช้ JOIN"], ["assignments", "ตรวจสิทธิ์กรรมการ"]],
    errors: [[403, "ไม่มีสิทธิ์ดาวน์โหลดไฟล์นี้"], [404, "ไม่พบไฟล์"]],
  },
  {
    key: "DELETE /api/evidences/{id}", name: "ลบรายละเอียดประกอบ", owner: 2, mount: "evidences", access: "evaluatee", guard: true,
    criteria: "5.2.6, 6.4", needs: "ต้องมีหลักฐานจากเส้นเพิ่มหลักฐาน", page: "/evaluatee/evaluation",
    flow: "กดลบ → confirm → DELETE → ตรวจเจ้าของและช่วงวัน → ลบแถว → ลบไฟล์",
    fe: [
      one(CARD, "const removeEvidence", "ฟังก์ชันลบ", "ถามยืนยันก่อน และใช้ `run` ตัวเดียวกับบันทึกคะแนน"),
      one(CARD, 'title="ลบรายละเอียด"', "ปุ่มลบ", "แสดงเฉพาะช่วงที่เปิดประเมิน"),
    ],
    be: [
      b(UP, "export const deleteFile", "ลบไฟล์", "`force: true` ทำให้ไม่ error ถ้าไฟล์หายไปแล้ว"),
      b(R("evidences"), 'router.delete("/:id"', "route ลบ", "ถ้าไม่ใช่ของตัวเองจะตอบ 404 เพื่อไม่บอกว่ามีรายการนี้อยู่"),
    ],
    db: [["evidences", "DELETE 1 แถว"]],
    errors: [[400, "หมดช่วงประเมิน"], [404, "ไม่พบรายการ หรือไม่ใช่ของตัวเอง"]],
  },

  {
    key: "GET /api/backups", name: "รายการไฟล์สำรอง", owner: 2, mount: "backups", access: "hr", guard: true,
    criteria: "8.3, 8.4", needs: "บัญชี hr", page: "/hr/backups", section: "สำรองและกู้คืนข้อมูล (backups)",
    flow: "เปิดหน้า → GET → อ่านรายชื่อไฟล์ในโฟลเดอร์ backups → แสดงตาราง",
    fe: [
      b(BK, "const load = () =>", "โหลดรายการ", "เก็บผลใน `list`"),
      z(BK, '<div className="overflow-x-auto bg-base-100 rounded-box shadow">', "{list.length === 0", "ตารางไฟล์สำรอง", "แสดงชื่อไฟล์ เวลา ขนาด และปุ่มต่างๆ"),
    ],
    be: [
      b(BU, "export function listBackups", "อ่านรายการไฟล์", "กรองเฉพาะชื่อที่ถูกรูปแบบ และเรียงไฟล์ใหม่สุดก่อน"),
      b(R("backups"), 'router.get("/", (req', "route รายการ", "เส้นนี้อ่านจากโฟลเดอร์ `backend/backups/` ไม่ได้อ่านจาก DB"),
    ],
    db: [],
    dbNote: "เส้นนี้ไม่ใช้ตารางใน DB อ่านจากโฟลเดอร์ `backend/backups/`",
    errors: [],
  },
  {
    key: "POST /api/backups", name: "สำรองข้อมูลตอนนี้", owner: 2, mount: "backups", access: "hr", guard: true,
    criteria: "8.3, 8.4", needs: "บัญชี hr และต้องตั้ง `DB_CONTAINER` ให้ตรงชื่อ container ของ MySQL", page: "/hr/backups (ปุ่มสำรองข้อมูลตอนนี้)",
    flow: "กดปุ่ม → POST → เรียก mysqldump → เขียนไฟล์ .sql → โหลดรายการใหม่",
    fe: [
      b(BK, "const run = async", "ตัวช่วยเรียก API", "ล็อกปุ่มระหว่างทำงาน แสดงผล แล้วโหลดรายการใหม่ ใช้ซ้ำทุกปุ่มในหน้านี้"),
      z(BK, 'onClick={() => run(() => api.post("/backups"))}', "</button>", "ปุ่มสำรองข้อมูล", "`disabled={busy}` กันการกดซ้ำ"),
    ],
    be: [
      b(BU, "function runMysql", "เรียกโปรแกรม mysqldump/mysql", "`DB_CONTAINER` มีค่าจะเรียกผ่าน `docker exec` ไม่มีค่าจะเรียกตรง และส่งรหัสผ่านทาง `MYSQL_PWD` ไม่ให้อยู่บน command line"),
      b(BU, "export async function createBackup", "สร้างไฟล์สำรอง", "ตั้งชื่อไฟล์จากวันเวลา"),
      b(R("backups"), 'router.post("/", async', "route สำรองข้อมูล", "ใช้ `try/catch` เพื่อตอบ 500 พร้อมสาเหตุ"),
    ],
    db: [],
    dbNote: "อ่านทุกตารางด้วย `mysqldump` ไฟล์ที่ได้มี DROP TABLE, CREATE TABLE และ INSERT ครบ",
    errors: [[500, "เรียก mysqldump ไม่สำเร็จ เช่น `DB_CONTAINER` ผิด"]],
  },
  {
    key: "GET /api/backups/{name}/download", name: "ดาวน์โหลดไฟล์สำรอง", owner: 2, mount: "backups", access: "hr", guard: true,
    criteria: "8.3, 8.4", needs: "ต้องมีไฟล์จาก `POST /api/backups`", page: "/hr/backups (ปุ่มดาวน์โหลด)",
    flow: "กดปุ่ม → GET แบบ blob พร้อม token → ตรวจชื่อไฟล์ → ส่งไฟล์",
    feIntro: "ใช้ `downloadFile` ตัวเดียวกับ[ดาวน์โหลดไฟล์หลักฐาน](#get-api-evidences-id-file)",
    fe: [one(BK, "onClick={() => downloadFile(`/backups/${b.name}/download`, b.name)", "ปุ่มดาวน์โหลด", "ส่ง URL และชื่อไฟล์")],
    be: [
      b(BU, "export const isBackupName", "ตรวจชื่อไฟล์", "กันการส่ง `../` เพื่อเข้าถึงไฟล์นอกโฟลเดอร์"),
      b(R("backups"), "function backupPath", "หา path ของไฟล์", "ชื่อผิดรูปแบบหรือไม่มีไฟล์จะคืน `null` ใช้ร่วมกับ restore และ delete"),
      b(R("backups"), 'router.get("/:name/download"', "route ดาวน์โหลด", "`res.download` ส่งไฟล์ให้เบราว์เซอร์"),
    ],
    db: [], dbNote: "เส้นนี้ไม่ใช้ตารางใน DB",
    errors: [[404, "ไม่พบไฟล์สำรอง"]],
  },
  {
    key: "POST /api/backups/{name}/restore", name: "กู้คืนจากไฟล์สำรองบน server", owner: 2, mount: "backups", access: "hr", guard: true,
    criteria: "8.3, 8.4", needs: "ต้องมีไฟล์จาก `POST /api/backups`", page: "/hr/backups (ปุ่มกู้คืน)",
    flow: "กดกู้คืน → confirm → POST → สำรองข้อมูลปัจจุบันก่อน → รัน SQL จากไฟล์",
    intro: "> ⚠️ ถ้าทีมใช้ MySQL ร่วมกัน เส้นนี้จะเขียนทับข้อมูลของทุกคน ต้องบอกเพื่อนก่อนทดสอบ",
    fe: [
      b(BK, "const restoreFrom", "ฟังก์ชันกู้คืน", "`confirm(...) && run(...)` ถ้ากดยกเลิกจะไม่เรียก API"),
      one(BK, "onClick={() => restoreFrom(b)}", "ปุ่มกู้คืน", "ล็อกระหว่างทำงาน"),
    ],
    be: [
      b(R("backups"), "const isSystemBackup", "ตรวจว่าเป็นไฟล์ของระบบนี้", "ไฟล์ต้องมีตาราง `users`"),
      b(R("backups"), "async function restore", "ขั้นตอนกู้คืน", "สำรองข้อมูลปัจจุบันไว้ก่อนเสมอ กันการกู้ผิดไฟล์"),
      b(BU, "export const restoreBackup", "รัน SQL", "ส่งข้อความ SQL เข้าโปรแกรม `mysql`"),
      b(R("backups"), 'router.post("/:name/restore"', "route กู้คืน", "ใช้ `backupPath` และ `restore` ตัวกลาง"),
    ],
    db: [], dbNote: "ทุกตารางถูก DROP แล้วสร้างใหม่จากไฟล์สำรอง",
    errors: [[400, "ไม่ใช่ไฟล์ของระบบนี้"], [404, "ไม่พบไฟล์สำรอง"], [500, "กู้คืนไม่สำเร็จ"]],
  },
  {
    key: "POST /api/backups/restore", name: "กู้คืนจากไฟล์ .sql ที่อัปโหลด", owner: 2, mount: "backups", access: "hr", guard: true,
    criteria: "8.3, 8.4", needs: "ต้องมีไฟล์ .sql ที่ดาวน์โหลดไว้", page: "/hr/backups (อัปโหลดและกู้คืน)", form: "form-data ช่อง `file` เป็นไฟล์ .sql",
    flow: "เลือกไฟล์ → confirm → FormData → POST → สำรองข้อมูลปัจจุบันก่อน → รัน SQL",
    feIntro: "ใช้ `run` ตัวเดียวกับ[ปุ่มสำรองข้อมูล](#post-api-backups)",
    fe: [
      b(BK, "const restoreUpload", "อัปโหลดไฟล์", "ส่งไฟล์ด้วย `FormData` แล้วล้างช่องเลือกไฟล์"),
      z(BK, '<input ref={fileRef} type="file" accept=".sql"', "</button>", "ช่องเลือกไฟล์", "`useRef` ใช้อ่านไฟล์"),
    ],
    be: [b(R("backups"), 'router.post("/restore"', "route กู้คืนจากไฟล์", "`file.data` คือเนื้อหาไฟล์ ใช้ `restore` ตัวกลางเดียวกับเส้นก่อนหน้า\n\n> ต้องประกาศเส้นนี้**ก่อน** `/:name/restore` ไม่อย่างนั้น Express จะมองคำว่า restore เป็นค่า `:name`")],
    db: [], dbNote: "ทุกตารางถูก DROP แล้วสร้างใหม่จากไฟล์ที่อัปโหลด",
    errors: [[400, "ไม่เลือกไฟล์ / ไม่ใช่ .sql / ไม่ใช่ไฟล์ของระบบนี้"], [500, "กู้คืนไม่สำเร็จ"]],
  },
  {
    key: "DELETE /api/backups/{name}", name: "ลบไฟล์สำรอง", owner: 2, mount: "backups", access: "hr", guard: true,
    criteria: "6.4, 8.3", needs: "ต้องมีไฟล์จาก `POST /api/backups`", page: "/hr/backups (ปุ่มถังขยะ)",
    flow: "กดลบ → confirm → DELETE → ลบไฟล์ออกจากโฟลเดอร์",
    fe: [
      one(BK, "const remove = (b)", "ฟังก์ชันลบ", "ใช้ `run` ตัวเดียวกับปุ่มอื่น"),
      one(BK, "onClick={() => remove(b)}", "ปุ่มลบ", "ล็อกระหว่างทำงาน"),
    ],
    be: [b(R("backups"), 'router.delete("/:name"', "route ลบ", "ใช้ `backupPath` ตรวจชื่อก่อนลบ")],
    db: [], dbNote: "เส้นนี้ไม่ใช้ตารางใน DB",
    errors: [[404, "ไม่พบไฟล์สำรอง"]],
  },

  {
    key: "GET /api/reports/overview", name: "ข้อมูล Dashboard", owner: 2, mount: "reports", access: "hr", guard: true,
    criteria: "8.1, 8.2, 5.1.12", needs: "ทำได้ทันที แต่จะเห็นตัวเลขจริงเมื่อมีผู้ใช้ ตัวชี้วัด และคะแนนแล้ว", page: "/hr", section: "Dashboard (reports/overview)",
    intro: "> 💡 ฟังก์ชัน `loadIndicators` และ `loadResults` ใช้ร่วมกับเส้นรายงานของคนที่ 3 ควรตกลงกันว่าใครเขียนก่อน",
    flow: "เปิดหน้า → GET → ดึงผู้ใช้ หัวข้อ การมอบหมาย และผลการประเมิน → คำนวณสถิติ → ตรวจความครบถ้วน → แสดง Dashboard",
    fe: [
      b(DASH, "useEffect(() => {", "โหลดข้อมูล", "เรียกครั้งเดียวเมื่อรู้ว่าเป็น hr"),
      b(DASH, "const statusBars", "เตรียมข้อมูลแถบสถานะ", "ทำเป็น array เพื่อใช้ `map` แทนการเขียนซ้ำ 3 ครั้ง"),
      z(DASH, "{/* ตรวจความถูกต้องของข้อมูล */}", '<div className="grid md:grid-cols-3 gap-4 mb-4">', "แจ้งเตือนข้อมูลและตัวเลขสรุป", "ใช้ `stats` ของ DaisyUI ส่วนบรรทัดถัดไปเป็นการ์ด progress และอันดับคะแนน ซึ่งอ่านค่าจาก `data` แบบเดียวกัน"),
    ],
    be: [
      b(R("reports"), "async function loadIndicators", "ดึงตัวชี้วัด", "ใช้หลายเส้นในไฟล์นี้"),
      b(R("reports"), "async function loadResults", "คำนวณผลรายคน", "ดึงข้อมูลทีเดียวทุกคนด้วย `IN (?)` แล้วแยกตามคน ลดจำนวนครั้งที่ถาม DB"),
      b(SCORE, "export function buildResult", "สรุปผล 1 คน", "ใช้คะแนนเฉลี่ยจากกรรมการที่ยืนยันแล้วเท่านั้น"),
      b(SCORE, "export function average", "ค่าเฉลี่ย", "ไม่นับค่าว่าง"),
      b(SCORE, "export function sortBy", "เรียงข้อมูล", "ค่าว่างไว้ท้ายเสมอ และไม่แก้ array เดิม"),
      b("backend/utils/dataCheck.js", "export function findDataIssues", "ตรวจความครบถ้วน", "เช่น น้ำหนักรวมต้องเป็น 100 ทุกคนต้องมีประธานกรรมการ ตามเกณฑ์ 8.2"),
      b(R("reports"), 'router.get("/overview"', "route Dashboard", "รวมตัวเลขทุกอย่างเป็น object เดียว"),
    ],
    db: [["users", "อ่าน `id`, `full_name`, `role`"], ["evaluation_topics", "อ่านหัวข้อ และคำนวณ `is_open`"], ["indicators", "อ่านผ่าน `loadIndicators`"], ["assignments", "นับตามสถานะ"], ["self_evaluations", "คะแนนตนเอง"], ["evidences", "นับจำนวนหลักฐาน"], ["committee_scores", "คะแนนกรรมการ"]],
    errors: [],
  },
];

export const person3 = [
  {
    key: "GET /api/committee/assignments", name: "ผู้รับการประเมินที่ต้องประเมิน", owner: 3, mount: "committee", access: "committee", guard: true,
    criteria: "5.3.1", needs: "ต้องมีการมอบหมายจากคนที่ 1 ถ้ายังไม่มีจะได้ `[]`", page: "/committee", section: "กรรมการ (committee)",
    flow: "เปิดหน้า → GET → หางานของกรรมการจาก id ใน token → แสดงตารางและสถิติ",
    fe: [
      b(CM, "useEffect(() => {", "โหลดรายการ", "เก็บผลใน `list`"),
      one(CM, "const count = (status)", "นับตามสถานะ", "ใช้แสดงตัวเลขสรุป"),
      z(CM, '<div className="stats stats-vertical', '<div className="overflow-x-auto bg-base-100 rounded-box shadow">', "ตัวเลขสรุป", "ใช้ `stats` ของ DaisyUI"),
      z(CM, "{list.map((a) => (", "{list.length === 0", "ตารางรายชื่อ", "ปุ่มเปลี่ยนเป็น \"ดูผล\" เมื่อยืนยันแล้ว"),
    ],
    be: [b(R("committee"), 'router.get("/assignments", async', "route งานของกรรมการ", "`WHERE a.committee_id = ?` ใช้ id จาก token จึงเห็นเฉพาะงานของตัวเอง")],
    db: [["assignments", "อ่านงานของกรรมการ"], ["users", "อ่านข้อมูลผู้รับการประเมิน"], ["committee_scores", "นับคะแนนที่ให้แล้ว"], ["self_evaluations", "นับข้อที่ประเมินตนเองแล้ว"], ["indicators", "นับจำนวนตัวชี้วัด"]],
    errors: [],
  },
  {
    key: "GET /api/committee/assignments/{id}", name: "ข้อมูลสำหรับประเมิน 1 คน", owner: 3, mount: "committee", access: "committee", guard: true,
    criteria: "5.3.2, 5.3.3, 5.3.6", needs: "ต้องมีการมอบหมาย และควรมีการประเมินตนเองจากคนที่ 2", page: "/committee/evaluate/{id}",
    flow: "เปิดหน้า → GET → ตรวจว่าเป็นงานของตัวเอง → รวมตัวชี้วัด หลักฐาน คะแนนตนเอง และคะแนนกรรมการ → แสดงผล",
    fe: [
      b(EVA, "const load = () =>", "โหลดข้อมูล", "แปลงคะแนนที่บันทึกแล้วเป็น `{ indicator_id: score }` เก็บไว้ใน `scores`"),
      z(EVA, "{/* ข้อมูลผู้รับการประเมิน */}", "{message.text && <div className={`alert", "ข้อมูลผู้รับการประเมิน", "แสดงชื่อ ตำแหน่ง และสถานะ"),
      z(EVA, "{i.evidences.map((ev) => (", "{i.evidences.length === 0", "หลักฐานของตัวชี้วัด", "แสดงไฟล์และ URL ตามเกณฑ์ 5.3.2"),
      z(EVA, "{/* ตารางผลลัพธ์ */}", "</tfoot>", "ตารางผลการประเมิน", "ตามเกณฑ์ 5.3.6 `topics.map` คืน array ของแถวหัวข้อและแถวตัวชี้วัด"),
    ],
    be: [
      b(R("committee"), "async function findMyAssignment", "หางานของตัวเอง", "มี `committee_id = ?` จึงเปิดงานของคนอื่นไม่ได้"),
      b(SCORE, "export function weighted", "คะแนนถ่วงน้ำหนัก", "สเกลคิด (คะแนน/4) x น้ำหนัก, มี/ไม่มีคิด 0 หรือ 1 เท่าของน้ำหนัก"),
      b(SCORE, "export const sum", "รวมคะแนน", "ปัดทศนิยม 2 ตำแหน่ง"),
      b(R("committee"), 'router.get("/assignments/:id", async', "route ข้อมูลประเมิน", "ประกอบ `rows` รายตัวชี้วัดก่อน แล้วจัดเข้าแต่ละหัวข้อ"),
    ],
    db: [["assignments", "อ่าน 1 แถวของตัวเอง"], ["users", "ข้อมูลผู้รับการประเมิน"], ["evaluation_topics", "อ่านหัวข้อ"], ["indicators", "อ่านทุกตัวชี้วัด"], ["self_evaluations", "คะแนนตนเอง"], ["evidences", "หลักฐาน"], ["committee_scores", "คะแนนของกรรมการคนนี้"]],
    errors: [[404, "ไม่พบงาน หรือไม่ใช่งานของตัวเอง"]],
  },
  {
    key: "PUT /api/committee/assignments/{id}/scores", name: "บันทึกร่างคะแนนและความเห็นสรุป", owner: 3, mount: "committee", access: "committee", guard: true,
    criteria: "5.3.4, 5.3.5, 5.3.8", needs: "ต้องมีการมอบหมาย และมีตัวชี้วัด", page: "/committee/evaluate/{id}",
    flow: "เลือกคะแนนและกรอกความเห็น → Zod → PUT → ตรวจทุกคะแนน → transaction บันทึกคะแนนและสถานะ draft",
    fe: [
      b(FS("committee"), "export const draftSchema", "Zod ของการบันทึกร่าง", "ความเห็นว่างได้"),
      b(EVA, "const scoreOptions", "ตัวเลือกคะแนน", "`title` แสดงคำอธิบายระดับ 1-4 เมื่อวางเมาส์"),
      z(EVA, "{scoreOptions(i.score_type).map((o) => (", "{scores[i.id] == null", "ปุ่มให้คะแนน", "`{ ...scores, [i.id]: o.value }` สร้าง object ใหม่ที่เปลี่ยนเฉพาะข้อนั้น `disabled={locked}` ล็อกเมื่อยืนยันแล้ว"),
      b(EVA, "const sendDraft", "ส่งข้อมูล", "แปลง `scores` กลับเป็น array ก่อนส่ง"),
      b(EVA, "const saveDraft", "กดบันทึกร่าง", "ตรวจด้วย Zod แล้วเรียก `sendDraft`"),
      z(EVA, "{/* ความเห็นสรุป */}", "{/* ตารางผลลัพธ์ */}", "ช่องความเห็นสรุป", "ใช้ `value` คู่กับ `onChange` เก็บค่าใน `comment`"),
    ],
    be: [
      b(BS("committee"), "export const draftSchema", "Zod ของ Backend", "`scores` เป็น array ให้ไม่ครบทุกข้อได้"),
      b(R("committee"), 'router.put("/assignments/:id/scores"', "route บันทึกร่าง", "ใช้ transaction: ถ้าขั้นใดพังจะ `rollback` ทั้งหมด และ `finally` คืน connection เสมอ"),
    ],
    db: [["assignments", "UPDATE `status` = draft, `summary_comment`"], ["indicators", "อ่าน `id`, `name`, `score_type` เพื่อตรวจคะแนน"], ["committee_scores", "INSERT หรือ UPDATE หลายแถว"]],
    errors: [[400, "ยืนยันผลแล้ว / ไม่พบตัวชี้วัด / คะแนนไม่ถูกต้อง"], [404, "ไม่พบงาน หรือไม่ใช่งานของตัวเอง"]],
  },
  {
    key: "PUT /api/committee/assignments/{id}/confirm", name: "ลงลายเซ็นและยืนยันผล", owner: 3, mount: "committee", access: "committee", guard: true,
    criteria: "5.3.7, 5.3.9, 5.3.10", needs: "ต้องให้คะแนนครบทุกตัวชี้วัด และบันทึกความเห็นสรุปแล้ว", page: "/committee/evaluate/{id}",
    flow: "วาดลายเซ็น → Zod ตรวจความครบ → confirm → บันทึกร่างล่าสุด → PUT → UPDATE เป็น confirmed → แก้ไขไม่ได้อีก",
    fe: [
      b(FS("committee"), "export const confirmSchema", "Zod ก่อนยืนยัน", "ต้องให้คะแนนครบ มีความเห็น และมีลายเซ็น"),
      b(SP, "export default function SignaturePad", "ช่องลงลายเซ็น", "วาดบน `<canvas>` ด้วย pointer events จึงใช้ได้ทั้งเมาส์และนิ้ว จบแต่ละเส้นจะส่งรูปออกด้วย `toDataURL`"),
      b(EVA, "const confirmResult", "กดยืนยัน", "เรียก `sendDraft` ก่อน เพื่อให้คะแนนล่าสุดถูกบันทึก แล้วค่อยยืนยัน"),
      z(EVA, "{/* ลงนาม + ยืนยัน */}", "</Layout>", "ส่วนลงนาม", "หลังยืนยันจะแสดงรูปลายเซ็นแทนช่องวาด"),
    ],
    be: [
      b(BS("committee"), "export const confirmSchema", "Zod ของ Backend", "ลายเซ็นต้องเป็น PNG แบบ data URL"),
      b(R("committee"), 'router.put("/assignments/:id/confirm"', "route ยืนยันผล", "ตรวจซ้ำฝั่ง Backend ว่าคะแนนครบและมีความเห็น แล้วตั้งสถานะ `confirmed`"),
    ],
    db: [["assignments", "UPDATE `status` = confirmed, `signature`, `confirmed_at`"], ["indicators", "นับจำนวนทั้งหมด"], ["committee_scores", "นับจำนวนที่ให้แล้ว"]],
    errors: [[400, "ยืนยันไปแล้ว / คะแนนไม่ครบ / ไม่มีความเห็น / ไม่มีลายเซ็น"], [404, "ไม่พบงาน หรือไม่ใช่งานของตัวเอง"]],
  },

  {
    key: "GET /api/reports/evaluatees", name: "สรุปผลรายผู้รับการประเมิน", owner: 3, mount: "reports", access: "hr", guard: true,
    criteria: "5.1.10, 5.1.12, 8.5", needs: "ต้องมีผู้รับการประเมิน ผลจะสมบูรณ์เมื่อกรรมการยืนยันแล้ว", page: "/hr/reports", section: "รายงาน (reports)",
    intro: "> 💡 ฟังก์ชัน `loadIndicators` และ `loadResults` ใช้ร่วมกับ Dashboard ของคนที่ 2",
    flow: "เปิดหน้า → GET พร้อม sort → คำนวณผลทุกคน → เรียงข้อมูล → แสดงตาราง → ส่งออก CSV หรือ PDF",
    fe: [
      b(RI, "useEffect(() => {", "โหลดข้อมูล", "โหลดใหม่เมื่อเปลี่ยนการเรียงลำดับ"),
      b(RI, "const exportEvaluatees", "ส่งออก CSV", "ใช้ `downloadCsv` จาก `lib/format.js`"),
      z(RI, '<div className="flex gap-2 print:hidden">', "</div>", "ปุ่มส่งออก", "`print:hidden` ซ่อนปุ่มตอนพิมพ์ ส่วน PDF ใช้ `window.print()`"),
      z(RI, "{evaluatees.map((e) => (", "</tbody>", "แถวตาราง", "`progress` แสดงร้อยละการบันทึก ตามเกณฑ์ 5.1.12"),
    ],
    be: [
      b(R("reports"), "async function loadIndicators", "ดึงตัวชี้วัด", "ใช้หลายเส้นในไฟล์นี้"),
      b(R("reports"), "async function loadResults", "คำนวณผลรายคน", "ดึงข้อมูลทีเดียวทุกคนด้วย `IN (?)` แล้วแยกตามคน"),
      b(SCORE, "export function buildResult", "สรุปผล 1 คน", "ใช้เฉพาะกรรมการที่ยืนยันแล้ว"),
      b(SCORE, "export function sortBy", "เรียงข้อมูล", "ค่าว่างไว้ท้ายเสมอ"),
      b(R("reports"), 'router.get("/evaluatees", requireRole', "route สรุปผล", "รับ `sort` เป็น score, progress หรือ name"),
    ],
    db: [["users", "อ่านผู้รับการประเมิน"], ["indicators", "ผ่าน `loadIndicators`"], ["evaluation_topics", "ชื่อหัวข้อ"], ["self_evaluations", "คะแนนตนเอง"], ["evidences", "นับหลักฐาน"], ["assignments", "กรรมการของแต่ละคน"], ["committee_scores", "คะแนนกรรมการ"]],
    errors: [],
  },
  {
    key: "GET /api/reports/evaluatees/{id}", name: "รายงานผลรายบุคคล", owner: 3, mount: "reports", access: "ทุกบทบาท ตามสิทธิ์ของแต่ละคน", guard: true,
    criteria: "5.1.13, 5.2.8, 5.2.9, 8.5", needs: "ต้องมีผู้รับการประเมิน ควรมีกรรมการยืนยันผลแล้ว", page: "/hr/reports/evaluatees/{id} และ /evaluatee/result",
    flow: "เปิดหน้า → GET → ตรวจสิทธิ์ตาม role → คำนวณผล → ซ่อนผลที่ยังไม่ยืนยัน → แสดงรายงาน → Export PDF",
    fe: [
      b(RE, "useEffect(() => {", "หน้าของ hr", "`useRouter().query.id` อ่าน id จาก URL ต้องรอจนมีค่าก่อนเรียก API"),
      b(RES, "useEffect(() => {", "หน้าของผู้รับการประเมิน", "ใช้ `user.id` ของตัวเอง"),
      z(RES, '<button className="btn btn-primary print:hidden"', "</button>", "ปุ่ม Export PDF", "`window.print()` แล้วเลือกบันทึกเป็น PDF ตามเกณฑ์ 5.2.8"),
      b(ER, "export default function EvaluationReport", "แสดงรายงาน", "ใช้ร่วมกันทุกบทบาท จัดกลุ่มตัวชี้วัดตามหัวข้อ แล้วแสดงตาราง ความเห็น และลายเซ็น"),
    ],
    be: [b(R("reports"), 'router.get("/evaluatees/:id"', "route รายงานรายบุคคล", "แต่ละ role มีสิทธิ์ต่างกัน ผู้รับการประเมินเห็นเฉพาะผลของกรรมการที่ยืนยันแล้ว ส่วน `loadResults` ดูที่[เส้นก่อนหน้า](#get-api-reports-evaluatees)")],
    db: [["assignments", "ตรวจสิทธิ์กรรมการ และข้อมูลกรรมการ"], ["users", "ข้อมูลผู้รับการประเมิน"]],
    errors: [[403, "ดูผลของคนอื่น หรือกรรมการที่ไม่ได้รับมอบหมาย"], [404, "ไม่พบผู้รับการประเมิน"]],
  },
  {
    key: "GET /api/reports/committees", name: "สถานะการประเมินรายกรรมการ", owner: 3, mount: "reports", access: "hr", guard: true,
    criteria: "5.1.11", needs: "ต้องมีกรรมการ", page: "/hr/reports (แท็บรายกรรมการ)",
    flow: "เปิดแท็บ → GET → นับสถานะของกรรมการแต่ละคน → แสดงตาราง",
    fe: [
      one(RI, 'api.get("/reports/committees")', "เรียก API", "อยู่ใน `useEffect` เดียวกับรายงานรายบุคคล"),
      b(RI, "const exportCommittees", "ส่งออก CSV", "รูปแบบเดียวกับรายงานรายบุคคล"),
      z(RI, "{committees.map((c) => (", "</tbody>", "แถวตาราง", "แสดงจำนวนแต่ละสถานะ ตามเกณฑ์ 5.1.11"),
    ],
    be: [b(R("reports"), 'router.get("/committees", requireRole', "route สถานะกรรมการ", "`LEFT JOIN` ทำให้กรรมการที่ยังไม่มีงานยังแสดงอยู่ และ `SUM(a.status = 'pending')` นับจำนวนตามสถานะ")],
    db: [["users", "อ่านกรรมการ"], ["assignments", "นับตามสถานะ"]],
    errors: [],
  },
  {
    key: "GET /api/reports/committees/{id}", name: "สรุปการประเมินของกรรมการ 1 คน", owner: 3, mount: "reports", access: "hr", guard: true,
    criteria: "5.1.10", needs: "ต้องมีกรรมการที่ได้รับมอบหมาย", page: "/hr/reports/committees/{id}",
    flow: "เปิดหน้า → GET → ดึงงานและคะแนนของกรรมการ → แสดงตารางผู้รับการประเมินต่อตัวชี้วัด",
    fe: [
      b(RC, "useEffect(() => {", "โหลดข้อมูล", "รอจนมี `id` จาก URL"),
      z(RC, '<table className="table table-sm">', "</table>", "ตารางสรุป", "แถวคือผู้รับการประเมิน คอลัมน์คือตัวชี้วัด"),
    ],
    be: [b(R("reports"), 'router.get("/committees/:id"', "route สรุปรายกรรมการ", "`Object.fromEntries` แปลงคะแนนเป็น `{ indicator_id: score }` เพื่อให้หน้าเว็บอ่านค่าง่าย")],
    db: [["users", "อ่านกรรมการ"], ["indicators", "ผ่าน `loadIndicators`"], ["assignments", "งานของกรรมการ"], ["committee_scores", "คะแนนของกรรมการ"]],
    errors: [[404, "ไม่พบกรรมการ"]],
  },
];
