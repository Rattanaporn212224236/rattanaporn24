import { Router } from 'express';
import {
  listCategories,
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departments.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyToken);

// ทุก role อ่านรายชื่อหน่วยงาน/หมวดหมู่ได้ (ใช้ประกอบฟอร์มสร้างกิจกรรม ฯลฯ)
router.get('/categories', listCategories);
router.get('/', listDepartments);

// จัดการ (เพิ่ม/แก้ไข/ลบ) ได้เฉพาะ Super Admin
router.post('/', requireRole('super_admin'), createDepartment);
router.put('/:id', requireRole('super_admin'), updateDepartment);
router.delete('/:id', requireRole('super_admin'), deleteDepartment);

export default router;
