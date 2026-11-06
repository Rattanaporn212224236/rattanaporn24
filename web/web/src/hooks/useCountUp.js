import { useEffect, useRef, useState } from 'react';

/**
 * นับตัวเลขไล่ขึ้นจาก 0 ไปยังค่าเป้าหมายแบบ smooth (ใช้กับการ์ดสถิติในแดชบอร์ด)
 * ให้ความรู้สึกมีชีวิตชีวาแทนที่จะโผล่ตัวเลขนิ่ง ๆ ทันที
 */
export default function useCountUp(target = 0, duration = 800) {
  const [value, setValue] = useState(0);
  const frameRef = useRef();

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = Number(target) || 0;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}
