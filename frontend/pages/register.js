import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import api, { errorMessage } from "@/lib/api";
import { goTo } from "@/lib/auth";
import { validateWith } from "@/lib/validate";
import { registerSchema } from "@/schemas/auth";
import Field from "@/components/Field";

// สมัครสมาชิก: บัญชีใหม่เป็นผู้รับการประเมินเสมอ
export default function Register() {
  const [error, setError] = useState("");
  // register ตรงนี้คือฟังก์ชันผูกช่องกรอกของ React Hook Form ไม่ใช่การสมัครสมาชิก
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: validateWith(registerSchema),
  });

  // ตัด confirm_password ออก ใช้ตรวจฝั่งหน้าเว็บเท่านั้น
  const onSubmit = async ({ confirm_password, ...data }) => {
    setError("");
    try {
      await api.post("/auth/register", data);
      alert("สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ");
      goTo("/login");
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="card bg-base-100 shadow w-full max-w-2xl">
        <div className="card-body">
          <h1 className="card-title text-2xl justify-center">สมัครสมาชิก</h1>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="ชื่อผู้ใช้" error={errors.username}>
              <input className="input w-full" autoComplete="username" {...register("username")} />
            </Field>
            <Field label="ชื่อ-สกุล" error={errors.full_name}>
              <input className="input w-full" {...register("full_name")} />
            </Field>
            <Field label="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)" error={errors.password}>
              <input type="password" className="input w-full" autoComplete="new-password" {...register("password")} />
            </Field>
            <Field label="ยืนยันรหัสผ่าน" error={errors.confirm_password}>
              <input type="password" className="input w-full" autoComplete="new-password" {...register("confirm_password")} />
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
          <button className="btn btn-primary mt-2" disabled={isSubmitting}>
            สมัครสมาชิก
          </button>
          <Link href="/login" className="link text-sm text-center">
            มีบัญชีแล้ว? เข้าสู่ระบบ
          </Link>
        </div>
      </form>
    </main>
  );
}
