// ฟังก์ชันคำนวณคะแนน (ไม่มี DB ทดสอบด้วย node --test ได้)

export const round2 = (n) => Math.round(n * 100) / 100;

export const sum = (nums) => round2(nums.reduce((a, b) => a + b, 0));

// ค่าเฉลี่ย ไม่นับค่าว่าง (null/undefined) ถ้าไม่มีเลยคืน null
export function average(nums) {
  const values = nums.filter((n) => n != null);
  return values.length ? round2(sum(values) / values.length) : null;
}

export const percent = (part, whole) => (whole ? round2((part / whole) * 100) : 0);

// คะแนนถ่วงน้ำหนัก: มี/ไม่มี -> 0 หรือ 1 เท่าของน้ำหนัก, สเกล 1-4 -> (คะแนน/4) x น้ำหนัก
export function weighted(score, indicator) {
  if (score == null) return 0;
  const ratio = indicator.score_type === "yes_no" ? score : score / 4;
  return round2(ratio * indicator.weight);
}

// คะแนนถูกต้องตามรูปแบบหรือไม่: มี/ไม่มี = 0 หรือ 1, สเกล = 1-4
export function isValidScore(score, scoreType) {
  if (!Number.isInteger(score)) return false;
  return scoreType === "yes_no" ? score === 0 || score === 1 : score >= 1 && score <= 4;
}

// ความคืบหน้าของตัวชี้วัด 1 ตัว (%): กรอกคะแนนแล้ว + แนบหลักฐานแล้ว (ถ้าตัวชี้วัดนั้นต้องแนบ)
export function indicatorProgress(indicator, score, evidenceCount) {
  const steps = [score != null];
  if (indicator.evidence_type !== "none") steps.push(evidenceCount > 0);
  return percent(steps.filter(Boolean).length, steps.length);
}

// เรียงข้อมูลตาม key (ค่าว่างไว้ท้ายเสมอ) ไม่แก้ array เดิม
export function sortBy(list, key, dir = "asc") {
  const sign = dir === "desc" ? -1 : 1;
  return [...list].sort((a, b) => {
    if (a[key] == null) return 1;
    if (b[key] == null) return -1;
    return a[key] > b[key] ? sign : a[key] < b[key] ? -sign : 0;
  });
}

// สรุปผลของผู้รับประเมิน 1 คน
// indicators: ตัวชี้วัดทั้งหมด, selfData: { indicator_id: { score, evidence_count } }
// assignments: กรรมการของคนนี้, committeeScores: [{ assignment_id, indicator_id, score }]
// ผลกรรมการใช้ค่าเฉลี่ยจากกรรมการที่ "ยืนยันแล้ว" เท่านั้น
export function buildResult(indicators, selfData, assignments, committeeScores) {
  const confirmedIds = assignments.filter((a) => a.status === "confirmed").map((a) => a.id);

  const rows = indicators.map((ind) => {
    const scores = {}; // { assignment_id: score }
    for (const s of committeeScores) if (s.indicator_id === ind.id) scores[s.assignment_id] = s.score;
    const self_score = selfData[ind.id]?.score ?? null;
    const evidence_count = selfData[ind.id]?.evidence_count ?? 0;
    const avg_score = average(confirmedIds.map((id) => scores[id]));
    return {
      ...ind,
      self_score,
      evidence_count,
      progress: indicatorProgress(ind, self_score, evidence_count),
      scores,
      avg_score,
      self_weighted: weighted(self_score, ind),
      committee_weighted: weighted(avg_score, ind),
    };
  });

  const total_weight = sum(rows.map((r) => r.weight));
  const filled = rows.filter((r) => r.progress === 100).length; // ตัวชี้วัดที่บันทึกครบ
  const committee_total = sum(rows.map((r) => r.committee_weighted));

  return {
    rows,
    summary: {
      total_weight,
      indicator_count: rows.length,
      filled,
      progress: percent(filled, rows.length),
      self_total: sum(rows.map((r) => r.self_weighted)),
      committee_count: assignments.length,
      confirmed_count: confirmedIds.length,
      committee_total: confirmedIds.length ? committee_total : null,
      committee_percent: confirmedIds.length ? percent(committee_total, total_weight) : null,
    },
  };
}
