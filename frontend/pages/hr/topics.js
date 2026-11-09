import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { thaiDate } from "@/lib/format";
import { SCORE_TYPES, EVIDENCE_TYPES } from "@/lib/constants";
import Layout from "@/components/Layout";
import TopicModal from "@/components/hr/TopicModal";
import IndicatorModal from "@/components/hr/IndicatorModal";

export default function Topics() {
  const user = useAuth(["hr"]);
  const [topics, setTopics] = useState([]);
  const [error, setError] = useState("");
  const [editTopic, setEditTopic] = useState(null); // null = ปิด modal, {} = เพิ่มใหม่
  const [editIndicator, setEditIndicator] = useState(null);

  const load = () =>
    api
      .get("/topics")
      .then((res) => setTopics(res.data.data))
      .catch((err) => setError(errorMessage(err)));

  useEffect(() => {
    if (user) load();
  }, [user]);

  // ลบแล้วโหลดใหม่ (ใช้ได้ทั้งหัวข้อและตัวชี้วัด)
  const remove = async (url, name) => {
    if (!confirm(`ลบ "${name}" ? ข้อมูลการประเมินที่เกี่ยวข้องจะถูกลบด้วย`)) return;
    try {
      await api.delete(url);
      load();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  const saved = () => {
    setEditTopic(null);
    setEditIndicator(null);
    load();
  };

  if (!user) return null;

  return (
    <Layout user={user}>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <div className="flex justify-between items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold">หัวข้อและตัวชี้วัด</h1>
        <button className="btn btn-primary" onClick={() => setEditTopic({})}>
          <Plus size={18} /> เพิ่มหัวข้อ
        </button>
      </div>

      <div className="space-y-4">
        {topics.map((t) => (
          <div key={t.id} className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h2 className="card-title">{t.title}</h2>
                  <p className="text-sm opacity-70">{t.description}</p>
                  <p className="text-sm mt-1">
                    ช่วงประเมิน {thaiDate(t.start_date)} - {thaiDate(t.end_date)}{" "}
                    {t.is_open ? <span className="badge badge-success">เปิดอยู่</span> : <span className="badge">ปิด</span>}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-sm" onClick={() => setEditTopic(t)} title="แก้ไขหัวข้อ">
                    <Pencil size={16} />
                  </button>
                  <button className="btn btn-sm btn-error btn-outline" onClick={() => remove(`/topics/${t.id}`, t.title)} title="ลบหัวข้อ">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>ตัวชี้วัด</th>
                      <th>รูปแบบ</th>
                      <th className="text-right">น้ำหนัก</th>
                      <th>หลักฐาน</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.indicators.map((i) => (
                      <tr key={i.id}>
                        <td>
                          <div className="font-medium">{i.name}</div>
                          <div className="text-xs opacity-60">{i.description}</div>
                        </td>
                        <td className="whitespace-nowrap">{SCORE_TYPES[i.score_type]}</td>
                        <td className="text-right">{i.weight}</td>
                        <td>
                          <div>{EVIDENCE_TYPES[i.evidence_type]}</div>
                          <div className="text-xs opacity-60">{i.evidence_note}</div>
                        </td>
                        <td className="whitespace-nowrap text-right">
                          <button className="btn btn-xs btn-ghost" onClick={() => setEditIndicator(i)} title="แก้ไขตัวชี้วัด">
                            <Pencil size={14} />
                          </button>
                          <button className="btn btn-xs btn-ghost text-error" onClick={() => remove(`/indicators/${i.id}`, i.name)} title="ลบตัวชี้วัด">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2}>รวม {t.indicators.length} ตัวชี้วัด</td>
                      <td className="text-right">{t.indicators.reduce((s, i) => s + i.weight, 0)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div>
                <button className="btn btn-sm btn-outline" onClick={() => setEditIndicator({ topic_id: t.id })}>
                  <Plus size={16} /> เพิ่มตัวชี้วัด
                </button>
              </div>
            </div>
          </div>
        ))}
        {topics.length === 0 && <p className="text-center opacity-60">ยังไม่มีหัวข้อการประเมิน</p>}
      </div>

      {editTopic && <TopicModal item={editTopic} onClose={() => setEditTopic(null)} onSaved={saved} />}
      {editIndicator && <IndicatorModal item={editIndicator} onClose={() => setEditIndicator(null)} onSaved={saved} />}
    </Layout>
  );
}
