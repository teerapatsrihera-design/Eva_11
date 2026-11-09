import { useEffect } from "react";
import { useRouter } from "next/router";
import { getUser, homePath } from "@/lib/auth";

// หน้าแรก: ส่งไปหน้าของ role หรือหน้า login
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const user = getUser();
    router.replace(user ? homePath(user.role) : "/login");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
