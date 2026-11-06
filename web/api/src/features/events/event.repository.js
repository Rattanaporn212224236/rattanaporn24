const { pool } = require("../../config/db");

// ==========================================
// [CREATE] - สร้างกิจกรรม
// ==========================================

/**
 * สร้างกิจกรรมใหม่พร้อมรูปภาพประกอบ (รองรับ Transaction)
 */
async function createEvent(eventData) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const sqlEvent = `
            INSERT INTO events 
            (event_title, event_description, objectives, responsibilities, event_date, end_date, event_time, end_time, location, volunteer_hours, dept_id, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const [result] = await conn.query(sqlEvent, [
            eventData.event_title, 
            eventData.event_description, 
            eventData.objectives, 
            eventData.responsibilities, 
            eventData.event_date, 
            eventData.end_date, 
            eventData.event_time, 
            eventData.end_time, 
            eventData.location, 
            eventData.volunteer_hours, 
            eventData.dept_id, 
            'published'
        ]);

        const eventId = result.insertId;

        // ถ้ามีรูปภาพแนบมาด้วยให้เพิ่มลงตาราง event_images
        if (eventData.images && eventData.images.length > 0) {
            const sqlImage = `INSERT INTO event_images (event_id, image_path, is_cover) VALUES ?`;
            const imageValues = eventData.images.map(img => [eventId, img.path, img.is_cover]);
            await conn.query(sqlImage, [imageValues]);
        }

        await conn.commit();
        return eventId;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

/**
 * เพิ่มเฉพาะรูปภาพให้กับกิจกรรมที่มีอยู่แล้ว (สำหรับ Test Postman)
 */
async function addEventImages(images) {
    // images: [[eventId, 'path.jpg', is_cover], ...]
    const sql = `INSERT INTO event_images (event_id, image_path, is_cover) VALUES ?`;
    const [result] = await pool.query(sql, [images]);
    return result;
}

// ==========================================
// [READ] - ดึงข้อมูลกิจกรรม
// ==========================================

/**
 * ดึงกิจกรรมทั้งหมด พร้อมรูปหน้าปก (Cover)
 */
async function getAllEvents() {
    const sql = `
        SELECT e.*, i.image_path as cover_image 
        FROM events e
        LEFT JOIN event_images i ON e.event_id = i.event_id AND i.is_cover = 1
        ORDER BY e.event_date DESC
    `;
    const [rows] = await pool.query(sql);
    return rows;
}

/**
 * ตรวจสอบ/ดึงข้อมูลกิจกรรมรายตัวตาม ID
 */
async function getEventById(eventId) {
    const sql = `
        SELECT e.*, 
                (SELECT i.image_path FROM event_images i WHERE i.event_id = e.event_id AND i.is_cover = 1 LIMIT 1) as cover_image
        FROM events e 
        WHERE e.event_id = ?`;
    const [rows] = await pool.query(sql, [eventId]);
    return rows[0];
}

/**
 * 📊 [READ - STATS] - คำนวณสรุปผลสถิติกิจกรรมทั้งหมดเพื่อป้อนให้หน้าแดชบอร์ด React
 */
async function getDashboardStats() {
    const sql = `
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS ongoing,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS finished
        FROM events;
    `;
    const [rows] = await pool.query(sql);
    return rows[0]; // ส่งข้อมูลแถวแรกและแถวเดียวที่สรุปค่านับรวมกลับออกไป
}

// ==========================================
// [UPDATE] - แก้ไขข้อมูล
// ==========================================

/**
 * อัปเดตข้อมูลกิจกรรม (รองรับการส่ง Object มาอัปเดตเฉพาะบาง Field)
 */
async function updateEvent(eventId, updateData) {
    const sql = `UPDATE events SET ? WHERE event_id = ?`;
    const [result] = await pool.query(sql, [updateData, eventId]);
    return result.affectedRows > 0;
}

// ==========================================
// [DELETE] - ลบข้อมูล
// ==========================================

/**
 * ลบกิจกรรม (หมายเหตุ: ถ้า DB ไม่ได้ทำ ON DELETE CASCADE อย่าลืมลบรูปก่อนนะคะ)
 */
async function deleteEvent(eventId) {
    const [result] = await pool.query("DELETE FROM events WHERE event_id = ?", [eventId]);
    return result.affectedRows > 0;
}

module.exports = { 
    createEvent, 
    addEventImages, 
    getEventById,
    getAllEvents,
    getDashboardStats, // ✅ ทำการเปิดการส่งออกฟังก์ชันสถิติเรียบร้อยค๊าาา
    updateEvent,
    deleteEvent
};