-- ระบบประเมินบุคลากร: โครงสร้างฐานข้อมูล
-- รันซ้ำได้ (ลบตารางเดิมก่อน) เรียงลำดับลบจากตารางลูกไปตารางแม่
SET NAMES utf8mb4;

DROP TABLE IF EXISTS committee_scores;
DROP TABLE IF EXISTS evidences;
DROP TABLE IF EXISTS self_evaluations;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS indicators;
DROP TABLE IF EXISTS evaluation_topics;
DROP TABLE IF EXISTS users;

-- ผู้ใช้ทั้ง 3 บทบาท
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  position VARCHAR(100),
  department VARCHAR(100),
  role ENUM('hr', 'evaluatee', 'committee') NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- หัวข้อการประเมิน พร้อมช่วงเปิด-ปิด
CREATE TABLE evaluation_topics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_date >= start_date)
);

-- ตัวชี้วัดในแต่ละหัวข้อ
-- score_type: yes_no = มี/ไม่มี (0/1), scale_4 = สเกล 1-4
-- evidence_type: หลักฐานที่ต้องแนบ none / file (pdf, รูป) / url / any (ไฟล์หรือ url)
CREATE TABLE indicators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  topic_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  weight DECIMAL(5,2) NOT NULL,
  score_type ENUM('yes_no', 'scale_4') NOT NULL,
  evidence_type ENUM('none', 'file', 'url', 'any') NOT NULL DEFAULT 'any',
  evidence_note VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (weight > 0),
  FOREIGN KEY (topic_id) REFERENCES evaluation_topics(id) ON DELETE CASCADE
);

-- มอบหมายกรรมการให้ผู้รับประเมิน (1 แถว = กรรมการ 1 คน ต่อผู้รับประเมิน 1 คน)
-- เก็บผลสรุปของกรรมการไว้ที่นี่ด้วย: สถานะ ความเห็นสรุป ลายเซ็น
-- status: pending = ยังไม่ประเมิน, draft = บันทึกร่าง, confirmed = ยืนยันแล้ว (แก้ไม่ได้)
CREATE TABLE assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  committee_id INT NOT NULL,
  evaluatee_id INT NOT NULL,
  committee_role ENUM('chair', 'member') NOT NULL DEFAULT 'member',
  status ENUM('pending', 'draft', 'confirmed') NOT NULL DEFAULT 'pending',
  summary_comment TEXT,
  signature MEDIUMTEXT,
  confirmed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (committee_id, evaluatee_id),
  FOREIGN KEY (committee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluatee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- คะแนนประเมินตนเอง (ผู้รับประเมิน 1 คน ต่อตัวชี้วัด 1 ตัว = 1 แถว)
CREATE TABLE self_evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evaluatee_id INT NOT NULL,
  indicator_id INT NOT NULL,
  score TINYINT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (evaluatee_id, indicator_id),
  CHECK (score BETWEEN 0 AND 4),
  FOREIGN KEY (evaluatee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (indicator_id) REFERENCES indicators(id) ON DELETE CASCADE
);

-- รายละเอียดประกอบ/หลักฐาน (หลายรายการต่อการประเมินตนเอง 1 แถว)
-- แต่ละรายการมีคำอธิบาย และแนบไฟล์หรือ url ได้
CREATE TABLE evidences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  self_evaluation_id INT NOT NULL,
  description TEXT NOT NULL,
  file_path VARCHAR(255),
  file_name VARCHAR(255),
  url VARCHAR(500),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (self_evaluation_id) REFERENCES self_evaluations(id) ON DELETE CASCADE
);

-- คะแนนที่กรรมการให้ในแต่ละตัวชี้วัด
CREATE TABLE committee_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  indicator_id INT NOT NULL,
  score TINYINT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (assignment_id, indicator_id),
  CHECK (score BETWEEN 0 AND 4),
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (indicator_id) REFERENCES indicators(id) ON DELETE CASCADE
);
