import { useEffect, useState } from "react";
import Link from "next/link";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { COMMITTEE_ROLES } from "@/lib/constants";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";

// หน้าหลักกรรมการ: ผู้รับการประเมินที่ได้รับมอบหมาย
export default function CommitteeHome() {
  const user = useAuth(["committee"]);
  const [list, setList] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api
      .get("/committee/assignments")
      .then((res) => setList(res.data.data))
      .catch((err) => setError(errorMessage(err)));
  }, [user]);

  if (!user) return null;

  const count = (status) => list.filter((a) => a.status === status).length;

  return (
    <Layout user={user}>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <h1 className="text-2xl font-bold mb-4">ผู้รับการประเมินที่ได้รับมอบหมาย</h1>

      <div className="stats stats-vertical sm:stats-horizontal shadow bg-base-100 w-full mb-4">
        <div className="stat">
          <div className="stat-title">ทั้งหมด</div>
          <div className="stat-value">{list.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">ยังไม่ประเมิน</div>
          <div className="stat-value">{count("pending")}</div>
        </div>
        <div className="stat">
          <div className="stat-title">บันทึกร่าง</div>
          <div className="stat-value text-warning">{count("draft")}</div>
        </div>
        <div className="stat">
          <div className="stat-title">ยืนยันผลแล้ว</div>
          <div className="stat-value text-success">{count("confirmed")}</div>
        </div>
      </div>

      <div className="overflow-x-auto bg-base-100 rounded-box shadow">
        <table className="table">
          <thead>
            <tr>
              <th>ผู้รับการประเมิน</th>
              <th>บทบาทของท่าน</th>
              <th>ประเมินตนเองแล้ว</th>
              <th>ท่านให้คะแนนแล้ว</th>
              <th>สถานะ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id}>
                <td>
                  <div>{a.full_name}</div>
                  <div className="text-xs opacity-60">
                    {a.position} {a.department}
                  </div>
                </td>
                <td className="whitespace-nowrap">{COMMITTEE_ROLES[a.committee_role]}</td>
                <td className="whitespace-nowrap">
                  {a.self_count}/{a.indicator_count}
                </td>
                <td>
                  <progress className="progress progress-primary w-20 mr-2" value={a.scored_count} max={a.indicator_count || 1} />
                  {a.scored_count}/{a.indicator_count}
                </td>
                <td>
                  <StatusBadge status={a.status} />
                </td>
                <td className="text-right">
                  <Link href={`/committee/evaluate/${a.id}`} className="btn btn-sm btn-primary">
                    {a.status === "confirmed" ? "ดูผล" : "ประเมิน"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="text-center opacity-60 p-4">ยังไม่ได้รับมอบหมาย</p>}
      </div>
    </Layout>
  );
}
