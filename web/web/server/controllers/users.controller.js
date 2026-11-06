// server/controllers/users.controller.js
// จัดการบัญชีผู้ดูแลระบบ (users table) - เฉพาะ Super Admin เท่านั้นที่จัดการบัญชีคนอื่นได้
// ผู้ใช้ทุกคนแก้ไขข้อมูลของตัวเอง (อีเมล/รหัสผ่าน) ได้ผ่าน /me endpoints

import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

const SALT_ROUNDS = 10;

function toPublicUser(row) {
  return {
    id: row.user_id,
    username: row.username,
    full_name: row.full_name,
    dept_id: row.dept_id,
    dept_name: row.dept_name || null,
    email: row.email,
    role: row.role,
    is_active: !!row.is_active,
    created_at: row.created_at,
    // จำนวนกิจกรรมที่บัญชีนี้เป็นผู้สร้างไว้ในระบบ — ใช้ฝั่ง frontend เพื่อเตือนซุปเปอร์แอดมิน
    // ก่อนกดลบว่าบัญชีนี้มีกิจกรรมผูกอยู่ และแนะนำให้ระงับสิทธิ์แทนการลบ (ลบไม่ได้จริงอยู่แล้วฝั่ง backend)
    event_count: Number(row.event_count || 0),
  };
}

export async function listUsers(req, res) {
  try {
    const search = (req.query.q || '').trim();
    const params = [];
    let where = '';
    if (search) {
      where = `WHERE u.full_name LIKE ? OR u.username LIKE ? OR d.dept_name LIKE ?`;
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    // เรียงให้เป็นระเบียบ ไม่กระจัดกระจาย: Super Admin (ส่วนกลาง) ขึ้นก่อน จากนั้นจัดกลุ่มตามหมวดหมู่
    // (หลักสูตร/ภาควิชา/ฝ่ายงาน/สโมสรนิสิต ผ่าน cat_id) แล้วเรียงตามรหัสหน่วยงาน และชื่อภายในกลุ่มเดียวกัน
    const [rows] = await pool.query(
      `SELECT u.*, d.dept_name AS dept_name,
        (SELECT COUNT(*) FROM events e WHERE e.created_by = u.user_id) AS event_count
       FROM users u
       LEFT JOIN departments d ON d.dept_id = u.dept_id
       ${where}
       ORDER BY (u.dept_id IS NULL) DESC, d.cat_id ASC, u.dept_id ASC, u.full_name ASC`,
      params
    );

    return res.json({ success: true, data: rows.map(toPublicUser) });
  } catch (err) {
    console.error('[users.list]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลผู้ใช้งานได้' });
  }
}

export async function createUser(req, res) {
  const { username, password, full_name, dept_id, email, role } = req.body || {};

  if (!username || !password || !full_name || !role) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน (username, password, full_name, role)' });
  }
  if (!['admin', 'super_admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'ระดับสิทธิ์ (role) ไม่ถูกต้อง' });
  }
  if (role === 'admin' && !dept_id) {
    return res.status(400).json({ success: false, message: 'กรุณาเลือกหน่วยงานสำหรับแอดมินระดับหน่วยงาน' });
  }

  try {
    const [existing] = await pool.query('SELECT user_id FROM users WHERE username = ?', [username.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'มีชื่อผู้ใช้งานนี้อยู่แล้วในระบบ' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query(
      `INSERT INTO users (username, password, full_name, dept_id, email, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [username.trim(), hashed, full_name.trim(), role === 'admin' ? dept_id : null, email || null, role]
    );

    const [rows] = await pool.query(
      `SELECT u.*, d.dept_name AS dept_name FROM users u LEFT JOIN departments d ON d.dept_id = u.dept_id WHERE u.user_id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, data: toPublicUser(rows[0]) });
  } catch (err) {
    console.error('[users.create]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถสร้างบัญชีผู้ใช้งานได้' });
  }
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const { full_name, dept_id, email, role, is_active } = req.body || {};

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบบัญชีผู้ใช้งานนี้' });
    }
    const target = rows[0];

    // ป้องกันไม่ให้ปลด/ระงับสิทธิ์ super_admin คนสุดท้ายของระบบ
    if (target.role === 'super_admin' && (role === 'admin' || is_active === false)) {
      const [[{ count }]] = await pool.query(
        `SELECT COUNT(*) AS count FROM users WHERE role = 'super_admin' AND is_active = 1`
      );
      if (count <= 1) {
        return res.status(400).json({ success: false, message: 'ไม่สามารถระงับ/ลดสิทธิ์ Super Admin คนสุดท้ายของระบบได้' });
      }
    }

    await pool.query(
      `UPDATE users SET
        full_name = COALESCE(?, full_name),
        dept_id = ?,
        email = COALESCE(?, email),
        role = COALESCE(?, role),
        is_active = COALESCE(?, is_active)
       WHERE user_id = ?`,
      [
        full_name ?? null,
        role === 'super_admin' ? null : (dept_id ?? target.dept_id),
        email ?? null,
        role ?? null,
        typeof is_active === 'boolean' ? (is_active ? 1 : 0) : null,
        id,
      ]
    );

    const [updated] = await pool.query(
      `SELECT u.*, d.dept_name AS dept_name FROM users u LEFT JOIN departments d ON d.dept_id = u.dept_id WHERE u.user_id = ?`,
      [id]
    );

    return res.json({ success: true, data: toPublicUser(updated[0]) });
  } catch (err) {
    console.error('[users.update]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถอัปเดตข้อมูลผู้ใช้งานได้' });
  }
}

export async function deleteUser(req, res) {
  const { id } = req.params;

  if (Number(id) === req.user.user_id) {
    return res.status(400).json({ success: false, message: 'ไม่สามารถลบบัญชีของตัวเองได้' });
  }

  try {
    const [rows] = await pool.query('SELECT role FROM users WHERE user_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบบัญชีผู้ใช้งานนี้' });
    }

    if (rows[0].role === 'super_admin') {
      const [[{ count }]] = await pool.query(`SELECT COUNT(*) AS count FROM users WHERE role = 'super_admin'`);
      if (count <= 1) {
        return res.status(400).json({ success: false, message: 'ไม่สามารถลบ Super Admin คนสุดท้ายของระบบได้' });
      }
    }

    await pool.query('DELETE FROM users WHERE user_id = ?', [id]);
    return res.json({ success: true, message: 'ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({
        success: false,
        message: 'ไม่สามารถลบได้ เนื่องจากบัญชีนี้เป็นผู้สร้างกิจกรรมอยู่ในระบบ กรุณาระงับสิทธิ์แทนการลบ',
      });
    }
    console.error('[users.delete]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถลบบัญชีผู้ใช้งานได้' });
  }
}

// Super Admin สั่งรีเซ็ตรหัสผ่านให้แอดมินคนอื่น (ไม่ต้องรู้รหัสผ่านเดิม)
export async function resetPassword(req, res) {
  const { id } = req.params;
  const { new_password } = req.body || {};

  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ success: false, message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
  }

  try {
    const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
    const [result] = await pool.query('UPDATE users SET password = ? WHERE user_id = ?', [hashed, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบบัญชีผู้ใช้งานนี้' });
    }
    return res.json({ success: true, message: 'รีเซ็ตรหัสผ่านเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('[users.resetPassword]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถรีเซ็ตรหัสผ่านได้' });
  }
}

// ---------- ผู้ใช้ปัจจุบันจัดการข้อมูลของตัวเอง ----------

export async function updateMe(req, res) {
  const { email } = req.body || {};
  try {
    await pool.query('UPDATE users SET email = COALESCE(?, email) WHERE user_id = ?', [email ?? null, req.user.user_id]);
    const [rows] = await pool.query(
      `SELECT u.*, d.dept_name AS dept_name FROM users u LEFT JOIN departments d ON d.dept_id = u.dept_id WHERE u.user_id = ?`,
      [req.user.user_id]
    );
    return res.json({ success: true, data: toPublicUser(rows[0]) });
  } catch (err) {
    console.error('[users.updateMe]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถอัปเดตข้อมูลบัญชีได้' });
  }
}

export async function changeMyPassword(req, res) {
  const { current_password, new_password } = req.body || {};

  if (!current_password || !new_password) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ success: false, message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
  }

  try {
    const [rows] = await pool.query('SELECT password FROM users WHERE user_id = ?', [req.user.user_id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบบัญชีผู้ใช้งาน' });
    }

    const matches = await bcrypt.compare(current_password, rows[0].password);
    if (!matches) {
      return res.status(401).json({ success: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }

    const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
    await pool.query('UPDATE users SET password = ? WHERE user_id = ?', [hashed, req.user.user_id]);

    return res.json({ success: true, message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('[users.changeMyPassword]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถเปลี่ยนรหัสผ่านได้' });
  }
}
