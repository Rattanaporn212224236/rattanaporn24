const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ตรวจสอบว่ามีโฟลเดอร์เก็บรูปไหม ถ้าไม่มีให้สร้าง
const uploadDir = 'public/uploads/events';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'ev-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;