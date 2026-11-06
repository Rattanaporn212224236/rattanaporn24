import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/SubPages.css';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPut, apiDelete, buildFileUrl } from '../api/client';
import { Pencil, Trash2, Save, AlertTriangle, Search, RefreshCw, CalendarRange, ImagePlus, X, XCircle, ChevronLeft, ChevronRight, Clock, MapPin, Building2, User, Link2, Info, UploadCloud, FolderOpen } from '../components/Icons';
import TimeSelect from '../components/TimeSelect';
import Toast from '../components/Toast';

// 📏 ขยายความสูง textarea ให้พอดีกับเนื้อหาทั้งหมดเสมอ แทนที่จะย่อเป็นกล่องเตี้ย ๆ แล้วมีแถบเลื่อนเล็ก ๆ
// ใช้เป็น ref callback (เรียกทุกครั้งที่ re-render อยู่แล้ว) จึงครอบคลุมทั้งตอนพิมพ์และตอนเปิดฟอร์มแก้ไขที่มีข้อความเดิมยาว ๆ มาก่อน
function autoGrowTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

const TIME_LABEL = { upcoming: 'กำลังจะจัด', ongoing: 'กำลังดำเนินการ', completed: 'จัดเรียบร้อยแล้ว' };
const TIME_CLASS = { upcoming: 'pending', ongoing: 'active', completed: 'active' };

// ลำดับความสำคัญในการจัดเรียง: กำลังดำเนินการ > กำลังจะจัด (ใกล้สุดก่อน) > จัดเรียบร้อยแล้ว (ล่าสุดก่อน)
const TIME_SORT_PRIORITY = { ongoing: 0, upcoming: 1, completed: 2 };

function eventDateTimeKey(ev) {
  return `${ev.event_date || ''} ${ev.event_time || '00:00:00'}`;
}

// โหมด "ใกล้จะถึงวันงาน" (สำหรับดูภาพรวม): กำลังดำเนินการ/กำลังจะจัดที่ใกล้สุดขึ้นก่อน ไล่ไปจนถึงที่จัดเสร็จแล้วล่าสุด
function sortByUpcoming(list) {
  return [...list].sort((a, b) => {
    const pa = TIME_SORT_PRIORITY[a.time_status] ?? 3;
    const pb = TIME_SORT_PRIORITY[b.time_status] ?? 3;
    if (pa !== pb) return pa - pb;
    const keyA = eventDateTimeKey(a);
    const keyB = eventDateTimeKey(b);
    // จัดเรียบร้อยแล้ว: เอาที่จัดล่าสุดขึ้นก่อน / อื่น ๆ: เอาที่ใกล้จะถึงขึ้นก่อน
    return pa === 2 ? keyB.localeCompare(keyA) : keyA.localeCompare(keyB);
  });
}

// โหมด "เพิ่งเพิ่มเข้าระบบ" (ค่าเริ่มต้น): กิจกรรมที่แอดมินเพิ่มล่าสุดอยู่บนสุด อ้างอิงวันที่สร้างจริงจากฐานข้อมูล
// ถ้าแถวใดไม่มี created_at (กันไว้เผื่อข้อมูลเก่า) จะใช้ event_id แทนเป็นลำดับสำรอง (id สูงกว่า = เพิ่มทีหลัง)
function sortByAdded(list) {
  return [...list].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : NaN;
    const tb = b.created_at ? new Date(b.created_at).getTime() : NaN;
    if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return tb - ta;
    return (b.event_id || 0) - (a.event_id || 0);
  });
}

const SORT_MODE_OPTIONS = [
  { value: 'added', label: 'กิจกรรมที่เพิ่มล่าสุด' },
  { value: 'upcoming', label: 'กิจกรรมที่ใกล้ถึงวันงาน' },
];

// 📄 จำนวนกิจกรรมต่อหน้าของตารางฝั่งเว็บ (แบ่งหน้าแทนการโชว์รวดเดียวทั้งหมด)
const PAGE_SIZE = 8;

// สร้างรายการเลขหน้าให้กด พร้อมจุดไข่ปลา (...) เมื่อมีหลายหน้าเกินไป จะได้ไม่ยาวจนล้นจอ
function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('...');
    result.push(p);
  });
  return result;
}

// รูปแบบวันที่จัดกิจกรรม/สิ้นสุด แสดงเป็น วัน เดือน ปี (เช่น 21 มิ.ย. 2569) แทนรูปแบบดิบจากฐานข้อมูล (ปี-เดือน-วัน)
const formatEventDate = (d) => {
  if (!d) return '';
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
};

const formatAddedDate = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

const formatAddedTime = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

// ป๊อปอัพแสดงรายละเอียดกิจกรรมแบบเต็ม เมื่อคลิกที่แถวในตาราง
// แสดงข้อมูลทั้งหมดของกิจกรรมนั้น พร้อมบอกว่าแอดมินคนไหนเพิ่มเมื่อไหร่ (อ้างอิงจาก created_by_name / created_at ที่ backend ส่งมาจริง)
// และมีปุ่มแก้ไข/ลบให้ทำได้จากหน้านี้เลย โดยส่งต่อไปเรียก handler เดียวกับที่ใช้ในตาราง
function EventDetailModal({ event, onClose, onEdit, onDelete }) {
  // event.images มาจาก backend เรียงรูปปกไว้ก่อนเสมอ (ORDER BY is_cover DESC, image_id ASC)
  // ใช้ลำดับนี้ตรง ๆ เป็นรายการรูปทั้งหมดที่เลื่อนดูได้ในตัวเดียว ไม่ต้องแยกส่วนปก/แกลเลอรีอีกต่อไป
  const images = event.images || [];
  const [activeIndex, setActiveIndex] = useState(0);

  const goPrev = () => setActiveIndex((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setActiveIndex((i) => (i + 1) % images.length);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card event-detail-modal"
        style={{ width: '100%', maxWidth: '720px', maxHeight: '88vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="event-detail-close" onClick={onClose} aria-label="ปิด"><X size={18} strokeWidth={2} /></button>

        {images.length > 0 && (
          <div className="event-detail-cover">
            <img src={buildFileUrl(images[activeIndex].image_url)} alt="" />
            {images.length > 1 && (
              <>
                <button type="button" className="event-detail-carousel-nav event-detail-carousel-nav--prev" onClick={goPrev} aria-label="รูปก่อนหน้า">
                  <ChevronLeft size={20} strokeWidth={2.3} />
                </button>
                <button type="button" className="event-detail-carousel-nav event-detail-carousel-nav--next" onClick={goNext} aria-label="รูปถัดไป">
                  <ChevronRight size={20} strokeWidth={2.3} />
                </button>
                <span className="event-detail-carousel-count">{activeIndex + 1} / {images.length}</span>
                <div className="event-detail-carousel-dots">
                  {images.map((img, i) => (
                    <button
                      key={img.image_id}
                      type="button"
                      className={`event-detail-carousel-dot ${i === activeIndex ? 'active' : ''}`}
                      onClick={() => setActiveIndex(i)}
                      aria-label={`ไปที่รูปที่ ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="event-detail-title-row">
          <div className="event-detail-title-col">
            <h3>{event.event_title}</h3>
            <span className={`badge-status ${TIME_CLASS[event.time_status] || 'pending'}`}>{TIME_LABEL[event.time_status] || event.time_status}</span>
          </div>
          <div className="event-detail-badges">
            <span className="event-detail-hours-badge">
              <Clock size={12} strokeWidth={2.2} /> {Number(event.volunteer_hours || 0)} ชม. จิตอาสา
            </span>
          </div>
        </div>

        <div className="event-detail-meta-grid">
          <div className="event-detail-meta-item">
            <CalendarRange size={15} strokeWidth={1.8} />
            <span>{formatEventDate(event.event_date)}{event.end_date && event.end_date !== event.event_date ? ` – ${formatEventDate(event.end_date)}` : ''}</span>
          </div>
          {event.event_time && (
            <div className="event-detail-meta-item">
              <Clock size={15} strokeWidth={1.8} />
              <span>{event.event_time.slice(0, 5)}{event.end_time ? ` - ${event.end_time.slice(0, 5)}` : ''} น.</span>
            </div>
          )}
          <div className="event-detail-meta-item">
            <MapPin size={15} strokeWidth={1.8} />
            <span>{event.location || 'ไม่ระบุสถานที่'}</span>
          </div>
          <div className="event-detail-meta-item">
            <Building2 size={15} strokeWidth={1.8} />
            <span>{event.dept_name || '-'}</span>
          </div>
        </div>

        {event.linked_departments?.length > 0 && (
          <div className="event-detail-linked-note">
            <Link2 size={14} strokeWidth={2.1} />
            <span>เชื่อมโยงกับ: {event.linked_departments.join(', ')} (กิจกรรมนี้จะถูกนับรวมเวลาดูย้อนหลังผ่านหลักสูตร/ภาควิชาที่เชื่อมกันด้วย)</span>
          </div>
        )}

        {event.registration_link && (
          <a href={event.registration_link} target="_blank" rel="noopener noreferrer" className="event-detail-registration-link">
            <Link2 size={15} strokeWidth={2} /> ลิงก์ลงทะเบียน: {event.registration_link}
          </a>
        )}

        {event.event_description && (
          <div className="event-detail-section">
            <h5>รายละเอียดกิจกรรม</h5>
            <p>{event.event_description}</p>
          </div>
        )}
        {event.objectives && (
          <div className="event-detail-section">
            <h5>วัตถุประสงค์</h5>
            <p>{event.objectives}</p>
          </div>
        )}
        {event.responsibilities && (
          <div className="event-detail-section">
            <h5>สิ่งที่ผู้เข้าร่วมต้องทำ / เตรียมตัว</h5>
            <p>{event.responsibilities}</p>
          </div>
        )}

        <div className="event-detail-footer">
          <span className="event-detail-added-by">
            <User size={13} strokeWidth={1.9} />
            เพิ่มโดย {event.created_by_name || 'ไม่ทราบผู้เพิ่ม'}
            {event.created_at ? ` · เพิ่มเมื่อ ${formatAddedDate(event.created_at)} เวลา ${formatAddedTime(event.created_at)} น.` : ''}
          </span>
          <div className="icon-action-row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn-pill btn-pill-blue" onClick={onEdit}><Pencil size={12} strokeWidth={2} /> แก้ไข</button>
            <button className="btn-pill btn-pill-danger" onClick={onDelete}><Trash2 size={12} strokeWidth={2} /> ลบ</button>
          </div>
        </div>
      </div>
    </div>
  );
}

let editPreviewIdCounter = 0;

function EditEventModal({ event, departments, isSuperAdmin, onClose, onSaved }) {
  const [form, setForm] = useState({
    event_title: event.event_title || '',
    event_description: event.event_description || '',
    objectives: event.objectives || '',
    responsibilities: event.responsibilities || '',
    registration_link: event.registration_link || '',
    event_date: event.event_date || '',
    end_date: event.end_date || '',
    event_time: (event.event_time || '').slice(0, 5),
    end_time: (event.end_time || '').slice(0, 5),
    location: event.location || '',
    volunteer_hours: event.volunteer_hours ?? '',
    dept_id: event.dept_id || '',
  });
  const [existingImages, setExistingImages] = useState(event.images || []);
  const [newPreviews, setNewPreviews] = useState([]); // [{ id, file, url, isCover }]
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    return () => newPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleAddCover = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewPreviews((prev) => [...prev.filter((p) => !p.isCover), { id: ++editPreviewIdCounter, file, url: URL.createObjectURL(file), isCover: true }]);
    e.target.value = '';
  };

  // จำกัดรวมสูงสุด 5 รูปในอัลบั้ม (ของเดิมที่ยังไม่ลบ + ของใหม่ที่เพิ่ม) ตามขอบเขตเดิมของระบบ
  const existingGalleryCount = existingImages.filter((img) => !img.is_cover).length;
  const newGalleryCount = newPreviews.filter((p) => !p.isCover).length;
  const galleryRemaining = Math.max(0, 5 - existingGalleryCount - newGalleryCount);
  const hasCover = existingImages.some((img) => img.is_cover) || newPreviews.some((p) => p.isCover);

  const handleAddGallery = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setNewPreviews((prev) => {
      const currentNewGalleryCount = prev.filter((p) => !p.isCover).length;
      const remaining = Math.max(0, 5 - existingGalleryCount - currentNewGalleryCount);
      const toAdd = files.slice(0, remaining).map((file) => ({ id: ++editPreviewIdCounter, file, url: URL.createObjectURL(file), isCover: false }));
      return [...prev, ...toAdd];
    });
    e.target.value = '';
  };

  const removeNewPreview = (id) => {
    setNewPreviews((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const removeExistingImage = async (imageId) => {
    if (!window.confirm('ลบรูปภาพนี้ออกจากกิจกรรมใช่หรือไม่?')) return;
    try {
      await apiDelete(`/events/${event.event_id}/images/${imageId}`);
      setExistingImages((prev) => prev.filter((img) => img.image_id !== imageId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!hasCover) {
      setError('กิจกรรมนี้ต้องมีรูปภาพหน้าปกเสมอ กรุณาอัปโหลดรูปภาพหน้าปกก่อนบันทึก');
      return;
    }
    if (form.end_date && form.end_date < form.event_date) {
      setError('วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มกิจกรรม');
      return;
    }
    if (form.registration_link && !/^https?:\/\//i.test(form.registration_link.trim())) {
      setError('ลิงก์ลงทะเบียนไม่ถูกต้อง กรุณาใส่ลิงก์ที่ขึ้นต้นด้วย http:// หรือ https://');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) fd.append(key, value);
      });
      const newCover = newPreviews.find((p) => p.isCover);
      if (newCover) fd.append('cover', newCover.file);
      newPreviews.filter((p) => !p.isCover).forEach((p) => fd.append('gallery', p.file));

      const res = await apiPut(`/events/${event.event_id}`, fd, { isForm: true });
      onSaved(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width: '100%', maxWidth: '760px', maxHeight: '88vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: '18px', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}><Pencil size={18} strokeWidth={1.8} /> แก้ไขกิจกรรม: {event.event_title}</h3>

        <Toast message={error} type="error" onClose={() => setError('')} />
        {error && <div className="alert-banner alert-error">{error}</div>}

        {/* 🎨 UI ของฟอร์มแก้ไข ปรับให้เหมือนหน้า "สร้างกิจกรรม" ทั้งหมด — แบ่งเป็นการ์ดย่อยมีไอคอนหัวข้อ
            และใช้โซนอัปโหลดรูปแบบเดียวกัน (ลากวาง/ปุ่มเลือกไฟล์สวย ๆ) แทนปุ่มเลือกไฟล์ดิบของเบราว์เซอร์ */}
        <form onSubmit={handleSubmit}>
          {/* --- ส่วนที่ 1: ข้อมูลกิจกรรม --- */}
          <div className="form-section-card">
            <div className="form-section-header">
              <span className="form-section-icon form-section-icon--blue"><Info size={18} strokeWidth={1.8} /></span>
              <div>
                <h4>ข้อมูลกิจกรรม</h4>
                <p>ชื่อ รายละเอียด และวัตถุประสงค์ของกิจกรรม</p>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group-kuse" style={{ gridColumn: 'span 2' }}>
                <label>ชื่อโครงการ / กิจกรรม *</label>
                <input className="form-input-kuse" name="event_title" value={form.event_title} onChange={handleChange} />
              </div>
              <div className="form-group-kuse" style={{ gridColumn: 'span 2' }}>
                <label>รายละเอียดกิจกรรม</label>
                <textarea
                  className="form-input-kuse"
                  rows="2"
                  name="event_description"
                  ref={autoGrowTextarea}
                  style={{ resize: 'vertical', overflow: 'hidden' }}
                  value={form.event_description}
                  onChange={(e) => { handleChange(e); autoGrowTextarea(e.target); }}
                ></textarea>
              </div>
              <div className="form-group-kuse" style={{ gridColumn: 'span 2' }}>
                <label>วัตถุประสงค์กิจกรรม</label>
                <textarea
                  className="form-input-kuse"
                  rows="2"
                  name="objectives"
                  ref={autoGrowTextarea}
                  style={{ resize: 'vertical', overflow: 'hidden' }}
                  value={form.objectives}
                  onChange={(e) => { handleChange(e); autoGrowTextarea(e.target); }}
                ></textarea>
              </div>
              <div className="form-group-kuse" style={{ gridColumn: 'span 2' }}>
                <label>สิ่งที่ผู้เข้าร่วมต้องทำ / เตรียมตัว</label>
                <textarea
                  className="form-input-kuse"
                  rows="2"
                  name="responsibilities"
                  ref={autoGrowTextarea}
                  style={{ resize: 'vertical', overflow: 'hidden' }}
                  value={form.responsibilities}
                  onChange={(e) => { handleChange(e); autoGrowTextarea(e.target); }}
                ></textarea>
              </div>
              {isSuperAdmin && (
                <div className="form-group-kuse" style={{ gridColumn: 'span 2' }}>
                  <label>หน่วยงานผู้รับผิดชอบ *</label>
                  <select className="form-input-kuse" name="dept_id" value={form.dept_id} onChange={handleChange}>
                    {departments.map((d) => (
                      <option key={d.dept_id} value={d.dept_id}>{d.cat_name} - {d.dept_name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* --- ส่วนที่ 2: วันเวลาและสถานที่ --- */}
          <div className="form-section-card">
            <div className="form-section-header">
              <span className="form-section-icon form-section-icon--gold"><Clock size={18} strokeWidth={1.8} /></span>
              <div>
                <h4>วันเวลาและสถานที่</h4>
                <p>กำหนดการจัดงานและสถานที่จัดกิจกรรม</p>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group-kuse">
                <label>วันที่เริ่มกิจกรรม *</label>
                <input type="date" className="form-input-kuse" name="event_date" value={form.event_date} onChange={handleChange} />
              </div>
              <div className="form-group-kuse">
                <label>วันที่สิ้นสุด (ถ้ามีหลายวัน)</label>
                <input type="date" className="form-input-kuse" name="end_date" value={form.end_date} onChange={handleChange} />
              </div>
              <div className="form-group-kuse">
                <label>เวลาเริ่มงาน *</label>
                <TimeSelect name="event_time" value={form.event_time} onChange={handleChange} />
              </div>
              <div className="form-group-kuse">
                <label>เวลาสิ้นสุด</label>
                <TimeSelect name="end_time" value={form.end_time} onChange={handleChange} />
              </div>
              <div className="form-group-kuse">
                <label>สถานที่จัดงาน</label>
                <input className="form-input-kuse" name="location" value={form.location} onChange={handleChange} />
              </div>
              <div className="form-group-kuse">
                <label>จำนวนชั่วโมงจิตอาสาที่ได้รับ</label>
                {/* onWheel={blur} กันเบราว์เซอร์แอบเปลี่ยนค่าตัวเลขตอนแค่เลื่อนจอผ่านช่องนี้ด้วยลูกกลิ้งเมาส์/แทร็กแพด (เหมือนที่แก้ไว้ในหน้าสร้างกิจกรรมแล้ว) */}
                <input type="number" min="0" step="0.5" className="form-input-kuse" name="volunteer_hours" value={form.volunteer_hours} onChange={handleChange} onWheel={(e) => e.currentTarget.blur()} />
              </div>
            </div>
          </div>

          {/* --- ส่วนที่ 3: การลงทะเบียน (ถ้ามี) --- */}
          <div className="form-section-card">
            <div className="form-section-header">
              <span className="form-section-icon form-section-icon--purple"><Link2 size={18} strokeWidth={1.8} /></span>
              <div>
                <h4>ลิงก์ลงทะเบียน (ถ้ามี)</h4>
                <p>เว้นว่างได้ถ้าเป็นกิจกรรมเชิญชวนทั่วไป ไม่ต้องลงทะเบียนล่วงหน้า</p>
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group-kuse" style={{ gridColumn: 'span 2' }}>
                <label>ลิงก์ลงทะเบียน</label>
                <input type="url" className="form-input-kuse" name="registration_link" placeholder="เช่น https://forms.gle/xxxxx" value={form.registration_link} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* --- ส่วนที่ 4: รูปภาพ --- */}
          <div className="form-section-card">
            <div className="form-section-header">
              <span className="form-section-icon form-section-icon--rose"><ImagePlus size={18} strokeWidth={1.8} /></span>
              <div>
                <h4>รูปภาพกิจกรรม</h4>
                <p>รูปหน้าปกและรูปภาพเพิ่มเติม — ดูตัวอย่างก่อนได้ กดที่ไอคอน ✕ เพื่อทิ้งรูปที่ไม่ต้องการ</p>
              </div>
            </div>

            <div className="form-grid-2">
              {existingImages.length > 0 && (
                <div className="form-group-kuse" style={{ gridColumn: 'span 2' }}>
                  <label>รูปภาพปัจจุบัน</label>
                  <div className="image-preview-grid">
                    {existingImages.map((img) => (
                      <div key={img.image_id} className={`image-preview-item ${img.is_cover ? 'image-preview-cover' : ''}`}>
                        <img src={buildFileUrl(img.image_url)} alt="" />
                        <button type="button" className="image-remove-btn" title="ลบรูปนี้" onClick={() => removeExistingImage(img.image_id)}><XCircle size={15} strokeWidth={2} /></button>
                        {!!img.is_cover && <span className="image-preview-tag">หน้าปก</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {newPreviews.length > 0 && (
                <div className="form-group-kuse" style={{ gridColumn: 'span 2' }}>
                  <label>รูปใหม่ที่จะอัปโหลดเพิ่ม (ยังไม่บันทึกจนกว่าจะกด "บันทึกการแก้ไข")</label>
                  <div className="image-preview-grid">
                    {newPreviews.map((p) => (
                      <div key={p.id} className={`image-preview-item ${p.isCover ? 'image-preview-cover' : ''}`}>
                        <img src={p.url} alt="" />
                        <button type="button" className="image-remove-btn" title="ยกเลิกรูปนี้" onClick={() => removeNewPreview(p.id)}><XCircle size={15} strokeWidth={2} /></button>
                        {p.isCover && <span className="image-preview-tag">หน้าปกใหม่</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* รูปหน้าปก: มีอยู่แล้ว → ปุ่มลิงก์เล็ก ๆ ให้เปลี่ยน / ยังไม่มี → โซนอัปโหลดใหญ่แบบหน้าสร้างกิจกรรม */}
              <div className="form-group-kuse" style={{ gridColumn: 'span 2' }}>
                {hasCover ? (
                  <>
                    <label>รูปภาพหน้าปก (Cover)</label>
                    <button type="button" className="btn-link-change" onClick={() => coverInputRef.current?.click()}>
                      <RefreshCw size={13} strokeWidth={1.9} /> เปลี่ยนรูปหน้าปก
                    </button>
                    <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAddCover} />
                  </>
                ) : (
                  <>
                    <label>รูปภาพหน้าปก (Cover) *</label>
                    <div className="upload-dropzone" onClick={() => coverInputRef.current?.click()}>
                      <div className="upload-dropzone-icon"><UploadCloud size={24} strokeWidth={1.8} /></div>
                      <div className="upload-dropzone-title">อัปโหลดรูปภาพหน้าปก</div>
                      <div className="upload-dropzone-sub">ลากไฟล์มาวางที่นี่ หรือคลิกปุ่มด้านล่างเพื่อเลือกไฟล์ (JPG, PNG)</div>
                      <button type="button" className="upload-dropzone-btn" onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}>
                        <FolderOpen size={15} strokeWidth={1.9} /> เลือกไฟล์
                      </button>
                      <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAddCover} />
                    </div>
                  </>
                )}
              </div>

              {galleryRemaining > 0 && (
                <div className="form-group-kuse" style={{ gridColumn: 'span 2' }}>
                  <label>เพิ่มรูปภาพเพิ่มเติม (เพิ่มได้อีก {galleryRemaining} รูป)</label>
                  <div className="upload-dropzone upload-dropzone--compact" onClick={() => galleryInputRef.current?.click()}>
                    <div className="upload-dropzone-icon upload-dropzone-icon--sm"><UploadCloud size={20} strokeWidth={1.8} /></div>
                    <div className="upload-dropzone-title">อัปโหลดรูปภาพเพิ่มเติม</div>
                    <div className="upload-dropzone-sub">เลือกได้หลายไฟล์พร้อมกัน (เพิ่มได้อีก {galleryRemaining} รูป)</div>
                    <button type="button" className="upload-dropzone-btn" onClick={(e) => { e.stopPropagation(); galleryInputRef.current?.click(); }}>
                      <FolderOpen size={15} strokeWidth={1.9} /> เลือกไฟล์
                    </button>
                    <input ref={galleryInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleAddGallery} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions-bar">
            <button type="button" className="btn-secondary-kuse" onClick={onClose}>ปิด</button>
            <button type="submit" className="btn-kuse btn-kuse--vivid" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : (<><Save size={15} strokeWidth={1.8} /> บันทึกการแก้ไข</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EventList() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState('added');
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState(null); // กิจกรรมที่กำลังจะลบ — ต้องยืนยันผ่านป๊อปอัพก่อนเสมอ
  const [page, setPage] = useState(1); // 📄 หน้าปัจจุบันของตาราง (เริ่มที่ 1)

  const loadEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      const res = await apiGet(`/events${params.toString() ? `?${params}` : ''}`);
      setEvents(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    if (isSuperAdmin) {
      apiGet('/departments').then((res) => setDepartments(res.data || [])).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadEvents, 300); // debounce ตอนพิมพ์ค้นหา
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // 📄 ค้นหาใหม่หรือเปลี่ยนโหมดเรียงลำดับ ให้กลับไปหน้า 1 เสมอ กันเผลอค้างอยู่หน้าท้าย ๆ ที่ไม่มีข้อมูลแล้ว
  useEffect(() => {
    setPage(1);
  }, [search, sortMode]);

  // แยกการลบจริง (ไม่ถาม confirm) ออกมาต่างหาก เพื่อให้เรียกใช้ได้ทั้งจากปุ่มในตารางและปุ่มในหน้ารายละเอียด
  // โดยไม่ต้องเด้ง confirm ซ้อนกันสองครั้ง
  const deleteEventNow = async (event) => {
    setError('');
    setMessage('');
    try {
      await apiDelete(`/events/${event.event_id}`);
      setMessage('ลบกิจกรรมเรียบร้อยแล้ว');
      loadEvents();
    } catch (err) {
      setError(err.message);
    }
  };

  // เดิมใช้ window.confirm() มาตรฐานของเบราว์เซอร์ (ไม่สวย ไม่แมทช์ดีไซน์ระบบ) เปลี่ยนเป็นป๊อปอัพยืนยันสไตล์เดียวกับ
  // หน้าจัดการสิทธิ์ผู้ใช้/จัดการข้อมูลหลัก (โทนแดง) — แค่เปิดป๊อปอัพตรงนี้ ตัวลบจริงอยู่ที่ deleteEventNow เหมือนเดิม
  const handleDelete = (event) => {
    setDeleteConfirmEvent(event);
  };

  const performDeleteEvent = async () => {
    if (!deleteConfirmEvent) return;
    const target = deleteConfirmEvent;
    setDeleteConfirmEvent(null);
    await deleteEventNow(target);
  };

  const visibleEvents = useMemo(() => {
    return sortMode === 'upcoming' ? sortByUpcoming(events) : sortByAdded(events);
  }, [events, sortMode]);

  // 📄 แบ่งหน้าตารางฝั่งเว็บ หน้าละ PAGE_SIZE (8) กิจกรรม
  const totalPages = Math.max(1, Math.ceil(visibleEvents.length / PAGE_SIZE));
  const pagedEvents = useMemo(
    () => visibleEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [visibleEvents, page]
  );

  // ถ้าข้อมูลลดลง (เช่นลบกิจกรรม) จนหน้าปัจจุบันเกินจำนวนหน้าที่มีจริง ให้ถอยกลับไปหน้าสุดท้ายอัตโนมัติ
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="subpage-container">
      <div className="subpage-card">
        <h3 style={{ color: '#2d3748', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '9px' }}>
          <CalendarRange size={20} strokeWidth={1.7} /> รายการการจัดการกิจกรรมทั้งหมด{isSuperAdmin ? 'ในระบบ' : 'ที่เกี่ยวข้องกับหน่วยงานฉัน'}
        </h3>

        <Toast message={error} type="error" onClose={() => setError('')} />
        <Toast message={message} type="success" onClose={() => setMessage('')} />
        {message && <div className="alert-banner alert-success">{message}</div>}
        {error && <div className="alert-banner alert-error" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><AlertTriangle size={16} strokeWidth={1.8} /> {error}</div>}

        <div className="eventlist-toolbar">
          <div className="eventlist-search">
            <Search size={16} strokeWidth={1.8} className="eventlist-search-icon" />
            <input
              className="form-input-kuse"
              style={{ paddingLeft: '36px' }}
              placeholder="ค้นหาชื่อกิจกรรม..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="sort-toggle-group">
            {SORT_MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`sort-toggle-btn ${sortMode === opt.value ? 'active' : ''}`}
                onClick={() => setSortMode(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#718096', display: 'flex', alignItems: 'center', gap: '7px' }}><RefreshCw size={15} strokeWidth={1.8} /> กำลังโหลดข้อมูล...</p>
        ) : (
          <>
          <div className="table-responsive">
            <table className="kuse-table kuse-table--burgundy-head">
              <thead>
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }}>วันที่จัดกิจกรรม</th>
                  <th>รูปภาพ</th>
                  <th>ชื่อกิจกรรม / โครงการ</th>
                  <th>หน่วยงาน</th>
                  <th>ชั่วโมงจิตอาสา<br />ที่จะได้รับ</th>
                  <th>สถานะช่วงเวลา</th>
                  <th>ดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {visibleEvents.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#a0aec0' }}>ไม่พบกิจกรรม</td></tr>
                ) : (
                  pagedEvents.map((ev) => (
                    <tr key={ev.event_id} className="clickable-row" onClick={() => setViewingEvent(ev)}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatEventDate(ev.event_date)}</td>
                      <td>
                        {ev.images?.[0] ? (
                          <img src={buildFileUrl(ev.images[0].image_url)} alt="" className="event-thumb" />
                        ) : (
                          <div className="event-thumb event-thumb--empty"><ImagePlus size={18} strokeWidth={1.8} /></div>
                        )}
                      </td>
                      <td style={{ fontWeight: 500, color: '#4a5568' }}>
                        {ev.event_title}
                        {ev.created_at && (
                          <div style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                            อัปโหลดเมื่อ {formatAddedDate(ev.created_at)} เวลา {formatAddedTime(ev.created_at)} น.
                          </div>
                        )}
                      </td>
                      <td>{ev.dept_name || '-'}</td>
                      <td style={{ fontWeight: 'bold', color: '#1a365d' }}>{Number(ev.volunteer_hours || 0)} ชม.</td>
                      <td>
                        <span className={`badge-status ${TIME_CLASS[ev.time_status] || 'pending'}`}>{TIME_LABEL[ev.time_status] || ev.time_status}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                        <div className="icon-action-row" style={{ justifyContent: 'flex-start' }}>
                          <button className="btn-pill btn-pill-blue" onClick={() => setEditingEvent(ev)}><Pencil size={12} strokeWidth={2} /> แก้ไข</button>
                          <button className="btn-pill btn-pill-danger" onClick={() => handleDelete(ev)}><Trash2 size={12} strokeWidth={2} /> ลบ</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {visibleEvents.length > 0 && (
            <div className="eventlist-pagination">
              <span className="eventlist-pagination-summary">
                แสดง {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, visibleEvents.length)} จาก {visibleEvents.length} กิจกรรม
              </span>

              {totalPages > 1 && (
                <div className="eventlist-pagination-controls">
                  <button
                    type="button"
                    className="pagination-btn pagination-nav"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="หน้าก่อนหน้า"
                  >
                    <ChevronLeft size={16} strokeWidth={2} />
                  </button>

                  {buildPageNumbers(page, totalPages).map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        className={`pagination-btn ${p === page ? 'active' : ''}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    className="pagination-btn pagination-nav"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="หน้าถัดไป"
                  >
                    <ChevronRight size={16} strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>
          )}
          </>
        )}
      </div>

      {viewingEvent && (
        <EventDetailModal
          event={viewingEvent}
          onClose={() => setViewingEvent(null)}
          onEdit={() => {
            setEditingEvent(viewingEvent);
            setViewingEvent(null);
          }}
          onDelete={() => {
            setViewingEvent(null);
            setDeleteConfirmEvent(viewingEvent);
          }}
        />
      )}

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          departments={departments}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setEditingEvent(null)}
          onSaved={() => {
            setEditingEvent(null);
            setMessage('แก้ไขกิจกรรมเรียบร้อยแล้ว');
            loadEvents();
          }}
        />
      )}

      {deleteConfirmEvent && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmEvent(null)}>
          <div className="modal-card" style={{ width: '100%', maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
              <span style={{
                width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                background: '#FEECEC', color: '#B91C1C',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trash2 size={18} strokeWidth={2} />
              </span>
              <div>
                <h3 style={{ margin: '0 0 3px 0', color: '#2d3748', fontSize: '16.5px', fontWeight: '700' }}>ยืนยันลบกิจกรรม</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#718096' }}>การลบไม่สามารถกู้คืนได้</p>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.65, margin: '0 0 22px' }}>
              ต้องการลบกิจกรรม &ldquo;<strong>{deleteConfirmEvent.event_title}</strong>&rdquo; ใช่หรือไม่? เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลกิจกรรมนี้กลับมาได้อีก
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn-secondary-kuse" onClick={() => setDeleteConfirmEvent(null)}>ยกเลิก</button>
              <button
                type="button"
                className="btn-kuse"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
                  boxShadow: '0 6px 16px -4px rgba(185, 28, 28, 0.5)',
                }}
                onClick={performDeleteEvent}
              >
                <Trash2 size={15} strokeWidth={2} /> ยืนยันลบกิจกรรม
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
