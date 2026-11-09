import { useEffect, useState } from "react";
import Link from "next/link";
import { TriangleAlert, CircleCheck } from "lucide-react";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";

// Dashboard ของงานบุคลากร: สถิติภาพรวม ค่าเฉลี่ยคะแนน และการตรวจความถูกต้องของข้อมูล
export default function HrDashboard() {
  const user = useAuth(["hr"]);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api
      .get("/reports/overview")
      .then((res) => setData(res.data.data))
      .catch((err) => setError(errorMessage(err)));
  }, [user]);

  if (!user) return null;
  // โหลดไม่สำเร็จ (เช่น เซิร์ฟเวอร์ไม่ทำงาน) แสดงข้อความแทนหน้าว่าง
  if (!data) return <Layout user={user}>{error && <div className="alert alert-error mb-4">{error}</div>}</Layout>;

  const { counts, assignments, progress, scores, topics, ranking, issues } = data;
  const statusBars = [
    { label: "ยังไม่ประเมิน", value: assignments.pending, color: "progress-neutral" },
    { label: "บันทึกร่าง", value: assignments.draft, color: "progress-warning" },
    { label: "ยืนยันผลแล้ว", value: assignments.confirmed, color: "progress-success" },
  ];

  return (
    <Layout user={user}>
      <h1 className="text-2xl font-bold mb-4">Dashboard ภาพรวมการประเมิน</h1>

      {/* ตรวจความถูกต้องของข้อมูล */}
      {issues.length > 0 ? (
        <div role="alert" className="alert alert-warning mb-4 items-start">
          <TriangleAlert size={20} />
          <div>
            <div className="font-bold">ตรวจพบข้อมูลที่ควรแก้ไข {issues.length} รายการ</div>
            <ul className="list-disc list-inside text-sm">
              {issues.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div role="alert" className="alert alert-success mb-4">
          <CircleCheck size={20} /> ตรวจสอบข้อมูลแล้ว: ตัวชี้วัด น้ำหนัก และการมอบหมายกรรมการครบถ้วน
        </div>
      )}

      <div className="stats stats-vertical sm:stats-horizontal shadow bg-base-100 w-full mb-4">
        <div className="stat">
          <div className="stat-title">ผู้รับการประเมิน</div>
          <div className="stat-value">{counts.evaluatees}</div>
          <div className="stat-desc">คน</div>
        </div>
        <div className="stat">
          <div className="stat-title">กรรมการ</div>
          <div className="stat-value">{counts.committees}</div>
          <div className="stat-desc">คน</div>
        </div>
        <div className="stat">
          <div className="stat-title">หัวข้อการประเมิน</div>
          <div className="stat-value">{counts.topics}</div>
          <div className="stat-desc">เปิดอยู่ {counts.open_topics} หัวข้อ</div>
        </div>
        <div className="stat">
          <div className="stat-title">ตัวชี้วัด</div>
          <div className="stat-value">{counts.indicators}</div>
          <div className="stat-desc">ตัว</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-base">การบันทึกประเมินตนเอง (เฉลี่ย)</h2>
            <div className="radial-progress text-primary text-xl font-bold" style={{ "--value": progress.average, "--size": "7rem" }} role="progressbar">
              {Math.round(progress.average)}%
            </div>
            <p className="text-sm">
              บันทึกครบ {progress.completed}/{counts.evaluatees} คน
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-base">สถานะการประเมินของกรรมการ</h2>
            {statusBars.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm">
                  <span>{s.label}</span>
                  <span>
                    {s.value}/{assignments.total}
                  </span>
                </div>
                <progress className={`progress ${s.color}`} value={s.value} max={assignments.total || 1} />
              </div>
            ))}
            <p className="text-sm mt-1">
              ประเมินครบทุกกรรมการแล้ว {progress.fully_evaluated}/{counts.evaluatees} คน
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-base">คะแนนจากกรรมการ</h2>
            <div className="text-4xl font-bold text-primary">{scores.average != null ? `${scores.average}%` : "-"}</div>
            <p className="text-sm opacity-70">ค่าเฉลี่ย จาก {scores.evaluated} คนที่มีผลยืนยันแล้ว</p>
            <div className="flex gap-4 text-sm">
              <span>สูงสุด {scores.max ?? "-"}%</span>
              <span>ต่ำสุด {scores.min ?? "-"}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-base">ค่าเฉลี่ยคะแนนรายหัวข้อ</h2>
            {topics.map((t) => (
              <div key={t.id}>
                <div className="flex justify-between text-sm gap-2">
                  <span>
                    {t.title} {t.is_open ? <span className="badge badge-success badge-sm">เปิด</span> : <span className="badge badge-sm">ปิด</span>}
                  </span>
                  <span className="whitespace-nowrap">{t.avg_percent != null ? `${t.avg_percent}%` : "-"}</span>
                </div>
                <progress className="progress progress-primary" value={t.avg_percent ?? 0} max="100" />
                <div className="text-xs opacity-60">
                  {t.indicator_count} ตัวชี้วัด น้ำหนักรวม {t.total_weight}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <h2 className="card-title text-base">อันดับคะแนนสูงสุด</h2>
              <Link href="/hr/reports" className="link text-sm">
                ดูรายงานทั้งหมด
              </Link>
            </div>
            <ol className="list-decimal list-inside">
              {ranking.map((r) => (
                <li key={r.id} className="py-1">
                  <Link href={`/hr/reports/evaluatees/${r.id}`} className="link link-hover">
                    {r.full_name}
                  </Link>{" "}
                  <span className="badge badge-primary">{r.committee_percent}%</span>
                </li>
              ))}
            </ol>
            {ranking.length === 0 && <p className="text-sm opacity-60">ยังไม่มีผลที่กรรมการยืนยัน</p>}
          </div>
        </div>
      </div>
    </Layout>
  );
}
