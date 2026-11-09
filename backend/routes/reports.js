import { Router } from "express";
import pool from "../db.js";
import { ok, fail } from "../utils/response.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { buildResult, weighted, sum, sortBy, average, percent } from "../utils/score.js";
import { findDataIssues } from "../utils/dataCheck.js";

const router = Router();
router.use(verifyToken);

// ตัวชี้วัดทั้งหมด พร้อมชื่อหัวข้อ
async function loadIndicators() {
  const [rows] = await pool.query(
    `SELECT i.id, i.topic_id, t.title AS topic_title, i.name, i.description, i.weight, i.score_type, i.evidence_type
     FROM indicators i JOIN evaluation_topics t ON t.id = i.topic_id
     ORDER BY i.topic_id, i.id`
  );
  return rows;
}

// คำนวณผลของผู้รับประเมินหลายคนในครั้งเดียว คืน { evaluatee_id: { assignments, rows, summary } }
async function loadResults(evaluateeIds) {
  if (!evaluateeIds.length) return {};
  const indicators = await loadIndicators();
  // คะแนนตนเอง + จำนวนหลักฐาน
  const [selfRows] = await pool.query(
    `SELECT se.evaluatee_id, se.indicator_id, se.score, COUNT(ev.id) AS evidence_count
     FROM self_evaluations se LEFT JOIN evidences ev ON ev.self_evaluation_id = se.id
     WHERE se.evaluatee_id IN (?) GROUP BY se.id`,
    [evaluateeIds]
  );
  const [assignments] = await pool.query(
    `SELECT a.*, u.full_name AS committee_name, u.position AS committee_position
     FROM assignments a JOIN users u ON u.id = a.committee_id
     WHERE a.evaluatee_id IN (?) ORDER BY a.committee_role, a.id`,
    [evaluateeIds]
  );
  const [scores] = await pool.query(
    `SELECT s.assignment_id, s.indicator_id, s.score
     FROM committee_scores s JOIN assignments a ON a.id = s.assignment_id
     WHERE a.evaluatee_id IN (?)`,
    [evaluateeIds]
  );

  const results = {};
  for (const id of evaluateeIds) {
    const mine = assignments.filter((a) => a.evaluatee_id === id);
    const selfData = Object.fromEntries(selfRows.filter((r) => r.evaluatee_id === id).map((r) => [r.indicator_id, r]));
    const myScores = scores.filter((s) => mine.some((a) => a.id === s.assignment_id));
    results[id] = { assignments: mine, ...buildResult(indicators, selfData, mine, myScores) };
  }
  return results;
}

// GET /api/reports/overview  ข้อมูล Dashboard ของ hr: สถิติภาพรวม + ค่าเฉลี่ยคะแนน + การตรวจข้อมูล
router.get("/overview", requireRole("hr"), async (req, res) => {
  const [users] = await pool.query("SELECT id, full_name, role FROM users WHERE role <> 'hr' ORDER BY id");
  const [topics] = await pool.query(
    "SELECT id, title, (CURDATE() BETWEEN start_date AND end_date) AS is_open FROM evaluation_topics ORDER BY id"
  );
  const [assignments] = await pool.query("SELECT evaluatee_id, committee_role, status FROM assignments");
  const indicators = await loadIndicators();

  const evaluatees = users.filter((u) => u.role === "evaluatee");
  const results = await loadResults(evaluatees.map((e) => e.id));
  const list = evaluatees.map((e) => ({ id: e.id, full_name: e.full_name, ...results[e.id].summary }));
  const scored = list.filter((e) => e.committee_percent != null); // มีกรรมการยืนยันอย่างน้อย 1 คน
  const percents = scored.map((e) => e.committee_percent);

  // ค่าเฉลี่ย % คะแนนกรรมการรายหัวข้อ (เฉพาะคนที่มีผลยืนยันแล้ว)
  const topicStats = topics.map((t) => {
    const inTopic = indicators.filter((i) => i.topic_id === t.id);
    const weight = sum(inTopic.map((i) => i.weight));
    const avg = average(
      scored.map((e) => {
        const got = sum(results[e.id].rows.filter((r) => r.topic_id === t.id).map((r) => r.committee_weighted));
        return percent(got, weight);
      })
    );
    return { ...t, indicator_count: inTopic.length, total_weight: weight, avg_percent: avg };
  });

  const countStatus = (s) => assignments.filter((a) => a.status === s).length;
  ok(res, {
    counts: {
      evaluatees: evaluatees.length,
      committees: users.length - evaluatees.length,
      topics: topics.length,
      open_topics: topics.filter((t) => t.is_open).length,
      indicators: indicators.length,
    },
    assignments: { total: assignments.length, pending: countStatus("pending"), draft: countStatus("draft"), confirmed: countStatus("confirmed") },
    progress: {
      average: average(list.map((e) => e.progress)) ?? 0,
      completed: list.filter((e) => e.progress === 100).length,
      fully_evaluated: list.filter((e) => e.committee_count > 0 && e.confirmed_count === e.committee_count).length,
    },
    scores: {
      evaluated: scored.length,
      average: average(percents),
      max: percents.length ? Math.max(...percents) : null,
      min: percents.length ? Math.min(...percents) : null,
    },
    topics: topicStats,
    ranking: sortBy(scored, "committee_percent", "desc").slice(0, 5),
    issues: findDataIssues({ topics, indicators, evaluatees, assignments }),
  });
});

// GET /api/reports/evaluatees?sort=score|progress|name
// สรุปรายผู้รับการประเมิน: % การบันทึก, จำนวนกรรมการที่ยืนยัน, คะแนนรวม
router.get("/evaluatees", requireRole("hr"), async (req, res) => {
  const [users] = await pool.query(
    "SELECT id, username, full_name, position, department FROM users WHERE role = 'evaluatee' ORDER BY id"
  );
  const results = await loadResults(users.map((u) => u.id));
  const list = users.map((u) => ({ ...u, ...results[u.id].summary }));

  const sortKey = { score: "committee_percent", progress: "progress", name: "full_name" }[req.query.sort];
  ok(res, sortKey ? sortBy(list, sortKey, sortKey === "full_name" ? "asc" : "desc") : list);
});

// GET /api/reports/evaluatees/:id  รายงานผลการประเมินรายบุคคล
// hr ดูได้ทุกคน, ผู้รับประเมินดูได้เฉพาะของตัวเอง, กรรมการดูได้เฉพาะคนที่ได้รับมอบหมาย
router.get("/evaluatees/:id", requireRole("hr", "evaluatee", "committee"), async (req, res) => {
  const id = Number(req.params.id);
  const { role, id: userId } = req.user;
  if (role === "evaluatee" && userId !== id) return fail(res, 403, "ดูได้เฉพาะผลของตนเอง");
  if (role === "committee") {
    const [rows] = await pool.query("SELECT id FROM assignments WHERE committee_id = ? AND evaluatee_id = ?", [userId, id]);
    if (!rows.length) return fail(res, 403, "ไม่ได้รับมอบหมายให้ประเมินผู้นี้");
  }

  const [users] = await pool.query(
    "SELECT id, username, full_name, email, phone, position, department FROM users WHERE id = ? AND role = 'evaluatee'",
    [id]
  );
  if (!users[0]) return fail(res, 404, "ไม่พบผู้รับการประเมิน");

  const result = (await loadResults([id]))[id];

  // ผู้รับประเมินเห็นเฉพาะผลของกรรมการที่ยืนยันแล้ว
  if (role === "evaluatee") {
    for (const a of result.assignments) {
      if (a.status === "confirmed") continue;
      a.summary_comment = null;
      a.signature = null;
      for (const r of result.rows) delete r.scores[a.id];
    }
  }
  ok(res, { evaluatee: users[0], ...result });
});

// GET /api/reports/committees  ติดตามสถานะการประเมินของกรรมการแต่ละคน
router.get("/committees", requireRole("hr"), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.position, u.department,
            COUNT(a.id) AS total,
            COALESCE(SUM(a.status = 'pending'), 0) AS pending,
            COALESCE(SUM(a.status = 'draft'), 0) AS draft,
            COALESCE(SUM(a.status = 'confirmed'), 0) AS confirmed
     FROM users u LEFT JOIN assignments a ON a.committee_id = u.id
     WHERE u.role = 'committee'
     GROUP BY u.id ORDER BY u.id`
  );
  ok(res, rows);
});

// GET /api/reports/committees/:id  สรุปการประเมินรายกรรมการ (ตัวชี้วัด x ผู้รับประเมิน)
router.get("/committees/:id", requireRole("hr"), async (req, res) => {
  const [users] = await pool.query(
    "SELECT id, full_name, position, department FROM users WHERE id = ? AND role = 'committee'",
    [req.params.id]
  );
  if (!users[0]) return fail(res, 404, "ไม่พบกรรมการ");

  const indicators = await loadIndicators();
  const [assignments] = await pool.query(
    `SELECT a.id, a.evaluatee_id, a.committee_role, a.status, a.summary_comment, a.confirmed_at, e.full_name AS evaluatee_name
     FROM assignments a JOIN users e ON e.id = a.evaluatee_id
     WHERE a.committee_id = ? ORDER BY a.id`,
    [req.params.id]
  );
  const [scores] = await pool.query(
    "SELECT s.assignment_id, s.indicator_id, s.score FROM committee_scores s JOIN assignments a ON a.id = s.assignment_id WHERE a.committee_id = ?",
    [req.params.id]
  );

  const rows = assignments.map((a) => {
    const mine = Object.fromEntries(scores.filter((s) => s.assignment_id === a.id).map((s) => [s.indicator_id, s.score]));
    return { ...a, scores: mine, total: sum(indicators.map((i) => weighted(mine[i.id], i))) };
  });
  ok(res, { committee: users[0], indicators, rows });
});

export default router;
