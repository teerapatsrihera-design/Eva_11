import { useEffect, useRef, useState } from "react";
import { DatabaseBackup, Download, RotateCcw, Trash2, Upload } from "lucide-react";
import api, { errorMessage, downloadFile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";

// สำรองและกู้คืนข้อมูล (mysqldump ผ่าน backend)
export default function Backups() {
  const user = useAuth(["hr"]);
  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileRef = useRef(null);

  const load = () =>
    api
      .get("/backups")
      .then((res) => setList(res.data.data))
      .catch((err) => setMessage({ type: "error", text: errorMessage(err) }));

  useEffect(() => {
    if (user) load();
  }, [user]);

  // เรียก API ที่ใช้เวลานาน: ล็อกปุ่ม แสดงผลลัพธ์ แล้วโหลดรายการใหม่
  const run = async (request) => {
    setBusy(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await request();
      setMessage({ type: "success", text: res.data.message });
      load();
    } catch (err) {
      setMessage({ type: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const restoreFrom = (b) =>
    confirm(`กู้คืนข้อมูลจาก ${b.name} ?\nข้อมูลปัจจุบันจะถูกแทนที่ (ระบบจะสำรองข้อมูลปัจจุบันไว้ให้ก่อน)`) &&
    run(() => api.post(`/backups/${b.name}/restore`));

  const restoreUpload = () => {
    const file = fileRef.current.files[0];
    if (!file) return setMessage({ type: "error", text: "กรุณาเลือกไฟล์ .sql" });
    if (!confirm(`กู้คืนข้อมูลจากไฟล์ ${file.name} ?\nข้อมูลปัจจุบันจะถูกแทนที่`)) return;
    const form = new FormData();
    form.append("file", file);
    run(() => api.post("/backups/restore", form)).then(() => (fileRef.current.value = ""));
  };

  const remove = (b) => confirm(`ลบไฟล์ ${b.name} ?`) && run(() => api.delete(`/backups/${b.name}`));

  if (!user) return null;

  return (
    <Layout user={user}>
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold">สำรองและกู้คืนข้อมูล</h1>
        <button className="btn btn-primary" disabled={busy} onClick={() => run(() => api.post("/backups"))}>
          <DatabaseBackup size={18} /> สำรองข้อมูลตอนนี้
        </button>
      </div>

      {busy && <progress className="progress progress-primary w-full mb-2" />}
      {message.text && <div className={`alert alert-${message.type} mb-4`}>{message.text}</div>}

      <div className="card bg-base-100 shadow mb-4">
        <div className="card-body py-4 flex-row flex-wrap items-center gap-2">
          <span className="font-medium">กู้คืนจากไฟล์ในเครื่อง</span>
          <input ref={fileRef} type="file" accept=".sql" className="file-input file-input-sm w-full sm:w-auto" />
          <button className="btn btn-sm btn-warning" disabled={busy} onClick={restoreUpload}>
            <Upload size={16} /> อัปโหลดและกู้คืน
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-base-100 rounded-box shadow">
        <table className="table">
          <thead>
            <tr>
              <th>ไฟล์สำรอง</th>
              <th>วันเวลา</th>
              <th className="text-right">ขนาด</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.name}>
                <td className="break-all">{b.name}</td>
                <td className="whitespace-nowrap">{new Date(b.created_at).toLocaleString("th-TH")}</td>
                <td className="text-right whitespace-nowrap">{(b.size / 1024).toFixed(1)} KB</td>
                <td className="whitespace-nowrap text-right">
                  <button
                    className="btn btn-xs btn-ghost"
                    title="ดาวน์โหลด"
                    onClick={() => downloadFile(`/backups/${b.name}/download`, b.name).catch((err) => alert(errorMessage(err)))}
                  >
                    <Download size={14} />
                  </button>
                  <button className="btn btn-xs btn-ghost" title="กู้คืน" disabled={busy} onClick={() => restoreFrom(b)}>
                    <RotateCcw size={14} />
                  </button>
                  <button className="btn btn-xs btn-ghost text-error" title="ลบ" disabled={busy} onClick={() => remove(b)}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="text-center opacity-60 p-4">ยังไม่มีไฟล์สำรอง</p>}
      </div>
    </Layout>
  );
}
