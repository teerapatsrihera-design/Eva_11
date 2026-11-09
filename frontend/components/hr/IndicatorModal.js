import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import api, { errorMessage } from "@/lib/api";
import { validateWith } from "@/lib/validate";
import { formValues } from "@/lib/format";
import { SCORE_TYPES, EVIDENCE_TYPES, SCALE_LABELS } from "@/lib/constants";
import { indicatorSchema } from "@/schemas/indicator";
import Modal from "@/components/Modal";
import Field from "@/components/Field";

// เพิ่ม/แก้ไขตัวชี้วัด (item.id มีค่า = แก้ไข, item.topic_id = หัวข้อที่สังกัด)
export default function IndicatorModal({ item, onClose, onSaved }) {
  const [error, setError] = useState("");
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    resolver: validateWith(indicatorSchema),
    defaultValues: formValues({
      name: "",
      description: "",
      weight: "",
      score_type: "scale_4",
      evidence_type: "any",
      evidence_note: "",
      ...item,
    }),
  });

  const scoreType = useWatch({ control, name: "score_type" }); // ใช้แสดงคำอธิบายระดับ 1-4

  const onSubmit = async (data) => {
    try {
      if (item.id) await api.put(`/indicators/${item.id}`, data);
      else await api.post("/indicators", data);
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Modal title={item.id ? "แก้ไขตัวชี้วัด" : "เพิ่มตัวชี้วัด"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {error && <div className="alert alert-error">{error}</div>}
        <Field label="ชื่อตัวชี้วัด" error={errors.name}>
          <input className="input w-full" {...register("name")} />
        </Field>
        <Field label="รายละเอียด" error={errors.description}>
          <textarea className="textarea w-full" rows={2} {...register("description")} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-x-4">
          <Field label="น้ำหนักคะแนน" error={errors.weight}>
            <input type="number" step="0.01" className="input w-full" {...register("weight")} />
          </Field>
          <Field label="รูปแบบการประเมิน" error={errors.score_type}>
            <select className="select w-full" {...register("score_type")}>
              {Object.entries(SCORE_TYPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
        </div>
        {scoreType === "scale_4" && (
          <ul className="text-xs bg-base-200 rounded p-2 my-1">
            {Object.entries(SCALE_LABELS).map(([level, label]) => (
              <li key={level}>ระดับ {level} = {label}</li>
            ))}
          </ul>
        )}
        <div className="grid sm:grid-cols-2 gap-x-4">
          <Field label="หลักฐานที่ต้องแนบ" error={errors.evidence_type}>
            <select className="select w-full" {...register("evidence_type")}>
              {Object.entries(EVIDENCE_TYPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="คำอธิบายหลักฐาน" error={errors.evidence_note}>
            <input className="input w-full" placeholder="เช่น ไฟล์ PDF แผนการสอน" {...register("evidence_note")} />
          </Field>
        </div>
        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button className="btn btn-primary" disabled={isSubmitting}>
            บันทึก
          </button>
        </div>
      </form>
    </Modal>
  );
}
