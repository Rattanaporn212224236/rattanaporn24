const db = require('../../config/db'); // ไม่ต้องใส่ .promise() แล้วเพราะข้างบนทำให้แล้ว

const AppUserRepository = {
    register: async (device_token, display_name) => {
        const query = 'INSERT INTO app_users (device_token, display_name) VALUES (?, ?)';
        // ใช้ db.execute ได้เลยเพราะ db คือ pool ที่เป็น promise แล้ว
        const [result] = await db.execute(query, [device_token, display_name]);
        return result.insertId;
    },

    findByToken: async (device_token) => {
        const query = 'SELECT * FROM app_users WHERE device_token = ?';
        const [rows] = await db.execute(query, [device_token]);
        return rows[0];
    },

    saveEvent: async (app_user_id, event_id) => {
        const query = 'INSERT INTO saved_events (app_user_id, event_id) VALUES (?, ?)';
        const [result] = await db.execute(query, [app_user_id, event_id]);
        return result;
    },
    // ฟังก์ชันดึงกิจกรรมที่จะเริ่มในอีก 3 วันข้างหน้า
// ดึงกิจกรรมที่จะเริ่มในอีก 3 วันข้างหน้า (อ้างอิงตามชื่อคอลัมน์จริงในรูป)
getUpcomingEvents: async () => {
    const query = `
        SELECT event_id, event_title 
        FROM events 
        WHERE DATEDIFF(event_date, CURDATE()) = 3
    `;
    const [rows] = await db.execute(query);
    return rows;
},

// ดึง Token ของทุกคนเพื่อส่งแจ้งเตือน
getAllUserTokens: async () => {
    const query = 'SELECT device_token FROM app_users WHERE device_token IS NOT NULL';
    const [rows] = await db.execute(query);
    return rows.map(row => row.device_token);
}
};

module.exports = AppUserRepository;