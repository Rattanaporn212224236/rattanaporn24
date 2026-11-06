import React, { useState } from 'react';
import '../styles/SubPages.css';
import { useAuth } from '../context/AuthContext';
import { apiPut } from '../api/client';
import { Settings, Save, Lock, User } from '../components/Icons';
// 🖼️ รูปโปรไฟล์เริ่มต้นของแอดมินทุกคน (ใช้ภาพเดียวกันแทนวงกลมตัวอักษรย่อเดิม)
import defaultAvatar from '../assets/KUnaka.jpg';

const ROLE_LABEL = { super_admin: 'Super Admin', admin: 'Admin (ระดับหน่วยงาน)' };

export default function AccountSettings() {
  const { user, refreshUser } = useAuth();

  const [email, setEmail] = useState(user?.email || '');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailMessage('');
    setEmailSaving(true);
    try {
      await apiPut('/users/me', { email });
      await refreshUser();
      setEmailMessage('อัปเดตอีเมลเรียบร้อยแล้ว');
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwMessage('');

    if (!pwForm.current_password || !pwForm.new_password) {
      setPwError('กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่');
      return;
    }
    if (pwForm.new_password.length < 6) {
      setPwError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setPwSaving(true);
    try {
      await apiPut('/users/me/password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwMessage('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="subpage-container">
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <h3 style={{ color: '#2d3748', marginBottom: '22px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px' }}>
          <Settings size={20} strokeWidth={1.7} /> จัดการบัญชีผู้ใช้งานผู้ดูแลระบบ
        </h3>

        <div className="account-profile-banner">
          <div className="account-profile-avatar">
            <img src={defaultAvatar} alt="รูปโปรไฟล์ผู้ดูแลระบบ" />
          </div>
          <p className="account-profile-name">{user?.full_name || user?.username}</p>
          <span className="account-profile-role">
            {ROLE_LABEL[user?.role] || user?.role}{user?.dept_name ? ` · ${user.dept_name}` : ''}
          </span>
        </div>

        {/* --- ส่วนที่ 1: ข้อมูลบัญชี (username + อีเมลติดต่อ) --- */}
        <div className="form-section-card account-section-card">
          <div className="form-section-header">
            <span className="form-section-icon form-section-icon--blue"><User size={18} strokeWidth={1.8} /></span>
            <div>
              <h4>ข้อมูลบัญชีผู้ใช้งาน</h4>
              <p>ชื่อผู้ใช้งานและอีเมลสำหรับติดต่อกลับ</p>
            </div>
          </div>
          <form onSubmit={handleEmailSubmit}>
            <div className="form-group-kuse">
              <label>ชื่อบัญชีผู้ใช้งาน (Username)</label>
              <input type="text" className="form-input-kuse" value={user?.username || ''} disabled style={{ background: '#f1f5f9', color: '#64748b' }} />
            </div>
            <div className="form-group-kuse">
              <label>อีเมลติดต่อกลับ</label>
              <input type="email" className="form-input-kuse" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {emailMessage && <div className="alert-banner alert-success">{emailMessage}</div>}
            {emailError && <div className="alert-banner alert-error">{emailError}</div>}
            <button type="submit" className="btn-kuse btn-kuse--vivid" style={{ width: '100%', justifyContent: 'center' }} disabled={emailSaving}>
              {emailSaving ? 'กำลังบันทึก...' : (<><Save size={15} strokeWidth={1.8} /> บันทึกข้อมูลบัญชี</>)}
            </button>
          </form>
        </div>

        {/* --- ส่วนที่ 2: เปลี่ยนรหัสผ่าน (แยกออกมาเป็นคนละโซนชัดเจน เน้นความปลอดภัย) --- */}
        <div className="form-section-card account-section-card account-section-card--security">
          <div className="form-section-header">
            <span className="form-section-icon form-section-icon--purple"><Lock size={18} strokeWidth={1.8} /></span>
            <div>
              <h4>เปลี่ยนรหัสผ่าน</h4>
              <p>เพื่อความปลอดภัยของบัญชี ควรตั้งรหัสผ่านที่คาดเดายาก</p>
            </div>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group-kuse">
              <label>รหัสผ่านปัจจุบัน</label>
              <input
                type="password"
                className="form-input-kuse"
                placeholder="••••••••"
                value={pwForm.current_password}
                onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))}
              />
            </div>
            <div className="form-group-kuse">
              <label>รหัสผ่านใหม่</label>
              <input
                type="password"
                className="form-input-kuse"
                placeholder="ป้อนรหัสผ่านใหม่ที่ต้องการตั้ง (อย่างน้อย 6 ตัวอักษร)"
                value={pwForm.new_password}
                onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
              />
            </div>
            <div className="form-group-kuse">
              <label>ยืนยันรหัสผ่านใหม่</label>
              <input
                type="password"
                className="form-input-kuse"
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                value={pwForm.confirm_password}
                onChange={(e) => setPwForm((f) => ({ ...f, confirm_password: e.target.value }))}
              />
            </div>
            {pwMessage && <div className="alert-banner alert-success">{pwMessage}</div>}
            {pwError && <div className="alert-banner alert-error">{pwError}</div>}
            <button type="submit" className="btn-kuse btn-kuse--security" style={{ width: '100%', justifyContent: 'center' }} disabled={pwSaving}>
              {pwSaving ? 'กำลังเปลี่ยนรหัสผ่าน...' : (<><Lock size={15} strokeWidth={1.8} /> เปลี่ยนรหัสผ่าน</>)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
