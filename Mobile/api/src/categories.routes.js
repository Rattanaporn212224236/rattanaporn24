const express = require('express');
const router = express.Router();
const db = require('./db');

// หมวดหมู่ในฐานข้อมูลไม่มีคอลัมน์ icon_name เก็บไว้ เลยจับคู่จากชื่อหมวดหมู่แทน
const ICON_BY_NAME = {
  หลักสูตร: 'GraduationCap',
  ภาควิชา: 'Building2',
  ฝ่ายงาน: 'Briefcase',
  สโมสรนิสิต: 'Users',
};

function mapCategoryRow(cat) {
  return {
    id: Number(cat.cat_id),
    name: String(cat.cat_name || ''),
    icon_name: ICON_BY_NAME[cat.cat_name] || 'Users',
    event_count: Number(cat.event_count || 0),
  };
}

function mapDepartmentRow(dept) {
  return {
    id: Number(dept.dept_id),
    name: String(dept.dept_name || ''),
    description: dept.dept_description || '',
    cat_id: dept.cat_id,
    // 🔢 จำนวนกิจกรรมของหน่วยงานนี้ (ไม่นับที่ถูกยกเลิก) ไว้โชว์ในรายการหน่วยงาน
    // ให้ยอดรวมของแต่ละหน่วยงานบวกกันแล้วตรงกับจำนวนกิจกรรมรวมของหมวดหมู่ที่โชว์อยู่หน้าก่อนหน้า
    event_count: Number(dept.event_count || 0),
  };
}

// 🟢 1. ดึงหมวดหมู่หลักทั้งหมด พร้อมนับจำนวนกิจกรรมในแต่ละหมวด (ไม่นับที่ถูกยกเลิก)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT c.cat_id, c.cat_name, COUNT(e.event_id) AS event_count
      FROM categories c
      LEFT JOIN departments d ON d.cat_id = c.cat_id
      LEFT JOIN events e ON e.dept_id = d.dept_id AND (e.status IS NULL OR e.status <> 'cancelled')
      GROUP BY c.cat_id, c.cat_name
      ORDER BY c.cat_id
    `);
    res.json({ success: true, data: rows.map(mapCategoryRow) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. ดึงหน่วยงานย่อย ทั้งหมด พร้อมนับจำนวนกิจกรรมของแต่ละหน่วยงาน (ไม่นับที่ถูกยกเลิก)
router.get('/departments/all', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.*, COUNT(e.event_id) AS event_count
      FROM departments d
      LEFT JOIN events e ON e.dept_id = d.dept_id AND (e.status IS NULL OR e.status <> 'cancelled')
      GROUP BY d.dept_id
    `);
    res.json({ success: true, data: rows.map(mapDepartmentRow) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. ดึงหน่วยงานย่อยตามหมวดหมู่ พร้อมนับจำนวนกิจกรรมของแต่ละหน่วยงาน (ไม่นับที่ถูกยกเลิก)
// เพิ่มเพื่อให้ผู้ใช้เห็นว่ากิจกรรมทั้งหมดของหมวดหมู่นี้ (โชว์ไว้หน้าก่อนหน้า) กระจายอยู่หน่วยงานไหนบ้าง กี่กิจกรรม
router.get('/departments/filter/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  try {
    const [rows] = await db.execute(`
      SELECT d.*, COUNT(e.event_id) AS event_count
      FROM departments d
      LEFT JOIN events e ON e.dept_id = d.dept_id AND (e.status IS NULL OR e.status <> 'cancelled')
      WHERE d.cat_id = ?
      GROUP BY d.dept_id
    `, [categoryId]);
    res.json({ success: true, data: rows.map(mapDepartmentRow) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
