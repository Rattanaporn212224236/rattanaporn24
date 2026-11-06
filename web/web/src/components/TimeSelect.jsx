import React from 'react';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '30'];

/**
 * ตัวเลือกเวลาแบบ ชม./นาที แยกกัน จำกัดนาทีให้เลือกได้แค่ 00 หรือ 30
 * (กิจกรรมส่วนใหญ่เริ่ม/จบตรงนาทีกลม ๆ ทำให้เลือกง่ายและข้อมูลเวลาสม่ำเสมอกันทั้งระบบ)
 * ค่า value/onChange ยังเป็นรูปแบบ "HH:MM" string เดิม เพื่อให้เข้ากับฟอร์มที่มีอยู่แล้วโดยไม่ต้องแก้ที่อื่น
 */
export default function TimeSelect({ name, value, onChange, className = '' }) {
  const [h = '', m = ''] = (value || '').split(':');

  const emit = (nextHour, nextMinute) => {
    const nextValue = nextHour ? `${nextHour}:${nextMinute || '00'}` : '';
    onChange({ target: { name, value: nextValue } });
  };

  return (
    <div className={`time-select-group ${className}`}>
      <select className="form-input-kuse time-select-hour" value={h} onChange={(e) => emit(e.target.value, m)}>
        <option value="">ชม.</option>
        {HOURS.map((hh) => (
          <option key={hh} value={hh}>{hh}</option>
        ))}
      </select>
      <span className="time-select-colon">:</span>
      <select className="form-input-kuse time-select-minute" value={m} onChange={(e) => emit(h, e.target.value)} disabled={!h}>
        <option value="">นาที</option>
        {MINUTES.map((mm) => (
          <option key={mm} value={mm}>{mm}</option>
        ))}
      </select>
    </div>
  );
}
