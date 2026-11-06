// src/server.js
// API กลางของระบบแจ้งงานกิจกรรม คณะวิทยาศาสตร์และวิศวกรรมศาสตร์ มก.ฉกส.
// รวมจาก web/web/server (เว็บแอดมิน) + Mobile/api (แอป Expo) เดิม ให้เหลือเซิร์ฟเวอร์เดียว
// ต่อฐานข้อมูล MySQL ตัวเดียวกัน (kuse_event) — ดู endpoint ทั้งหมดได้ใน README.md
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { assertDbConnection } from './config/db.js';
import { runStartupDataFixes } from './config/bootstrapData.js';

// ---- ฝั่งแอดมิน (เว็บ) — ทุก route ในนี้ต้อง JWT (verifyToken) อยู่แล้วภายในตัวเอง ----
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import departmentRoutes from './routes/departments.routes.js';
import eventRoutes from './routes/events.routes.js';

// ---- ฝั่งแอป Expo (public) — ไม่ต้อง login ผูกกับ device_token แทน ----
import categoriesRoutes from './routes/categories.routes.js';
import publicEventsRoutes from './routes/publicEvents.routes.js';
import appUsersRoutes from './routes/appUsers.routes.js';
import savedEventsRoutes from './routes/savedEvents.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
// import ไฟล์นี้ = เริ่มระบบเช็ค+ส่ง push notification อัตโนมัติทันที (setInterval ทุก 5 วิ)
// เหมือนพฤติกรรมเดิมตอนอยู่ใน Mobile/api/src/server.js
import './services/notification.service.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ---------------- CORS ----------------
// ต้องรับได้ทั้งเว็บแอดมิน (Vite, http://localhost:5173 หรือพอร์ตอื่นเวลา dev หลายอินสแตนซ์)
// และแอป Expo (native fetch ไม่ผ่าน CORS แต่โหมด `expo start --web` / เปิดผ่านเบราว์เซอร์จะผ่าน
// origin เป็น IP วง LAN เช่น http://192.168.1.25:8081) จึงอนุญาต localhost ทุกพอร์ต + IP วง LAN
// ส่วนตัวทุกพอร์ตแบบไดนามิก แทนที่จะ hardcode origin เดียวแบบเดิม
const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const PRIVATE_LAN_ORIGIN = /^https?:\/\/(10(\.\d{1,3}){3}|192\.168(\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[0-1])(\.\d{1,3}){2})(:\d+)?$/i;

const extraOrigins = (process.env.CORS_EXTRA_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const configuredOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = new Set([configuredOrigin, ...extraOrigins]);

app.use(
  cors({
    origin(origin, callback) {
      // ไม่มี origin (เช่น curl, Postman, server-to-server, native fetch ของ Expo) -> อนุญาตเสมอ
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      if (LOCALHOST_ORIGIN.test(origin)) return callback(null, true);
      if (PRIVATE_LAN_ORIGIN.test(origin)) return callback(null, true);
      return callback(new Error(`CORS: ไม่อนุญาต origin นี้ (${origin})`));
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// เปิดให้เข้าถึงรูปภาพกิจกรรมที่อัปโหลดไว้แบบ static file (ทั้งเว็บแอดมินและแอป Expo ใช้เส้นทางเดียวกันนี้)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'KUSE Event API (รวม web+mobile) กำลังทำงาน' });
});

// ---- ฝั่งแอดมิน ----
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/events', eventRoutes);

// ---- ฝั่งแอป Expo ----
app.use('/api/categories', categoriesRoutes);
app.use('/api/public-events', publicEventsRoutes);
app.use('/api/app-users', appUsersRoutes);
app.use('/api/saved-events', savedEventsRoutes);
app.use('/api/notifications', notificationsRoutes);

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] KUSE Event API (รวม web+mobile) พร้อมใช้งานที่ http://localhost:${PORT}`);
    console.log('[server] สำหรับมือถือ/เครื่องอื่นในวง Wi-Fi เดียวกัน ใช้ IP เครื่องนี้แทน localhost');
  });
}

start();
