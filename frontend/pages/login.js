import { useState } from "react";
import { useForm } from "react-hook-form";
import api, { errorMessage } from "@/lib/api";
import { saveAuth, homePath, goTo } from "@/lib/auth";
import { validateWith } from "@/lib/validate";
import { loginSchema } from "@/schemas/auth";
import Field from "@/components/Field";

export default function Login() {
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: validateWith(loginSchema),
  });

  const onSubmit = async (data) => {
    setError("");
    try {
      const res = await api.post("/auth/login", data);
      const { token, user } = res.data.data;
      saveAuth(token, user);
      goTo(user.must_change_password ? "/change-password" : homePath(user.role));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="card bg-base-100 shadow w-full max-w-sm">
        <div className="card-body">
          <h1 className="card-title text-2xl justify-center">ระบบประเมินบุคลากร</h1>
          {error && <div className="alert alert-error">{error}</div>}
          <Field label="ชื่อผู้ใช้" error={errors.username}>
            <input className="input w-full" autoComplete="username" {...register("username")} />
          </Field>
          <Field label="รหัสผ่าน" error={errors.password}>
            <input type="password" className="input w-full" autoComplete="current-password" {...register("password")} />
          </Field>
          <button className="btn btn-primary mt-2" disabled={isSubmitting}>
            เข้าสู่ระบบ
          </button>
        </div>
      </form>
    </main>
  );
}
