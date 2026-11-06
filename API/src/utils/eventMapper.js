// src/utils/eventMapper.js
// 🔧 ใช้ร่วมกันระหว่าง publicEvents.routes.js, savedEvents.routes.js และ notifications.routes.js
// เพื่อแปลงคอลัมน์จาก DB (event_title, event_date, volunteer_hours, ...)
// ให้เป็นชื่อฟิลด์ที่หน้าแอปฝั่งผู้ใช้ต้องการ (title, date, activity_hours, ...)
//
// (ย้ายมาจาก Mobile/api/src/eventMapper.js — logic การแปลงข้อมูลเหมือนเดิมทุกอย่าง)

import { toDateString, computeEventStatus } from './dateUtils.js';
//
// 🖼️ เดิม (ตอนแยกเป็น 2 เซิร์ฟเวอร์) รูปกิจกรรมถูกอัปโหลด/เสิร์ฟจาก server ของฝั่งแอดมิน (คนละพอร์ตกับ
// server มือถือ) เลยต้อง hardcode โฮสต์ปลายทางผ่าน ADMIN_SERVER_URL ซึ่งมีปัญหาจริงบนมือถือเครื่องจริง:
// ตั้งเป็น "http://localhost:5000" ก็ใช้ไม่ได้บนมือถือ (localhost ของมือถือเอง ไม่ใช่ของเครื่อง server)
// ตอนนี้ API รวมเป็นเซิร์ฟเวอร์เดียวกันแล้ว จึงสร้าง URL รูปจาก "โฮสต์ที่ client เรียกเข้ามาจริง ๆ"
// (req.protocol + req.get('host')) แทน — ตรงกับ IP/พอร์ตที่แอป Expo auto-detect ไว้แล้วเป๊ะ ๆ เสมอ
// ไม่ว่าจะเปิดผ่าน localhost, IP วง LAN, หรือ tunnel ก็ตาม (ไม่ต้องตั้งค่า ADMIN_SERVER_URL เองอีกต่อไป)
function resolveOrigin(req) {
  if (req) return `${req.protocol}://${req.get('host')}`;
  // เผื่อกรณีเรียกใช้แบบไม่มี req (เช่น สคริปต์ background) - fallback ไปที่พอร์ตของ API เอง
  return process.env.ADMIN_SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
}

// 🖼️ แปลง path รูปจาก DB ("/uploads/events/xxx.png") ให้เป็น URL เต็ม ใช้ร่วมกันทั้งรูปปกและรูปรายละเอียด
export function buildImageUrl(path, req) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${resolveOrigin(req)}${path}`;
}

export function mapEventRow(row, req) {
  const dateRaw = toDateString(row.event_date);
  const endDateRaw = row.end_date ? toDateString(row.end_date) : null;
  const timeRaw = row.event_time ? String(row.event_time).slice(0, 5) : '';

  // image_path ใน DB เป็นรูปแบบ "/uploads/events/xxx.png" อยู่แล้ว (มี / นำหน้าให้เสร็จ)
  const imageUrl = buildImageUrl(row.cover_image, req);

  return {
    id: Number(row.event_id),
    title: row.event_title || '',
    description: row.event_description || '',
    objectives: row.objectives || '',
    responsibilities: row.responsibilities || '',
    date: dateRaw,
    date_raw: dateRaw,
    // 🗓️ ถ้าแอดมินเคยแก้ไขวันที่จัดกิจกรรมนี้ (ไม่ใช่วันที่ตั้งต้นตอนสร้างครั้งแรก) ฟิลด์นี้จะมีค่าเป็นวันที่เดิมก่อนแก้ไขล่าสุด
    // ใช้โชว์ป้ายแจ้งในหน้ารายละเอียดฝั่งแอปมือถือว่ากิจกรรมนี้มีการเปลี่ยนวันที่จัดงาน
    date_changed_from: row.previous_event_date ? toDateString(row.previous_event_date) : null,
    end_date: endDateRaw,
    time: timeRaw,
    end_time: row.end_time ? String(row.end_time).slice(0, 5) : null,
    location: row.location || '',
    // 🔗 ลิงก์ลงทะเบียนเข้าร่วมกิจกรรม (กรอกชื่อ/รหัสนิสิต) — แอดมินใส่ไว้ตอนสร้าง/แก้ไขกิจกรรมบนเว็บ
    // เดิมฟิลด์นี้ถูกตัดออกตอนแปลงข้อมูลส่งให้แอปมือถือ ทำให้ตั้งค่าจากฝั่งเว็บแล้วไม่โผล่ในแอป แก้ให้ส่งมาด้วย
    registration_link: row.registration_link || null,
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
export const BASE_SELECT = `
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
