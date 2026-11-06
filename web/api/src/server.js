require("dotenv").config();

const app = require("./app");
const { testConnection } = require("./config/db");
const cron = require('node-cron'); // ✅ เพิ่มตัวตั้งเวลา
const { sendEventReminders } = require('./utils/notification'); // ✅ ดึงฟังก์ชันแจ้งเตือนมาใช้

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. ทดสอบเชื่อมต่อฐานข้อมูล
    await testConnection();
    console.log("Database connected successfully to kuse_event");

    // 2. ตั้งเวลาทำงานอัตโนมัติ (Cron Job)
    // สั่งให้ทำงานทุกวันตอน 09:00 น.
    cron.schedule('0 9 * * *', async () => {
      console.log('--- Running Daily Notification Task ---');
      await sendEventReminders();
    }, {
      scheduled: true,
      timezone: "Asia/Bangkok" // ตั้งค่าเป็นเวลาไทย
    });

    // 3. เริ่มรัน Server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log('Automatic Notification System: Active');
    });

  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();