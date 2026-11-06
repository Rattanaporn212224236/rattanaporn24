const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kuse_event', // แก้เป็นชื่อ DB ของคุณ
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ตรวจสอบการเชื่อมต่อ
pool.getConnection()
    .then(connection => {
        console.log('Connected to MySQL Database (Mobile API)');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

module.exports = pool;