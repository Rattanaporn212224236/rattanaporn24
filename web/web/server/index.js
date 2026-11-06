// server/index.js
// Express API server สำหรับระบบผู้ดูแล (Backend) ของ "ระบบแจ้งข่าวสารและกิจกรรม
// คณะวิทยาศาสตร์และวิศวกรรมศาสตร์ มก.ฉกส." เชื่อมต่อฐานข้อมูล MySQL kuse_event

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { assertDbConnection } from './config/db.js';
import { runStartupDataFixes } from './config/bootstrapData.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import departmentRoutes from './routes/departments.routes.js';
import eventRoutes from './routes/events.routes.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// เปิดให้เข้าถึงรูปภาพกิจกรรมที่อัปโหลดไว้แบบ static file
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'KUSE Event API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/events', eventRoutes);

// จัดการ error จาก multer (เช่น ไฟล์ใหญ่เกิน / ประเภทไฟล์ไม่ถูกต้อง) ให้ตอบกลับเป็น JSON ที่อ่านง่าย
app.use((err, req, res, next) => {
  if (err) {
    console.error('[unhandled]', err.message);
    return res.status(400).json({ success: false, message: err.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด' });
  }
  next();
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'ไม่พบ endpoint นี้' });
});

async function start() {
  // ขั้นที่ 1: ต่อฐานข้อมูลให้ได้ก่อน — ถ้าล้มเหลวตรงนี้จริง ๆ ค่อยหยุดเซิร์ฟเวอร์ เพราะไม่มีฐานข้อมูลก็ทำงานต่อไม่ได้
  try {
    await assertDbConnection();
    console.log('[db] เชื่อมต่อฐานข้อมูล kuse_event สำเร็จ');
  } catch (err) {
    console.error('[db] เชื่อมต่อฐานข้อมูลไม่สำเร็จ ตรวจสอบว่า MySQL (เช่น XAMPP) เปิดอยู่หรือไม่ และค่า DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME ใน .env ถูกต้อง');
    console.error(err.message);
    process.exit(1);
  }

  // ขั้นที่ 2: ซ่อมข้อมูลเก่า (ไม่ใช่ขั้นตอนจำเป็นต่อการเปิดเซิร์ฟเวอร์) — ถ้าล้มเหลวเพราะปัญหาเชื่อมต่อชั่วคราว
  // (เช่น MySQL ตัดการเชื่อมต่อกลางคัน) ให้ข้ามไปก่อนแล้วเปิด API ต่อได้เลย ไม่ควรทำให้ทั้งระบบใช้งานไม่ได้
  try {
    await runStartupDataFixes();
  } catch (err) {
    console.error('[bootstrap] ขั้นตอนซ่อมข้อมูลเริ่มต้นล้มเหลว (ข้ามไปก่อน เซิร์ฟเวอร์จะยังเปิดใช้งานต่อตามปกติ):', err.message);
  }

  app.listen(PORT, () => {
    console.log(`[server] KUSE Event API พร้อมใช้งานที่ http://localhost:${PORT}`);
  });
}

start();
