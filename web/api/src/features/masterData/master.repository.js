const { pool } = require("../../config/db");

// ดึงข้อมูลคณะ/หน่วยงานทั้งหมด
async function findAllDepartments() {
    const [rows] = await pool.query("SELECT * FROM departments ORDER BY dept_name ASC");
    return rows;
}

// ดึงข้อมูลหมวดหมู่ทั้งหมด
async function findAllCategories() {
    const [rows] = await pool.query("SELECT * FROM categories ORDER BY cat_id ASC");
    return rows;
}

module.exports = {
    findAllDepartments,
    findAllCategories
};