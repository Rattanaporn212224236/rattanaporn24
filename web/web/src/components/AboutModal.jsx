// src/components/AboutModal.jsx
// ป๊อปอัพ "เกี่ยวกับผู้จัดทำ" — ให้เครดิตผู้พัฒนาระบบอิงตามหน้าปกปริญญานิพนธ์
import React from 'react';
import '../styles/Footer.css';
import meProfile from '../assets/me2-profile.jpg';
import kuseLogo from '../assets/KUSE_LOGO.png';
import advisorWalailak from '../assets/WL_s.jpg';
import advisorSasithorn from '../assets/SS_s.jpg';
import { X, GraduationCap, Users, User } from './Icons';

const advisors = [
  { name: 'ผู้ช่วยศาสตราจารย์วไลลักษณ์ วงษ์รื่น', photo: advisorWalailak },
  { name: 'ผู้ช่วยศาสตราจารย์ศศิธร สุชัยยะ', photo: advisorSasithorn },
];

export default function AboutModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="about-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="about-modal-close" onClick={onClose} aria-label="ปิด">
          <X size={18} strokeWidth={2} />
        </button>

        <div className="about-modal-header">
          <div className="about-modal-photo-ring">
            <img src={meProfile} alt="รัตนาภรณ์ ศิริฟอง" className="about-modal-photo" />
          </div>
          <div className="about-modal-heading">
            <span className="about-modal-eyebrow">ผู้พัฒนาระบบ</span>
            <h3>รัตนาภรณ์ ศิริฟอง</h3>
            <p>นักศึกษาสาขาวิชาวิทยาการคอมพิวเตอร์</p>
          </div>
        </div>

        <div className="about-modal-divider" />

        <div className="about-modal-section">
          <div className="about-modal-section-title">
            <GraduationCap size={16} strokeWidth={1.8} /> ที่มาของโครงงาน
          </div>
          <p className="about-project-title-th">ระบบแจ้งงานกิจกรรมของคณะวิทยาศาสตร์และวิศวกรรมศาสตร์ มก.ฉกส.</p>
          <p className="about-project-title-en">Event Notification System of the Faculty of Science and Engineering, CSC.KU.</p>
          <p className="about-modal-text">
            ปริญญานิพนธ์นี้เป็นส่วนหนึ่งของการศึกษาตามหลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์<br />
            ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ คณะวิทยาศาสตร์และวิศวกรรมศาสตร์<br />
            มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร &middot; พ.ศ. 2568
          </p>
        </div>

        <div className="about-modal-section">
          <div className="about-modal-section-title">
            <Users size={16} strokeWidth={1.8} /> อาจารย์ที่ปรึกษา
          </div>
          <div className="about-advisor-grid">
            {advisors.map((a) => (
              <div className="about-advisor-card" key={a.name}>
                <div className={`about-advisor-photo ${a.photo ? '' : 'about-advisor-photo--empty'}`}>
                  {a.photo ? <img src={a.photo} alt={a.name} /> : <User size={26} strokeWidth={1.6} />}
                </div>
                <span className="about-advisor-name">{a.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="about-modal-footer-brand">
          <img src={kuseLogo} alt="KUSE" />
          <span>คณะวิทยาศาสตร์และวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร</span>
        </div>
      </div>
    </div>
  );
}
