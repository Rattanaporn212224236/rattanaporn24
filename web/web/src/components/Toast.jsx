import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, X } from './Icons';

/**
 * ป๊อบอัพแจ้งเตือนลอยอยู่บนสุดของหน้าจอเสมอ (ไม่ขึ้นกับตำแหน่งเลื่อนหน้าจอ)
 * ใช้กับข้อความ error/success ที่ต้องให้ผู้ใช้เห็นทันที เช่น ตรวจฟอร์มไม่ผ่านตอนกดบันทึก
 * ซึ่งถ้าใช้แถบแจ้งเตือนแบบเดิมที่วางอยู่บนสุดของฟอร์ม ผู้ใช้ที่เลื่อนลงมาอยู่ใกล้ปุ่มบันทึกจะไม่เห็นเลย
 */
export default function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => onClose && onClose(), 5000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast-popup toast-popup--${type}`} role="alert">
      {type === 'success' ? <CheckCircle2 size={18} strokeWidth={2} /> : <AlertTriangle size={18} strokeWidth={2} />}
      <span>{message}</span>
      <button type="button" className="toast-popup-close" onClick={onClose} aria-label="ปิด">
        <X size={14} strokeWidth={2.2} />
      </button>
    </div>
  );
}
