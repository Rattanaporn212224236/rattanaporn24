// src/controllers/events.controller.js
import fs from 'fs';
import path from 'path';
import { pool } from '../config/db.js';
import { UPLOAD_ROOT } from '../middleware/upload.middleware.js';
import { toDateString } from '../utils/dateUtils.js';

/**
 * คำนวณสถานะกิจกรรมตามช่วงเวลาจริง (ใช้แสดงผลในแอปมือถือ/แดชบอร์ด)
 * upcoming = ยังไม่เริ่ม, ongoing = กำลังดำเนินอยู่, completed = จบแล้ว
 * (แยกจาก `status` ในฐานข้อมูลซึ่งเป็นสถานะการเผยแพร่ pending/published/cancelled)
 */
function computeTimeStatus(row) {
  const now = new Date();
  const startStr = `${row.event_date}T${row.event_time || '00:00:00'}`;
  const endDate = row.end_date || row.event_date;
  const endTime = row.end_time || '23:59:59';
  const endStr = `${endDate}T${endTime}`;

  const start = new Date(startStr);
  const end = new Date(endStr);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'upcoming';
  if (now < start) return 'upcoming';
  if (now > end) return 'completed';
  return 'ongoing';
}

function scopeToDept(req) {
  // super_admin ไม่ถูกจำกัดหน่วยงาน, admin (department) ถูกล็อกให้เห็นเฉพาะหน่วยงานตัวเอง
  return req.user.role === 'super_admin' ? null : req.user.dept_id;
}

// ภาควิชา/หลักสูตรบางคู่เป็นหน่วยงานเดียวกันจริง ๆ — ใช้วิว department_link_closure ที่สร้างไว้ใน
// bootstrapData.js (รวม dept_id ตัวเองเข้าไปให้แล้วเสมอ) แทนที่จะเขียน UNION เองซ้ำในโค้ดฝั่งนี้
// ใช้ตอน "ดู/ค้นหา" กิจกรรมเท่านั้น เพื่อให้เจอกิจกรรมของหน่วยงานที่เชื่อมกันด้วย
// (ไม่ใช้กับสิทธิ์แก้ไข/ลบ — loadEventForOwnershipCheck ยังคงล็อกเฉพาะ dept_id ตัวเองอย่างเข้มงวดเหมือนเดิม)
async function resolveDeptIdsWithLinks(deptId) {
  const [rows] = await pool.query(
    'SELECT linked_dept_id FROM department_link_closure WHERE dept_id = ?',
    [deptId]
  );
  return rows.length > 0 ? rows.map((r) => r.linked_dept_id) : [Number(deptId)];
}

// เติมชื่อหน่วยงานที่เชื่อมโยงกันไว้ (department_links) ให้แต่ละกิจกรรม เพื่อโชว์เป็นแท็กในหน้ารายละเอียด
// ให้แอดมินเห็นตรง ๆ ว่ากิจกรรมนี้จะถูกนับรวมกับหลักสูตร/ภาควิชาไหนอีกบ้าง (ไม่ใช่แค่มีผลลัพธ์ตอนค้นหาแบบมองไม่เห็น)
async function attachLinkedDepartments(rows) {
  if (rows.length === 0) return rows;
  const deptIds = [...new Set(rows.map((r) => r.dept_id).filter(Boolean))];
  if (deptIds.length === 0) return rows.map((row) => ({ ...row, linked_departments: [] }));

  const [links] = await pool.query(
    `SELECT dl.dept_id AS a_id, dl.related_dept_id AS b_id, da.dept_name AS a_name, db.dept_name AS b_name
     FROM department_links dl
     JOIN departments da ON da.dept_id = dl.dept_id
     JOIN departments db ON db.dept_id = dl.related_dept_id
     WHERE dl.dept_id IN (?) OR dl.related_dept_id IN (?)`,
    [deptIds, deptIds]
  );

  const byDept = {};
  for (const link of links) {
    (byDept[link.a_id] ||= []).push(link.b_name);
    (byDept[link.b_id] ||= []).push(link.a_name);
  }

  return rows.map((row) => ({ ...row, linked_departments: byDept[row.dept_id] || [] }));
}

async function attachImages(rows) {
  if (rows.length === 0) return rows;
  const ids = rows.map((r) => r.event_id);
  const [images] = await pool.query(
    `SELECT * FROM event_images WHERE event_id IN (?) ORDER BY is_cover DESC, image_id ASC`,
    [ids]
  );
  const byEvent = {};
  for (const img of images) {
    if (!byEvent[img.event_id]) byEvent[img.event_id] = [];
    byEvent[img.event_id].push({ ...img, image_url: `/uploads/events/${path.basename(img.image_path)}` });
  }
  return rows.map((row) => ({
    ...row,
    time_status: computeTimeStatus(row),
    images: byEvent[row.event_id] || [],
  }));
}

export async function listEvents(req, res) {
  try {
    const { status, time_status, q } = req.query;
    const forcedDept = scopeToDept(req);
    const deptFilter = req.user.role === 'super_admin' ? req.query.dept_id : forcedDept;

    const where = [];
    const params = [];

    if (deptFilter) {
      const expandedDeptIds = await resolveDeptIdsWithLinks(deptFilter);
      where.push('e.dept_id IN (?)');
      params.push(expandedDeptIds);
    }
    if (status) {
      where.push('e.status = ?');
      params.push(status);
    }
    if (q) {
      where.push('e.event_title LIKE ?');
      params.push(`%${q}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT e.*, d.dept_name AS dept_name, u.full_name AS created_by_name
       FROM events e
       LEFT JOIN departments d ON d.dept_id = e.dept_id
       LEFT JOIN users u ON u.user_id = e.created_by
       ${whereSql}
       ORDER BY e.event_date DESC, e.event_time DESC`,
      params
    );

    let withImages = await attachImages(rows);
    withImages = await attachLinkedDepartments(withImages);

    if (time_status) {
      withImages = withImages.filter((row) => row.time_status === time_status);
    }

    return res.json({ success: true, data: withImages });
  } catch (err) {
    console.error('[events.list]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลกิจกรรมได้' });
  }
}

export async function getEvent(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT e.*, d.dept_name AS dept_name, u.full_name AS created_by_name
       FROM events e
       LEFT JOIN departments d ON d.dept_id = e.dept_id
       LEFT JOIN users u ON u.user_id = e.created_by
       WHERE e.event_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรมนี้ในระบบ' });
    }

    const forcedDept = scopeToDept(req);
    if (forcedDept && rows[0].dept_id !== forcedDept) {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์เข้าถึงกิจกรรมของหน่วยงานอื่น' });
    }

    const [withImages] = await attachLinkedDepartments(await attachImages(rows));
    return res.json({ success: true, data: withImages });
  } catch (err) {
    console.error('[events.get]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลกิจกรรมได้' });
  }
}

function parseBody(body) {
  return {
    event_title: body.event_title?.trim(),
    event_description: body.event_description || null,
    objectives: body.objectives || null,
    responsibilities: body.responsibilities || null,
    registration_link: body.registration_link?.trim() || null,
    event_date: body.event_date,
    end_date: body.end_date || null,
    event_time: body.event_time,
    end_time: body.end_time || null,
    location: body.location || null,
    volunteer_hours: body.volunteer_hours ? Number(body.volunteer_hours) : 0,
    dept_id: body.dept_id ? Number(body.dept_id) : null,
  };
}

// ตรวจแบบเบา ๆ ว่าเป็นลิงก์ http(s) จริง ๆ (กันแอดมินพิมพ์ผิด/วางข้อความมาแทนลิงก์)
// ไม่ต้องเข้มงวดถึงขั้นเช็คว่าลิงก์ใช้งานได้จริงหรือไม่ เพราะเป็นลิงก์ภายนอกที่ระบบนี้ไม่ได้ควบคุม
function isValidHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

async function saveUploadedImages(eventId, files) {
  const cover = files?.cover?.[0];
  const gallery = files?.gallery || [];

  if (cover) {
    await pool.query(
      'INSERT INTO event_images (event_id, image_path, is_cover) VALUES (?, ?, 1)',
      [eventId, `/uploads/events/${cover.filename}`]
    );
  }
  for (const file of gallery) {
    await pool.query(
      'INSERT INTO event_images (event_id, image_path, is_cover) VALUES (?, ?, 0)',
      [eventId, `/uploads/events/${file.filename}`]
    );
  }
}

export async function createEvent(req, res) {
  const data = parseBody(req.body);

  if (!data.event_title || !data.event_date || !data.event_time) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อกิจกรรม วันที่ และเวลาเริ่มงานให้ครบถ้วน' });
  }

  // ทุกกิจกรรมต้องมีรูปภาพหน้าปกเสมอ (ตรวจซ้ำฝั่ง backend เผื่อมีการเรียก API ตรง ๆ โดยไม่ผ่านฟอร์ม)
  if (!req.files?.cover?.[0]) {
    return res.status(400).json({ success: false, message: 'กรุณาอัปโหลดรูปภาพหน้าปกกิจกรรม (ทุกกิจกรรมต้องมีรูปภาพหน้าปก)' });
  }

  // แอดมินระดับหน่วยงานสร้างกิจกรรมได้เฉพาะหน่วยงานตัวเองเท่านั้น (ล็อกค่า ไม่ให้ปลอมแปลง dept_id จาก client)
  const deptId = req.user.role === 'super_admin' ? data.dept_id : req.user.dept_id;
  if (!deptId) {
    return res.status(400).json({ success: false, message: 'กรุณาเลือกหน่วยงานที่รับผิดชอบกิจกรรมนี้' });
  }

  if (data.end_date && data.end_date < data.event_date) {
    return res.status(400).json({ success: false, message: 'วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มกิจกรรม' });
  }

  if (data.registration_link && !isValidHttpUrl(data.registration_link)) {
    return res.status(400).json({ success: false, message: 'ลิงก์ลงทะเบียนไม่ถูกต้อง กรุณาใส่ลิงก์ที่ขึ้นต้นด้วย http:// หรือ https://' });
  }

  try {
    // ระบบนี้ไม่มีขั้นตอนให้ super_admin อนุมัติก่อนเผยแพร่ — เมื่อแอดมิน (ไม่ว่าระดับใด) เพิ่มกิจกรรม
    // ถือว่าเผยแพร่เรียบร้อยทันที จึงตั้งค่าเริ่มต้นเป็น 'published' / is_published = 1 เสมอ
    const [result] = await pool.query(
      `INSERT INTO events
        (event_title, event_description, objectives, responsibilities, registration_link, event_date, end_date,
         event_time, end_time, location, volunteer_hours, dept_id, created_by, status, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 1)`,
      [
        data.event_title,
        data.event_description,
        data.objectives,
        data.responsibilities,
        data.registration_link,
        data.event_date,
        data.end_date,
        data.event_time,
        data.end_time,
        data.location,
        data.volunteer_hours,
        deptId,
        req.user.user_id,
      ]
    );

    await saveUploadedImages(result.insertId, req.files);

    const [rows] = await pool.query(
      `SELECT e.*, d.dept_name AS dept_name FROM events e LEFT JOIN departments d ON d.dept_id = e.dept_id WHERE e.event_id = ?`,
      [result.insertId]
    );
    const [withImages] = await attachImages(rows);

    return res.status(201).json({ success: true, data: withImages });
  } catch (err) {
    console.error('[events.create]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถสร้างกิจกรรมได้' });
  }
}

async function loadEventForOwnershipCheck(req, res, id) {
  const [rows] = await pool.query('SELECT * FROM events WHERE event_id = ?', [id]);
  if (rows.length === 0) {
    res.status(404).json({ success: false, message: 'ไม่พบกิจกรรมนี้ในระบบ' });
    return null;
  }
  const forcedDept = scopeToDept(req);
  if (forcedDept && rows[0].dept_id !== forcedDept) {
    res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์แก้ไขกิจกรรมของหน่วยงานอื่น' });
    return null;
  }
  return rows[0];
}

export async function updateEvent(req, res) {
  const { id } = req.params;
  const existing = await loadEventForOwnershipCheck(req, res, id);
  if (!existing) return;

  const data = parseBody(req.body);
  const deptId = req.user.role === 'super_admin' ? data.dept_id || existing.dept_id : existing.dept_id;

  const effectiveEventDate = data.event_date || existing.event_date;
  if (data.end_date && data.end_date < effectiveEventDate) {
    return res.status(400).json({ success: false, message: 'วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มกิจกรรม' });
  }

  if (data.registration_link && !isValidHttpUrl(data.registration_link)) {
    return res.status(400).json({ success: false, message: 'ลิงก์ลงทะเบียนไม่ถูกต้อง กรุณาใส่ลิงก์ที่ขึ้นต้นด้วย http:// หรือ https://' });
  }

  // 🗓️ ตรวจว่าการแก้ไขครั้งนี้ "เปลี่ยนวันที่จัดกิจกรรมจริง ๆ" หรือไม่ (ไม่ใช่แค่บันทึกซ้ำวันเดิม)
  // ถ้าเปลี่ยนจริง เก็บวันที่เดิมไว้ใน previous_event_date เพื่อโชว์เป็นป้ายแจ้งในหน้ารายละเอียดฝั่งแอปมือถือ
  // ("วันที่จัดกิจกรรมถูกเปลี่ยนจากวันที่ ... เป็นวันที่ ...") และเพื่อให้ระบบแจ้งเตือน 3 วันล่วงหน้า
  // (notification.service.js) รู้ว่าต้องพิจารณาแจ้งเตือนใหม่อีกครั้งสำหรับวันที่ใหม่นี้
  const eventDateChanged = !!data.event_date && toDateString(data.event_date) !== toDateString(existing.event_date);

  // ทุกกิจกรรมต้องมีรูปภาพหน้าปกเสมอ — ถ้าไม่ได้แนบรูปปกใหม่มาในคำขอนี้ ต้องมีรูปปกเดิมเหลืออยู่ในระบบแล้วเท่านั้นถึงจะบันทึกได้
  // (กรณีผู้ใช้ลบรูปปกเดิมออกไปก่อนหน้านี้ผ่าน DELETE /events/:id/images/:imageId แล้วไม่ได้อัปโหลดรูปปกใหม่มาแทน)
  if (!req.files?.cover?.[0]) {
    const [[{ coverCount }]] = await pool.query(
      'SELECT COUNT(*) AS coverCount FROM event_images WHERE event_id = ? AND is_cover = 1',
      [id]
    );
    if (coverCount === 0) {
      return res.status(400).json({ success: false, message: 'กิจกรรมนี้ยังไม่มีรูปภาพหน้าปก กรุณาอัปโหลดรูปภาพหน้าปกก่อนบันทึก' });
    }
  }

  try {
    await pool.query(
      `UPDATE events SET
        event_title = COALESCE(?, event_title),
        event_description = ?,
        objectives = ?,
        responsibilities = ?,
        registration_link = ?,
        event_date = COALESCE(?, event_date),
        previous_event_date = ?,
        end_date = ?,
        event_time = COALESCE(?, event_time),
        end_time = ?,
        location = ?,
        volunteer_hours = ?,
        dept_id = ?
       WHERE event_id = ?`,
      [
        data.event_title || null,
        data.event_description,
        data.objectives,
        data.responsibilities,
        data.registration_link,
        data.event_date || null,
        // ไม่เปลี่ยนวันที่ -> ปล่อยค่าเดิมไว้ (ไม่ใช่ COALESCE เพราะต้อง "คงค่า" ไม่ใช่ "เติมค่าตอน null")
        eventDateChanged ? toDateString(existing.event_date) : existing.previous_event_date,
        data.end_date,
        data.event_time || null,
        data.end_time,
        data.location,
        data.volunteer_hours,
        deptId,
        id,
      ]
    );

    if (req.files) {
      await saveUploadedImages(id, req.files);
    }

    const [rows] = await pool.query(
      `SELECT e.*, d.dept_name AS dept_name FROM events e LEFT JOIN departments d ON d.dept_id = e.dept_id WHERE e.event_id = ?`,
      [id]
    );
    const [withImages] = await attachImages(rows);

    return res.json({ success: true, data: withImages });
  } catch (err) {
    console.error('[events.update]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถแก้ไขข้อมูลกิจกรรมได้' });
  }
}

export async function updateEventStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!['pending', 'published', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง' });
  }

  const existing = await loadEventForOwnershipCheck(req, res, id);
  if (!existing) return;

  try {
    await pool.query('UPDATE events SET status = ?, is_published = ? WHERE event_id = ?', [
      status,
      status === 'published' ? 1 : 0,
      id,
    ]);
    return res.json({ success: true, message: 'อัปเดตสถานะกิจกรรมเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('[events.updateStatus]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถอัปเดตสถานะกิจกรรมได้' });
  }
}

export async function deleteEvent(req, res) {
  const { id } = req.params;
  const existing = await loadEventForOwnershipCheck(req, res, id);
  if (!existing) return;

  try {
    const [images] = await pool.query('SELECT image_path FROM event_images WHERE event_id = ?', [id]);
    await pool.query('DELETE FROM events WHERE event_id = ?', [id]); // event_images ถูกลบตาม ON DELETE CASCADE

    for (const img of images) {
      const filePath = path.join(UPLOAD_ROOT, path.basename(img.image_path));
      fs.unlink(filePath, () => {}); // best-effort ลบไฟล์จริงออกจาก disk
    }

    return res.json({ success: true, message: 'ลบกิจกรรมเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('[events.delete]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถลบกิจกรรมได้' });
  }
}

export async function deleteEventImage(req, res) {
  const { id, imageId } = req.params;
  const existing = await loadEventForOwnershipCheck(req, res, id);
  if (!existing) return;

  try {
    const [rows] = await pool.query('SELECT * FROM event_images WHERE image_id = ? AND event_id = ?', [imageId, id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรูปภาพนี้' });
    }
    await pool.query('DELETE FROM event_images WHERE image_id = ?', [imageId]);
    const filePath = path.join(UPLOAD_ROOT, path.basename(rows[0].image_path));
    fs.unlink(filePath, () => {});
    return res.json({ success: true, message: 'ลบรูปภาพเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('[events.deleteImage]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถลบรูปภาพได้' });
  }
}

export async function getStats(req, res) {
  try {
    const forcedDept = scopeToDept(req);
    const params = [];
    let where = '';
    if (forcedDept) {
      where = 'WHERE dept_id = ?';
      params.push(forcedDept);
    }

    const [rows] = await pool.query(
      `SELECT event_id, event_date, end_date, event_time, end_time, status FROM events ${where}`,
      params
    );

    const counts = { total: rows.length, upcoming: 0, ongoing: 0, completed: 0, pending: 0, published: 0, cancelled: 0 };
    const currentYear = new Date().getFullYear();
    const monthly = new Array(12).fill(0);

    for (const row of rows) {
      const timeStatus = computeTimeStatus(row);
      counts[timeStatus] += 1;
      counts[row.status] = (counts[row.status] || 0) + 1;

      const eventYear = new Date(row.event_date).getFullYear();
      if (eventYear === currentYear) {
        const monthIndex = new Date(row.event_date).getMonth();
        monthly[monthIndex] += 1;
      }
    }

    const successRate = counts.total > 0 ? Math.round(((counts.total - counts.cancelled) / counts.total) * 100) : 100;

    const [[{ appUserCount }]] = await pool.query('SELECT COUNT(*) AS appUserCount FROM app_users');

    let byDepartment = [];
    if (!forcedDept) {
      const [deptRows] = await pool.query(
        `SELECT d.dept_id, d.dept_name, COUNT(e.event_id) AS event_count
         FROM departments d
         LEFT JOIN events e ON e.dept_id = d.dept_id
         GROUP BY d.dept_id, d.dept_name
         ORDER BY event_count DESC`
      );
      byDepartment = deptRows;
    }

    return res.json({
      success: true,
      total: counts.total,
      upcoming: counts.upcoming,
      ongoing: counts.ongoing,
      finished: counts.completed,
      pending: counts.pending,
      published: counts.published,
      cancelled: counts.cancelled,
      successRate,
      appUserCount,
      monthly,
      byDepartment,
    });
  } catch (err) {
    console.error('[events.stats]', err);
    return res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลสถิติได้' });
  }
}
