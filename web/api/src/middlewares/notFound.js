function notFound(req, res, next) {
  // สร้าง Error เมื่อไม่พบ Route ที่เรียกใช้
  const error = new Error(`Resource not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  
  // ส่งไปให้ errorHandler จัดการต่อ
  next(error);
}

module.exports = notFound;