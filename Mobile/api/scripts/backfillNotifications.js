// 🧰 สคริปต์ backfill ประวัติแจ้งเตือนย้อนหลัง สำหรับกิจกรรมที่ "จัดเสร็จแล้ว" (COMPLETED)
//
// ทำไมต้องมีสคริปต์นี้: ระบบแจ้งเตือนจริง (notification.service.js) เช็คแบบ real-time
// เทียบกับ "วันนี้" เท่านั้น กิจกรรมที่จัดเสร็จไปแล้วจะไม่มีทางถูกแจ้งเตือนย้อนหลังเองได้อีก
// สคริปต์นี้เลย insert แถวเข้าตาราง notifications ให้เอง โดยตั้ง sent_at ให้สมจริง
// (ห่างจากวันจัดงานจริง 3 วัน เหมือนเงื่อนไขของระบบจริง) ไว้ใช้โชว์เป็นตัวอย่าง/เดโมเท่านั้น
// ไม่กระทบ logic การแจ้งเตือนจริงของกิจกรรมที่ยังไม่จัด
//
// วิธีใช้ (รันจากโฟลเดอร์ server):
//   node scripts/backfillNotifications.js
//
// สคริปต์จะข้ามกิจกรรมที่เคยมีประวัติแจ้งเตือนอยู่แล้วโดยอัตโนมัติ รันซ้ำได้ไม่ซ้ำข้อมูล

const db = require('../src/db');
const { toGregorianDate, computeEventStatus } = require('../src/dateUtils');

async function backfillNotifications() {
  try {
    const [allEvents] = await db.execute(`
      SELECT event_id, event_title, event_date, end_date
      FROM events
      WHERE (status IS NULL OR status <> 'cancelled')
    `);

    const [notifiedRows] = await db.execute(
      'SELECT DISTINCT event_id FROM notifications WHERE event_id IS NOT NULL'
    );
    const alreadyNotified = new Set(notifiedRows.map((row) => row.event_id));

    const completedEvents = allEvents.filter((event) => {
      if (alreadyNotified.has(event.event_id)) return false;
      const status = computeEventStatus(event.event_date, event.end_date);
      return status === 'COMPLETED';
    });

    if (completedEvents.length === 0) {
      console.log('✅ ไม่มีกิจกรรมที่จัดเสร็จแล้วที่ต้อง backfill (หรือ backfill ไปหมดแล้ว)');
      process.exit(0);
    }

    console.log(`🔎 พบกิจกรรมที่จัดเสร็จแล้วและยังไม่มีประวัติแจ้งเตือน: ${completedEvents.length} รายการ`);

    for (const event of completedEvents) {
      const eventDate = toGregorianDate(event.event_date);
      if (!eventDate) continue;

      // ตั้ง sent_at ให้ห่างจากวันจัดงานจริง 3 วัน (เหมือนเงื่อนไขแจ้งเตือนจริง) ให้ดูสมจริง
      const sentAt = new Date(eventDate);
      sentAt.setDate(sentAt.getDate() - 3);

      const title = 'แจ้งเตือนกิจกรรมล่วงหน้า!';
      const body = `อีก 3 วันจะถึงกิจกรรม: ${event.event_title}`;

      await db.execute(
        'INSERT INTO notifications (event_id, title, body, sent_at) VALUES (?, ?, ?, ?)',
        [event.event_id, title, body, sentAt]
      );

      console.log(`  ✔ เพิ่มประวัติแจ้งเตือนให้ "${event.event_title}" (sent_at: ${sentAt.toISOString().split('T')[0]})`);
    }

    console.log('🎉 Backfill เสร็จสิ้น');
    process.exit(0);
  } catch (error) {
    console.error('❌ Backfill error:', error.message);
    process.exit(1);
  }
}

backfillNotifications();
