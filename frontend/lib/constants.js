// ค่าคงที่และข้อความที่ใช้หลายหน้า
export const ROLE_NAMES = { hr: "งานบุคลากร", evaluatee: "ผู้รับการประเมิน", committee: "กรรมการ" };

export const COMMITTEE_ROLES = { chair: "ประธานกรรมการ", member: "กรรมการร่วม" };

export const STATUS = {
  pending: { label: "ยังไม่ประเมิน", badge: "badge-ghost" },
  draft: { label: "บันทึกร่าง", badge: "badge-warning" },
  confirmed: { label: "ยืนยันผลแล้ว", badge: "badge-success" },
};

export const SCORE_TYPES = { yes_no: "มี / ไม่มี", scale_4: "สเกล 1-4" };

export const EVIDENCE_TYPES = { none: "ไม่ต้องแนบ", file: "ไฟล์ (PDF/รูปภาพ)", url: "ลิงก์ (URL)", any: "ไฟล์หรือลิงก์" };

// คำอธิบายระดับคะแนนสเกล 1-4
export const SCALE_LABELS = {
  1: "ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวังมาก",
  2: "ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวัง",
  3: "ปฏิบัติได้ตามระดับการปฏิบัติที่คาดหวัง",
  4: "ปฏิบัติได้สูงกว่าระดับการปฏิบัติที่คาดหวัง",
};
