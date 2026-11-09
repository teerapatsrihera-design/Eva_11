import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, KeyRound, Upload, Download } from "lucide-react";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ROLE_NAMES } from "@/lib/constants";
import Layout from "@/components/Layout";
import UserModal from "@/components/hr/UserModal";

const TABS = { "": "ทั้งหมด", evaluatee: "ผู้รับการประเมิน", committee: "กรรมการ" };

export default function Users() {
  const user = useAuth(["hr"]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null); // null = ปิด modal, {} = เพิ่มใหม่
  const fileRef = useRef(null); // ช่องเลือกไฟล์ CSV

  // GET /users?role=...&q=...
  const load = () =>
    api
      .get("/users", { params: { role, q } })
      .then((res) => setUsers(res.data.data))
      .catch((err) => setError(errorMessage(err)));

  useEffect(() => {
    if (user) load();
  }, [user, role]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetPassword = async (u) => {
    if (!confirm(`รีเซ็ตรหัสผ่านของ ${u.full_name} ?`)) return;
    try {
      const res = await api.put(`/users/${u.id}/reset-password`);
      alert(`รหัสผ่านชั่วคราวของ ${u.username} คือ ${res.data.data.temp_password}`);
      load();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  const remove = async (u) => {
    if (!confirm(`ลบผู้ใช้ ${u.full_name} ? ข้อมูลการประเมินของผู้ใช้นี้จะถูกลบด้วย`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      load();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  // อัปโหลดไฟล์ CSV เพื่อเพิ่มผู้ใช้หลายคน
  const importCsv = async () => {
    const file = fileRef.current.files[0];
    if (!file) return alert("กรุณาเลือกไฟล์ CSV");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await api.post("/users/import", form);
      const lines = res.data.data.map((u) => `${u.username} : ${u.temp_password}`);
      alert(`${res.data.message}\nรหัสผ่านชั่วคราว\n${lines.join("\n")}`);
      fileRef.current.value = ""; // ล้างช่องเลือกไฟล์
      load();
    } catch (err) {
      const rows = err.response?.data?.data;
      const detail = Array.isArray(rows) ? rows.map((r) => `แถว ${r.row}: ${r.message}`).join("\n") : "";
      alert(`${errorMessage(err)}\n${detail}`);
    }
  };

  if (!user) return null;

  return (
    <Layout user={user}>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold">ผู้ใช้งาน</h1>
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          <Plus size={18} /> เพิ่มผู้ใช้
        </button>
      </div>

      {/* นำเข้าจาก CSV */}
      <div className="card bg-base-100 shadow mb-4">
        <div className="card-body py-4 flex-row flex-wrap items-center gap-2">
          <span className="font-medium">นำเข้าจากไฟล์ CSV</span>
          <input ref={fileRef} type="file" accept=".csv" className="file-input file-input-sm w-full sm:w-auto" />
          <button className="btn btn-sm" onClick={importCsv}>
            <Upload size={16} /> นำเข้า
          </button>
          <a href="/users-template.csv" download className="btn btn-sm btn-ghost">
            <Download size={16} /> ไฟล์ตัวอย่าง
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <div role="tablist" className="tabs tabs-box">
          {Object.entries(TABS).map(([value, label]) => (
            <button key={value} role="tab" className={`tab ${role === value ? "tab-active" : ""}`} onClick={() => setRole(value)}>
              {label}
            </button>
          ))}
        </div>
        <form
          className="flex gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
        >
          <input className="input" placeholder="ค้นหาชื่อ" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn">ค้นหา</button>
        </form>
      </div>

      <div className="overflow-x-auto bg-base-100 rounded-box shadow">
        <table className="table">
          <thead>
            <tr>
              <th>ชื่อผู้ใช้</th>
              <th>ชื่อ-สกุล</th>
              <th>บทบาท</th>
              <th>ตำแหน่ง / แผนก</th>
              <th>รหัสผ่าน</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>
                  <div>{u.full_name}</div>
                  <div className="text-xs opacity-60">{u.email}</div>
                </td>
                <td className="whitespace-nowrap">{ROLE_NAMES[u.role]}</td>
                <td>
                  <div>{u.position}</div>
                  <div className="text-xs opacity-60">{u.department}</div>
                </td>
                <td>{u.must_change_password ? <span className="badge badge-warning whitespace-nowrap">รอเปลี่ยน</span> : "-"}</td>
                <td className="whitespace-nowrap text-right">
                  {u.role !== "hr" && (
                    <>
                      <button className="btn btn-xs btn-ghost" onClick={() => setEditing(u)} title="แก้ไข">
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-xs btn-ghost" onClick={() => resetPassword(u)} title="รีเซ็ตรหัสผ่าน">
                        <KeyRound size={14} />
                      </button>
                      <button className="btn btn-xs btn-ghost text-error" onClick={() => remove(u)} title="ลบ">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-center opacity-60 p-4">ไม่พบผู้ใช้</p>}
      </div>

      {editing && (
        <UserModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </Layout>
  );
}
