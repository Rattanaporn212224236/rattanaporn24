// src/config/bootstrapData.js
// รันครั้งเดียวตอนเซิร์ฟเวอร์เริ่มทำงาน เพื่อ "ซ่อม" ข้อมูลเก่าที่มากับไฟล์ kuse_event.sql
// ให้ใช้งานกับระบบใหม่ได้จริง โดยไม่ต้องให้ผู้ใช้ไปรันสคริปต์ SQL เองแยกต่างหาก
//
// 1) รหัสผ่านผู้ใช้เดิมในตาราง users ถูกเก็บเป็น plain text (เช่น '123456')
//    -> แปลงเป็น bcrypt hash ให้อัตโนมัติ (ทำครั้งเดียว ตรวจสอบด้วย prefix ของ bcrypt hash '$2')
// 2) แถวในตาราง events บางแถวมีค่า status เป็นค่าว่าง '' ซึ่งไม่ตรงกับ ENUM('pending','published','cancelled')
//    -> เติมค่าที่ถูกต้องให้จาก is_published (1 = published, 0 = pending)

import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const BCRYPT_PREFIX = '$2';
const SALT_ROUNDS = 10;

async function hashLegacyPasswords() {
  const [rows] = await pool.query(
    'SELECT user_id, password FROM users WHERE password NOT LIKE ?',
    [`${BCRYPT_PREFIX}%`]
  );

  if (rows.length === 0) return 0;

  for (const row of rows) {
    const hashed = await bcrypt.hash(row.password, SALT_ROUNDS);
    await pool.query('UPDATE users SET password = ? WHERE user_id = ?', [hashed, row.user_id]);
  }

  return rows.length;
}

async function fixInvalidEventStatus() {
  const [result] = await pool.query(
    `UPDATE events
     SET status = CASE WHEN is_published = 1 THEN 'published' ELSE 'pending' END
     WHERE status IS NULL OR status = ''`
  );
  return result.affectedRows || 0;
}

// ระบบนี้ไม่มีขั้นตอนให้ super_admin อนุมัติกิจกรรมก่อนเผยแพร่ (แอดมินเพิ่มกิจกรรม = เผยแพร่ทันที)
// แต่ข้อมูลเก่าบางส่วนอาจยังค้างสถานะ 'pending' อยู่จากตอนที่ระบบยังมีขั้นตอนรออนุมัติ
// -> เลื่อนกิจกรรมที่ค้างสถานะ pending ทั้งหมดให้เป็น published ให้ตรงกับพฤติกรรมจริงของระบบปัจจุบัน (ทำครั้งเดียว ปลอดภัย)
async function publishPendingEvents() {
  const [result] = await pool.query(
    `UPDATE events SET status = 'published', is_published = 1 WHERE status = 'pending'`
  );
  return result.affectedRows || 0;
}

// ภาควิชา (cat_id=2) กับหลักสูตร (cat_id=1) บางคู่จริง ๆ แล้วเป็นหน่วยงานเดียวกัน แค่ใช้ชื่อคนละชื่อ
// (เช่น "ภาควิชาวิศวกรรมไฟฟ้าและคอมพิวเตอร์" ดูแลทั้ง "หลักสูตรวิศวกรรมไฟฟ้า" และ "หลักสูตรวิศวกรรมคอมพิวเตอร์")
// เดิมระบบไม่มีความเชื่อมโยงนี้เลย ทำให้กิจกรรมที่โพสต์ผ่านภาควิชาหนึ่ง ไม่ถูกนับรวมเวลาดูย้อนหลังผ่านหลักสูตรที่เชื่อมกัน
// ตารางนี้เก็บคู่ความสัมพันธ์ไว้ (ยืนยันรายชื่อจริงกับผู้ดูแลระบบแล้ว) ให้ query ฝั่งกิจกรรมเอาไปขยายผลการค้นหาได้
async function ensureDepartmentLinksTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS department_links (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dept_id INT NOT NULL,
      related_dept_id INT NOT NULL,
      UNIQUE KEY uniq_department_link (dept_id, related_dept_id),
      FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE CASCADE,
      FOREIGN KEY (related_dept_id) REFERENCES departments(dept_id) ON DELETE CASCADE
    )
  `);
}

// จับคู่ภาควิชา -> หลักสูตรที่ภาควิชานั้นดูแล (ยืนยันรายชื่อจริงกับผู้ดูแลระบบแล้ว 18 ส.ค. 2569)
// ใช้ INSERT IGNORE + จับคู่ด้วยชื่อ (ไม่ใช่ id ตายตัว) เพื่อความปลอดภัยหากรันซ้ำหรือ id ต่างไปในแต่ละเครื่อง
const DEPARTMENT_LINK_PAIRS = [
  ['ภาควิชาวิศวกรรมเครื่องกลและการผลิต', ['หลักสูตรวิศวกรรมเครื่องกลและการผลิต', 'หลักสูตรวิศวกรรมอุตสาหการ']],
  ['ภาควิชาวิศวกรรมไฟฟ้าและคอมพิวเตอร์', ['หลักสูตรวิศวกรรมไฟฟ้า', 'หลักสูตรวิศวกรรมคอมพิวเตอร์']],
  ['ภาควิชาวิศวกรรมโยธาและสิ่งแวดล้อม', ['หลักสูตรวิศวกรรมโยธา', 'หลักสูตรวิศวกรรมสิ่งแวดล้อม']],
  ['ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ', ['หลักสูตรวิทยาการคอมพิวเตอร์']],
  ['ภาควิชาวิทยาศาสตร์ทั่วไป', ['หลักสูตรเคมีประยุกต์']],
];

async function seedDepartmentLinks() {
  let inserted = 0;
  for (const [deptName, courseNames] of DEPARTMENT_LINK_PAIRS) {
    for (const courseName of courseNames) {
      const [result] = await pool.query(
        `INSERT IGNORE INTO department_links (dept_id, related_dept_id)
         SELECT d.dept_id, c.dept_id
         FROM departments d, departments c
         WHERE d.dept_name = ? AND c.dept_name LIKE ?
         LIMIT 1`,
        [deptName, `${courseName}%`]
      );
      inserted += result.affectedRows || 0;
    }
  }
  return inserted;
}

// วิว (VIEW) ช่วยย่อ logic การขยายผล dept_id ให้เหลือ query เดียว ใครก็ตามที่อ่านฐานข้อมูลนี้
// (ทั้งเว็บแอดมินตัวนี้ และเซิร์ฟเวอร์แอปมือถือที่แยกกันคนละระบบ) ก็ใช้ query เดียวกันได้เลย ไม่ต้องเขียน UNION เอง
// สำหรับ dept_id ใด ๆ จะได้ตัวเองกลับมาด้วยเสมอ (แถวที่ dept_id = linked_dept_id) บวกกับหน่วยงานที่เชื่อมกันทุกทิศทาง
// อัปเดตอัตโนมัติทันทีที่ตาราง department_links เปลี่ยน เพราะเป็น VIEW ไม่ใช่ตารางที่ต้อง sync ข้อมูลเอง
async function ensureDepartmentLinkClosureView() {
  await pool.query(`
    CREATE OR REPLACE VIEW department_link_closure AS
    SELECT dept_id, dept_id AS linked_dept_id FROM departments
    UNION
    SELECT dept_id, related_dept_id AS linked_dept_id FROM department_links
    UNION
    SELECT related_dept_id AS dept_id, dept_id AS linked_dept_id FROM department_links
  `);
}

// ข้อมูลตัวอย่างในไฟล์ kuse_event.sql ใส่ปี พ.ศ. ตรง ๆ ลงในคอลัมน์ DATE (เช่น '2569-05-24')
// ซึ่ง MySQL จะเก็บเป็นปี ค.ศ. 2569 จริง ๆ (ไม่ได้แปลงให้อัตโนมัติ) ทำให้กิจกรรมทั้งหมดดูเหมือนอยู่ใน
// อนาคตอีก 543 ปี และคำนวณสถานะ กำลังจะจัด/กำลังดำเนินการ/เสร็จสิ้น เทียบกับวันที่ปัจจุบันไม่ได้เลย
// -> ปรับปีที่มากผิดปกติ (> 2200) ให้เป็น ค.ศ. จริงโดยลบ 543 ปี ทำครั้งเดียวและปลอดภัย (idempotent)
async function fixBuddhistEraYears() {
  const [r1] = await pool.query(
    `UPDATE events SET event_date = DATE_SUB(event_date, INTERVAL 543 YEAR) WHERE YEAR(event_date) > 2200`
  );
  const [r2] = await pool.query(
    `UPDATE events SET end_date = DATE_SUB(end_date, INTERVAL 543 YEAR) WHERE end_date IS NOT NULL AND YEAR(end_date) > 2200`
  );
  return (r1.affectedRows || 0) + (r2.affectedRows || 0);
}

// บางกิจกรรมต้องการให้ผู้สนใจ "ลงทะเบียน" ล่วงหน้า (เช่น รับสมัครสตาฟ จำกัดจำนวนคน) ต่างจากกิจกรรม
// แบบเชิญชวนทั่วไปที่กดเข้ามาอ่านรายละเอียดอย่างเดียวก็พอ ระบบนี้ไม่ได้สร้างฟอร์มลงทะเบียน/ระบบนับจำนวนผู้สมัครเอง
// (จะทำให้ขอบเขตงานบวมเกินจำเป็น) แต่ให้แอดมินแปะ "ลิงก์ลงทะเบียนภายนอก" (เช่น Google Form, Line) แทน
// ถ้าช่องนี้ว่าง ถือว่าเป็นกิจกรรมแบบเชิญชวนอย่างเดียว ไม่ต้องลงทะเบียน
async function ensureRegistrationLinkColumn() {
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'events' AND COLUMN_NAME = 'registration_link'`
  );
  if (cols.length === 0) {
    await pool.query(`ALTER TABLE events ADD COLUMN registration_link VARCHAR(500) NULL AFTER responsibilities`);
  }
}

// 🔔 ระบบแจ้งเตือน push (notification.service.js / notifications.routes.js) พึ่งตาราง/คอลัมน์เหล่านี้
// เดิมต้องให้ผู้ดูแลระบบไปรัน SQL เองแยกต่างหาก (ดูคอมเมนต์ในไฟล์นั้น) ซึ่งพลาดง่ายมาก — ถ้าตาราง/คอลัมน์
// ไม่ครบ ทุก query ในระบบแจ้งเตือนจะ throw error เงียบ ๆ (ถูกจับด้วย try/catch) ทำให้ไม่มีการแจ้งเตือนเกิดขึ้น
// เลยสักครั้งโดยไม่มีใครรู้สาเหตุ ย้ายมาสร้างอัตโนมัติตรงนี้แทน ให้ชัวร์ว่าพร้อมใช้งานเสมอไม่ว่าจะรันที่เครื่องไหน
async function ensureNotificationsInfra() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      notification_id INT(11) NOT NULL AUTO_INCREMENT,
      event_id INT(11) DEFAULT NULL,
      title VARCHAR(255) NOT NULL,
      body TEXT,
      notified_for_date DATE DEFAULT NULL,
      is_date_change TINYINT(1) NOT NULL DEFAULT 0,
      sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (notification_id),
      KEY fk_notifications_event (event_id),
      CONSTRAINT fk_notifications_event FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  // ตารางอาจถูกสร้างไว้ก่อนหน้านี้แล้วโดยไม่มีคอลัมน์ notified_for_date (เวอร์ชันเก่า) -> เติมให้ครบ
  const [notifCols] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'notified_for_date'`
  );
  if (notifCols.length === 0) {
    await pool.query(`ALTER TABLE notifications ADD COLUMN notified_for_date DATE DEFAULT NULL AFTER body`);
  }

  // 🗓️ ธงบอกว่าแจ้งเตือนรอบนี้เกิดจากการ "แก้ไขวันที่จัดกิจกรรม" (ไม่ใช่กิจกรรมใหม่/นับถอยหลังปกติ)
  // ใช้ตัดสินใจฝั่งแอปมือถือว่าจะโชว์ข้อความ "ปรับเปลี่ยนวันจัดกิจกรรมจากวันที่ ... เป็นวันที่ ..." แทนคำอธิบายกิจกรรมปกติหรือไม่
  const [dateChangeCols] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'is_date_change'`
  );
  if (dateChangeCols.length === 0) {
    await pool.query(`ALTER TABLE notifications ADD COLUMN is_date_change TINYINT(1) NOT NULL DEFAULT 0 AFTER notified_for_date`);
  }

  const [appUserCols] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'app_users'`
  );
  const appUserColNames = appUserCols.map((c) => c.COLUMN_NAME);
  if (!appUserColNames.includes('push_token')) {
    await pool.query(`ALTER TABLE app_users ADD COLUMN push_token VARCHAR(255) DEFAULT NULL`);
  }
  if (!appUserColNames.includes('notifications_seen_at')) {
    await pool.query(`ALTER TABLE app_users ADD COLUMN notifications_seen_at DATETIME DEFAULT NULL`);
  }
}

// 🗓️ เก็บวันที่จัดกิจกรรม "ก่อนแก้ไขล่าสุด" ไว้ ใช้โชว์ป้ายแจ้งในหน้ารายละเอียดกิจกรรมฝั่งแอปมือถือว่า
// "วันที่จัดกิจกรรมถูกเปลี่ยนจากวันที่ ... เป็นวันที่ ..." ทุกครั้งที่แอดมินแก้ไขวันที่จริง ๆ (ดู events.controller.js)
async function ensurePreviousEventDateColumn() {
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'events' AND COLUMN_NAME = 'previous_event_date'`
  );
  if (cols.length === 0) {
    await pool.query(`ALTER TABLE events ADD COLUMN previous_event_date DATE NULL AFTER event_date`);
  }
}

export async function runStartupDataFixes() {
  const fixedPasswords = await hashLegacyPasswords();
  const fixedStatuses = await fixInvalidEventStatus();
  const fixedYears = await fixBuddhistEraYears();
  const publishedPending = await publishPendingEvents();
  await ensureDepartmentLinksTable();
  const linkedDepartments = await seedDepartmentLinks();
  await ensureDepartmentLinkClosureView();
  await ensureRegistrationLinkColumn();
  await ensureNotificationsInfra();
  await ensurePreviousEventDateColumn();

  if (fixedPasswords > 0) {
    console.log(`[bootstrap] แปลงรหัสผ่านแบบ plain text เป็น bcrypt hash แล้ว ${fixedPasswords} บัญชี`);
  }
  if (fixedStatuses > 0) {
    console.log(`[bootstrap] ซ่อมค่าสถานะกิจกรรมที่ไม่ถูกต้องแล้ว ${fixedStatuses} รายการ`);
  }
  if (fixedYears > 0) {
    console.log(`[bootstrap] ปรับปี พ.ศ. ที่หลงเข้ามาในคอลัมน์วันที่ (DATE) ให้เป็น ค.ศ. แล้ว ${fixedYears} แถว`);
  }
  if (publishedPending > 0) {
    console.log(`[bootstrap] เผยแพร่กิจกรรมที่ค้างสถานะรออนุมัติแล้ว ${publishedPending} รายการ (ระบบนี้ไม่มีขั้นตอนรออนุมัติ)`);
  }
  if (linkedDepartments > 0) {
    console.log(`[bootstrap] เชื่อมโยงภาควิชา-หลักสูตรที่เป็นหน่วยงานเดียวกันแล้ว ${linkedDepartments} คู่`);
  }
}
