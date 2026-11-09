import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Printer } from "lucide-react";
import api, { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import EvaluationReport from "@/components/EvaluationReport";

// รายงานผลการประเมินรายบุคคล (พิมพ์/บันทึกเป็น PDF ได้)
export default function EvaluateeReport() {
  const user = useAuth(["hr"]);
  const { id } = useRouter().query;
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !id) return;
    api
      .get(`/reports/evaluatees/${id}`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(errorMessage(err)));
  }, [user, id]);

  if (!user) return null;

  return (
    <Layout user={user}>
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4 print:hidden">
        <Link href="/hr/reports" className="btn btn-sm btn-ghost">
          ← กลับ
        </Link>
        <button className="btn btn-sm btn-primary" onClick={() => window.print()}>
          <Printer size={16} /> พิมพ์ / PDF
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-4">รายงานผลการประเมินรายบุคคล</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {data && <EvaluationReport data={data} />}
    </Layout>
  );
}
