import { useEffect, useState } from "react";
import { useRouter } from "next/router";

// เก็บ token + ข้อมูลผู้ใช้ไว้ใน localStorage (เรียกใช้ใน useEffect/event เท่านั้น)
export function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export const getToken = () => localStorage.getItem("token");

export function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

// เปลี่ยนหน้าแบบโหลดใหม่ทั้งหน้า (ให้ทุกหน้าอ่าน localStorage ใหม่)
export function goTo(path) {
  window.location.href = path;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  goTo("/login");
}

// หน้าแรกของแต่ละ role
export const homePath = (role) => `/${role}`;

// Guard: ใช้ในทุกหน้าที่ต้อง login
// const user = useAuth(["hr"]); if (!user) return null;
export function useAuth(roles) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace("/login");
    } else if (u.must_change_password && router.pathname !== "/change-password") {
      router.replace("/change-password"); // บังคับเปลี่ยนรหัสผ่านครั้งแรก
    } else if (roles && !roles.includes(u.role)) {
      router.replace(homePath(u.role)); // role ไม่ตรง กลับหน้าของตัวเอง
    } else {
      // localStorage อ่านได้หลัง mount เท่านั้น จึงต้อง setState ใน effect
      setUser(u); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return user;
}
