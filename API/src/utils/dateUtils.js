// src/utils/dateUtils.js
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
//
// (ย้ายมาจาก Mobile/api/src/dateUtils.js แบบ 1:1 ไม่แก้ logic ใด ๆ — bootstrapData.js ของฝั่งเว็บ
// ก็ซ่อมปี พ.ศ. ที่ต้นทางในฐานข้อมูลอยู่แล้วส่วนหนึ่ง แต่ฟังก์ชันนี้ยังจำเป็นเผื่อเคสหลุดใหม่)

const BE_YEAR_THRESHOLD = 2400;
const BE_TO_CE_OFFSET = 543;

export function toGregorianDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  if (d.getFullYear() > BE_YEAR_THRESHOLD) {
    d.setFullYear(d.getFullYear() - BE_TO_CE_OFFSET);
  }

  return d;
}

export function toDateString(value) {
  const d = toGregorianDate(value);
  return d ? d.toISOString().split('T')[0] : '';
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

// 📅 แปลงวันที่ 'YYYY-MM-DD' (ค.ศ.) ให้เป็นรูปแบบไทยอ่านง่าย เช่น '10 กรกฎาคม 2569'
// (เหมือนกับ Mobile/src/utils/formatDate.js ฝั่งแอปเป๊ะ ๆ — ใช้ตอนสร้างข้อความแจ้งเตือนฝั่ง server
// เพื่อให้ข้อความ "เปลี่ยนวันจัดกิจกรรมจากวันที่ ... เป็นวันที่ ..." อ่านง่ายเหมือนที่แสดงในแอป)
export function formatThaiDate(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return dateStr;
  const month = THAI_MONTHS[m - 1] || '';
  const buddhistYear = y + 543;
  return `${d} ${month} ${buddhistYear}`;
}

// คำนวณสถานะจริงจากวันที่ (ฐาน DB status enum มีแค่ pending/published/cancelled
// ไม่มีค่า "ongoing" ให้ใช้ เลยต้องคำนวณเทียบวันที่ปัจจุบันเองแทน)
export function computeEventStatus(eventDateRaw, endDateRaw) {
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
