import { useState } from "react";
import { useForm } from "react-hook-form";
import api, { errorMessage } from "@/lib/api";
import { validateWith } from "@/lib/validate";
import { formValues } from "@/lib/format";
import { userSchema, userUpdateSchema } from "@/schemas/user";
import Modal from "@/components/Modal";
import Field from "@/components/Field";

// เพิ่ม/แก้ไขผู้รับการประเมินหรือกรรมการ (item.id มีค่า = แก้ไข)
export default function UserModal({ item, onClose, onSaved }) {
  const isEdit = !!item.id;
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: validateWith(isEdit ? userUpdateSchema : userSchema),
    defaultValues: formValues({
      username: "",
      full_name: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      role: "evaluatee",
      ...item,
    }),
  });

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await api.put(`/users/${item.id}`, data);
      } else {
        const res = await api.post("/users", data);
        alert(`เพิ่มผู้ใช้สำเร็จ\nรหัสผ่านชั่วคราวของ ${data.username} คือ ${res.data.data.temp_password}`);
      }
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Modal title={isEdit ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="grid sm:grid-cols-2 gap-x-4">
          <Field label="ชื่อผู้ใช้" error={errors.username}>
            <input className="input w-full" {...register("username")} />
          </Field>
          {!isEdit && (
            <Field label="บทบาท" error={errors.role}>
              <select className="select w-full" {...register("role")}>
                <option value="evaluatee">ผู้รับการประเมิน</option>
                <option value="committee">กรรมการ</option>
              </select>
            </Field>
          )}
          <Field label="ชื่อ-สกุล" error={errors.full_name}>
            <input className="input w-full" {...register("full_name")} />
          </Field>
          <Field label="อีเมล" error={errors.email}>
            <input className="input w-full" {...register("email")} />
          </Field>
          <Field label="เบอร์โทร" error={errors.phone}>
            <input className="input w-full" {...register("phone")} />
          </Field>
          <Field label="ตำแหน่ง" error={errors.position}>
            <input className="input w-full" {...register("position")} />
          </Field>
          <Field label="แผนก/หน่วยงาน" error={errors.department}>
            <input className="input w-full" {...register("department")} />
          </Field>
        </div>
        {!isEdit && <p className="text-sm opacity-70 mt-2">ระบบจะสร้างรหัสผ่านชั่วคราวให้ ผู้ใช้ต้องเปลี่ยนเมื่อเข้าครั้งแรก</p>}
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
