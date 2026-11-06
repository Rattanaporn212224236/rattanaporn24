// 🗓️ เครื่องมือช่วยแปลงวันที่ ป้องกันปัญหา พ.ศ./ค.ศ. ปนกัน
//
// ที่พบ: ข้อมูลกิจกรรมบางส่วนถูกบันทึก event_date เป็นเลขปี พ.ศ. ตรง ๆ
// เช่น '2569-07-07' (ควรจะเป็น '2026-07-07' ในคอลัมน์ DATE ของ MySQL)
// เข้าใจว่าฝั่งฟอร์มเพิ่มกิจกรรมของแอดมินน่าจะยังไม่ได้แปลง พ.ศ. -> ค.ศ. ก่อนบันทึก
// ทำให้การคำนวณวันที่ (เช่น "อีกกี่วันจะถึงงาน", "งานนี้กำลังจัดอยู่ไหม") ผิดเพี้ยนไปเยอะ
// (MySQL CURDATE() คืนค่าปี ค.ศ. จริงเสมอ เทียบกับ 2569 ไม่ได้)
//
// ทางแก้ชั่วคราวตรงนี้: ถ้าปีที่อ่านได้เกิน 2400 (ไม่มีทางเป็นปี ค.ศ. จริงในอนาคตอันใกล้)
// ให้ถือว่าเป็นเลข พ.ศ. แล้วลบ 543 ปีออกก่อนใช้งานเสมอ
// แนะนำให้ตรวจ/แก้ที่ต้นทาง (ฟอร์มแอดมิน) ด้วยในระยะยาว

const BE_YEAR_THRESHOLD = 2400;
const BE_TO_CE_OFFSET = 543;

function toGregorianDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  if (d.getFullYear() > BE_YEAR_THRESHOLD) {
    d.setFullYear(d.getFullYear() - BE_TO_CE_OFFSET);
  }

  return d;
}

function toDateString(value) {
  const d = toGregorianDate(value);
  return d ? d.toISOString().split('T')[0] : '';
}

// คำนวณสถานะจริงจากวันที่ (ฐาน DB status enum มีแค่ pending/published/cancelled
// ไม่มีค่า "ongoing" ให้ใช้ เลยต้องคำนวณเทียบวันที่ปัจจุบันเองแทน)
function computeEventStatus(eventDateRaw, endDateRaw) {
  const start = toGregorianDate(eventDateRaw);
  if (!start) return 'UPCOMING';
  const end = toGregorianDate(endDateRaw) || start;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  if (today < startDay) return 'UPCOMING';
  if (today >= startDay && today <= endDay) return 'ONGOING';
  return 'COMPLETED';
}

module.exports = { toGregorianDate, toDateString, computeEventStatus };
