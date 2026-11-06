const express = require('express');
const router = express.Router();
const db = require('./db');
const { mapEventRow, BASE_SELECT } = require('./eventMapper');

// 🟢 1. ดึงรายการกิจกรรมที่ผู้ใช้คนนี้บันทึกไว้ (หน้า "บันทึกกิจกรรม")
router.get('/:appUserId', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `${BASE_SELECT}
       INNER JOIN saved_events s ON s.event_id = e.event_id
       WHERE s.app_user_id = ?
       ORDER BY s.saved_at DESC`,
      [req.params.appUserId]
    );

    res.json({ success: true, data: rows.map((r) => mapEventRow(r, req)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🟢 2. บันทึกกิจกรรม (กดหัวใจ)
router.post('/', async (req, res) => {
  const { app_user_id, event_id } = req.body;

  if (!app_user_id || !event_id) {
    return res.status(400).json({ success: false, message: 'ต้องระบุ app_user_id และ event_id' });
  }

  try {
    const [existing] = await db.execute(
      'SELECT save_id FROM saved_events WHERE app_user_id = ? AND event_id = ? LIMIT 1',
      [app_user_id, event_id]
    );

    if (existing.length > 0) {
      return res.json({ success: true, data: { save_id: existing[0].save_id, already_saved: true } });
    }

    const [result] = await db.execute(
      'INSERT INTO saved_events (app_user_id, event_id) VALUES (?, ?)',
      [app_user_id, event_id]
    );

    res.json({ success: true, data: { save_id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🟢 3. ยกเลิกบันทึกกิจกรรม (กดหัวใจซ้ำเพื่อเอาออก)
router.delete('/:appUserId/:eventId', async (req, res) => {
  try {
    const { appUserId, eventId } = req.params;
    await db.execute(
      'DELETE FROM saved_events WHERE app_user_id = ? AND event_id = ?',
      [appUserId, eventId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
