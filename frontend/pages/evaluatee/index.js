import { useEffect, useState } from "react";
import Link from "next/link";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { scoreLabel } from "@/lib/format";
import Layout from "@/components/Layout";

// หน้าหลักผู้รับการประเมิน: ความก้าวหน้าของแต่ละตัวชี้วัด
export default function EvaluateeHome() {
  const user = useAuth(["evaluatee"]);
  const [data, setData] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api.get("/self-evaluations").then((res) => setData(res.data.data)).catch((err) => setError(errorMessage(err)));
    api.get(`/reports/evaluatees/${user.id}`).then((res) => setReport(res.data.data.summary)).catch((err) => setError(errorMessage(err)));
  }, [user]);

  if (!user) return null;
  // โหลดไม่สำเร็จ (เช่น เซิร์ฟเวอร์ไม่ทำงาน) แสดงข้อความแทนหน้าว่าง
  if (!data) return <Layout user={user}>{error && <div className="alert alert-error mb-4">{error}</div>}</Layout>;

  return (
    <Layout user={user}>
      <h1 className="text-2xl font-bold mb-4">สวัสดี {user.full_name}</h1>

      <div className="stats stats-vertical sm:stats-horizontal shadow bg-base-100 w-full mb-4">
        <div className="stat">
          <div className="stat-title">ความก้าวหน้าการประเมินตนเอง</div>
          <div className="stat-value text-primary">{data.summary.progress}%</div>
          <div className="stat-desc">
            บันทึกครบ {data.summary.filled}/{data.summary.indicator_count} ตัวชี้วัด
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">กรรมการยืนยันผลแล้ว</div>
          <div className="stat-value">
            {report ? `${report.confirmed_count}/${report.committee_count}` : "-"}
          </div>
          <div className="stat-desc">
            <Link href="/evaluatee/result" className="link">
              ดูผลและความเห็นกรรมการ
            </Link>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex justify-between items-center gap-2">
            <h2 className="card-title">ความก้าวหน้ารายตัวชี้วัด</h2>
            <Link href="/evaluatee/evaluation" className="btn btn-sm btn-primary">
              ไปประเมินตนเอง
            </Link>
          </div>
          {data.topics.map((t) => (
            <div key={t.id}>
              <h3 className="font-bold mt-3">{t.title}</h3>
              <ul className="divide-y divide-base-200">
                {t.indicators.map((i) => (
                  <li key={i.id} className="py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex-1 min-w-48">{i.name}</span>
                    <span className="text-sm opacity-70 w-40">
                      คะแนน {scoreLabel(i.score, i.score_type)} | หลักฐาน {i.evidences.length}
                    </span>
                    <progress
                      className={`progress w-32 ${i.progress === 100 ? "progress-success" : "progress-primary"}`}
                      value={i.progress}
                      max="100"
                    />
                    <span className="text-sm w-12 text-right">{i.progress}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs opacity-60 mt-2">ตัวชี้วัดครบ 100% เมื่อกรอกคะแนนแล้ว และแนบหลักฐานแล้ว (ถ้าตัวชี้วัดนั้นต้องแนบ)</p>
        </div>
      </div>
    </Layout>
  );
}
