import { useState } from "react";
import { useForm } from "react-hook-form";
import api, { errorMessage } from "@/lib/api";
import { validateWith } from "@/lib/validate";
import { formValues } from "@/lib/format";
import { topicSchema } from "@/schemas/topic";
import Modal from "@/components/Modal";
import Field from "@/components/Field";

// เพิ่ม/แก้ไขหัวข้อ (item.id มีค่า = แก้ไข)
export default function TopicModal({ item, onClose, onSaved }) {
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: validateWith(topicSchema),
    defaultValues: formValues({ title: "", description: "", start_date: "", end_date: "", ...item }),
  });

  const onSubmit = async (data) => {
    try {
      if (item.id) await api.put(`/topics/${item.id}`, data);
      else await api.post("/topics", data);
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Modal title={item.id ? "แก้ไขหัวข้อการประเมิน" : "เพิ่มหัวข้อการประเมิน"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {error && <div className="alert alert-error">{error}</div>}
        <Field label="ชื่อหัวข้อ" error={errors.title}>
          <input className="input w-full" {...register("title")} />
        </Field>
        <Field label="รายละเอียด" error={errors.description}>
          <textarea className="textarea w-full" rows={2} {...register("description")} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-x-4">
          <Field label="วันเริ่มประเมิน" error={errors.start_date}>
            <input type="date" className="input w-full" {...register("start_date")} />
          </Field>
          <Field label="วันสิ้นสุดการประเมิน" error={errors.end_date}>
            <input type="date" className="input w-full" {...register("end_date")} />
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
