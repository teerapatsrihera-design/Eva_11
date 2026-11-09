import { STATUS } from "@/lib/constants";

// ป้ายสถานะการประเมินของกรรมการ
export default function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return <span className={`badge ${s.badge} whitespace-nowrap`}>{s.label}</span>;
}
