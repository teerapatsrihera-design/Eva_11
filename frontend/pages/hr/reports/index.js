import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Printer } from "lucide-react";
import api, { errorMessage } from "@/lib/api";
import { downloadCsv } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";

export default function Reports() {
  const user = useAuth(["hr"]);
  const [tab, setTab] = useState("evaluatees");
  const [sort, setSort] = useState("");
  const [evaluatees, setEvaluatees] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api.get("/reports/evaluatees", { params: { sort } }).then((res) => setEvaluatees(res.data.data)).catch((err) => setError(errorMessage(err)));
    api.get("/reports/committees").then((res) => setCommittees(res.data.data)).catch((err) => setError(errorMessage(err)));
  }, [user, sort]);

  // ส่งออกตารางเป็น CSV
  const exportEvaluatees = () =>
    downloadCsv(
      "evaluation-summary.csv",
      ["ชื่อ-สกุล", "แผนก", "บันทึกครบ (ตัวชี้วัด)", "ร้อยละการบันทึก", "กรรมการยืนยัน", "คะแนนกรรมการ", "คะแนนเต็ม", "ร้อยละ"],
      evaluatees.map((e) => [e.full_name, e.department, `${e.filled}/${e.indicator_count}`, e.progress, `${e.confirmed_count}/${e.committee_count}`, e.committee_total, e.total_weight, e.committee_percent])
    );
  const exportCommittees = () =>
    downloadCsv(
      "committee-status.csv",
      ["กรรมการ", "ตำแหน่ง", "ได้รับมอบหมาย", "ยังไม่ประเมิน", "บันทึกร่าง", "ยืนยันผลแล้ว"],
      committees.map((c) => [c.full_name, c.position, c.total, c.pending, c.draft, c.confirmed])
    );

  if (!user) return null;

  return (
    <Layout user={user}>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold">รายงานผลการประเมิน</h1>
        <div className="flex gap-2 print:hidden">
          <button className="btn btn-sm" onClick={tab === "evaluatees" ? exportEvaluatees : exportCommittees}>
            <Download size={16} /> ดาวน์โหลด CSV
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => window.print()}>
            <Printer size={16} /> พิมพ์ / PDF
          </button>
        </div>
      </div>
      <p className="hidden print:block mb-2">พิมพ์เมื่อ {new Date().toLocaleString("th-TH")}</p>
      <div role="tablist" className="tabs tabs-box mb-3 w-fit print:hidden">
        <button role="tab" className={`tab ${tab === "evaluatees" ? "tab-active" : ""}`} onClick={() => setTab("evaluatees")}>
          รายผู้รับการประเมิน
        </button>
        <button role="tab" className={`tab ${tab === "committees" ? "tab-active" : ""}`} onClick={() => setTab("committees")}>
          รายกรรมการ
        </button>
      </div>

      {tab === "evaluatees" && (
        <>
          <select className="select select-sm mb-3 print:hidden" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="">เรียงตามรายชื่อในระบบ</option>
            <option value="score">เรียงตามคะแนน (มาก-น้อย)</option>
            <option value="progress">เรียงตาม % การบันทึก (มาก-น้อย)</option>
            <option value="name">เรียงตามชื่อ (ก-ฮ)</option>
          </select>
          <div className="overflow-x-auto bg-base-100 rounded-box shadow">
            <table className="table">
              <thead>
                <tr>
                  <th>ผู้รับการประเมิน</th>
                  <th>บันทึกข้อมูลตามตัวชี้วัด</th>
                  <th className="text-center">กรรมการยืนยัน</th>
                  <th className="text-right">คะแนน</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {evaluatees.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div>{e.full_name}</div>
                      <div className="text-xs opacity-60">{e.department}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <progress className="progress progress-primary w-24" value={e.progress} max="100" />
                        <span className="text-sm whitespace-nowrap">
                          {e.progress}% ({e.filled}/{e.indicator_count})
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      {e.confirmed_count}/{e.committee_count}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {e.committee_total != null ? `${e.committee_total} / ${e.total_weight}` : "-"}
                    </td>
                    <td className="text-right">
                      <Link href={`/hr/reports/evaluatees/${e.id}`} className="btn btn-xs">
                        ดูรายงาน
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "committees" && (
        <div className="overflow-x-auto bg-base-100 rounded-box shadow">
          <table className="table">
            <thead>
              <tr>
                <th>กรรมการ</th>
                <th className="text-center">ได้รับมอบหมาย</th>
                <th className="text-center">ยังไม่ประเมิน</th>
                <th className="text-center">บันทึกร่าง</th>
                <th className="text-center">ยืนยันผลแล้ว</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {committees.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div>{c.full_name}</div>
                    <div className="text-xs opacity-60">{c.position}</div>
                  </td>
                  <td className="text-center">{c.total}</td>
                  <td className="text-center">{c.pending}</td>
                  <td className="text-center">{c.draft}</td>
                  <td className="text-center">
                    <progress className="progress progress-success w-16 mr-2" value={c.confirmed} max={c.total || 1} />
                    {c.confirmed}
                  </td>
                  <td className="text-right">
                    <Link href={`/hr/reports/committees/${c.id}`} className="btn btn-xs">
                      ดูสรุป
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
