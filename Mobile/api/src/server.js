const express = require('express');
const cors = require('cors');
require('dotenv').config();

// นำเข้าเฉพาะ Routes ที่เรามีจริงๆ
const eventsRoutes = require('./events.routes');
const notificationService = require('./notification.service');
// ระบบจะเริ่มทำงานตามเวลาที่ตั้งไว้ (Schedule) ทันทีที่รัน Server
const categoriesRoutes = require('./categories.routes');
const usersRoutes = require('./users.routes');
const savedEventsRoutes = require('./savedEvents.routes');
const notificationsRoutes = require('./notifications.routes');
const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ message: 'Mobile Server is running' });
});

// ใช้ Route กิจกรรมที่เราสร้างไว้ใน events.routes.js
app.use('/api/events', eventsRoutes);
app.use('/api/categories', categoriesRoutes);
// ผู้ใช้แบบไม่ต้อง Login (ผูกกับ device_token ที่แอปเก็บไว้ในเครื่อง)
app.use('/api/users', usersRoutes);
// กิจกรรมที่ผู้ใช้แต่ละคนกดบันทึกไว้ (หน้า "บันทึกกิจกรรม")
app.use('/api/saved-events', savedEventsRoutes);
// ประวัติการแจ้งเตือนที่เคยส่งออกไป (หน้า "การแจ้งเตือน")
app.use('/api/notifications', notificationsRoutes);
// ตั้งพอร์ต 3001 เพื่อไม่ให้ชนกับเซิร์ฟเวอร์แอดมิน
const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Mobile API Server running on port ${port}`);
});