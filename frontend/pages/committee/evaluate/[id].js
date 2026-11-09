import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Paperclip, Printer } from "lucide-react";
import api, { errorMessage, downloadFile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { validateWith } from "@/lib/validate";
import { COMMITTEE_ROLES, SCALE_LABELS, EVIDENCE_TYPES } from "@/lib/constants";
import { scoreLabel, thaiDate } from "@/lib/format";
import { draftSchema, confirmSchema } from "@/schemas/committee";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import SignaturePad from "@/components/SignaturePad";

// ตัวเลือกคะแนนของกรรมการ
const scoreOptions = (type) =>
  type === "yes_no"
    ? [{ value: 1, label: "มี" }, { value: 0, label: "ไม่มี" }]
    : [1, 2, 3, 4].map((v) => ({ value: v, label: String(v), title: SCALE_LABELS[v] }));

export default function Evaluate() {
  const user = useAuth(["committee"]);
  const { id } = useRouter().query;
  const [data, setData] = useState(null);
  const [scores, setScores] = useState({}); // { indicator_id: score } ที่กำลังแก้
  const [comment, setComment] = useState("");
  const [signature, setSignature] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });

  const load = () =>
    api.get(`/committee/assignments/${id}`).then((res) => {
      const d = res.data.data;
      const saved = {};
      for (const t of d.topics) for (const i of t.indicators) if (i.score != null) saved[i.id] = i.score;
      setData(d);
      setScores(saved);
      setComment(d.assignment.summary_comment || "");
    }).catch((err) => setMessage({ type: "error", text: errorMessage(err) }));

  useEffect(() => {
    if (user && id) load();
  }, [user, id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ส่งคะแนน + ความเห็นไปบันทึกร่าง
  const sendDraft = () =>
    api.put(`/committee/assignments/${id}/scores`, {
      scores: Object.entries(scores).map(([indicatorId, score]) => ({ indicator_id: Number(indicatorId), score })),
      summary_comment: comment,
    });

  const saveDraft = async () => {
    const check = validateWith(draftSchema)({ summary_comment: comment });
    setErrors(check.errors);
    if (Object.keys(check.errors).length) return;
    try {
      const res = await sendDraft();
      setMessage({ type: "success", text: res.data.message });
      load();
    } catch (err) {
      setMessage({ type: "error", text: errorMessage(err) });
    }
  };

  const confirmResult = async () => {
    const indicators = data.topics.flatMap((t) => t.indicators);
    const check = validateWith(confirmSchema)({
      scored: indicators.filter((i) => scores[i.id] != null).length,
      total: indicators.length,
      summary_comment: comment,
      signature,
    });
    setErrors(check.errors);
    if (Object.keys(check.errors).length) return;
    if (!confirm("ยืนยันและส่งผลการประเมิน? หลังยืนยันแล้วจะแก้ไขไม่ได้")) return;
    try {
      await sendDraft(); // บันทึกค่าล่าสุดก่อน
      const res = await api.put(`/committee/assignments/${id}/confirm`, { signature });
      setMessage({ type: "success", text: res.data.message });
      load();
    } catch (err) {
      setMessage({ type: "error", text: errorMessage(err) });
    }
  };

  if (!user) return null;
  if (!data) return <Layout user={user}>{message.text && <div className="alert alert-error">{message.text}</div>}</Layout>;

  const { assignment, evaluatee, topics, summary } = data;
  const locked = assignment.status === "confirmed";
  const allIndicators = topics.flatMap((t) => t.indicators);

  return (
    <Layout user={user}>
      <div className="flex justify-between items-center gap-2 mb-2 print:hidden">
        <Link href="/committee" className="btn btn-sm btn-ghost">
          ← กลับ
        </Link>
        <button className="btn btn-sm" onClick={() => window.print()}>
          <Printer size={16} /> พิมพ์ / PDF
        </button>
      </div>

      {/* ข้อมูลผู้รับการประเมิน */}
      <div className="card bg-base-100 shadow mb-4 print:shadow-none">
        <div className="card-body">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <h1 className="card-title text-2xl">{evaluatee.full_name}</h1>
              <p className="opacity-70">
                {evaluatee.position} {evaluatee.department}
              </p>
              <p className="text-sm opacity-70">
                {evaluatee.email} {evaluatee.phone}
              </p>
            </div>
            <div className="text-right space-y-1">
              <div className="badge badge-outline">{COMMITTEE_ROLES[assignment.committee_role]}</div>
              <div>
                <StatusBadge status={assignment.status} />
              </div>
              <div className="text-sm">
                ให้คะแนนแล้ว {Object.keys(scores).length}/{allIndicators.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {message.text && <div className={`alert alert-${message.type} mb-4`}>{message.text}</div>}
      {locked && (
        <div className="alert alert-success mb-4">ยืนยันผลแล้วเมื่อ {thaiDate(assignment.confirmed_at)} ไม่สามารถแก้ไขได้</div>
      )}

      {/* ตัวชี้วัด + หลักฐาน + คะแนนตนเอง + ช่องให้คะแนน */}
      {topics.map((t) => (
        <section key={t.id} className="mb-4 print:hidden">
          <h2 className="text-lg font-bold mb-2">{t.title}</h2>
          <div className="space-y-3">
            {t.indicators.map((i) => (
              <div key={i.id} className="card bg-base-100 shadow">
                <div className="card-body p-4 gap-2">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div className="flex-1 min-w-48">
                      <h3 className="font-bold">{i.name}</h3>
                      <p className="text-sm opacity-70">{i.description}</p>
                      <p className="text-xs">
                        น้ำหนัก {i.weight} | หลักฐาน: {EVIDENCE_TYPES[i.evidence_type]}
                      </p>
                    </div>
                    <div className="text-sm">
                      ผู้รับการประเมินให้ตนเอง: <b>{scoreLabel(i.self_score, i.score_type)}</b>
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="font-medium">รายละเอียดประกอบ / หลักฐาน ({i.evidences.length})</div>
                    <ul className="list-disc list-inside">
                      {i.evidences.map((ev) => (
                        <li key={ev.id} className="break-all">
                          {ev.description}{" "}
                          {ev.file_name && (
                            <button
                              type="button"
                              className="link link-primary"
                              onClick={() => downloadFile(`/evidences/${ev.id}/file`, ev.file_name).catch((err) => alert(errorMessage(err)))}
                            >
                              <Paperclip size={12} className="inline" /> {ev.file_name}
                            </button>
                          )}
                          {ev.url && (
                            <a href={ev.url} target="_blank" rel="noreferrer" className="link link-primary">
                              {ev.url}
                            </a>
                          )}
                        </li>
                      ))}
                      {i.evidences.length === 0 && <li className="opacity-60">ไม่มี</li>}
                    </ul>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">คะแนนของท่าน:</span>
                    {scoreOptions(i.score_type).map((o) => (
                      <input
                        key={o.value}
                        type="radio"
                        name={`score-${i.id}`}
                        className="btn btn-sm min-w-12"
                        aria-label={o.label}
                        title={o.title}
                        checked={scores[i.id] === o.value}
                        disabled={locked}
                        onChange={() => setScores({ ...scores, [i.id]: o.value })}
                      />
                    ))}
                    {scores[i.id] == null && <span className="text-xs text-warning">ยังไม่ให้คะแนน</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      <p className="text-xs opacity-60 mb-4 print:hidden">
        ระดับ 1 = {SCALE_LABELS[1]}, 2 = {SCALE_LABELS[2]}, 3 = {SCALE_LABELS[3]}, 4 = {SCALE_LABELS[4]}
      </p>

      {/* ความเห็นสรุป */}
      <div className="card bg-base-100 shadow mb-4 print:shadow-none">
        <div className="card-body">
          <h2 className="card-title">ความเห็นสรุปโดยภาพรวม</h2>
          {locked ? (
            <p className="whitespace-pre-line">{assignment.summary_comment}</p>
          ) : (
            <>
              <textarea className="textarea w-full" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
              {errors.summary_comment && <p className="text-error text-sm">{errors.summary_comment.message}</p>}
              <button className="btn btn-outline w-fit" onClick={saveDraft}>
                บันทึกร่าง
              </button>
            </>
          )}
        </div>
      </div>

      {/* ตารางผลลัพธ์ */}
      <div className="card bg-base-100 shadow mb-4 print:shadow-none">
        <div className="card-body">
          <h2 className="card-title">ผลการประเมินรายตัวชี้วัด</h2>
          {!locked && <p className="text-xs opacity-60 print:hidden">แสดงคะแนนที่บันทึกแล้ว (กดบันทึกร่างเพื่ออัปเดตตาราง)</p>}
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>ตัวชี้วัด</th>
                  <th className="text-right">น้ำหนัก</th>
                  <th className="text-center">ตนเอง</th>
                  <th className="text-center">กรรมการ</th>
                  <th className="text-right">คะแนนที่ได้</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((t) => [
                  <tr key={`t${t.id}`} className="bg-base-200">
                    <td colSpan={5} className="font-bold">
                      {t.title}
                    </td>
                  </tr>,
                  ...t.indicators.map((i) => (
                    <tr key={i.id}>
                      <td>{i.name}</td>
                      <td className="text-right">{i.weight}</td>
                      <td className="text-center">{scoreLabel(i.self_score, i.score_type)}</td>
                      <td className="text-center">{scoreLabel(i.score, i.score_type)}</td>
                      <td className="text-right">{i.weighted_score}</td>
                    </tr>
                  )),
                ])}
              </tbody>
              <tfoot>
                <tr>
                  <td>รวม</td>
                  <td className="text-right">{summary.total_weight}</td>
                  <td colSpan={2} className="text-center">
                    {summary.scored}/{summary.indicator_count} ตัวชี้วัด
                  </td>
                  <td className="text-right">
                    {summary.total} ({summary.percent}%)
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ลงนาม + ยืนยัน */}
      <div className="card bg-base-100 shadow mb-4 print:shadow-none">
        <div className="card-body">
          <h2 className="card-title">ลงนามการประเมิน</h2>
          {locked ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assignment.signature} alt="ลายเซ็น" className="h-24 border border-base-300 rounded bg-white" />
              <p className="text-sm mt-1">
                {user.full_name} ({COMMITTEE_ROLES[assignment.committee_role]}) ลงนามเมื่อ {thaiDate(assignment.confirmed_at)}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm opacity-70">วาดลายเซ็นในกรอบด้านล่าง แล้วกดยืนยันและส่งผล</p>
              <SignaturePad onChange={setSignature} />
              {/* error ก่อนยืนยัน: คะแนนไม่ครบ / ไม่มีความเห็น / ไม่มีลายเซ็น */}
              {Object.entries(errors).map(([field, e]) => (
                <p key={field} className="text-error text-sm">
                  {e.message}
                </p>
              ))}
              <button className="btn btn-primary w-fit" onClick={confirmResult}>
                ยืนยันและส่งผลการประเมิน
              </button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
