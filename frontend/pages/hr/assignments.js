import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { COMMITTEE_ROLES } from "@/lib/constants";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";

export default function Assignments() {
  const user = useAuth(["hr"]);
  const [evaluatees, setEvaluatees] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [indicatorCount, setIndicatorCount] = useState(0);
  const [error, setError] = useState("");
  const [form, setForm] = useState({}); // ค่าที่เลือกในแถวเพิ่มกรรมการ แยกตาม evaluatee_id

  // โหลด 4 อย่างพร้อมกัน
  const load = () =>
    Promise.all([
      api.get("/users", { params: { role: "evaluatee" } }),
      api.get("/users", { params: { role: "committee" } }),
      api.get("/assignments"),
      api.get("/indicators"),
    ]).then(([e, c, a, i]) => {
      setEvaluatees(e.data.data);
      setCommittees(c.data.data);
      setAssignments(a.data.data);
      setIndicatorCount(i.data.data.length);
    }).catch((err) => setError(errorMessage(err)));

  useEffect(() => {
    if (user) load();
  }, [user]);

  // เรียก API แล้วโหลดใหม่ ถ้า error แสดง alert
  const run = async (request) => {
    try {
      await request;
      load();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  const add = (evaluateeId) => {
    const f = form[evaluateeId] || {};
    if (!f.committee_id) return alert("กรุณาเลือกกรรมการ");
    run(
      api.post("/assignments", {
        evaluatee_id: evaluateeId,
        committee_id: f.committee_id,
        committee_role: f.committee_role || "member",
      })
    );
    setForm({ ...form, [evaluateeId]: {} });
  };

  const setField = (evaluateeId, key, value) =>
    setForm({ ...form, [evaluateeId]: { ...form[evaluateeId], [key]: value } });

  if (!user) return null;

  return (
    <Layout user={user}>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <h1 className="text-2xl font-bold mb-1">มอบหมายกรรมการ</h1>
      <p className="text-sm opacity-70 mb-4">กำหนดกรรมการและบทบาท (ประธาน 1 คนต่อผู้รับการประเมิน) และติดตามสถานะการประเมิน</p>

      <div className="grid lg:grid-cols-2 gap-4">
        {evaluatees.map((e) => {
          const mine = assignments.filter((a) => a.evaluatee_id === e.id);
          const available = committees.filter((c) => !mine.some((a) => a.committee_id === c.id));
          const f = form[e.id] || {};
          return (
            <div key={e.id} className="card bg-base-100 shadow">
              <div className="card-body p-4">
                <h2 className="card-title text-base">
                  {e.full_name}
                  <span className="text-sm font-normal opacity-60">{e.department}</span>
                </h2>

                <ul className="divide-y divide-base-200">
                  {mine.map((a) => (
                    <li key={a.id} className="py-2 flex flex-wrap items-center gap-2">
                      <span className="flex-1 min-w-32">{a.committee_name}</span>
                      <select
                        className="select select-sm w-36"
                        value={a.committee_role}
                        onChange={(ev) => run(api.put(`/assignments/${a.id}`, { committee_role: ev.target.value }))}
                      >
                        {Object.entries(COMMITTEE_ROLES).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <StatusBadge status={a.status} />
                      <span className="text-xs opacity-60 w-16">
                        {a.scored_count}/{indicatorCount} ข้อ
                      </span>
                      <button
                        className="btn btn-xs btn-ghost text-error"
                        title="ยกเลิกการมอบหมาย"
                        onClick={() => confirm(`ยกเลิก ${a.committee_name} ? คะแนนที่ให้ไว้จะถูกลบ`) && run(api.delete(`/assignments/${a.id}`))}
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                  {mine.length === 0 && <li className="py-2 text-sm opacity-60">ยังไม่มีกรรมการ</li>}
                </ul>

                {available.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    <select
                      className="select select-sm flex-1 min-w-40"
                      value={f.committee_id || ""}
                      onChange={(ev) => setField(e.id, "committee_id", ev.target.value)}
                    >
                      <option value="">เลือกกรรมการ</option>
                      {available.map((c) => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                    <select
                      className="select select-sm w-36"
                      value={f.committee_role || "member"}
                      onChange={(ev) => setField(e.id, "committee_role", ev.target.value)}
                    >
                      {Object.entries(COMMITTEE_ROLES).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <button className="btn btn-sm btn-primary" onClick={() => add(e.id)}>
                      <Plus size={16} /> เพิ่ม
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
