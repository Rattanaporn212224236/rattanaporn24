import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import kuseLogo from '../assets/KUSE_LOGO.png';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, CheckCircle2, X } from '../components/Icons';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [loginStep, setLoginStep] = useState('loading'); // 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const { login, isAuthenticated, isReady } = useAuth();

  // ถ้าล็อกอินค้างอยู่แล้ว (มี token ที่ยังใช้ได้) ไม่ต้องให้กรอกฟอร์มซ้ำ พาไปหน้าแดชบอร์ดเลย
  useEffect(() => {
    if (isReady && isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isReady, isAuthenticated, navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (username && password) {
      setShowModal(true);
      setLoginStep('loading');
      setErrorMessage('');

      try {
        await login(username, password);
        setLoginStep('success');
        setTimeout(() => {
          setShowModal(false);
          navigate('/admin');
        }, 1100);
      } catch (error) {
        setLoginStep('error');
        setErrorMessage(error.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการรัน Backend');
      }
    }
  };

  return (
    <div className="login-viewport">

      {/* ฝั่งซ้าย: ภาพมหาวิทยาลัยพร้อมโทนสีเบิร์กันดีบาง ๆ */}
      <div className="login-left-pane">
        <div className="login-left-overlay" />
        <div className="kuse-info-group">
          <div className="grad-icon-circle">
            <svg viewBox="0 0 24 24" fill="currentColor" width="34" height="34">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM3.97 12.01L12 16.4l8.03-4.38c-.28.45-.75.87-1.42 1.24L12 16.85l-6.61-3.6c-.67-.37-1.14-.79-1.42-1.24z" />
            </svg>
          </div>
          <h1 className="system-title">Event Notification System</h1>
          <p className="faculty-title">คณะวิทยาศาสตร์และวิศวกรรมศาสตร์</p>
          <div className="hairline-divider" />
          <p className="university-title">
            มหาวิทยาลัยเกษตรศาสตร์<br />
            วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร
          </p>
        </div>
      </div>

      {/* ฝั่งขวา: ฟอร์มล็อกอิน */}
      <div className="login-right-pane">
        <div className="login-form-container">

          <img src={kuseLogo} alt="KUSE Logo" className="kuse-logo" />

          <h3 className="welcome-header-red">
            ยินดีต้อนรับเข้าสู่ระบบการจัดการข้อมูลงานและกิจกรรม
            <span className="welcome-sub-header">สำหรับผู้ดูแลหน่วยงาน</span>
          </h3>

          <form onSubmit={handleLoginSubmit}>
            <div className="input-wrapper">
              <label>ชื่อผู้ใช้งาน (Username)</label>
              <div className="input-relative-box">
                <input
                  type="text"
                  className="kuse-input-clean"
                  placeholder="กรุณากรอก Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-wrapper">
              <label>รหัสผ่าน (Password)</label>
              <div className="input-relative-box">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="kuse-input-clean"
                  placeholder="กรุณากรอกรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="แสดง/ซ่อนรหัสผ่าน"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <a
              href="#forgot"
              className="forgot-password-link"
              onClick={(e) => { e.preventDefault(); alert('กรุณาติดต่อผู้ดูแลระบบสูงสุดเพื่อรีเซ็ตรหัสผ่าน'); }}
            >
              ลืมรหัสผ่านใช่หรือไม่
            </a>

            <button type="submit" className="btn-login-gradient-th">
              เข้าสู่ระบบ
            </button>
          </form>

        </div>
      </div>

      {/* Popup แจ้งสถานะการเข้าสู่ระบบ แบบการ์ดกระจกลอย มินิมอล */}
      {showModal && (
        <div className="uxui-modal-overlay">
          <div className={`glass-modal-card ${loginStep}`}>

            {loginStep === 'loading' && (
              <div className="modal-content-wrapper">
                <div className="premium-gradient-spinner" />
                <h4 className="modal-title-text">กำลังตรวจสอบข้อมูล...</h4>
                <p className="modal-desc-text">โปรดรอสักครู่ ระบบกำลังเชื่อมต่อฐานข้อมูลความปลอดภัย</p>
              </div>
            )}

            {loginStep === 'success' && (
              <div className="modal-content-wrapper animation-fade-in">
                <div className="modal-icon-circle circle-success"><CheckCircle2 size={30} strokeWidth={2} /></div>
                <h4 className="modal-title-text success-color">เข้าสู่ระบบสำเร็จ</h4>
                <p className="modal-desc-text">ยินดีต้อนรับ กำลังนำท่านเข้าสู่ระบบงาน KUSE...</p>
              </div>
            )}

            {loginStep === 'error' && (
              <div className="modal-content-wrapper">
                <div className="modal-icon-circle circle-error"><X size={28} strokeWidth={2.4} /></div>
                <h4 className="modal-title-text error-color">ข้อมูลไม่ถูกต้อง</h4>
                <p className="modal-desc-text">{errorMessage}</p>
                <button
                  type="button"
                  className="btn-modal-close-gradient"
                  onClick={() => setShowModal(false)}
                >
                  ลองอีกครั้ง
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
