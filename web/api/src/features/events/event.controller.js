const eventService = require("./event.service");
const { success } = require("../../utils/response");

/**
 * [POST] - สร้างกิจกรรมใหม่ (พร้อมจัดการไฟล์ผ่าน Middleware)
 */
const createEvent = async (req, res, next) => {
    try {
        const result = await eventService.createEvent(req.body, req.files);
        return success(res, "สร้างกิจกรรมและอัปโหลดรูปสำเร็จ", { event_id: result });
    } catch (error) {
        next(error);
    }
};

/**
 * [POST] - เพิ่มรูปภาพเข้าไปในกิจกรรมที่มีอยู่แล้ว
 */
const addImages = async (req, res, next) => {
    try {
        const { event_id } = req.body; 
        
        if (!event_id) {
            return res.status(400).json({ 
                success: false, 
                message: "กรุณาระบุ event_id ใน Body" 
            });
        }

        const result = await eventService.uploadImages(event_id, req.files);
        return success(res, "อัปโหลดรูปภาพเพิ่มเติมสำเร็จ", result);
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] - ดึงรายการกิจกรรมทั้งหมด
 */
const getAllEvents = async (req, res, next) => {
    try {
        const events = await eventService.findAllEvents();
        return success(res, "ดึงข้อมูลกิจกรรมทั้งหมดสำเร็จ", events);
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] - ดึงข้อมูลสถิติกิจกรรมทั้งหมดเพื่อแสดงผลบนหน้าแดชบอร์ด React
 */
const getEventStats = async (req, res, next) => {
    try {
        // 🚀 ส่งต่อหน้าที่ไปดึงสถิติจากฐานข้อมูลที่ไฟล์ event.service.js
        const stats = await eventService.getDashboardStats();
        return success(res, "ดึงข้อมูลสถิติกิจกรรมสำเร็จ", stats);
    } catch (error) {
        next(error);
    }
};

/**
 * [PUT] - แก้ไขข้อมูลกิจกรรม (ระบุ ID ผ่าน URL)
 */
const updateEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ message: "กรุณาระบุ ID ที่ต้องการแก้ไขใน URL" });
        }

        const result = await eventService.updateEventInfo(id, req.body);
        return success(res, "แก้ไขกิจกรรมสำเร็จ", result);
    } catch (error) {
        next(error);
    }
};

/**
 * [DELETE] - ลบกิจกรรม (ระบุ ID ผ่าน URL)
 */
const deleteEvent = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "กรุณาระบุ ID ที่ต้องการลบใน URL" });
        }

        await eventService.removeEvent(id);
        return success(res, "ลบกิจกรรมสำเร็จ");
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createEvent,
    addImages,
    getAllEvents,
    getEventStats, // ✅ เพิ่มฟังก์ชันสถิติเข้าพูล Export
    updateEvent,
    deleteEvent
};