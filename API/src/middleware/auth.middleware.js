// src/middleware/auth.middleware.js
// ใช้กับ route ฝั่งแอดมินเท่านั้น (auth/users/departments/events) — ฝั่งแอป Expo (app-users/public-events/
// categories/saved-events/notifications) ไม่ต้อง login จึงไม่ผ่าน middleware นี้
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'kuse-dev-secret-change-me';

/**
 * ตรวจสอบ JWT token จาก header Authorization: Bearer <token>
 * ถ้าถูกต้อง จะแนบข้อมูลผู้ใช้ (req.user) ไว้ให้ route ถัดไปใช้งาน
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { user_id, username, role, dept_id, full_name }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
  }
}

/**
 * จำกัดสิทธิ์การเข้าถึงตาม role เช่น requireRole('super_admin')
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้' });
    }
    next();
  };
}

export { JWT_SECRET };
