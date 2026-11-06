// src/components/SiteFooter.jsx
// แถบท้ายเว็บไซต์ฝั่งแอดมิน: ให้เครดิตสั้น ๆ พอ ไม่เอาข้อมูลติดต่อ/โซเชียลของคณะแบบเต็มมาใส่
// (ข้อมูลติดต่อแบบเต็มควรอยู่ฝั่งแอปมือถือที่เป็นหน้าบ้านสำหรับผู้ใช้ทั่วไป ไม่ใช่หลังบ้านของแอดมิน)
import React, { useState } from 'react';
import '../styles/Footer.css';
import AboutModal from './AboutModal';
import { Info } from './Icons';

export default function SiteFooter() {
  const [showAbout, setShowAbout] = useState(false);
  const buddhistYear = new Date().getFullYear() + 543;

  return (
    <>
      <footer className="site-footer site-footer--compact">
        <strong className="site-footer-title">ระบบแจ้งงานกิจกรรม</strong>

        <div className="site-footer-divider" />

        <div className="site-footer-copyright">
          © {buddhistYear} ระบบแจ้งงานกิจกรรม คณะวิทยาศาสตร์และวิศวกรรมศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร สงวนสิทธิ์ทุกประการ
        </div>

        <button type="button" className="site-footer-quicklink" onClick={() => setShowAbout(true)}>
          <Info size={12} /> พัฒนาโดย รัตนาภรณ์ ศิริฟอง · เกี่ยวกับผู้จัดทำ
        </button>
      </footer>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </>
  );
}
