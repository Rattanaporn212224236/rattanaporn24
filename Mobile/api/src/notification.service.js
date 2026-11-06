const db = require('./db');
const { toGregorianDate } = require('./dateUtils');

// 🔔 ส่งแจ้งเตือนผ่าน Expo Push Notification Service (ไม่ใช้ Firebase Admin โดยตรง)
// เพราะแอปฝั่ง client ใช้ expo-notifications ซึ่งได้ "Expo Push Token"
// (รูปแบบ ExponentPushToken[...]) ไม่ใช่ raw FCM token
// ตัว firebase-key.json ยังจำเป็นอยู่ แต่ใช้อัปโหลดเป็น FCM V1 credential
// ใน EAS (eas credentials) เพื่อให้ Expo ส่งไปหา Android ได้ ไม่ได้เรียกใช้ในไฟล์นี้โดยตรง
const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

// Expo แนะนำให้ส่งครั้งละไม่เกิน 100 ข้อความต่อ 1 request
async function sendExpoPushNotifications(pushTokens, title, body, data = {}) {
  const chunkSize = 100;

  for (let i = 0; i < pushTokens.length; i += chunkSize) {
    const chunk = pushTokens.slice(i, i + chunkSize);
    const messages = chunk.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }));

    try {
      const response = await fetch(EXPO_PUSH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      });
      const result = await response.json();
      console.log('📮 Expo push result:', JSON.stringify(result));
    } catch (error) {
      console.error('❌ ส่ง Expo push ไม่สำเร็จ:', error.message);
    }
  }
}

// 🔎 ตรวจกิจกรรมที่เหลืออีกไม่เกิน 3 วัน แล้วแจ้งเตือนทุกคนที่เคยเปิดแอปและอนุญาตแจ้งเตือน
// ต้องรัน SQL นี้ก่อนถึงจะใช้ได้ครบ (ดูรายละเอียดใน users.routes.js และ notifications.routes.js):
//   ALTER TABLE app_users ADD COLUMN push_token VARCHAR(255) DEFAULT NULL AFTER device_token;
//   CREATE TABLE notifications (...);
//
// 🕐 เปลี่ยนจากเช็ค "พอดี 3 วัน" วันละครั้งตอน 9 โมง มาเป็นเช็คถี่ทุก 5 วินาทีแทน (ดูท้ายไฟล์)
// เพื่อให้ใกล้เคียง real-time: ถ้ากิจกรรมถูกลงประกาศตอนเหลือน้อยกว่า 3 วันอยู่แล้ว
// (เช่น ประกาศ 1 ทุ่ม กิจกรรมเริ่มพรุ่งนี้ 9 โมง) จะโดนแจ้งเตือนภายในไม่กี่วินาทีทันที
// ไม่ต้องรอข้ามวันไปถึง 9 โมงของวันถัดไปเหมือนเดิม ส่วนกิจกรรมที่เหลือพอดี 3 วัน
// พอเลยเที่ยงคืนไปปุ๊บ diffDays จะขยับเป็น 3 รอบเช็คถัดไป (ภายในไม่กี่วินาที) ก็จะจับได้ทันที
// เท่ากับ "แจ้งเตือนตอนเที่ยงคืน" ของวันนั้นโดยอัตโนมัติ
//
// 🛡️ กันแจ้งเตือนซ้ำ: เดิมเช็คแค่ diffDays === 3 (ครั้งเดียวพอดี) แต่พอเปลี่ยนเป็นช่วง <= 3 วัน
// ต้องกันไม่ให้ยิงซ้ำทุก 5 วินาที เลยเช็คจากตาราง notifications ก่อนว่า event_id นี้
// เคยถูกแจ้งเตือนไปแล้วหรือยัง ถ้าเคยแล้วก็ข้าม (แจ้งแค่ครั้งแรกที่เข้าเงื่อนไขเท่านั้น)
const checkAndSendNotifications = async () => {
  try {
    // ⚠️ ไม่ใช้ DATEDIFF(event_date, CURDATE()) ในฝั่ง SQL เพราะข้อมูล event_date
    // บางส่วนบันทึกเป็นเลขปี พ.ศ. ตรง ๆ (เช่น 2569 แทนที่จะเป็น 2026) ทำให้ CURDATE()
    // ของ MySQL (ปี ค.ศ. จริง) เทียบกันไม่ตรง เลยดึงกิจกรรมที่จะแสดงในแอปทั้งหมดมา
    // แล้วมาคำนวณ/แปลงปีให้ถูกต้องด้วย toGregorianDate() ในฝั่ง JS แทน
    //
    // ⚠️ เดิมกรองด้วย is_published = 1 แต่กิจกรรมส่วนใหญ่ในฐานข้อมูลยังไม่ถูกกด publish
    // (เหมือนกับ events.routes.js GET '/') ทำให้ cron หากิจกรรมไม่เจอทั้งที่โชว์อยู่ในแอปแล้ว
    // เปลี่ยนเงื่อนไขให้ตรงกับที่แอปใช้จริง: ซ่อนเฉพาะกิจกรรมที่ถูกยกเลิก (status = 'cancelled')
    const [allEvents] = await db.execute(`
      SELECT event_id, event_title, event_date, location
      FROM events
      WHERE (status IS NULL OR status <> 'cancelled')
    `);

    // เอารายชื่อ event_id ที่เคยถูกแจ้งเตือนไปแล้วมากันซ้ำ (ไม่จำกัดช่วงเวลา เพราะแจ้งแค่ครั้งเดียวต่อกิจกรรม)
    const [notifiedRows] = await db.execute(
      'SELECT DISTINCT event_id FROM notifications WHERE event_id IS NOT NULL'
    );
    const alreadyNotified = new Set(notifiedRows.map((row) => row.event_id));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = allEvents
      .map((event) => {
        const eventDate = toGregorianDate(event.event_date);
        if (!eventDate) return null;
        eventDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
        return { ...event, diffDays };
      })
      // แจ้งเตือนเฉพาะกิจกรรมที่เหลือ 0-3 วัน (ยังไม่ผ่านไป) และยังไม่เคยแจ้งเตือนมาก่อน
      .filter((event) => event && event.diffDays >= 0 && event.diffDays <= 3 && !alreadyNotified.has(event.event_id));

    if (events.length === 0) {
      console.log('📅 ไม่มีกิจกรรมใหม่ที่เหลืออีกไม่เกิน 3 วัน (หรือแจ้งเตือนไปหมดแล้ว)');
      return;
    }

    const [tokenRows] = await db.execute(
      'SELECT push_token FROM app_users WHERE push_token IS NOT NULL'
    );
    const pushTokens = tokenRows.map((row) => row.push_token).filter(Boolean);

    for (const event of events) {
      try {
        const title = 'แจ้งเตือนกิจกรรมล่วงหน้า!';
        const body =
          event.diffDays === 0
            ? `วันนี้มีกิจกรรม: ${event.event_title}`
            : `อีก ${event.diffDays} วันจะถึงกิจกรรม: ${event.event_title}`;

        // เก็บประวัติไว้ในตาราง notifications เสมอ (ไว้แสดงในหน้า "การแจ้งเตือน")
        // แม้จะยังไม่มีใครลงทะเบียนรับ push ก็ตาม
        await db.execute(
          'INSERT INTO notifications (event_id, title, body) VALUES (?, ?, ?)',
          [event.event_id, title, body]
        );

        if (pushTokens.length > 0) {
          await sendExpoPushNotifications(pushTokens, title, body, { eventId: event.event_id });
        }

        console.log('🚀 ประมวลผลแจ้งเตือนกิจกรรมสำเร็จ:', event.event_title);
      } catch (eventError) {
        console.error(`❌ แจ้งเตือนกิจกรรม "${event.event_title}" ไม่สำเร็จ:`, eventError.message);
      }
    }
  } catch (error) {
    console.error('Notification Query Error:', error.message);
  }
};

// ⏰ เช็คถี่ทุก 5 วินาที (แทนที่จะรอวันละครั้งตอน 9 โมง หรือทุก 15 นาที) ให้ใกล้เคียง real-time ที่สุด
// ใช้ setInterval ธรรมดาแทน cron เพราะ cron มาตรฐานกำหนดถี่สุดได้แค่ระดับนาที ไม่รองรับหลักวินาที
// (โปรเจกต์นี้ขนาดเล็ก ผู้ใช้ไม่เยอะ เช็คถี่ขนาดนี้ไม่กระทบโหลด DB)
const CHECK_INTERVAL_MS = 5000;
setInterval(checkAndSendNotifications, CHECK_INTERVAL_MS);

// 🚀 เช็คทันที 1 รอบตอน server เพิ่งสตาร์ท/restart ไม่ต้องรอรอบ 5 วินาทีแรก
checkAndSendNotifications();

module.exports = { checkAndSendNotifications };
