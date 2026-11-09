import { useEffect, useState } from "react";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { thaiDate } from "@/lib/format";
import Layout from "@/components/Layout";
import IndicatorCard from "@/components/evaluatee/IndicatorCard";

// ประเมินตนเอง: กรอกคะแนน + รายละเอียด/หลักฐานในแต่ละตัวชี้วัด
export default function Evaluation() {
  const user = useAuth(["evaluatee"]);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get("/self-evaluations")
      .then((res) => setData(res.data.data))
      .catch((err) => setError(errorMessage(err)));

  useEffect(() => {
    if (user) load();
  }, [user]);

  if (!user) return null;
  // โหลดไม่สำเร็จ (เช่น เซิร์ฟเวอร์ไม่ทำงาน) แสดงข้อความแทนหน้าว่าง
  if (!data) return <Layout user={user}>{error && <div className="alert alert-error mb-4">{error}</div>}</Layout>;

  return (
    <Layout user={user}>
      <div className="flex flex-wrap justify-between items-end gap-2 mb-4">
        <h1 className="text-2xl font-bold">ประเมินตนเอง</h1>
        <div className="text-sm">
          บันทึกครบ {data.summary.filled}/{data.summary.indicator_count} ตัวชี้วัด
          <progress className="progress progress-primary w-40 block" value={data.summary.progress} max="100" />
        </div>
      </div>

      {data.topics.map((t) => (
        <section key={t.id} className="mb-6">
          <h2 className="text-lg font-bold">{t.title}</h2>
          <p className="text-sm opacity-70 mb-2">
            ช่วงประเมิน {thaiDate(t.start_date)} - {thaiDate(t.end_date)}
          </p>
          {!t.is_open && <div className="alert alert-warning mb-2">หัวข้อนี้ไม่อยู่ในช่วงเวลาการประเมิน ดูข้อมูลได้อย่างเดียว</div>}
          <div className="grid lg:grid-cols-2 gap-4">
            {t.indicators.map((i) => (
              <IndicatorCard key={i.id} indicator={i} isOpen={!!t.is_open} onChange={load} />
            ))}
          </div>
        </section>
      ))}
    </Layout>
  );
}
