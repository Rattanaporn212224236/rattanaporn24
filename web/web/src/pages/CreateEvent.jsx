import React, { useEffect, useRef, useState } from 'react';
import '../styles/SubPages.css';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost } from '../api/client';
import { CalendarPlus, AlertTriangle, RefreshCw, Save, Info, Clock, MapPin, ImagePlus, UploadCloud, FolderOpen, XCircle, Link2 } from '../components/Icons';
import TimeSelect from '../components/TimeSelect';
import Toast from '../components/Toast';

// 📏 ขยายความสูง textarea ให้พอดีกับเนื้อหาทั้งหมดเสมอ แทนที่จะย่อเป็นกล่องเตี้ย ๆ แล้วมีแถบเลื่อนเล็ก ๆ
function autoGrowTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

const emptyForm = {
  event_title: '',
  event_description: '',
  objectives: '',
  responsibilities: '',
  registration_link: '',
  event_date: '',
  end_date: '',
  event_time: '',
  end_time: '',
  location: '',
  volunteer_hours: '',
  dept_id: '',
};

let previewIdCounter = 0;

const formatDateDisplay = (d) => {
  if (!d) return '';
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
};

export default function CreateEvent({ onCreated }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [coverPreview, setCoverPreview] = useState(null); // { id, file, url }
  const [galleryPreviews, setGalleryPreviews] = useState([]); // [{ id, file, url }]
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isSuperAdmin) {
      apiGet('/departments').then((res) => setDepartments(res.data || [])).catch(() => {});
    }
  }, [isSuperAdmin]);

  // เคลียร์ object URL ที่สร้างไว้ตอน component ถูกทำลาย ป้องกัน memory leak
  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview.url);
      galleryPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (coverPreview) URL.revokeObjectURL(coverPreview.url);
    setCoverPreview({ id: ++previewIdCounter, file, url: URL.createObjectURL(file) });
    e.target.value = ''; // เผื่อเลือกไฟล์เดิมซ้ำก็ยังยิง onChange
  };

  const removeCover = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview.url);
    setCoverPreview(null);
  };

  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setGalleryPreviews((prev) => {
      const next = [...prev, ...files.map((file) => ({ id: ++previewIdCounter, file, url: URL.createObjectURL(file) }))];
      return next.slice(0, 5); // จำกัดสูงสุด 5 รูปตามฝั่ง backend
    });
    e.target.value = '';
  };

  const removeGalleryItem = (id) => {
    setGalleryPreviews((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleReset = () => {
    setForm(emptyForm);
    if (coverPreview) URL.revokeObjectURL(coverPreview.url);
    galleryPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    setCoverPreview(null);
    setGalleryPreviews([]);
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!form.event_title.trim() || !form.event_date || !form.event_time) {
      setError('กรุณากรอกชื่อกิจกรรม วันที่ และเวลาเริ่มงานให้ครบถ้วน');
      return;
    }
    if (!coverPreview) {
      setError('กรุณาอัปโหลดรูปภาพหน้าปกกิจกรรม (ทุกกิจกรรมต้องมีรูปภาพหน้าปก)');
      return;
    }
    if (isSuperAdmin && !form.dept_id) {
      setError('กรุณาเลือกหน่วยงานที่รับผิดชอบกิจกรรมนี้');
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
      if (coverPreview) fd.append('cover', coverPreview.file);
      galleryPreviews.forEach((p) => fd.append('gallery', p.file));

      await apiPost('/events', fd, { isForm: true });

      setMessage('สร้างกิจกรรมเรียบร้อยแล้ว ระบบจะพาไปหน้ารายการกิจกรรม');
      handleReset();
      setTimeout(() => onCreated && onCreated(), 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- ค่าสำหรับแสดงในการ์ดพรีวิว (ไม่ใช่ state ใหม่ แค่คำนวณจากฟอร์มปัจจุบันเพื่อแสดงผลเฉย ๆ) ---
  const previewDeptLabel = (() => {
    if (!isSuperAdmin) return user?.dept_name || '';
    const d = departments.find((dep) => String(dep.dept_id) === String(form.dept_id));
    return d ? `${d.cat_name} - ${d.dept_name}` : '';
  })();
  const previewDateLabel = form.event_date
    ? `${formatDateDisplay(form.event_date)}${form.end_date && form.end_date !== form.event_date ? ` – ${formatDateDisplay(form.end_date)}` : ''}`
    : '';
  const previewTimeLabel = form.event_time ? `${form.event_time}${form.end_time ? ` – ${form.end_time}` : ' น.'}` : '';

  return (
    <div className="subpage-container">
      <Toast message={error} type="error" onClose={() => setError('')} />
      <Toast message={message} type="success" onClose={() => setMessage('')} />

      <div className="subpage-card" style={{ marginBottom: '18px' }}>
        <h3 style={{ color: '#2d3748', marginBottom: '0', display: 'flex', alignItems: 'center', gap: '9px' }}>
          <CalendarPlus size={20} strokeWidth={1.7} /> สร้างกิจกรรม/ข่าวสารใหม่ {!isSuperAdmin && user?.dept_name ? `(หน่วยงาน: ${user.dept_name})` : ''}
        </h3>
      </div>

      {message && <div className="alert-banner alert-success" style={{ marginBottom: '18px' }}>{message}</div>}
      {error && <div className="alert-banner alert-error" style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '18px' }}><AlertTriangle size={16} strokeWidth={1.8} /> {error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="event-create-layout">
          {/* ===================== คอลัมน์ซ้าย: ฟอร์มแบ่งเป็นส่วน ๆ ===================== */}
          <div>
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
                  <input type="text" name="event_title" className="form-input-kuse" placeholder="กรุณากรอกชื่อกิจกรรมหลัก" value={form.event_title} onChange={handleChange} />
                </div>

                <div className="form-group-kuse" style={{ gridColumn: 'span 2' }}>
                  <label>รายละเอียดกิจกรรม</label>
                  <textarea
                    name="event_description"
                    className="form-input-kuse"
                    rows="2"
                    placeholder="รายละเอียด/คำเชิญชวนสำหรับผู้เข้าร่วม..."
                    ref={autoGrowTextarea}
                    style={{ resize: 'vertical', overflow: 'hidden' }}
                    value={form.event_description}
                    onChange={(e) => { handleChange(e); autoGrowTextarea(e.target); }}
                  ></textarea>
                </div>

                <div className="form-group-kuse" style={{ gridColumn: 'span 2' }}>
                  <label>วัตถุประสงค์กิจกรรม</label>
                  <textarea
                    name="objectives"
                    className="form-input-kuse"
                    rows="2"
                    placeholder="ระบุรายละเอียดวัตถุประสงค์สำคัญ..."
                    ref={autoGrowTextarea}
                    style={{ resize: 'vertical', overflow: 'hidden' }}
                    value={form.objectives}
                    onChange={(e) => { handleChange(e); autoGrowTextarea(e.target); }}
                  ></textarea>
                </div>

                <div className="form-group-kuse" style={{ gridColumn: 'span 2' }}>
                  <label>สิ่งที่ผู้เข้าร่วมต้องทำ / เตรียมตัว</label>
                  <textarea
                    name="responsibilities"
                    className="form-input-kuse"
                    rows="2"
                    placeholder="เช่น การแต่งกาย กำหนดการคร่าว ๆ..."
                    ref={autoGrowTextarea}
                    style={{ resize: 'vertical', overflow: 'hidden' }}
                    value={form.responsibilities}
                    onChange={(e) => { handleChange(e); autoGrowTextarea(e.target); }}
                  ></textarea>
                </div>

                {isSuperAdmin && (
                  <div className="form-group-kuse" style={{ gridColumn: 'span 2' }}>
                    <label>หน่วยงานผู้รับผิดชอบ *</label>
                    <select name="dept_id" className="form-input-kuse" value={form.dept_id} onChange={handleChange}>
                      <option value="">-- เลือกหน่วยงาน --</option>
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
                  <input type="date" name="event_date" className="form-input-kuse" value={form.event_date} onChange={handleChange} />
                </div>
                <div className="form-group-kuse">
                  <label>วันที่สิ้นสุด (ถ้ามีหลายวัน)</label>
                  <input type="date" name="end_date" className="form-input-kuse" value={form.end_date} onChange={handleChange} />
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
                  <input type="text" name="location" className="form-input-kuse" placeholder="เช่น อาคาร 9 ห้อง 9201" value={form.location} onChange={handleChange} />
                </div>

                <div className="form-group-kuse">
                  <label>จำนวนชั่วโมงจิตอาสาที่ได้รับ</label>
                  {/* onWheel={blur} กันเบราว์เซอร์แอบเปลี่ยนค่าตัวเลขตอนผู้ใช้แค่เลื่อนจอผ่านช่องนี้ด้วยลูกกลิ้งเมาส์/แทร็กแพด
                      (ค่าเริ่มต้นของ input type=number จะบวก/ลบค่าทุกครั้งที่มีการสกอลผ่านตอนโฟกัสอยู่ ซึ่งไม่ใช่พฤติกรรมที่ต้องการ
                      ต้องการให้กรอกค่าได้เฉพาะจากการพิมพ์เท่านั้น) */}
                  <input type="number" min="0" step="0.5" name="volunteer_hours" className="form-input-kuse" placeholder="เช่น 3, 6 ชั่วโมง" value={form.volunteer_hours} onChange={handleChange} onWheel={(e) => e.currentTarget.blur()} />
                </div>
              </div>
            </div>

            {/* --- ส่วนที่ 3: การลงทะเบียน (ถ้ามี) --- */}
            <div className="form-section-card">
              <div className="form-section-header">
                <span className="form-section-icon form-section-icon--purple"><Link2 size={18} strokeWidth={1.8} /></span>
                <div>
                  <h4>ลิงก์ลงทะเบียน (ถ้ามี)</h4>
                  <p>ถ้ากิจกรรมนี้ต้องลงทะเบียนล่วงหน้า (เช่น รับสมัครสตาฟ จำกัดจำนวนคน) ใส่ลิงก์แบบฟอร์มภายนอก (Google Form, Line ฯลฯ) — ถ้าเป็นกิจกรรมเชิญชวนทั่วไป ไม่ต้องกรอกก็ได้</p>
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group-kuse" style={{ gridColumn: 'span 2' }}>
                  <label>ลิงก์ลงทะเบียน</label>
                  <input type="url" name="registration_link" className="form-input-kuse" placeholder="เช่น https://forms.gle/xxxxx" value={form.registration_link} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* --- ส่วนที่ 4: รูปภาพ --- */}
            <div className="form-section-card">
              <div className="form-section-header">
                <span className="form-section-icon form-section-icon--rose"><ImagePlus size={18} strokeWidth={1.8} /></span>
                <div>
                  <h4>รูปภาพกิจกรรม</h4>
                  <p>รูปหน้าปกและรูปภาพเพิ่มเติม (ดูตัวอย่างก่อนบันทึกได้)</p>
                </div>
              </div>

              <div className="form-grid-2">
                {/* --- รูปภาพหน้าปก: เลือกแล้วดูตัวอย่างและตัดสินใจทิ้ง/เปลี่ยนได้ก่อนบันทึกจริง --- */}
                <div className="form-group-kuse" style={{ gridColumn: 'span 2' }}>
                  <label>รูปภาพหน้าปก (Cover) *</label>
                  {coverPreview ? (
                    <>
                      <div className="image-preview-grid">
                        <div className="image-preview-item image-preview-cover">
                          <img src={coverPreview.url} alt="ตัวอย่างรูปหน้าปก" />
                          <button type="button" className="image-remove-btn" title="ลบรูปนี้" onClick={removeCover}><XCircle size={15} strokeWidth={2} /></button>
                          <span className="image-preview-tag">หน้าปก</span>
                        </div>
                      </div>
                      <button type="button" className="btn-link-change" onClick={() => coverInputRef.current?.click()}>
                        <RefreshCw size={13} strokeWidth={1.9} /> เปลี่ยนรูปหน้าปก
                      </button>
                      <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverSelect} />
                    </>
                  ) : (
                    <div className="upload-dropzone" onClick={() => coverInputRef.current?.click()}>
                      <div className="upload-dropzone-icon"><UploadCloud size={24} strokeWidth={1.8} /></div>
                      <div className="upload-dropzone-title">อัปโหลดรูปภาพหน้าปก</div>
                      <div className="upload-dropzone-sub">ลากไฟล์มาวางที่นี่ หรือคลิกปุ่มด้านล่างเพื่อเลือกไฟล์ (JPG, PNG)</div>
                      <button type="button" className="upload-dropzone-btn" onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}>
                        <FolderOpen size={15} strokeWidth={1.9} /> เลือกไฟล์
                      </button>
                      <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverSelect} />
                    </div>
                  )}
                </div>

                <div className="form-group-kuse" style={{ gridColumn: 'span 2' }}>
                  <label>รูปภาพเพิ่มเติม (สูงสุด 5 รูป) — เลือกแล้วดูตัวอย่างก่อนได้ กดที่ไอคอน ✕ เพื่อทิ้งรูปที่ไม่ต้องการ</label>
                  {galleryPreviews.length > 0 && (
                    <div className="image-preview-grid">
                      {galleryPreviews.map((p) => (
                        <div key={p.id} className="image-preview-item">
                          <img src={p.url} alt="ตัวอย่างรูปกิจกรรม" />
                          <button type="button" className="image-remove-btn" title="ลบรูปนี้" onClick={() => removeGalleryItem(p.id)}><XCircle size={15} strokeWidth={2} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {galleryPreviews.length < 5 && (
                    <div className="upload-dropzone upload-dropzone--compact" style={{ marginTop: galleryPreviews.length > 0 ? '12px' : 0 }} onClick={() => galleryInputRef.current?.click()}>
                      <div className="upload-dropzone-icon upload-dropzone-icon--sm"><UploadCloud size={20} strokeWidth={1.8} /></div>
                      <div className="upload-dropzone-title">อัปโหลดรูปภาพเพิ่มเติม</div>
                      <div className="upload-dropzone-sub">เลือกได้หลายไฟล์พร้อมกัน (สูงสุด {5 - galleryPreviews.length} รูป)</div>
                      <button type="button" className="upload-dropzone-btn" onClick={(e) => { e.stopPropagation(); galleryInputRef.current?.click(); }}>
                        <FolderOpen size={15} strokeWidth={1.9} /> เลือกไฟล์
                      </button>
                      <input ref={galleryInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleGallerySelect} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-actions-bar">
              <button type="button" className="btn-secondary-kuse" onClick={handleReset}>
                <RefreshCw size={14} strokeWidth={1.9} /> ล้างฟอร์ม
              </button>
              <button type="submit" className="btn-kuse btn-kuse--vivid" disabled={saving}>
                {saving ? 'กำลังบันทึก...' : (<><Save size={15} strokeWidth={1.8} /> บันทึกกิจกรรม</>)}
              </button>
            </div>
          </div>

          {/* ===================== คอลัมน์ขวา: การ์ดพรีวิวสด ===================== */}
          <div className="event-preview-card">
            <div className="event-preview-label"><i /> ตัวอย่างสด (Live Preview)</div>

            <div className="event-preview-cover">
              {coverPreview ? (
                <img src={coverPreview.url} alt="ตัวอย่างรูปหน้าปก" />
              ) : (
                <div className="event-preview-cover-placeholder">
                  <ImagePlus size={26} strokeWidth={1.6} />
                  <span>ยังไม่มีรูปหน้าปก</span>
                </div>
              )}
            </div>

            <div className="event-preview-body">
              <div className={`event-preview-title${form.event_title.trim() ? '' : ' event-preview-title--empty'}`}>
                {form.event_title.trim() || 'ชื่อกิจกรรมของคุณจะแสดงที่นี่'}
              </div>

              <div className="event-preview-meta">
                {(previewDateLabel || previewTimeLabel) && (
                  <div className="event-preview-meta-row">
                    <Clock size={15} strokeWidth={1.8} />
                    <span>{previewDateLabel}{previewDateLabel && previewTimeLabel ? ' · ' : ''}{previewTimeLabel}</span>
                  </div>
                )}
                {form.location && (
                  <div className="event-preview-meta-row">
                    <MapPin size={15} strokeWidth={1.8} />
                    <span>{form.location}</span>
                  </div>
                )}
                {previewDeptLabel && (
                  <div className="event-preview-meta-row">
                    <Info size={15} strokeWidth={1.8} />
                    <span>{previewDeptLabel}</span>
                  </div>
                )}
              </div>

              {form.event_description && (
                <div className="event-preview-desc">{form.event_description}</div>
              )}

              {form.volunteer_hours && (
                <span className="event-preview-hours-badge">
                  <Clock size={12} strokeWidth={2} /> {form.volunteer_hours} ชม. จิตอาสา
                </span>
              )}
              {form.registration_link && (
                <span className="event-preview-registration-badge">
                  <Link2 size={12} strokeWidth={2} /> ต้องลงทะเบียน
                </span>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
