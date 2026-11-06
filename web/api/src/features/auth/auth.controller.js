const db = require('../../config/db'); //

const login = async (req, res) => { //
    const { username, password } = req.body; //

    try { //
        // 🛠️ แก้ไขคำสั่ง SQL: เพิ่มการดึง full_name และเช็คสถานะบัญชี (is_active = 1) เพื่อความปลอดภัยตามโครงสร้าง DB จริงค๊าาา
        const query = 'SELECT user_id, username, full_name, role FROM users WHERE username = ? AND password = ? AND is_active = 1';
        const [rows] = await db.execute(query, [username, password]); //

        if (rows.length > 0) { //
            // ถ้าเจอข้อมูล ให้ส่ง success กลับไปพร้อมข้อมูล user
            res.status(200).json({ //
                success: true, //
                message: 'เข้าสู่ระบบสำเร็จ', //
                user: rows[0] //
            }); //
        } else { //
            // ถ้าไม่เจอ หรือรหัสผิด หรือโดนระงับสิทธิ์ (is_active = 0)
            res.status(401).json({ //
                success: false, //
                message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีของคุณไม่มีสิทธิ์เข้าใช้งาน'
            }); //
        } //
    } catch (error) { //
        console.error('Login Error:', error); //
        res.status(500).json({ //
            success: false, //
            message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์: ' + error.message //
        }); //
    } //
}; //

module.exports = { //
    login //
}; //