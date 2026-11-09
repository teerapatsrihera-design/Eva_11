import { COMMITTEE_ROLES } from "@/lib/constants";
import { scoreLabel, thaiDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

// รายงานผลการประเมินรายบุคคล (ใช้ร่วมกันทั้ง hr / ผู้รับประเมิน / กรรมการ)
// data มาจาก GET /api/reports/evaluatees/:id
export default function EvaluationReport({ data }) {
  const { evaluatee, assignments, rows, summary } = data;

  // จัดกลุ่มตัวชี้วัดตามหัวข้อ
  const topics = [];
  for (const r of rows) {
    let t = topics.find((x) => x.id === r.topic_id);
    if (!t) topics.push((t = { id: r.topic_id, title: r.topic_title, rows: [] }));
    t.rows.push(r);
  }

  return (
    <div className="space-y-4">
      <div className="card bg-base-100 shadow print:shadow-none">
        <div className="card-body">
          <h2 className="card-title">{evaluatee.full_name}</h2>
          <p className="text-sm opacity-70">
            {evaluatee.position} {evaluatee.department}
          </p>
          <div className="stats stats-vertical sm:stats-horizontal bg-base-200 mt-2">
            <div className="stat">
              <div className="stat-title">บันทึกการประเมินตนเอง</div>
              <div className="stat-value text-2xl">{summary.progress}%</div>
              <div className="stat-desc">
                {summary.filled}/{summary.indicator_count} ตัวชี้วัด
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">กรรมการยืนยันผล</div>
              <div className="stat-value text-2xl">
                {summary.confirmed_count}/{summary.committee_count}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">คะแนนจากกรรมการ</div>
              <div className="stat-value text-2xl">{summary.committee_total ?? "-"}</div>
              <div className="stat-desc">
                จาก {summary.total_weight} คะแนน {summary.committee_percent != null && `(${summary.committee_percent}%)`}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">คะแนนประเมินตนเอง</div>
              <div className="stat-value text-2xl">{summary.self_total}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-base-100 rounded-box shadow print:shadow-none">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>ตัวชี้วัด</th>
              <th className="text-right">น้ำหนัก</th>
              <th className="text-center">ตนเอง</th>
              {assignments.map((a) => (
                <th key={a.id} className="text-center">
                  {a.committee_name}
                  <div className="font-normal">{COMMITTEE_ROLES[a.committee_role]}</div>
                </th>
              ))}
              <th className="text-center">เฉลี่ยกรรมการ</th>
              <th className="text-right">คะแนนที่ได้</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => [
              <tr key={`t${t.id}`} className="bg-base-200">
                <td colSpan={5 + assignments.length} className="font-bold">
                  {t.title}
                </td>
              </tr>,
              ...t.rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td className="text-right">{r.weight}</td>
                  <td className="text-center">{scoreLabel(r.self_score, r.score_type)}</td>
                  {assignments.map((a) => (
                    <td key={a.id} className="text-center">
                      {scoreLabel(r.scores[a.id], r.score_type)}
                    </td>
                  ))}
                  <td className="text-center">{r.avg_score ?? "-"}</td>
                  <td className="text-right">{r.committee_weighted}</td>
                </tr>
              )),
            ])}
          </tbody>
          <tfoot>
            <tr>
              <td>รวม</td>
              <td className="text-right">{summary.total_weight}</td>
              <td colSpan={2 + assignments.length}></td>
              <td className="text-right">{summary.committee_total ?? "-"}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs opacity-60">
        คะแนนที่ได้ = (คะแนนเฉลี่ยของกรรมการที่ยืนยันผลแล้ว ÷ คะแนนเต็ม) × น้ำหนัก (มี/ไม่มี คะแนนเต็ม 1, สเกล คะแนนเต็ม 4)
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignments.map((a) => (
          <div key={a.id} className="card bg-base-100 shadow print:shadow-none print:border">
            <div className="card-body p-4">
              <div className="flex justify-between gap-2">
                <div>
                  <div className="font-bold">{a.committee_name}</div>
                  <div className="text-sm opacity-70">{COMMITTEE_ROLES[a.committee_role]}</div>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <p className="text-sm whitespace-pre-line">{a.summary_comment || "ยังไม่มีความเห็น"}</p>
              {a.signature && (
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.signature} alt="ลายเซ็น" className="h-16 mx-auto" />
                  <div className="text-xs opacity-60">ลงนามเมื่อ {thaiDate(a.confirmed_at)}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
