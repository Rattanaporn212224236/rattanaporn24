const express = require('express');
const router = express.Router();
const db = require('./db');

// สร้างชื่อสมมติให้ผู้ใช้แบบไม่ระบุตัวตน เช่น KUSE-User-4821
function generateDisplayName() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `KUSE-User-${random}`;
}

// 🟢 ลงทะเบียน/ค้นหาผู้ใช้แบบไม่ต้อง Login โดยอ้างอิงจาก device_token
// ที่แอปสร้างและเก็บไว้ในเครื่อง (AsyncStorage) ครั้งแรกที่เปิดแอป
// ถ้าเจอ device_token เดิม -> คืน app_user_id เดิม (ไม่สร้างไอดีใหม่)
// ถ้าไม่เจอ -> สร้างผู้ใช้ใหม่ในตาราง app_users
router.post('/register', async (req, res) => {
  const { device_token } = req.body;

  if (!device_token || typeof device_token !== 'string') {
    return res.status(400).json({ success: false, message: 'ต้องระบุ device_token' });
  }

  try {
    const [existing] = await db.execute(
      'SELECT app_user_id, device_token, display_name, created_at FROM app_users WHERE device_token = ? LIMIT 1',
      [device_token]
    );

    if (existing.length > 0) {
      return res.json({ success: true, data: existing[0] });
    }

    const displayName = generateDisplayName();
    const [result] = await db.execute(
      'INSERT INTO app_users (device_token, display_name) VALUES (?, ?)',
      [device_token, displayName]
    );

    res.json({
      success: true,
      data: {
        app_user_id: result.insertId,
        device_token,
        display_name: displayName,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🟢 บันทึก/อัปเดต Expo Push Token ของผู้ใช้คนนี้ (เรียกหลังขอสิทธิ์แจ้งเตือนสำเร็จ)
// หมายเหตุ: คนละตัวกับ device_token (ที่ใช้แยกผู้ใช้แบบไม่ต้อง Login)
// ต้องรัน SQL นี้ก่อนถึงจะใช้ได้:
//   ALTER TABLE app_users ADD COLUMN push_token VARCHAR(255) DEFAULT NULL AFTER device_token;
router.put('/:appUserId/push-token', async (req, res) => {
  const { push_token } = req.body;

  if (!push_token || typeof push_token !== 'string') {
    return res.status(400).json({ success: false, message: 'ต้องระบุ push_token' });
  }

  try {
    await db.execute(
      'UPDATE app_users SET push_token = ? WHERE app_user_id = ?',
      [push_token, req.params.appUserId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🟢 ดึงข้อมูลผู้ใช้จาก app_user_id (ใช้เช็คตอนแอปเปิดว่าไอดีที่เก็บไว้ยังใช้ได้อยู่ไหม)
router.get('/:appUserId', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT app_user_id, device_token, display_name, created_at FROM app_users WHERE app_user_id = ? LIMIT 1',
      [req.params.appUserId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้นี้' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
