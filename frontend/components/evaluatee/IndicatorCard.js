import { useState } from "react";
import { useForm } from "react-hook-form";
import { Trash2, Paperclip } from "lucide-react";
import api, { errorMessage, downloadFile } from "@/lib/api";
import { validateWith } from "@/lib/validate";
import { SCALE_LABELS, EVIDENCE_TYPES } from "@/lib/constants";
import { evidenceSchema } from "@/schemas/evaluation";
import Field from "@/components/Field";

// ตัวเลือกคะแนนตามรูปแบบตัวชี้วัด
const scoreOptions = (type) =>
  type === "yes_no"
    ? [{ value: 1, label: "มี" }, { value: 0, label: "ไม่มี" }]
    : [1, 2, 3, 4].map((v) => ({ value: v, label: `ระดับ ${v} - ${SCALE_LABELS[v]}` }));

// การ์ดตัวชี้วัด 1 ตัว: กรอกคะแนนตนเอง + รายละเอียดประกอบหลายรายการ
export default function IndicatorCard({ indicator: ind, isOpen, onChange }) {
  const [error, setError] = useState("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: validateWith(evidenceSchema),
    defaultValues: { description: "", url: "", file: undefined },
  });

  // เรียก API แล้วให้หน้าแม่โหลดใหม่ คืน true ถ้าสำเร็จ
  const run = async (request) => {
    setError("");
    try {
      await request;
      onChange();
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    }
  };

  const saveScore = (score) => run(api.put(`/self-evaluations/${ind.id}`, { score }));

  const addEvidence = async ({ description, url, file }) => {
    const form = new FormData();
    form.append("description", description);
    if (url) form.append("url", url);
    if (file?.length) form.append("file", file[0]);
    if (await run(api.post(`/self-evaluations/${ind.id}/evidences`, form))) reset();
  };

  const removeEvidence = (ev) => confirm(`ลบ "${ev.description}" ?`) && run(api.delete(`/evidences/${ev.id}`));

  const download = (ev) => downloadFile(`/evidences/${ev.id}/file`, ev.file_name).catch((err) => setError(errorMessage(err)));

  const canFile = ["file", "any"].includes(ind.evidence_type);
  const canUrl = ["url", "any"].includes(ind.evidence_type);

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body p-4 gap-3">
        <div className="flex flex-wrap justify-between gap-2">
          <div className="flex-1 min-w-48">
            <h3 className="font-bold">{ind.name}</h3>
            <p className="text-sm opacity-70">{ind.description}</p>
            <p className="text-xs mt-1">
              น้ำหนัก {ind.weight} | หลักฐาน: {EVIDENCE_TYPES[ind.evidence_type]} {ind.evidence_note && `(${ind.evidence_note})`}
            </p>
          </div>
          <div className="text-sm text-right">
            <div>ความคืบหน้า {ind.progress}%</div>
            <progress className="progress progress-primary w-32" value={ind.progress} max="100" />
          </div>
        </div>

        {error && <div className="alert alert-error py-2">{error}</div>}

        {/* คะแนนตนเอง: เลือกแล้วบันทึกทันที แก้ไขได้ตลอดช่วงที่เปิด */}
        <div>
          <div className="font-medium text-sm mb-1">คะแนนประเมินตนเอง</div>
          <div className="flex flex-col gap-1">
            {scoreOptions(ind.score_type).map((o) => (
              <label key={o.value} className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  className="radio radio-sm radio-primary"
                  name={`score-${ind.id}`}
                  checked={ind.score === o.value}
                  disabled={!isOpen}
                  onChange={() => saveScore(o.value)}
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>

        {/* รายการรายละเอียดประกอบ */}
        <div>
          <div className="font-medium text-sm mb-1">รายละเอียดประกอบ / หลักฐาน ({ind.evidences.length} รายการ)</div>
          <ul className="space-y-1">
            {ind.evidences.map((ev, n) => (
              <li key={ev.id} className="flex items-start gap-2 bg-base-200 rounded p-2 text-sm">
                <div className="flex-1 min-w-0">
                  <div>
                    {n + 1}. {ev.description}
                  </div>
                  {ev.file_name && (
                    <button type="button" className="link link-primary text-left break-all" onClick={() => download(ev)}>
                      <Paperclip size={14} className="inline" /> {ev.file_name}
                    </button>
                  )}
                  {ev.url && (
                    <a href={ev.url} target="_blank" rel="noreferrer" className="link link-primary block break-all">
                      {ev.url}
                    </a>
                  )}
                </div>
                {isOpen && (
                  <button type="button" className="btn btn-xs btn-ghost text-error" title="ลบรายละเอียด" onClick={() => removeEvidence(ev)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {isOpen && (
          <form onSubmit={handleSubmit(addEvidence)} className="border border-base-300 rounded-box p-3">
            <Field label="เพิ่มรายละเอียดประกอบ" error={errors.description}>
              <textarea className="textarea w-full" rows={2} {...register("description")} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-x-4">
              {canFile && (
                <Field label="แนบไฟล์ (PDF, JPG, PNG ไม่เกิน 10MB)" error={errors.file}>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="file-input w-full" {...register("file")} />
                </Field>
              )}
              {canUrl && (
                <Field label={canFile ? "หรือแนบลิงก์ (URL)" : "แนบลิงก์ (URL)"} error={errors.url}>
                  <input className="input w-full" placeholder="https://" {...register("url")} />
                </Field>
              )}
            </div>
            <button className="btn btn-sm btn-primary mt-2" disabled={isSubmitting}>
              เพิ่มรายละเอียด
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
