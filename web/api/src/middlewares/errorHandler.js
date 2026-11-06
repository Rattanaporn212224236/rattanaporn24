const { error } = require("../utils/response");

function errorHandler(err, req, res, next) {
  // พิมพ์ Error ออกทาง Console เพื่อให้เรา (Developer) ไล่แก้บั๊กได้ง่าย
  console.error("Error Log:", err);
  if (err.code === "LIMIT_FILE_SIZE") {
  return error(res, "Image size must not exceed 5 MB", 400);
}

if (err.code === "LIMIT_UNEXPECTED_FILE") {
  return error(res, "Unexpected file field or too many images", 400);
}
  // ตรวจสอบ Error จาก MySQL กรณีข้อมูลซ้ำ (เช่น Username เดิมมีอยู่แล้ว)
  if (err.code === "ER_DUP_ENTRY") {
    return error(res, "Username or Email already exists in the system", 409);
  }

  // ตรวจสอบ Error กรณี Foreign Key ผิดพลาด (เช่น ใส่ dept_id ที่ไม่มีจริง)
  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return error(res, "Related data (Department) not found", 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  return error(res, message, statusCode);
}

module.exports = errorHandler;