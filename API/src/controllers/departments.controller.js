// src/controllers/departments.controller.js
// จัดการ "ข้อมูลหลัก" (Master Data) ตามที่มีจริงในฐานข้อมูล kuse_event:
// - categories: หมวดหมู่คงที่ (หลักสูตร/ภาควิชา/ฝ่ายงาน/สโมสรนิสิต) - อ่านอย่างเดียว
// - departments: รายชื่อหลักสูตร/ภาควิชา/หน่วยงาน/สโมสร ภายใต้แต่ละหมวดหมู่ - CRUD เต็มรูปแบบ

import { pool } from '../config/db.js';

export async function listCategories(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY cat_id ASC');
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[departments.listCategories]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลหมวดหมู่ได้' });
  }
}

export async function listDepartments(req, res) {
  try {
    const { cat_id } = req.query;
    const params = [];
    let where = '';
    if (cat_id) {
      where = 'WHERE d.cat_id = ?';
      params.push(cat_id);
    }
    const [rows] = await pool.query(
      `SELECT d.*, c.cat_name AS cat_name
       FROM departments d
       JOIN categories c ON c.cat_id = d.cat_id
       ${where}
       ORDER BY d.cat_id ASC, d.dept_id ASC`,
      params
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[departments.list]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลหน่วยงานได้' });
  }
}

export async function createDepartment(req, res) {
  const { dept_name, dept_description, cat_id } = req.body || {};

  if (!dept_name || !cat_id) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อหน่วยงานและเลือกหมวดหมู่' });
  }

  try {
    const [cat] = await pool.query('SELECT cat_id FROM categories WHERE cat_id = ?', [cat_id]);
    if (cat.length === 0) {
      return res.status(400).json({ success: false, message: 'หมวดหมู่ที่เลือกไม่ถูกต้อง' });
    }

    const [result] = await pool.query(
      'INSERT INTO departments (dept_name, dept_description, cat_id) VALUES (?, ?, ?)',
      [dept_name.trim(), dept_description || null, cat_id]
    );

    const [rows] = await pool.query(
      `SELECT d.*, c.cat_name AS cat_name FROM departments d JOIN categories c ON c.cat_id = d.cat_id WHERE d.dept_id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[departments.create]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถเพิ่มข้อมูลหน่วยงานได้' });
  }
}

export async function updateDepartment(req, res) {
  const { id } = req.params;
  const { dept_name, dept_description, cat_id } = req.body || {};

  try {
    const [existing] = await pool.query('SELECT * FROM departments WHERE dept_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบหน่วยงานนี้ในระบบ' });
    }

    await pool.query(
      `UPDATE departments SET
        dept_name = COALESCE(?, dept_name),
        dept_description = COALESCE(?, dept_description),
        cat_id = COALESCE(?, cat_id)
       WHERE dept_id = ?`,
      [dept_name ?? null, dept_description ?? null, cat_id ?? null, id]
    );

    const [rows] = await pool.query(
      `SELECT d.*, c.cat_name AS cat_name FROM departments d JOIN categories c ON c.cat_id = d.cat_id WHERE d.dept_id = ?`,
      [id]
    );

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[departments.update]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถแก้ไขข้อมูลหน่วยงานได้' });
  }
}

export async function deleteDepartment(req, res) {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM departments WHERE dept_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบหน่วยงานนี้ในระบบ' });
    }
    return res.json({ success: true, message: 'ลบข้อมูลหน่วยงานเรียบร้อยแล้ว' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({
        success: false,
        message: 'ไม่สามารถลบได้ เนื่องจากมีผู้ใช้งานหรือกิจกรรมที่ผูกกับหน่วยงานนี้อยู่',
      });
    }
    console.error('[departments.delete]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถลบข้อมูลหน่วยงานได้' });
  }
}
