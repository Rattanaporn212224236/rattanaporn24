// user.validation.js

// ฟังก์ชันตรวจสอบ ID (ต้องเป็นตัวเลข)
const validateId = (id) => {
    const userId = parseInt(id);
    if (isNaN(userId)) {
        const error = new Error("รหัส ID ต้องเป็นตัวเลขเท่านั้น");
        error.statusCode = 400;
        throw error;
    }
    return userId;
};

// ตัวอย่างใน user.validation.js
const validateUser = (data) => {
    const allowedRoles = ['admin', 'super_admin']; // แก้จาก staff เป็น super_admin
    if (data.role && !allowedRoles.includes(data.role)) {
        throw new Error("Role ไม่ถูกต้อง (ต้องเป็น admin หรือ super_admin เท่านั้น)");
    }
    // ... logic อื่นๆ
};

module.exports = {
    validateId,
    validateUser
};