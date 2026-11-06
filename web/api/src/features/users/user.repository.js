const { pool } = require("../../config/db");

const userSelectFields = `
  user_id as id,
  username,
  full_name,
  dept_id,
  role,
  email,
  created_at
`;

async function findAll() {
  const sql = `SELECT ${userSelectFields} FROM users ORDER BY user_id DESC`;
  const [rows] = await pool.query(sql);
  return rows;
}

async function findById(id) {
  const sql = `SELECT ${userSelectFields} FROM users WHERE user_id = ?`;
  const [rows] = await pool.query(sql, [id]);
  return rows[0] || null;
}

// --- เพิ่ม: เอาไว้เช็คชื่อซ้ำ หรือใช้ตอน Login ---
async function findByUsername(username) {
  const sql = `SELECT * FROM users WHERE username = ?`; // ดึงมาหมดเพื่อเอา password ไปเช็ค login ด้วย
  const [rows] = await pool.query(sql, [username]);
  return rows[0] || null;
}

async function create(user) {
  const sql = `
    INSERT INTO users (username, password, full_name, dept_id, role, email)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [
    user.username,
    user.password, // อย่าลืม Hash password ใน Service นะคะ
    user.full_name,
    user.dept_id || null,
    user.role || 'staff',
    user.email
  ];
  const [result] = await pool.query(sql, values);
  return result.insertId;
}

async function update(id, user) {
  // ใช้แบบระบุฟิลด์ชัดเจนตามที่คุณเขียนมา
  const sql = `
    UPDATE users 
    SET username = ?, full_name = ?, dept_id = ?, role = ?, email = ?
    WHERE user_id = ?
  `;
  const values = [user.username, user.full_name, user.dept_id, user.role, user.email, id];
  const [result] = await pool.query(sql, values);
  return result.affectedRows;
}

async function remove(id) {
  const [result] = await pool.query("DELETE FROM users WHERE user_id = ?", [id]);
  return result.affectedRows;
}

module.exports = {
  findAll,
  findById,
  findByUsername, // ส่งออกฟังก์ชันใหม่ด้วย
  create,
  update,
  remove
};