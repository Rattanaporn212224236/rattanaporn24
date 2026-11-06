// src/routes/notifications.routes.js
// เดิมคือ Mobile/api/src/notifications.routes.js — path เดิม /api/notifications ไม่ชนใคร คงชื่อเดิม
import { Router } from 'express';
import db from '../config/db.js';
import { checkAndSendNotifications } from '../services/notification.service.js';
import { buildImageUrl } from '../utils/eventMapper.js';

const router = Router();

// 🔔 ประวัติการแจ้งเตือนทั้งหมด (บันทึกไว้ทุกครั้งที่ระบบเช็คแล้วเจอกิจกรรมเข้าเงื่อนไข)
// ต้องรัน SQL นี้ก่อนถึงจะใช้ได้:
//   CREATE TABLE notifications (
//     notification_id INT(11) NOT NULL AUTO_INCREMENT,
//     event_id INT(11) DEFAULT NULL,
//     title VARCHAR(255) NOT NULL,
//     body TEXT,
//     sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
//     PRIMARY KEY (notification_id),
//     KEY fk_notifications_event (event_id),
//     CONSTRAINT fk_notifications_event FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
//   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
//
// 🆕 ต้องรัน SQL นี้เพิ่มด้วย เพื่อให้ระบบ "อ่านแล้ว/ยังไม่อ่าน" ทำงานได้
// (จำวันเวลาที่ผู้ใช้แต่ละคนเปิดดูหน้าแจ้งเตือนล่าสุด ไว้เทียบว่ารายการไหนใหม่กว่านั้น = ยังไม่อ่าน):
//   ALTER TABLE app_users ADD COLUMN notifications_seen_at DATETIME DEFAULT NULL;
//
// รองรับ query param ?app_user_id=xx เพื่อคำนวณ is_read ต่อผู้ใช้แต่ละคน
// (ไม่ส่ง app_user_id มาก็ยังใช้ได้ปกติ แค่ is_read จะเป็น true ให้หมดเป็นค่า default)
router.get('/', async (req, res) => {
  try {
    const { app_user_id } = req.query;

    let seenAt = null;
    if (app_user_id) {
      const [userRows] = await db.execute(
        'SELECT notifications_seen_at FROM app_users WHERE app_user_id = ? LIMIT 1',
        [app_user_id]
      );
      if (userRows.length > 0) seenAt = userRows[0].notifications_seen_at;
    }

    // 🖼️ JOIN กับ events เพื่อเอารูปปก + คำอธิบายสั้น ๆ มาโชว์คู่กับการ์ดแจ้งเตือน
    // (ไม่ใช่แค่ title/body ของ notification เฉย ๆ เหมือนเดิม)
    const [rows] = await db.execute(
      `SELECT n.notification_id, n.event_id, n.title, n.body, n.is_date_change, n.sent_at,
        e.event_title, e.event_description,
        (SELECT ei.image_path FROM event_images ei
           WHERE ei.event_id = e.event_id AND ei.is_cover = 1
           LIMIT 1) AS cover_image
      FROM notifications n
      LEFT JOIN events e ON n.event_id = e.event_id
      ORDER BY n.sent_at DESC
      LIMIT 50`
    );

    res.json({
      success: true,
      data: rows.map((row) => ({
        id: row.notification_id,
        event_id: row.event_id,
        title: row.title,
        body: row.body,
        // 🗓️ true = แจ้งเตือนรอบนี้เกิดจากแอดมินแก้ไขวันที่จัดกิจกรรม -> ฝั่งแอปควรโชว์ body
        // (ข้อความ "ปรับเปลี่ยนวันจัดกิจกรรม...") แทนคำอธิบายกิจกรรมปกติ (event_description)
        is_date_change: !!row.is_date_change,
        sent_at: row.sent_at,
        event_title: row.event_title || row.title,
        event_description: row.event_description || '',
        image_url: buildImageUrl(row.cover_image, req),
        // ไม่มี app_user_id ส่งมา -> ถือว่าอ่านแล้วทั้งหมด (ไม่โชว์สถานะใหม่แบบผิด ๆ)
        is_read: app_user_id ? (seenAt ? new Date(row.sent_at) <= new Date(seenAt) : false) : true,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔴 จำนวนแจ้งเตือนที่ "ยังไม่อ่าน" ของผู้ใช้คนนี้ — ไว้โชว์ตัวเลขบนกระดิ่งหน้าแรก
router.get('/unread-count', async (req, res) => {
  try {
    const { app_user_id } = req.query;
    if (!app_user_id) {
      return res.json({ success: true, data: { count: 0 } });
    }

    const [userRows] = await db.execute(
      'SELECT notifications_seen_at FROM app_users WHERE app_user_id = ? LIMIT 1',
      [app_user_id]
    );
    const seenAt = userRows.length > 0 ? userRows[0].notifications_seen_at : null;

    const [countRows] = seenAt
      ? await db.execute('SELECT COUNT(*) AS count FROM notifications WHERE sent_at > ?', [seenAt])
      : await db.execute('SELECT COUNT(*) AS count FROM notifications');

    res.json({ success: true, data: { count: countRows[0].count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 👁️ บันทึกว่าผู้ใช้คนนี้เพิ่งเปิดดูหน้าแจ้งเตือนล่าสุดเมื่อไหร่ (เรียกตอนเข้าหน้า NotificationScreen)
// รายการที่ sent_at ใหม่กว่าเวลานี้ในครั้งถัดไปถึงจะนับว่า "ยังไม่อ่าน"
router.post('/mark-seen', async (req, res) => {
  try {
    const { app_user_id } = req.body;
    if (!app_user_id) {
      return res.status(400).json({ success: false, message: 'ต้องระบุ app_user_id' });
    }

    await db.execute(
      'UPDATE app_users SET notifications_seen_at = NOW() WHERE app_user_id = ?',
      [app_user_id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🧪 ทดสอบ trigger การเช็ค+ส่งแจ้งเตือนได้ทันที โดยไม่ต้องรอรอบเช็คอัตโนมัติ
// ใช้ตอน dev เท่านั้น เช่น เปิด Postman/เบราว์เซอร์ยิง POST ไปที่ /api/notifications/trigger-test
router.post('/trigger-test', async (req, res) => {
  try {
    await checkAndSendNotifications();
    res.json({ success: true, message: 'ทริกเกอร์การแจ้งเตือนแล้ว ดูผลได้ที่ log ของ server' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
