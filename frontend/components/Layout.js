import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, LogOut, KeyRound, UserRound } from "lucide-react";
import { logout } from "@/lib/auth";
import { ROLE_NAMES } from "@/lib/constants";

// เมนูของแต่ละ role
const MENUS = {
  hr: [
    { href: "/hr", label: "Dashboard" },
    { href: "/hr/topics", label: "หัวข้อ/ตัวชี้วัด" },
    { href: "/hr/users", label: "ผู้ใช้งาน" },
    { href: "/hr/assignments", label: "มอบหมายกรรมการ" },
    { href: "/hr/reports", label: "รายงาน" },
    { href: "/hr/backups", label: "สำรองข้อมูล" },
  ],
  evaluatee: [
    { href: "/evaluatee", label: "หน้าหลัก" },
    { href: "/evaluatee/evaluation", label: "ประเมินตนเอง" },
    { href: "/evaluatee/result", label: "ผลการประเมิน" },
  ],
  committee: [{ href: "/committee", label: "หน้าหลัก" }],
};

export default function Layout({ user, children }) {
  const { pathname } = useRouter();
  const home = `/${user.role}`;
  // เมนูที่ตรงกับหน้าปัจจุบัน (รวมหน้าย่อย เช่น /hr/reports/...) ยกเว้นหน้าหลัก
  const isActive = (href) => pathname === href || (href !== home && pathname.startsWith(href + "/"));
  const links = MENUS[user.role].map((m) => (
    <li key={m.href}>
      <Link href={m.href} className={isActive(m.href) ? "menu-active" : ""}>
        {m.label}
      </Link>
    </li>
  ));

  return (
    <div className="min-h-screen bg-base-200 print:bg-white">
      <nav className="navbar bg-base-100 shadow print:hidden">
        <div className="navbar-start">
          {/* มือถือ: เมนูแบบ dropdown */}
          <div className="dropdown lg:hidden">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-square">
              <Menu size={20} />
            </div>
            <ul tabIndex={0} className="menu dropdown-content bg-base-100 rounded-box shadow w-52 z-10">
              {links}
            </ul>
          </div>
          <Link href={`/${user.role}`} className="btn btn-ghost text-lg">
            ระบบประเมิน
          </Link>
        </div>
        {/* desktop: เมนูแนวนอน */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal">{links}</ul>
        </div>
        <div className="navbar-end gap-1">
          <div className="text-right text-sm hidden sm:block">
            <div>{user.full_name}</div>
            <div className="text-xs opacity-60">{ROLE_NAMES[user.role]}</div>
          </div>
          <Link href="/profile" className="btn btn-ghost btn-square" title="ข้อมูลส่วนตัว">
            <UserRound size={18} />
          </Link>
          <Link href="/change-password" className="btn btn-ghost btn-square" title="เปลี่ยนรหัสผ่าน">
            <KeyRound size={18} />
          </Link>
          <button onClick={logout} className="btn btn-ghost btn-square" title="ออกจากระบบ">
            <LogOut size={18} />
          </button>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-4 print:p-0">{children}</main>
    </div>
  );
}
