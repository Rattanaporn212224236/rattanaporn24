const express = require('express');
const router = express.Router();
const upload = require('../../utils/uploadConfig');
const eventController = require('./event.controller');

// [CREATE] สร้างกิจกรรมใหม่
router.post('/', upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'galleryImages', maxCount: 10 }]), eventController.createEvent);

// [CREATE] เพิ่มรูปให้กิจกรรมที่มีอยู่แล้ว
router.post('/upload-images', upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'galleryImages', maxCount: 10 }]), eventController.addImages);

// [READ] ดูทั้งหมด
router.get('/', eventController.getAllEvents);

// [UPDATE] แก้ไขข้อมูล (ระบุ ID)
router.put('/:id', eventController.updateEvent);

// [DELETE] ลบกิจกรรม (ระบุ ID)
router.delete('/:id', eventController.deleteEvent);

router.get('/stats', eventController.getEventStats);

module.exports = router;