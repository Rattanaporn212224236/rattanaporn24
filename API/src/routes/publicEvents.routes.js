// src/routes/publicEvents.routes.js
// เดิมคือ Mobile/api/src/events.routes.js — mount ที่ /api/events บนเซิร์ฟเวอร์แยกของแอป (พอร์ต 3001)
// ตอนนี้ mount ที่ /api/public-events แทน เพราะ /api/events ถูกฝั่งแอดมินใช้ไปแล้ว (CRUD + ต้อง JWT)
// endpoint นี้อ่านอย่างเดียว ไม่ต้อง login — สำหรับแอป Expo เท่านั้น (logic การ query เหมือนเดิมทุกอย่าง)
import { Router } from 'express';
import db from '../config/db.js';
import { mapEventRow, BASE_SELECT, buildImageUrl } from '../utils/eventMapper.js';

const router = Router();

// 🟢 1. สำหรับดึงกิจกรรมหน้าหลัก
// เดิมกรองด้วย is_published = 1 แต่กิจกรรมส่วนใหญ่ในฐานข้อมูลยังไม่ถูกกด publish
// ทำให้กิจกรรมหายไปจากแอป จึงเปลี่ยนมาซ่อนเฉพาะกิจกรรมที่ถูกยกเลิก (status = 'cancelled') แทน
// รองรับ query param ?dept_id=xx เพื่อกรองเฉพาะกิจกรรมของหน่วยงานนั้น (ใช้ตอนกดเข้าหมวดหมู่/หน่วยงาน)
router.get('/', async (req, res) => {
  try {
    const { dept_id } = req.query;
    let sql = `${BASE_SELECT} WHERE (e.status IS NULL OR e.status <> 'cancelled')`;
    const params = [];

    if (dept_id) {
      sql += ' AND e.dept_id = ?';
      params.push(dept_id);
    }

    sql += ' ORDER BY e.event_date DESC';

    const [rows] = await db.execute(sql, params);
    res.json({ success: true, data: rows.map((r) => mapEventRow(r, req)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🟢 2. สำหรับดึงรายละเอียดกิจกรรมทั้งหมด (รวมที่ยังไม่ publish ไว้ใช้ภายใน)
router.get('/all-details', async (req, res) => {
  try {
    const [rows] = await db.execute(`${BASE_SELECT} ORDER BY e.event_date DESC`);
    res.json({ success: true, data: rows.map((r) => mapEventRow(r, req)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🟢 3. ดึงกิจกรรมทีละรายการ (หน้ารายละเอียดกิจกรรม EventDetailScreen ใช้ตัวนี้)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(`${BASE_SELECT} WHERE e.event_id = ?`, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรมนี้' });
    }

    const event = mapEventRow(rows[0], req);

    // 🖼️ รูปรายละเอียดกิจกรรม (ไม่รวมรูปปก) แอดมินอัปโหลดได้สูงสุด 5 รูป -> ดึงมาแสดงเป็นแกลเลอรีในหน้ารายละเอียด
    const [galleryRows] = await db.execute(
      `SELECT image_path FROM event_images
       WHERE event_id = ? AND (is_cover = 0 OR is_cover IS NULL)
       ORDER BY image_id ASC
       LIMIT 5`,
      [id]
    );
    event.gallery_images = galleryRows
      .map((r) => buildImageUrl(r.image_path, req))
      .filter(Boolean);

    // EventDetailScreen เรียกแบบ axios.get ตรง ๆ (ไม่ได้แกะ .data.data) จึงส่ง object กิจกรรมตรง ๆ
    res.json(event);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🧪 หน้าตรวจสอบเร็ว ๆ ว่ากิจกรรมในฐานข้อมูลมีทั้งหมดกี่รายการ กับกี่รายการที่ผ่านเงื่อนไข publish
// เปิดดูตรง ๆ ในเบราว์เซอร์ได้เลย: http://<ip-เครื่อง>:5000/api/public-events/debug/counts
router.get('/debug/counts', async (req, res) => {
  try {
    const [[{ total }]] = await db.execute('SELECT COUNT(*) AS total FROM events');
    const [[{ published }]] = await db.execute(
      'SELECT COUNT(*) AS published FROM events WHERE is_published = 1'
    );
    const [rows] = await db.execute(
      'SELECT event_id, event_title, is_published, status, event_date, dept_id FROM events ORDER BY event_id'
    );
    res.json({ success: true, total, published, events: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
