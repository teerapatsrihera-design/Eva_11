-- ข้อมูลตัวอย่าง (รันหลัง schema.sql)
-- รหัสผ่านทุกบัญชีคือ 123456 (hash ด้วย crypto.scrypt จาก utils/password.js)
SET NAMES utf8mb4;
SET @pw = '7a598e831d2b0a43997106229036312b:7b99abc140ad74327135f9d0478b5319cb966d37f015005bd9bdac3b7e0fcd99d6bdc9ec7c3c2e894924fc320198660505f641fe7f44ff5eff8ef5269d923075';

-- hr 1, กรรมการ 3, ผู้รับประเมิน 5 (hr ไม่ต้องเปลี่ยนรหัสผ่าน คนอื่นต้องเปลี่ยนตอนเข้าครั้งแรก)
INSERT INTO users (id, username, password_hash, full_name, email, phone, position, department, role, must_change_password) VALUES
(1, 'hr',     @pw, 'สมศรี ใจดี',     'hr@school.ac.th',     '0810000001', 'เจ้าหน้าที่งานบุคลากร', 'งานบุคลากร',       'hr',        FALSE),
(2, 'comm1',  @pw, 'ประเสริฐ วงศ์ดี', 'comm1@school.ac.th',  '0810000002', 'รองผู้อำนวยการ',       'ฝ่ายวิชาการ',      'committee', TRUE),
(3, 'comm2',  @pw, 'วิไล สายทอง',    'comm2@school.ac.th',  '0810000003', 'หัวหน้าแผนก',          'แผนกเทคโนโลยีสารสนเทศ', 'committee', TRUE),
(4, 'comm3',  @pw, 'ชัยวัฒน์ แก้วมา', 'comm3@school.ac.th',  '0810000004', 'ครูชำนาญการพิเศษ',     'แผนกคอมพิวเตอร์ธุรกิจ', 'committee', TRUE),
(5, 'teach1', @pw, 'สมชาย รักเรียน',  'teach1@school.ac.th', '0810000005', 'ครู',                  'แผนกเทคโนโลยีสารสนเทศ', 'evaluatee', TRUE),
(6, 'teach2', @pw, 'มาลี ศรีสุข',     'teach2@school.ac.th', '0810000006', 'ครู',                  'แผนกเทคโนโลยีสารสนเทศ', 'evaluatee', TRUE),
(7, 'teach3', @pw, 'อนันต์ มั่นคง',   'teach3@school.ac.th', '0810000007', 'ครูผู้ช่วย',            'แผนกคอมพิวเตอร์ธุรกิจ', 'evaluatee', TRUE),
(8, 'teach4', @pw, 'กมลา ทองดี',     'teach4@school.ac.th', '0810000008', 'ครู',                  'แผนกการบัญชี',      'evaluatee', TRUE),
(9, 'teach5', @pw, 'ธนพล บุญมี',     'teach5@school.ac.th', '0810000009', 'ครูผู้ช่วย',            'แผนกการตลาด',       'evaluatee', TRUE);

-- 2 หัวข้อ
INSERT INTO evaluation_topics (id, title, description, start_date, end_date) VALUES
(1, 'ด้านการจัดการเรียนการสอน', 'ประเมินการวางแผนและการจัดการเรียนรู้', '2026-11-01', '2026-12-31'),
(2, 'ด้านคุณลักษณะและการพัฒนาตนเอง', 'ประเมินวินัย การพัฒนาตนเอง และการมีส่วนร่วม', '2026-11-01', '2026-12-31');

-- ตัวชี้วัดทั้งสองแบบ (น้ำหนักรวม 100)
INSERT INTO indicators (id, topic_id, name, description, weight, score_type, evidence_type, evidence_note) VALUES
(1, 1, 'การจัดทำแผนการจัดการเรียนรู้', 'มีแผนการจัดการเรียนรู้ครบทุกรายวิชาที่สอน', 20, 'scale_4', 'file', 'ไฟล์ PDF แผนการจัดการเรียนรู้'),
(2, 1, 'การใช้สื่อและเทคโนโลยีในการสอน', 'ใช้สื่อดิจิทัลหรือแพลตฟอร์มออนไลน์ประกอบการสอน', 15, 'scale_4', 'any', 'ภาพกิจกรรม หรือ URL สื่อการสอน'),
(3, 1, 'การทำวิจัยในชั้นเรียน', 'มีงานวิจัยในชั้นเรียนอย่างน้อย 1 เรื่องต่อปีการศึกษา', 15, 'yes_no', 'file', 'ไฟล์ PDF รายงานวิจัย'),
(4, 2, 'การเข้ารับการอบรมพัฒนาตนเอง', 'เข้ารับการอบรมอย่างน้อย 20 ชั่วโมงต่อปี', 10, 'yes_no', 'any', 'เกียรติบัตร หรือ URL หลักฐานการอบรม'),
(5, 2, 'การปฏิบัติตามระเบียบวินัย', 'มาปฏิบัติงานตรงเวลาและปฏิบัติตามระเบียบของสถานศึกษา', 20, 'scale_4', 'none', NULL),
(6, 2, 'การมีส่วนร่วมในกิจกรรมสถานศึกษา', 'เข้าร่วมกิจกรรมของสถานศึกษาและชุมชน', 20, 'scale_4', 'url', 'URL ภาพกิจกรรม');

-- มอบหมายกรรมการ (ประธาน 1 คน ต่อผู้รับประเมิน)
INSERT INTO assignments (id, committee_id, evaluatee_id, committee_role, status, summary_comment, signature, confirmed_at) VALUES
(1, 2, 5, 'chair',  'confirmed', 'ปฏิบัติงานได้ดี มีหลักฐานครบถ้วน', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', '2026-11-05 10:00:00'),
(2, 3, 5, 'member', 'draft',     'ควรเพิ่มหลักฐานด้านสื่อการสอน', NULL, NULL),
(3, 4, 5, 'member', 'pending',   NULL, NULL, NULL),
(4, 2, 6, 'chair',  'pending',   NULL, NULL, NULL),
(5, 3, 6, 'member', 'pending',   NULL, NULL, NULL),
(6, 4, 6, 'member', 'pending',   NULL, NULL, NULL),
(7, 2, 7, 'chair',  'pending',   NULL, NULL, NULL),
(8, 3, 7, 'member', 'pending',   NULL, NULL, NULL),
(9, 4, 7, 'member', 'pending',   NULL, NULL, NULL),
(10, 3, 8, 'chair', 'pending',   NULL, NULL, NULL),
(11, 4, 8, 'member','pending',   NULL, NULL, NULL),
(12, 4, 9, 'chair', 'pending',   NULL, NULL, NULL),
(13, 2, 9, 'member','pending',   NULL, NULL, NULL);

-- ประเมินตนเอง: teach1 ครบ 6 ตัว (100%), teach2 ทำ 3 ตัว แต่ครบ 2 ตัว (33.33% เพราะตัวที่ 3 ยังไม่แนบไฟล์), คนอื่นยังไม่ทำ
INSERT INTO self_evaluations (id, evaluatee_id, indicator_id, score) VALUES
(1, 5, 1, 4), (2, 5, 2, 3), (3, 5, 3, 1), (4, 5, 4, 1), (5, 5, 5, 4), (6, 5, 6, 3),
(7, 6, 1, 3), (8, 6, 3, 0), (9, 6, 5, 3);

-- รายละเอียดประกอบ/หลักฐาน (ตัวชี้วัดที่ 2 ของ teach1 มี 2 รายการ)
INSERT INTO evidences (self_evaluation_id, description, url) VALUES
(1, 'แผนการจัดการเรียนรู้วิชาการเขียนโปรแกรมเว็บ', 'https://example.com/plan-web.pdf'),
(2, 'ใช้ Google Classroom ในทุกรายวิชา', 'https://classroom.google.com'),
(2, 'ผลิตคลิปสอนบน YouTube 10 คลิป', 'https://youtube.com'),
(3, 'วิจัยเรื่องการพัฒนาทักษะการเขียนโปรแกรมด้วย Pair Programming', 'https://example.com/research.pdf'),
(4, 'อบรมหลักสูตร Full-stack Developer 30 ชั่วโมง', 'https://example.com/cert.pdf'),
(6, 'ร่วมกิจกรรมจิตอาสาพัฒนาชุมชน', 'https://example.com/activity'),
(7, 'แผนการจัดการเรียนรู้วิชาฐานข้อมูล', 'https://example.com/plan-db.pdf');

-- คะแนนกรรมการ: comm1 ยืนยันครบ, comm2 ร่างไว้บางส่วน
INSERT INTO committee_scores (assignment_id, indicator_id, score) VALUES
(1, 1, 4), (1, 2, 3), (1, 3, 1), (1, 4, 1), (1, 5, 4), (1, 6, 3),
(2, 1, 3), (2, 2, 2);
