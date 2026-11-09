import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { COMMITTEE_ROLES } from "@/lib/constants";
import { scoreLabel } from "@/lib/format";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";

// สรุปการประเมินรายกรรมการ: แถว = ผู้รับประเมิน, คอลัมน์ = ตัวชี้วัด
export default function CommitteeReport() {
  const user = useAuth(["hr"]);
  const { id } = useRouter().query;
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !id) return;
    api
      .get(`/reports/committees/${id}`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(errorMessage(err)));
  }, [user, id]);

  if (!user) return null;

  return (
    <Layout user={user}>
      <Link href="/hr/reports" className="btn btn-sm btn-ghost mb-2">
        ← กลับ
      </Link>
      {error && <div className="alert alert-error">{error}</div>}
      {data && (
        <>
          <h1 className="text-2xl font-bold">สรุปการประเมินของ {data.committee.full_name}</h1>
          <p className="text-sm opacity-70 mb-4">{data.committee.position}</p>
          <div className="overflow-x-auto bg-base-100 rounded-box shadow">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>ผู้รับการประเมิน</th>
                  <th>สถานะ</th>
                  {data.indicators.map((i, n) => (
                    <th key={i.id} className="text-center" title={i.name}>
                      ข้อ {n + 1}
                    </th>
                  ))}
                  <th className="text-right">คะแนนรวม</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div>{r.evaluatee_name}</div>
                      <div className="text-xs opacity-60">{COMMITTEE_ROLES[r.committee_role]}</div>
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    {data.indicators.map((i) => (
                      <td key={i.id} className="text-center">
                        {scoreLabel(r.scores[i.id], i.score_type)}
                      </td>
                    ))}
                    <td className="text-right">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ol className="list-decimal list-inside text-sm mt-3 opacity-80">
            {data.indicators.map((i) => (
              <li key={i.id}>
                {i.name} (น้ำหนัก {i.weight})
              </li>
            ))}
          </ol>
        </>
      )}
    </Layout>
  );
}
