// 🔧 ใช้ร่วมกันระหว่าง events.routes.js และ saved-events.routes.js
// เพื่อแปลงคอลัมน์จาก DB (event_title, event_date, volunteer_hours, ...)
// ให้เป็นชื่อฟิลด์ที่หน้าแอปฝั่งผู้ใช้ต้องการ (title, date, activity_hours, ...)

const { toDateString, computeEventStatus } = require('./dateUtils');

// รูปกิจกรรม (event_images.image_path) ถูกอัปโหลด/เสิร์ฟจากฝั่ง server ของแอดมิน
// ไม่ใช่ server ตัวนี้ (mobile API พอร์ต 3001) เลยต้องต่อ URL ไปหา server แอดมินโดยตรง
// ตั้งค่าพอร์ต/โฮสต์ที่ถูกต้องใน server/.env -> ADMIN_SERVER_URL
const ADMIN_SERVER_URL = (process.env.ADMIN_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '');

// 🖼️ แปลง path รูปจาก DB ("/uploads/events/xxx.png") ให้เป็น URL เต็ม ใช้ร่วมกันทั้งรูปปกและรูปรายละเอียด
function buildImageUrl(path) {
  if (!path) return null;
  return /^https?:\/\//i.test(path) ? path : `${ADMIN_SERVER_URL}${path}`;
}

function mapEventRow(row) {
  const dateRaw = toDateString(row.event_date);
  const endDateRaw = row.end_date ? toDateString(row.end_date) : null;
  const timeRaw = row.event_time ? String(row.event_time).slice(0, 5) : '';

  // image_path ใน DB เป็นรูปแบบ "/uploads/events/xxx.png" อยู่แล้ว (มี / นำหน้าให้เสร็จ)
  const imageUrl = buildImageUrl(row.cover_image);

  return {
    id: Number(row.event_id),
    title: row.event_title || '',
    description: row.event_description || '',
    objectives: row.objectives || '',
    responsibilities: row.responsibilities || '',
    date: dateRaw,
    date_raw: dateRaw,
    end_date: endDateRaw,
    time: timeRaw,
    end_time: row.end_time ? String(row.end_time).slice(0, 5) : null,
    location: row.location || '',
    activity_hours: row.volunteer_hours != null ? String(row.volunteer_hours) : '0',
    dept_id: row.dept_id,
    department_name: row.dept_name || '',
    // 🎓 หลักสูตรที่ผูกกับภาควิชานี้ (ผ่านตาราง department_links) — มีได้หลายหลักสูตรต่อภาควิชา
    // ถ้าหน่วยงานที่จัดไม่ใช่ภาควิชา (ไม่มีแถวใน department_links) ค่านี้จะเป็นค่าว่าง
    program_name: row.program_names || '',
    // สถานะจริงคำนวณจากวันที่ (DB status enum มีแค่ pending/published/cancelled ไม่มี "ongoing")
    status: computeEventStatus(row.event_date, row.end_date),
    is_published: !!row.is_published,
    image_url: imageUrl,
  };
}

// 🎓 หลักสูตรของภาควิชาที่จัดกิจกรรมนี้ ผูกผ่านตาราง department_links
// (dept_id = ภาควิชา, related_dept_id = หลักสูตรที่สังกัดภาควิชานั้น — เก็บเป็นแถวใน departments เหมือนกัน)
// ใช้ GROUP_CONCAT เพราะภาควิชาหนึ่งอาจมีหลายหลักสูตร เช่น วิทยาการคอมพิวเตอร์ + เทคโนโลยีสารสนเทศ
const BASE_SELECT = `
  SELECT e.*, d.dept_name,
    (SELECT ei.image_path FROM event_images ei
       WHERE ei.event_id = e.event_id AND ei.is_cover = 1
       LIMIT 1) AS cover_image,
    (SELECT GROUP_CONCAT(d2.dept_name SEPARATOR ', ')
       FROM department_links dl
       JOIN departments d2 ON dl.related_dept_id = d2.dept_id
       WHERE dl.dept_id = e.dept_id) AS program_names
  FROM events e
  LEFT JOIN departments d ON e.dept_id = d.dept_id
`;

module.exports = { mapEventRow, BASE_SELECT, buildImageUrl };
