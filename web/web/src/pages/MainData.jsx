import React, { useEffect, useState } from 'react';
import '../styles/SubPages.css';
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client';
import { Building2, Pencil, Trash2 } from '../components/Icons';

const emptyForm = { dept_name: '', cat_id: '' };

// สีประจำกล่องแต่ละหมวดหมู่ วนใช้ตามลำดับ (ไม่ผูกกับชื่อหมวดหมู่ตายตัว เผื่อมีเพิ่ม/ลดหมวดหมู่ในอนาคต)
const CATEGORY_PALETTE = [
  { bg: 'var(--color-primary-light)', text: 'var(--color-primary)' },
  { bg: '#EAF2FE', text: '#2563EB' },
  { bg: '#FBF0D9', text: '#96731F' },
  { bg: '#FBE3E9', text: '#BE185D' },
];

// ฟิลด์ป้ายลอย (floating label) แบบใช้ร่วมกันในฟอร์มนี้
function FloatingInput({ label, name, value, onChange, ...rest }) {
  return (
    <div className="floating-field">
      <input id={`ff-${name}`} name={name} value={value} onChange={onChange} placeholder=" " className={value ? 'has-value' : ''} {...rest} />
      <label htmlFor={`ff-${name}`}>{label}</label>
    </div>
  );
}

function FloatingSelect({ label, name, value, onChange, children }) {
  return (
    <div className="floating-field">
      <select id={`ff-${name}`} name={name} value={value} onChange={onChange} className={value ? 'has-value' : ''}>
        {children}
      </select>
      <label htmlFor={`ff-${name}`}>{label}</label>
    </div>
  );
}

// ป๊อปอัพแก้ไขหน่วยงาน — แยกออกมาจากฟอร์มเพิ่มด้านบนของหน้า เพื่อไม่ให้ผู้ใช้ต้องเลื่อนจอขึ้นไปแก้ไข
// กดแก้ไขตรงแถวไหน ก็เด้งป๊อปอัพขึ้นมาแก้ตรงนั้นได้เลย
function DeptEditModal({ dept, categories, onClose, onSaved }) {
  const [form, setForm] = useState({ dept_name: dept.dept_name, cat_id: String(dept.cat_id) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.dept_name.trim() || !form.cat_id) {
      setError('กรุณากรอกชื่อหน่วยงานและเลือกหมวดหมู่');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiPut(`/departments/${dept.dept_id}`, form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width: '100%', maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="form-section-header" style={{ marginBottom: '18px' }}>
          <span className="form-section-icon form-section-icon--brand"><Building2 size={18} strokeWidth={1.8} /></span>
          <div>
            <h4>แก้ไขข้อมูลหน่วยงาน</h4>
            <p>แก้ไขชื่อหน่วยงานหรือเปลี่ยนหมวดหมู่ที่เกี่ยวข้อง</p>
          </div>
        </div>

        {error && <div className="alert-banner alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <FloatingSelect label="หมวดหมู่" name="cat_id" value={form.cat_id} onChange={handleChange}>
              <option value="">-- เลือกหมวดหมู่ --</option>
              {categories.map((c) => (
                <option key={c.cat_id} value={c.cat_id}>{c.cat_name}</option>
              ))}
            </FloatingSelect>

            <FloatingInput label="ชื่อหน่วยงาน (ภาษาไทย)" name="dept_name" value={form.dept_name} onChange={handleChange} />
          </div>

          <div className="form-actions-bar" style={{ marginTop: '22px' }}>
            <button type="button" className="btn-secondary-kuse" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn-kuse btn-kuse--vivid" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MainData() {
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editModalDept, setEditModalDept] = useState(null); // หน่วยงานที่กำลังแก้ไขในป๊อปอัพ (null = ปิดอยู่)
  const [deleteConfirm, setDeleteConfirm] = useState(null); // หน่วยงานที่กำลังจะลบ — ต้องยืนยันผ่านป๊อปอัพก่อนเสมอ
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [catRes, deptRes] = await Promise.all([apiGet('/departments/categories'), apiGet('/departments')]);
      setCategories(catRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // กดแก้ไขตรงแถวไหน เด้งป๊อปอัพขึ้นมาแก้ตรงนั้นเลย ไม่ต้องเลื่อนจอขึ้นไปหาฟอร์มด้านบนอีกต่อไป
  const handleEdit = (dept) => {
    setEditModalDept(dept);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.dept_name.trim() || !form.cat_id) {
      setError('กรุณากรอกชื่อหน่วยงานและเลือกหมวดหมู่');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await apiPost('/departments', form);
      setMessage('เพิ่มข้อมูลหน่วยงานเรียบร้อยแล้ว');
      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // เดิมใช้ window.confirm() มาตรฐานของเบราว์เซอร์ (ไม่สวย ไม่แมทช์ดีไซน์ระบบ) เปลี่ยนเป็นป๊อปอัพยืนยัน
  // สไตล์เดียวกับหน้าจัดการสิทธิ์ผู้ใช้ (โทนแดง) — ฟังก์ชันลบจริงยังทำงานเหมือนเดิมทุกอย่าง แค่ต้องกดยืนยันในป๊อปอัพก่อน
  const handleDelete = async (dept) => {
    setError('');
    setMessage('');
    try {
      await apiDelete(`/departments/${dept.dept_id}`);
      setMessage('ลบข้อมูลหน่วยงานเรียบร้อยแล้ว');
      if (editModalDept?.dept_id === dept.dept_id) setEditModalDept(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const performDelete = () => {
    if (!deleteConfirm) return;
    handleDelete(deleteConfirm);
    setDeleteConfirm(null);
  };

  // จัดกลุ่มหน่วยงานตามหมวดหมู่จริงที่มีในระบบ (ไม่ล็อกจำนวน/ชื่อหมวดหมู่ตายตัว)
  // departments ที่ได้จาก backend เรียงตาม cat_id แล้ว dept_id (เรียงตามลำดับที่เพิ่มเข้ามาจริง)
  // ทำให้แค่ filter ตาม cat_id ก็ยังคงลำดับ "เพิ่มใหม่อยู่ล่างสุด" ไว้ได้ในแต่ละกลุ่ม
  const categoriesWithItems = categories.map((c) => ({
    ...c,
    items: departments.filter((d) => String(d.cat_id) === String(c.cat_id)),
  }));

  return (
    <div className="subpage-container">
      <div className="maindata-header">
        <div className="maindata-header-icon"><Building2 size={22} strokeWidth={1.7} /></div>
        <div>
          <h3>จัดการข้อมูลหลักระบบ</h3>
          <p>จัดการหลักสูตร ภาควิชา หน่วยงาน และสโมสรนิสิต</p>
        </div>
      </div>

      {message && <div className="alert-banner alert-success">{message}</div>}
      {error && <div className="alert-banner alert-error">{error}</div>}

      {/* --- ฟอร์มเพิ่มข้อมูลใหม่: วางไว้บนสุด เต็มความกว้าง ปุ่มบันทึกอยู่แถวบนชิดขวา (แก้ไขแยกไปเป็นป๊อปอัพแล้ว) --- */}
      <div className="form-section-card maindata-add-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section-header maindata-add-header">
            <div className="maindata-add-header-info">
              <span className="form-section-icon form-section-icon--brand"><Building2 size={18} strokeWidth={1.8} /></span>
              <div>
                <h4>เพิ่มหลักสูตร / ภาควิชา / หน่วยงาน</h4>
                <p>กรอกชื่อหน่วยงานแล้วเลือกหมวดหมู่ที่เกี่ยวข้อง</p>
              </div>
            </div>
            <div className="maindata-form-actions">
              <button type="submit" className="btn-kuse btn-kuse--vivid" disabled={saving}>
                {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </div>

          <div className="form-grid-2">
            <FloatingSelect label="หมวดหมู่" name="cat_id" value={form.cat_id} onChange={handleChange}>
              <option value="">-- เลือกหมวดหมู่ --</option>
              {categories.map((c) => (
                <option key={c.cat_id} value={c.cat_id}>{c.cat_name}</option>
              ))}
            </FloatingSelect>

            <FloatingInput label="ชื่อหน่วยงาน (ภาษาไทย)" name="dept_name" value={form.dept_name} onChange={handleChange} />
          </div>
        </form>
      </div>

      {/* --- รายการหน่วยงาน: แยกเป็นกล่องตามหมวดหมู่จริง วางไว้ด้านล่าง --- */}
      <h4 className="maindata-section-title">รายการหน่วยงานทั้งหมด</h4>

      {loading ? (
        <div className="subpage-card">
          <p style={{ color: 'var(--color-text-secondary)', padding: '20px 0', margin: 0 }}>กำลังโหลดข้อมูล...</p>
        </div>
      ) : categoriesWithItems.length === 0 ? (
        <div className="subpage-card">
          <p style={{ color: '#A0AEC0', padding: '20px 0', margin: 0, textAlign: 'center' }}>ยังไม่มีหมวดหมู่ในระบบ</p>
        </div>
      ) : (
        categoriesWithItems.map((cat, catIdx) => {
          const palette = CATEGORY_PALETTE[catIdx % CATEGORY_PALETTE.length];
          return (
            <div className="subpage-card category-box" key={cat.cat_id}>
              <div className="category-box-header" style={{ background: palette.bg, color: palette.text }}>
                <span className="category-box-name">{cat.cat_name}</span>
                <span className="category-box-count" style={{ color: palette.text }}>{cat.items.length} รายการ</span>
              </div>

              {cat.items.length === 0 ? (
                <p style={{ color: '#A0AEC0', padding: '18px 4px 4px', margin: 0, fontSize: '13px' }}>ยังไม่มีหน่วยงานในหมวดหมู่นี้</p>
              ) : (
                <div className="table-responsive" style={{ marginTop: '14px' }}>
                  <table className="kuse-table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>ลำดับที่</th>
                        <th>หน่วยงาน/ภาควิชา</th>
                        <th style={{ textAlign: 'center' }}>การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.items.map((dept, idx) => (
                        <tr key={dept.dept_id}>
                          <td style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{idx + 1}</td>
                          <td style={{ fontWeight: 500 }}>{dept.dept_name}</td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <div className="icon-action-row">
                              <button className="btn-pill btn-pill-edit-pastel" onClick={() => handleEdit(dept)}><Pencil size={12} /> แก้ไข</button>
                              <button className="btn-pill btn-pill-delete-pastel" onClick={() => setDeleteConfirm(dept)}><Trash2 size={12} /> ลบ</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
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
                <h3 style={{ margin: '0 0 3px 0', color: '#2d3748', fontSize: '16.5px', fontWeight: '700' }}>ยืนยันลบข้อมูล</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#718096' }}>การลบไม่สามารถกู้คืนได้</p>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.65, margin: '0 0 22px' }}>
              ต้องการลบ &ldquo;<strong>{deleteConfirm.dept_name}</strong>&rdquo; ออกจากระบบใช่หรือไม่? เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลนี้กลับมาได้อีก
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn-secondary-kuse" onClick={() => setDeleteConfirm(null)}>ยกเลิก</button>
              <button
                type="button"
                className="btn-kuse"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
                  boxShadow: '0 6px 16px -4px rgba(185, 28, 28, 0.5)',
                }}
                onClick={performDelete}
              >
                <Trash2 size={15} strokeWidth={2} /> ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {editModalDept && (
        <DeptEditModal
          dept={editModalDept}
          categories={categories}
          onClose={() => setEditModalDept(null)}
          onSaved={() => {
            setEditModalDept(null);
            setMessage('แก้ไขข้อมูลหน่วยงานเรียบร้อยแล้ว');
            loadData();
          }}
        />
      )}
    </div>
  );
}
