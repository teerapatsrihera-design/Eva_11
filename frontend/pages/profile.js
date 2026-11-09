import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api, { errorMessage } from "@/lib/api";
import { useAuth, saveAuth, getToken } from "@/lib/auth";
import { validateWith } from "@/lib/validate";
import { formValues } from "@/lib/format";
import { ROLE_NAMES } from "@/lib/constants";
import { profileSchema } from "@/schemas/user";
import Layout from "@/components/Layout";
import Field from "@/components/Field";

// แก้ไขข้อมูลส่วนตัว (ทุก role)
export default function Profile() {
  const user = useAuth();
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: validateWith(profileSchema),
  });

  useEffect(() => {
    if (!user) return;
    api.get("/profile").then((res) => {
      setProfile(res.data.data);
      reset(formValues(res.data.data));
    }).catch((err) => setMessage({ type: "error", text: errorMessage(err) }));
  }, [user, reset]);

  const onSubmit = async (data) => {
    try {
      const res = await api.put("/profile", data);
      saveAuth(getToken(), { ...user, full_name: data.full_name }); // ชื่อบน navbar
      setMessage({ type: "success", text: res.data.message });
    } catch (err) {
      setMessage({ type: "error", text: errorMessage(err) });
    }
  };

  if (!user) return null;
  // โหลดไม่สำเร็จ (เช่น เซิร์ฟเวอร์ไม่ทำงาน) แสดงข้อความแทนหน้าว่าง
  if (!profile) return <Layout user={user}>{message.text && <div className="alert alert-error mb-4">{message.text}</div>}</Layout>;

  return (
    <Layout user={user}>
      <form onSubmit={handleSubmit(onSubmit)} className="card bg-base-100 shadow max-w-2xl mx-auto">
        <div className="card-body">
          <h1 className="card-title">ข้อมูลส่วนตัว</h1>
          <p className="text-sm opacity-70">
            ชื่อผู้ใช้ {profile.username} | {ROLE_NAMES[profile.role]}
          </p>
          {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}
          <div className="grid sm:grid-cols-2 gap-x-4">
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
          <button className="btn btn-primary mt-2 w-fit" disabled={isSubmitting}>
            บันทึก
          </button>
        </div>
      </form>
    </Layout>
  );
}
