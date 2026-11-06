const eventRepository = require("./event.repository");

/**
 * [CREATE] - สร้างกิจกรรมใหม่พร้อมจัดการข้อมูลรูปภาพ
 */
async function createEvent(eventData, files) {
    const imagesData = [];

    // จัดการรูปปก (is_cover = 1)
    if (files && files.coverImage) {
        imagesData.push({ path: files.coverImage[0].filename, is_cover: 1 });
    }

    // จัดการรูป Gallery (is_cover = 0)
    if (files && files.galleryImages) {
        files.galleryImages.forEach(file => {
            imagesData.push({ path: file.filename, is_cover: 0 });
        });
    }

    // รวมข้อมูลรูปภาพเข้าไปใน Object ก่อนส่งให้ Repository
    eventData.images = imagesData;

    return await eventRepository.createEvent(eventData);
}

/**
 * [CREATE - Images] - เพิ่มรูปภาพให้กับกิจกรรมเดิมที่มีอยู่แล้ว
 */
async function uploadImages(eventId, files) {
    const imagesToSave = [];

    // Validation: เช็คว่ากิจกรรมมีอยู่จริงไหม
    const event = await eventRepository.getEventById(eventId);
    if (!event) {
        throw new Error("ไม่พบรหัสกิจกรรมที่คุณระบุในระบบ");
    }

    if (files && files.coverImage) {
        imagesToSave.push([eventId, files.coverImage[0].filename, 1]);
    }

    if (files && files.galleryImages) {
        files.galleryImages.forEach(file => {
            imagesToSave.push([eventId, file.filename, 0]);
        });
    }

    if (imagesToSave.length === 0) {
        throw new Error("กรุณาเลือกไฟล์ภาพที่ต้องการอัปโหลด");
    }

    return await eventRepository.addEventImages(imagesToSave);
}

/**
 * [READ] - ดึงรายการกิจกรรมทั้งหมด
 */
async function findAllEvents() {
    return await eventRepository.getAllEvents();
}

/**
 * 📊 [READ - STATS] - ดึงข้อมูลสถิติกิจกรรมทั้งหมดส่งไปให้ Controller
 */
async function getDashboardStats() {
    // 🚀 ส่งต่อไม้สุดท้ายไปให้ Repository เป็นคนสอยคำสั่งเด็ดคิวรีกับ MySQL ค๊าา
    return await eventRepository.getDashboardStats();
}

/**
 * [UPDATE] - แก้ไขข้อมูลรายละเอียดกิจกรรม
 */
async function updateEventInfo(eventId, updateData) {
    // เช็คก่อนว่ามีของให้แก้ไหม
    const event = await eventRepository.getEventById(eventId);
    if (!event) {
        throw new Error("ไม่พบกิจกรรมที่ต้องการแก้ไข");
    }

    const success = await eventRepository.updateEvent(eventId, updateData);
    if (!success) {
        throw new Error("ไม่สามารถอัปเดตข้อมูลได้ หรือข้อมูลไม่มีการเปลี่ยนแปลง");
    }
    
    return { message: "อัปเดตข้อมูลกิจกรรมเรียบร้อยแล้ว" };
}

/**
 * [DELETE] - ลบกิจกรรม
 */
async function removeEvent(eventId) {
    const event = await eventRepository.getEventById(eventId);
    if (!event) {
        throw new Error("ไม่พบกิจกรรมที่ต้องการลบ");
    }

    const success = await eventRepository.deleteEvent(eventId);
    if (!success) {
        throw new Error("ไม่สามารถลบกิจกรรมได้");
    }

    return { message: "ลบกิจกรรมเรียบร้อยแล้ว" };
}

module.exports = {
    createEvent,
    uploadImages,
    findAllEvents,
    getDashboardStats, // ✅ เพิ่มฟังก์ชันสถิติเข้าพูล Export เรียบร้อยค๊าา
    updateEventInfo,
    removeEvent
};