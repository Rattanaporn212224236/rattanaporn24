const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "kuse_event",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  // ลองดึง connection มาเช็ค ถ้าผ่านก็แปลว่าต่อติดค่ะ
  const connection = await pool.getConnection();
  console.log("✅ Database Connected Successfully");
  connection.release();
}

// ส่งออกแบบนี้เพื่อให้ไฟล์อื่นเรียกใช้ db.execute ได้โดยตรง
module.exports = pool; 
module.exports.testConnection = testConnection;