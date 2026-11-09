import { useState } from "react";
import { useForm } from "react-hook-form";
import api, { errorMessage } from "@/lib/api";
import { useAuth, saveAuth, getToken, homePath, goTo } from "@/lib/auth";
import { validateWith } from "@/lib/validate";
import { changePasswordSchema } from "@/schemas/auth";
import Layout from "@/components/Layout";
import Field from "@/components/Field";

export default function ChangePassword() {
  const user = useAuth(); // ทุก role ใช้ได้
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: validateWith(changePasswordSchema),
  });

  const onSubmit = async ({ old_password, new_password }) => {
    setError("");
    try {
      await api.put("/auth/change-password", { old_password, new_password });
      saveAuth(getToken(), { ...user, must_change_password: false });
      alert("เปลี่ยนรหัสผ่านสำเร็จ");
      goTo(homePath(user.role));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (!user) return null;

  return (
    <Layout user={user}>
      <form onSubmit={handleSubmit(onSubmit)} className="card bg-base-100 shadow max-w-md mx-auto">
        <div className="card-body">
          <h1 className="card-title">เปลี่ยนรหัสผ่าน</h1>
          {user.must_change_password && (
            <div className="alert alert-warning">กรุณาเปลี่ยนรหัสผ่านก่อนเริ่มใช้งานครั้งแรก</div>
          )}
          {error && <div className="alert alert-error">{error}</div>}
          <Field label="รหัสผ่านเดิม" error={errors.old_password}>
            <input type="password" className="input w-full" {...register("old_password")} />
          </Field>
          <Field label="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)" error={errors.new_password}>
            <input type="password" className="input w-full" {...register("new_password")} />
          </Field>
          <Field label="ยืนยันรหัสผ่านใหม่" error={errors.confirm_password}>
            <input type="password" className="input w-full" {...register("confirm_password")} />
          </Field>
          <button className="btn btn-primary mt-2" disabled={isSubmitting}>
            บันทึก
          </button>
        </div>
      </form>
    </Layout>
  );
}
