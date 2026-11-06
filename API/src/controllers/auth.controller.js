// src/controllers/auth.controller.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { JWT_SECRET } from '../middleware/auth.middleware.js';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

function toPublicUser(row) {
  return {
    id: row.user_id,
    username: row.username,
    full_name: row.full_name,
    dept_id: row.dept_id,
    dept_name: row.dept_name || null,
    department: row.department,
    email: row.email,
    role: row.role,
    is_active: !!row.is_active,
  };
}

export async function login(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT u.*, d.dept_name AS dept_name
       FROM users u
       LEFT JOIN departments d ON d.dept_id = u.dept_id
       WHERE u.username = ?
       LIMIT 1`,
      [username.trim()]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบสูงสุด' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const publicUser = toPublicUser(user);

    const token = jwt.sign(
      {
        user_id: publicUser.id,
        username: publicUser.username,
        role: publicUser.role,
        dept_id: publicUser.dept_id,
        full_name: publicUser.full_name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({ success: true, token, user: publicUser });
  } catch (err) {
    console.error('[auth.login]', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ ไม่สามารถเข้าสู่ระบบได้' });
  }
}

export async function me(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT u.*, d.dept_name AS dept_name
       FROM users u
       LEFT JOIN departments d ON d.dept_id = u.dept_id
       WHERE u.user_id = ?
       LIMIT 1`,
      [req.user.user_id]
    );

    const user = rows[0];
    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' });
    }

    return res.json({ success: true, user: toPublicUser(user) });
  } catch (err) {
    console.error('[auth.me]', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน' });
  }
}
