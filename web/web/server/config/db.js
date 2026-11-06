// server/config/db.js
// จุดเชื่อมต่อฐานข้อมูล MySQL (kuse_event) แบบ connection pool
// ใช้ mysql2/promise เพื่อให้เขียนโค้ด async/await ได้สะดวก

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kuse_event',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // คืนค่า DATE/DATETIME เป็น string ตรง ๆ ไม่ผ่าน timezone conversion ของ JS
});

/**
 * ตรวจสอบว่าเชื่อมต่อฐานข้อมูลได้จริงก่อนเปิดให้ API ใช้งาน
 * ป้องกันปัญหาเซิร์ฟเวอร์ดูเหมือนรันอยู่แต่ query อะไรไม่ได้เลย
 */
export async function assertDbConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SELECT 1');
  } finally {
    conn.release();
  }
}

export default pool;
