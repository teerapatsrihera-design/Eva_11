import { sum } from "./score.js";

// ตรวจความถูกต้อง/ครบถ้วนของข้อมูลการประเมิน คืนรายการข้อความแจ้งเตือน (ว่าง = ข้อมูลพร้อม)
// topics: [{ id, title }], indicators: [{ topic_id, weight }]
// evaluatees: [{ id, full_name }], assignments: [{ evaluatee_id, committee_role }]
export function findDataIssues({ topics, indicators, evaluatees, assignments }) {
  const issues = [];

  const totalWeight = sum(indicators.map((i) => i.weight));
  if (totalWeight !== 100) issues.push(`น้ำหนักรวมของตัวชี้วัดทั้งหมดเท่ากับ ${totalWeight} (ควรเท่ากับ 100)`);

  for (const t of topics) {
    if (!indicators.some((i) => i.topic_id === t.id)) issues.push(`หัวข้อ "${t.title}" ยังไม่มีตัวชี้วัด`);
  }

  for (const e of evaluatees) {
    const mine = assignments.filter((a) => a.evaluatee_id === e.id);
    if (mine.length === 0) issues.push(`${e.full_name} ยังไม่มีกรรมการประเมิน`);
    else if (!mine.some((a) => a.committee_role === "chair")) issues.push(`${e.full_name} ยังไม่มีประธานกรรมการ`);
  }
  return issues;
}
