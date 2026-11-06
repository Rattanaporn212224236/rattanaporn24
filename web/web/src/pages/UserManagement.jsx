import React, { useEffect, useState } from 'react';
import '../styles/SubPages.css';
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client';
import { Users, Pencil, Save, Plus, Ban, CheckCircle2, Lock, Trash2, Search, RefreshCw, AlertTriangle } from '../components/Icons';

const emptyForm = { username: '', password: '', full_name: '', dept_id: '', email: '', role: 'admin' };

function UserFormModal({ initial, departments, onClose, onSaved }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(
    initial
      ? { username: initial.username, full_name: initial.full_name, dept_id: initial.dept_id || '', email: initial.email || '', role: initial.role }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isEdit && (!form.username || !form.password || !form.full_name)) {
      setError('กรุณากรอก Username, Password และชื่อ-นามสกุลให้ครบถ้วน');
      return;
    }
    if (form.role === 'admin' && !form.dept_id) {
      setError('กรุณาเลือกหน่วยงานสำหรับแอดมินระดับหน่วยงาน');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await apiPut(`/users/${initial.id}`, {
          full_name: form.full_name,
          dept_id: form.role === 'super_admin' ? null : form.dept_id,
          email: form.email,
          role: form.role,
        });
      } else {
        await apiPost('/users', form);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: '18px', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isEdit ? <Pencil size={18} strokeWidth={1.8} /> : <Plus size={18} strokeWidth={1.8} />}
          {isEdit ? 'แก้ไขบัญชีผู้ดูแลระบบ' : 'เพิ่มผู้ดูแลระบบใหม่'}
        </h3>

        {error && <div className="alert-banner alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isEdit && (
            <>
              <div className="form-group-kuse">
                <label>Username</label>
                <input className="form-input-kuse" name="username" value={form.username} onChange={handleChange} />
              </div>
              <div className="form-group-kuse">
                <label>Password</label>
                <input type="password" className="form-input-kuse" name="password" value={form.password} onChange={handleChange} />
              </div>
            </>
          )}
          <div className="form-group-kuse">
            <label>ชื่อ-นามสกุล</label>
            <input className="form-input-kuse" name="full_name" value={form.full_name} onChange={handleChange} />
          </div>
          <div className="form-group-kuse">
            <label>อีเมล</label>
            <input type="email" className="form-input-kuse" name="email" value={form.email} onChange={handleChange} />
          </div>
          <div className="form-group-kuse">
            <label>ระดับสิทธิ์</label>
            <select className="form-input-kuse" name="role" value={form.role} onChange={handleChange}>
              <option value="admin">Admin (ระดับหน่วยงาน)</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          {form.role === 'admin' && (
            <div className="form-group-kuse">
              <label>หน่วยงาน</label>
              <select className="form-input-kuse" name="dept_id" value={form.dept_id} onChange={handleChange}>
                <option value="">-- เลือกหน่วยงาน --</option>
                {departments.map((d) => (
                  <option key={d.dept_id} value={d.dept_id}>{d.cat_name} - {d.dept_name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ background: '#e2e8f0', color: '#4a5568', border: 'none', padding: '10px 18px', borderRadius: '6px', marginRight: '10px', cursor: 'pointer' }}>ยกเลิก</button>
            <button type="submit" className="btn-kuse" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} disabled={saving}>
              {saving ? 'กำลังบันทึก...' : (<><Save size={15} strokeWidth={1.8} /> บันทึก</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 🔒 ตั้งรหัสผ่านใหม่ให้ผู้ใช้งาน — เดิมใช้ window.prompt() (กล่องเบราว์เซอร์มาตรฐาน ไม่สวย ไม่แมทช์ดีไซน์ระบบ)
// เปลี่ยนเป็นป๊อปอัพในสไตล์เดียวกับป๊อปอัพเตือนก่อนลบบัญชี (modal-overlay/modal-card + ไอคอนวงกลมสี)
// ฟังก์ชันการทำงานเดิม (เรียก /users/:id/reset-password) ไม่เปลี่ยนเลย แค่เปลี่ยนหน้าตา
function ResetPasswordModal({ user, onClose, onSaved }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!password || password.length < 6) {
      setError('กรุณากรอกรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน กรุณากรอกให้ตรงกัน');
      return;
    }
    setSaving(true);
    try {
      await apiPost(`/users/${user.id}/reset-password`, { new_password: password });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width: '100%', maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '18px' }}>
          <span style={{
            width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
            background: '#F1EAFE', color: '#6D28D9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={18} strokeWidth={2} />
          </span>
          <div>
            <h3 style={{ margin: '0 0 3px 0', color: '#2d3748', fontSize: '16.5px', fontWeight: '700' }}>ตั้งรหัสผ่านใหม่</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#718096' }}>สำหรับบัญชี &ldquo;{user.full_name}&rdquo;</p>
          </div>
        </div>

        {error && <div className="alert-banner alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group-kuse">
            <label>รหัสผ่านใหม่</label>
            <input
              type="password"
              className="form-input-kuse"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              autoFocus
            />
          </div>
          <div className="form-group-kuse" style={{ marginBottom: '6px' }}>
            <label>ยืนยันรหัสผ่านใหม่</label>
            <input
              type="password"
              className="form-input-kuse"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn-secondary-kuse" onClick={onClose}>ยกเลิก</button>
            <button
              type="submit"
              className="btn-kuse"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                boxShadow: '0 6px 16px -4px rgba(109, 40, 217, 0.5)',
              }}
              disabled={saving}
            >
              {saving ? 'กำลังบันทึก...' : (<><Lock size={15} strokeWidth={1.8} /> ตั้งรหัสผ่านใหม่</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [modalUser, setModalUser] = useState(undefined); // undefined = closed, null = create, object = edit
  const [deleteWarning, setDeleteWarning] = useState(null); // { user, count } — เตือนก่อนลบแอดมินที่มีกิจกรรมผูกอยู่
  const [suspendConfirm, setSuspendConfirm] = useState(null); // user ที่กำลังจะกดระงับสิทธิ์ — ต้องยืนยันก่อนเสมอ
  const [passwordModal, setPasswordModal] = useState(null); // user ที่กำลังตั้งรหัสผ่านใหม่ให้
  const [deleteConfirm, setDeleteConfirm] = useState(null); // user ที่กำลังจะลบ (ไม่มีกิจกรรมผูกอยู่) — ต้องยืนยันก่อนเสมอ

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const params = search ? `?q=${encodeURIComponent(search)}` : '';
      const resData = await apiGet(`/users${params}`);
      setUsers(resData.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiGet('/departments').then((res) => setDepartments(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchUsersData, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const displayRole = (role) => {
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'admin') return 'Admin (หน่วยงาน)';
    return role;
  };

  const toggleActive = async (user) => {
    setError(null);
    setMessage('');
    try {
      await apiPut(`/users/${user.id}`, { is_active: !user.is_active });
      setMessage(`${user.is_active ? 'ระงับ' : 'ปลดระงับ'}สิทธิ์ "${user.full_name}" เรียบร้อยแล้ว`);
      fetchUsersData();
    } catch (err) {
      setError(err.message);
    }
  };

  // 🛡️ ก่อนระงับสิทธิ์ ต้องเด้งป๊อปอัพให้ยืนยันก่อนเสมอ (กันกดพลาด — บล็อกการเข้าใช้งานของแอดมินคนนั้นทันที)
  // ส่วนปลดระงับ (คืนสิทธิ์) เป็นการกระทำที่ปลอดภัยกว่า ไม่ต้องมีป๊อปอัพยืนยัน กดแล้วทำงานได้เลยเหมือนเดิม
  const handleToggleActiveClick = (user) => {
    if (user.is_active) {
      setSuspendConfirm(user);
    } else {
      toggleActive(user);
    }
  };

  const confirmSuspend = () => {
    if (!suspendConfirm) return;
    toggleActive(suspendConfirm);
    setSuspendConfirm(null);
  };

  // backend กันเคสอันตรายไว้ให้แล้ว: ลบบัญชีตัวเองไม่ได้, ลบ Super Admin คนสุดท้ายไม่ได้,
  // และถ้าบัญชีนี้เคยสร้างกิจกรรมไว้ (มีข้อมูลผูกอยู่) จะลบไม่ได้พร้อมข้อความแนะนำให้ระงับสิทธิ์แทน
  // (การยืนยันก่อนลบทำผ่านป๊อปอัพ deleteConfirm ด้านล่างแล้ว ไม่ใช้ window.confirm() อีกต่อไป)
  const handleDeleteUser = async (user) => {
    setError(null);
    setMessage('');
    try {
      await apiDelete(`/users/${user.id}`);
      setMessage(`ลบบัญชี "${user.full_name}" เรียบร้อยแล้ว`);
      fetchUsersData();
    } catch (err) {
      // เผื่อข้อมูลจำนวนกิจกรรมที่โหลดไว้คลาดเคลื่อนไปจากฐานข้อมูลจริง (เช่นมีคนเพิ่งสร้างกิจกรรมไป)
      // backend จะสกัดไว้ที่ HTTP 409 อยู่ดี — จับเคสนี้แล้วโชว์ป๊อปอัพเตือน+แนะนำระงับสิทธิ์แบบเดียวกัน
      // แทนที่จะโชว์เป็นข้อความ error ธรรมดา
      if (err.status === 409) {
        setDeleteWarning({ user, count: user.event_count || null });
        return;
      }
      setError(err.message);
    }
  };

  // ก่อนลบ เช็คจำนวนกิจกรรมที่แอดมินคนนี้สร้างไว้ก่อนเสมอ (ได้มาพร้อมรายชื่อผู้ใช้งานจาก API แล้ว)
  // มีกิจกรรมอยู่ = ลบไม่ได้ตามกฎ ต้องเตือน+แนะนำให้ระงับสิทธิ์แทน ไม่มี = เด้งป๊อปอัพยืนยันลบก่อนเสมอ
  const confirmDeleteUser = (user) => {
    if (Number(user.event_count || 0) > 0) {
      setDeleteWarning({ user, count: user.event_count });
      return;
    }
    setDeleteConfirm(user);
  };

  const performDelete = () => {
    if (!deleteConfirm) return;
    handleDeleteUser(deleteConfirm);
    setDeleteConfirm(null);
  };

  const suspendFromWarning = () => {
    if (!deleteWarning) return;
    toggleActive(deleteWarning.user);
    setDeleteWarning(null);
  };

  return (
    <div className="subpage-container">
      <div className="subpage-card">

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span className="maindata-header-icon"><Users size={22} strokeWidth={1.7} /></span>
            <div>
              <h3 style={{ color: '#2d3748', margin: '0 0 3px 0', fontSize: '20px', fontWeight: '600' }}>จัดการสิทธิ์ผู้ใช้งาน</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#718096' }}>รายชื่อผู้ดูแลระบบ แยกตามแต่ละหน่วยงาน</p>
            </div>
          </div>
          <button className="btn-kuse" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setModalUser(null)}>
            <Plus size={16} strokeWidth={2} /> เพิ่มผู้ดูแลระบบ
          </button>
        </div>

        {message && <div className="alert-banner alert-success">{message}</div>}

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} strokeWidth={1.8} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#A0AEC0' }} />
            <input
              type="text"
              className="form-input-kuse"
              style={{ paddingLeft: '36px' }}
              placeholder="ค้นหารายชื่อแอดมินหรือหน่วยงาน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
            <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}><RefreshCw size={15} strokeWidth={1.8} /> กำลังเชื่อมต่อ API เพื่อโหลดข้อมูลจริงจากฐานข้อมูล...</p>
          </div>
        )}

        {error && (
          <div style={{ padding: '15px', background: '#fff5f5', color: '#c53030', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <AlertTriangle size={16} strokeWidth={1.8} /> เกิดข้อผิดพลาด: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="table-responsive">
            <table className="kuse-table kuse-table--soft-head">
              <thead>
                <tr>
                  <th>ชื่อ-นามสกุล</th>
                  <th>Username</th>
                  <th>หน่วยงาน</th>
                  <th>บทบาท/สิทธิ์</th>
                  <th>สถานะ</th>
                  <th style={{ textAlign: 'center', minWidth: '140px' }}>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#a0aec0' }}>
                      ไม่พบข้อมูลผู้ใช้งานในระบบฐานข้อมูล
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: '500', color: '#1a202c' }}>
                        {user.full_name || 'ไม่ได้ระบุชื่อ'}
                        {Number(user.event_count || 0) > 0 && (
                          <div style={{ fontWeight: '500', fontSize: '11.5px', color: '#92600A', marginTop: '2px' }}>
                            สร้างกิจกรรมไว้ {user.event_count} รายการ
                          </div>
                        )}
                      </td>
                      <td><span className="username-pill">{user.username}</span></td>
                      <td style={{ fontWeight: '600', color: '#4a5568' }}>{user.dept_name || 'ส่วนกลาง'}</td>
                      <td>
                        <span className={`role-pill role-pill--${user.role === 'super_admin' ? 'super_admin' : 'admin'}`}>
                          {displayRole(user.role)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-status ${user.is_active ? 'active' : 'pending'}`}>{user.is_active ? 'ใช้งานได้' : 'ถูกระงับ'}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="icon-action-row">
                          <button className="btn-icon-soft btn-icon-soft--blue" title="แก้ไขข้อมูล" onClick={() => setModalUser(user)}><Pencil size={17} strokeWidth={2.1} /></button>
                          <button
                            className={`btn-icon-soft ${user.is_active ? 'btn-icon-soft--amber' : 'btn-icon-soft--green'}`}
                            title={user.is_active ? 'ระงับสิทธิ์' : 'ปลดระงับ'}
                            onClick={() => handleToggleActiveClick(user)}
                          >
                            {user.is_active ? <Ban size={17} strokeWidth={2.1} /> : <CheckCircle2 size={17} strokeWidth={2.1} />}
                          </button>
                          <button
                            className="btn-icon-soft btn-icon-soft--purple"
                            title="รีเซ็ตรหัสผ่าน"
                            onClick={() => { setError(null); setMessage(''); setPasswordModal(user); }}
                          ><Lock size={17} strokeWidth={2.1} /></button>
                          <button
                            className="btn-icon-soft btn-icon-soft--red"
                            title={Number(user.event_count || 0) > 0 ? 'มีกิจกรรมผูกอยู่ ลบไม่ได้ — กดดูคำแนะนำ' : 'ลบบัญชี'}
                            onClick={() => confirmDeleteUser(user)}
                          ><Trash2 size={17} strokeWidth={2.1} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalUser !== undefined && (
        <UserFormModal
          initial={modalUser}
          departments={departments}
          onClose={() => setModalUser(undefined)}
          onSaved={() => {
            setModalUser(undefined);
            setMessage(modalUser ? 'แก้ไขบัญชีผู้ใช้งานเรียบร้อยแล้ว' : 'เพิ่มบัญชีผู้ใช้งานใหม่เรียบร้อยแล้ว');
            fetchUsersData();
          }}
        />
      )}

      {suspendConfirm && (
        <div className="modal-overlay" onClick={() => setSuspendConfirm(null)}>
          <div className="modal-card" style={{ width: '100%', maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
              <span style={{
                width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                background: '#FEF6DF', color: '#92600A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Ban size={19} strokeWidth={2} />
              </span>
              <div>
                <h3 style={{ margin: '0 0 3px 0', color: '#2d3748', fontSize: '16.5px', fontWeight: '700' }}>ยืนยันระงับสิทธิ์ผู้ใช้งาน</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#718096' }}>บัญชีนี้จะไม่สามารถเข้าใช้งานระบบได้ทันที</p>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.65, margin: '0 0 22px' }}>
              ต้องการระงับสิทธิ์การใช้งานของ &ldquo;<strong>{suspendConfirm.full_name}</strong>&rdquo; ใช่หรือไม่? เมื่อระงับแล้ว บัญชีนี้จะไม่สามารถเข้าสู่ระบบได้จนกว่าจะกดปลดระงับอีกครั้ง
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn-secondary-kuse" onClick={() => setSuspendConfirm(null)}>ยกเลิก</button>
              <button
                type="button"
                className="btn-kuse"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'linear-gradient(135deg, #D97706, #B45309)',
                  boxShadow: '0 6px 16px -4px rgba(180, 83, 9, 0.5)',
                }}
                onClick={confirmSuspend}
              >
                <Ban size={15} strokeWidth={2} /> ยืนยันระงับสิทธิ์
              </button>
            </div>
          </div>
        </div>
      )}

      {passwordModal && (
        <ResetPasswordModal
          user={passwordModal}
          onClose={() => setPasswordModal(null)}
          onSaved={() => {
            setMessage(`รีเซ็ตรหัสผ่านของ "${passwordModal.full_name}" เรียบร้อยแล้ว`);
            setPasswordModal(null);
          }}
        />
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
                <h3 style={{ margin: '0 0 3px 0', color: '#2d3748', fontSize: '16.5px', fontWeight: '700' }}>ยืนยันลบบัญชีผู้ใช้งาน</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#718096' }}>การลบไม่สามารถกู้คืนได้</p>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.65, margin: '0 0 22px' }}>
              ต้องการลบบัญชี &ldquo;<strong>{deleteConfirm.full_name}</strong>&rdquo; ออกจากระบบใช่หรือไม่? เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลบัญชีนี้กลับมาได้อีก
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
                <Trash2 size={15} strokeWidth={2} /> ยืนยันลบบัญชี
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteWarning && (
        <div className="modal-overlay" onClick={() => setDeleteWarning(null)}>
          <div className="modal-card" style={{ width: '100%', maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
              <span style={{
                width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                background: '#FEF6DF', color: '#92600A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle size={19} strokeWidth={2} />
              </span>
              <div>
                <h3 style={{ margin: '0 0 3px 0', color: '#2d3748', fontSize: '16.5px', fontWeight: '700' }}>ไม่สามารถลบบัญชีนี้ได้</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#718096' }}>บัญชีนี้ยังมีกิจกรรมผูกอยู่ในระบบ</p>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.65, margin: '0 0 10px' }}>
              &ldquo;<strong>{deleteWarning.user.full_name}</strong>&rdquo; เป็นผู้สร้างกิจกรรมไว้แล้ว
              {deleteWarning.count ? <> จำนวน <strong>{deleteWarning.count} กิจกรรม</strong></> : ''}
              {' '}ระบบจึงไม่อนุญาตให้ลบบัญชีนี้ เพราะกิจกรรมเหล่านั้นยังผูกอยู่กับบัญชี — หากยืนยันลบ ข้อมูลกิจกรรมที่สร้างไว้ทั้งหมดจะได้รับผลกระทบและอาจถูกลบหายไปจากระบบด้วย
            </p>
            <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.65, margin: '0 0 22px' }}>
              แนะนำให้ <strong>ระงับสิทธิ์การใช้งาน</strong> แทนการลบ เพื่อปิดกั้นการเข้าใช้งานของบัญชีนี้ โดยไม่กระทบกับกิจกรรมที่มีอยู่ในระบบ
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn-secondary-kuse" onClick={() => setDeleteWarning(null)}>ปิด</button>
              <button
                type="button"
                className="btn-kuse"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'linear-gradient(135deg, #D97706, #B45309)',
                  boxShadow: '0 6px 16px -4px rgba(180, 83, 9, 0.5)',
                }}
                onClick={suspendFromWarning}
              >
                <Ban size={15} strokeWidth={2} /> ระงับสิทธิ์แทน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
