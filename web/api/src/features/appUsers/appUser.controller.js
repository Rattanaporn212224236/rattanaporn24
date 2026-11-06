const AppUserRepository = require('./appUser.repository');

const AppUserController = {
    // ฟังก์ชันลงทะเบียนอัตโนมัติ
    handleOpenApp: async (req, res) => {
        try {
            const { device_token } = req.body;
            
            // 1. เช็คก่อนว่าคนนี้เคยเข้าแอพหรือยัง
            let user = await AppUserRepository.findByToken(device_token);
            
            if (!user) {
                // 2. ถ้ายังไม่เคย ให้สร้างชื่ออัตโนมัติแล้วบันทึก
                // เราจะใช้ timestamp หรือเลขสุ่มง่ายๆ มาต่อท้ายชื่อ
                const tempName = `KUSE-User-${Math.floor(1000 + Math.random() * 9000)}`;
                const userId = await AppUserRepository.register(device_token, tempName);
                user = { app_user_id: userId, display_name: tempName };
            }

            res.status(200).json({ success: true, data: user });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // ฟังก์ชันบันทึกกิจกรรม
    bookmarkEvent: async (req, res) => {
        try {
            const { app_user_id, event_id } = req.body;
            await AppUserRepository.saveEvent(app_user_id, event_id);
            res.status(201).json({ success: true, message: "Event saved successfully!" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = AppUserController;