import { Router } from 'express';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  updateMe,
  changeMyPassword,
} from '../controllers/users.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyToken);

// ผู้ใช้ที่ล็อกอินอยู่จัดการข้อมูลของตัวเอง (ต้องมาก่อน /:id เพื่อไม่ให้ "me" ถูกตีความเป็น id)
router.put('/me', updateMe);
router.put('/me/password', changeMyPassword);

// เฉพาะ Super Admin เท่านั้นที่จัดการบัญชีผู้ใช้งานคนอื่นได้
router.get('/', requireRole('super_admin'), listUsers);
router.post('/', requireRole('super_admin'), createUser);
router.put('/:id', requireRole('super_admin'), updateUser);
router.delete('/:id', requireRole('super_admin'), deleteUser);
router.post('/:id/reset-password', requireRole('super_admin'), resetPassword);

export default router;
