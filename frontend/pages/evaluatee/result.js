import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { scoreLabel } from "@/lib/format";
import Layout from "@/components/Layout";
import EvaluationReport from "@/components/EvaluationReport";

// ผลการประเมิน + ความเห็นกรรมการ + รายละเอียดประกอบ (Export PDF ด้วย window.print)
export default function Result() {
  const user = useAuth(["evaluatee"]);
  const [report, setReport] = useState(null);
  const [self, setSelf] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api.get(`/reports/evaluatees/${user.id}`).then((res) => setReport(res.data.data)).catch((err) => setError(errorMessage(err)));
    api.get("/self-evaluations").then((res) => setSelf(res.data.data)).catch((err) => setError(errorMessage(err)));
  }, [user]);

  if (!user) return null;

  return (
    <Layout user={user}>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold">ผลการประเมิน</h1>
        <button className="btn btn-primary print:hidden" onClick={() => window.print()}>
          <Printer size={18} /> Export PDF
        </button>
      </div>
      <p className="text-sm opacity-70 mb-4 print:hidden">
        แสดงคะแนนและความเห็นเฉพาะกรรมการที่ยืนยันผลแล้ว กด Export PDF แล้วเลือก &quot;บันทึกเป็น PDF&quot;
      </p>

      {report && <EvaluationReport data={report} />}

      {self && (
        <div className="card bg-base-100 shadow print:shadow-none mt-4 break-before-page">
          <div className="card-body">
            <h2 className="card-title">รายละเอียดประกอบการประเมินตนเอง</h2>
            {self.topics.map((t) => (
              <div key={t.id}>
                <h3 className="font-bold mt-2">{t.title}</h3>
                <ol className="list-decimal list-inside space-y-2">
                  {t.indicators.map((i) => (
                    <li key={i.id}>
                      {i.name} (คะแนนตนเอง {scoreLabel(i.score, i.score_type)})
                      <ul className="list-disc list-inside ml-6 text-sm opacity-80">
                        {i.evidences.map((ev) => (
                          <li key={ev.id}>
                            {ev.description}
                            {ev.file_name && ` [ไฟล์: ${ev.file_name}]`}
                            {ev.url && ` [${ev.url}]`}
                          </li>
                        ))}
                        {i.evidences.length === 0 && <li>ไม่มีรายละเอียดประกอบ</li>}
                      </ul>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
