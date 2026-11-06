// src/services/notification.service.js
// เดิมคือ Mobile/api/src/notification.service.js — ระบบแจ้งเตือน push เพียงชุดเดียวที่ใช้งานจริง
// ในโปรเจกต์ (ฝั่งเว็บแอดมินไม่เคยมีระบบนี้ทำงานจริง มีแต่ใน web/api ที่เป็นโค้ดทิ้งร้าง) ย้ายมาแบบ
// 1:1 ไม่แก้ logic ใด ๆ
import db from '../config/db.js';
import { toGregorianDate, toDateString, formatThaiDate } from '../utils/dateUtils.js';

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
// ตาราง/คอลัมน์ที่ระบบนี้ต้องใช้ (notifications, app_users.push_token, app_users.notifications_seen_at,
// notifications.notified_for_date) ถูกสร้างให้อัตโนมัติแล้วตอนสตาร์ทเซิร์ฟเวอร์ (ดู bootstrapData.js
// ensureNotificationsInfra) ไม่ต้องรัน SQL เองแยกต่างหากอีกต่อไป
//
// 🕐 เปลี่ยนจากเช็ค "พอดี 3 วัน" วันละครั้งตอน 9 โมง มาเป็นเช็คถี่ทุก 5 วินาทีแทน (ดูท้ายไฟล์)
// เพื่อให้ใกล้เคียง real-time: ถ้ากิจกรรมถูกลงประกาศตอนเหลือน้อยกว่า 3 วันอยู่แล้ว
// (เช่น ประกาศ 1 ทุ่ม กิจกรรมเริ่มพรุ่งนี้ 9 โมง) จะโดนแจ้งเตือนภายในไม่กี่วินาทีทันที
// ไม่ต้องรอข้ามวันไปถึง 9 โมงของวันถัดไปเหมือนเดิม ส่วนกิจกรรมที่เหลือพอดี 3 วัน
// พอเลยเที่ยงคืนไปปุ๊บ diffDays จะขยับเป็น 3 รอบเช็คถัดไป (ภายในไม่กี่วินาที) ก็จะจับได้ทันที
// เท่ากับ "แจ้งเตือนตอนเที่ยงคืน" ของวันนั้นโดยอัตโนมัติ
//
// 🛡️ กันแจ้งเตือนซ้ำ: กันซ้ำต่อ "คู่ (event_id, วันที่จัดงาน)" แทนที่จะกันซ้ำต่อ event_id เฉย ๆ เหมือนเดิม
// เพราะถ้าแอดมินแก้ไขวันที่จัดกิจกรรมของกิจกรรมที่เคยแจ้งเตือนไปแล้ว แล้ววันที่ใหม่ตกอยู่ในช่วง 0-3 วันอีกครั้ง
// (เช่น เลื่อนกิจกรรมให้เร็วขึ้นมาเป็นภายใน 3 วันนี้) ควรได้รับการแจ้งเตือนใหม่สำหรับวันที่ใหม่นี้ด้วย
// ไม่ใช่ถูกมองว่า "เคยแจ้งไปแล้ว" ทั้งที่แจ้งไปตอนวันที่เดิมคนละวันกันเลย
export const checkAndSendNotifications = async () => {
  try {
    // ⚠️ ไม่ใช้ DATEDIFF(event_date, CURDATE()) ในฝั่ง SQL เพราะข้อมูล event_date
    // บางส่วนบันทึกเป็นเลขปี พ.ศ. ตรง ๆ (เช่น 2569 แทนที่จะเป็น 2026) ทำให้ CURDATE()
    // ของ MySQL (ปี ค.ศ. จริง) เทียบกันไม่ตรง เลยดึงกิจกรรมที่จะแสดงในแอปทั้งหมดมา
    // แล้วมาคำนวณ/แปลงปีให้ถูกต้องด้วย toGregorianDate() ในฝั่ง JS แทน
    //
    // ⚠️ เดิมกรองด้วย is_published = 1 แต่กิจกรรมส่วนใหญ่ในฐานข้อมูลยังไม่ถูกกด publish
    // (เหมือนกับ publicEvents.routes.js GET '/') ทำให้ cron หากิจกรรมไม่เจอทั้งที่โชว์อยู่ในแอปแล้ว
    // เปลี่ยนเงื่อนไขให้ตรงกับที่แอปใช้จริง: ซ่อนเฉพาะกิจกรรมที่ถูกยกเลิก (status = 'cancelled')
    const [allEvents] = await db.execute(`
      SELECT event_id, event_title, event_date, previous_event_date, location
      FROM events
      WHERE (status IS NULL OR status <> 'cancelled')
    `);

    // เอาคู่ (event_id, วันที่ที่เคยแจ้งเตือนไปแล้ว) มากันซ้ำ — ใช้คีย์ร่วมแทนที่จะกันซ้ำแค่ event_id เฉย ๆ
    // เพื่อให้กิจกรรมที่ถูกแก้ไขวันที่ (แล้ววันที่ใหม่ตกอยู่ในช่วง 0-3 วันอีกครั้ง) ได้รับแจ้งเตือนใหม่สำหรับวันที่ใหม่นั้นด้วย
    const [notifiedRows] = await db.execute(
      'SELECT DISTINCT event_id, notified_for_date FROM notifications WHERE event_id IS NOT NULL'
    );
    const alreadyNotified = new Set(
      notifiedRows.map((row) => `${row.event_id}::${toDateString(row.notified_for_date) || ''}`)
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = allEvents
      .map((event) => {
        const eventDate = toGregorianDate(event.event_date);
        if (!eventDate) return null;
        eventDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
        const dateKey = toDateString(event.event_date);
        // 🗓️ กิจกรรมนี้เพิ่งถูกแก้ไขวันที่หรือไม่ (previous_event_date มีค่า = เคยแก้ไขวันที่มาก่อน)
        // ใช้ตัดสินว่ารอบแจ้งเตือนนี้เกิดจากการแก้ไขวันที่ (ไม่ใช่กิจกรรมใหม่/นับถอยหลังปกติ)
        const prevDateKey = event.previous_event_date ? toDateString(event.previous_event_date) : null;
        const isDateChange = !!prevDateKey && prevDateKey !== dateKey;
        return { ...event, diffDays, dateKey, prevDateKey, isDateChange };
      })
      // แจ้งเตือนเฉพาะกิจกรรมที่เหลือ 0-3 วัน (ยังไม่ผ่านไป) และยังไม่เคยแจ้งเตือนสำหรับวันที่นี้มาก่อน
      .filter((event) => event && event.diffDays >= 0 && event.diffDays <= 1 && !alreadyNotified.has(`${event.event_id}::${event.dateKey}`));

    if (events.length === 0) {
      console.log('📅 ไม่มีกิจกรรมใหม่ที่เหลืออีกไม่เกิน 3 วัน (หรือแจ้งเตือนไปหมดแล้วสำหรับวันที่ปัจจุบันของกิจกรรมนั้น ๆ)');
      return;
    }

    const [tokenRows] = await db.execute(
      'SELECT push_token FROM app_users WHERE push_token IS NOT NULL'
    );
    const pushTokens = tokenRows.map((row) => row.push_token).filter(Boolean);

    for (const event of events) {
      try {
        const title = 'แจ้งเตือนกิจกรรมล่วงหน้า!';
        // 🗓️ ถ้ารอบนี้เข้าเงื่อนไข "เหลือ 0-3 วัน" เพราะแอดมินเพิ่งแก้ไขวันที่จัดกิจกรรม (ไม่ใช่กิจกรรมใหม่
        // หรือแค่นับถอยหลังตามปกติ) ให้บอกตรง ๆ ในตัวข้อความแจ้งเตือนเลยว่าเปลี่ยนจากวันที่ไหนเป็นวันที่ไหน
        // แทนข้อความ "อีก N วันจะถึงกิจกรรม" ปกติ — ผู้ใช้จะได้รู้ทันทีโดยไม่ต้องกดเข้าไปดูรายละเอียดก่อน
        const body = event.isDateChange
          ? `กิจกรรม "${event.event_title}" มีการปรับเปลี่ยนวันจัดกิจกรรม จากวันที่ ${formatThaiDate(event.prevDateKey)} เป็นวันที่ ${formatThaiDate(event.dateKey)}`
          : event.diffDays === 0
            ? `วันนี้มีกิจกรรม: ${event.event_title}`
            : `อีก ${event.diffDays} วันจะถึงกิจกรรม: ${event.event_title}`;

        // เก็บประวัติไว้ในตาราง notifications เสมอ (ไว้แสดงในหน้า "การแจ้งเตือน")
        // แม้จะยังไม่มีใครลงทะเบียนรับ push ก็ตาม — เก็บ notified_for_date ไว้ด้วยเพื่อใช้กันแจ้งเตือนซ้ำแบบแยกตามวันที่ (ดูด้านบน)
        // is_date_change เก็บไว้ให้ mobile รู้ว่าต้องโชว์ข้อความนี้ (body) แทนคำอธิบายกิจกรรมปกติในหน้ารายการแจ้งเตือน
        await db.execute(
          'INSERT INTO notifications (event_id, title, body, notified_for_date, is_date_change) VALUES (?, ?, ?, ?, ?)',
          [event.event_id, title, body, event.dateKey, event.isDateChange ? 1 : 0]
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
//
// หมายเหตุตอนย้ายมารวม API: เดิมไฟล์นี้เริ่ม setInterval ทันทีที่ถูก import (side effect ตอนโหลดโมดูล)
// คงพฤติกรรมเดิมไว้เป๊ะ ๆ — แค่ import ไฟล์นี้จาก server.js ก็เริ่มระบบแจ้งเตือนอัตโนมัติทันที เหมือนเดิม
const CHECK_INTERVAL_MS = 5000;
setInterval(checkAndSendNotifications, CHECK_INTERVAL_MS);

// 🚀 เช็คทันที 1 รอบตอน server เพิ่งสตาร์ท/restart ไม่ต้องรอรอบ 5 วินาทีแรก
checkAndSendNotifications();
