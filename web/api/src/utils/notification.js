const admin = require('../config/firebase');
const AppUserRepository = require('../features/appUsers/appUser.repository');

const sendEventReminders = async () => {
    try {
        const events = await AppUserRepository.getUpcomingEvents();
        const tokens = await AppUserRepository.getAllUserTokens();

        if (events.length > 0 && tokens.length > 0) {
            events.forEach(async (event) => {
                const message = {
                    notification: {
                        title: 'ใกล้เริ่มแล้ว!',
                        body: `กิจกรรม "${event.event_title}" จะเริ่มขึ้นในอีก 3 วัน อย่าลืมมาร่วมงานนะ!`
                    },
                    tokens: tokens,
                };
                
                const response = await admin.messaging().sendEachForMulticast(message);
                console.log(`Successfully sent notification for ${event.title}:`, response.successCount);
            });
        }
    } catch (error) {
        console.error('Error sending notifications:', error);
    }
};

module.exports = { sendEventReminders };