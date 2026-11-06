const express = require("express");
const cors = require("cors");
const path = require("path");

// --- 1. นำเข้า Routes ทั้งหมด ---
const userRoutes = require("./features/users/user.routes"); 
const eventRoutes = require("./features/events/event.routes"); 
const masterRoutes = require("./features/masterData/master.routes"); 
const appUserRoutes = require('./features/appUsers/appUser.routes');
const authRoutes = require('./features/auth/auth.routes'); // ✅ สำหรับระบบ Login แอดมิน

const { testConnection } = require("./config/db");
const { success } = require("./utils/response");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

// --- 2. เริ่มสร้าง Instance ของ Express ---
const app = express();

// --- 3. Middlewares ---
// ตั้งค่า CORS ให้ยอมรับการยิงมาจาก React (พอร์ต 5173)
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
}));
app.use(express.json());

// --- 4. Static Files ---
// เปิดทางให้เข้าถึงรูปภาพที่อัปโหลดได้
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// --- 5. Health Check ---
// เช็คว่า Server และ Database ยังทำงานปกติไหม
app.get("/api/health", (req, res) => {
    return success(res, "Server is running");
});

app.get("/api/db-health", async (req, res, next) => {
    try {
        await testConnection();
        return success(res, "Database connection is working");
    } catch (error) {
        return next(error);
    }
});

// --- 6. ประกาศ API Routes ---
app.use("/api/users", userRoutes);       // จัดการข้อมูลแอดมิน (CRUD)
app.use("/api/events", eventRoutes);     // จัดการกิจกรรม
app.use("/api/master", masterRoutes);     // ข้อมูลพื้นฐาน (เช่น หมวดหมู่, ภาควิชา)
app.use("/api/app-users", appUserRoutes); // ระบบนิสิตและการแจ้งเตือน
app.use("/api/auth", authRoutes);         // ✅ ระบบ Login (MySQL)

// --- 7. Error Handlers ---
app.use(notFound);      // กรณีเรียก URL ที่ไม่มีอยู่จริง
app.use(errorHandler);  // กรณีเกิด Error ภายในระบบ

module.exports = app;