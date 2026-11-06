// src/components/Icons.jsx
// ชุดไอคอนสไตล์ Lucide (เส้น outline, minimal) แบบฝังในไฟล์เอง
// เหตุผล: แซนด์บ็อกซ์นี้ไม่มีสิทธิ์เข้าถึง npm registry เพื่อติดตั้ง lucide-react ได้จริง
// จึงสร้างชุดไอคอนที่หน้าตา/สไตล์เดียวกัน (24x24, stroke-based, currentColor) ให้ใช้แทนกันได้ทั้งระบบ
import React from 'react';

function Icon({ size = 20, strokeWidth = 1.8, className = '', children, ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon ${className}`}
      {...rest}
    >
      {children}
    </svg>
  );
}

export const LayoutDashboard = (props) => (
  <Icon {...props}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Icon>
);

export const Users = (props) => (
  <Icon {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);

export const Building2 = (props) => (
  <Icon {...props}>
    <path d="M6 22V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v18" />
    <path d="M6 12H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2" />
    <path d="M16 12h4a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-4" />
    <path d="M9 6h1M9 10h1M9 14h1M9 18h1M13 6h1M13 10h1M13 14h1M13 18h1" />
  </Icon>
);

export const CalendarPlus = (props) => (
  <Icon {...props}>
    <rect x="3" y="4" width="18" height="17" rx="2.2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <path d="M12 14v6M9 17h6" />
  </Icon>
);

export const CalendarRange = (props) => (
  <Icon {...props}>
    <rect x="3" y="4" width="18" height="17" rx="2.2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <path d="M7 14h2M11 14h2M15 14h2M7 18h2" />
  </Icon>
);

export const Settings = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 13.6a1.7 1.7 0 0 0 .3 1.9l.06.06a2.06 2.06 0 1 1-2.9 2.9l-.06-.06a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.55V20a2.06 2.06 0 1 1-4.12 0v-.1a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.9.3l-.06.06a2.06 2.06 0 1 1-2.9-2.9l.06-.06a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.55-1H4a2.06 2.06 0 1 1 0-4.12h.1a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.3-1.9l-.06-.06a2.06 2.06 0 1 1 2.9-2.9l.06.06a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.55V4a2.06 2.06 0 1 1 4.12 0v.1a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.9-.3l.06-.06a2.06 2.06 0 1 1 2.9 2.9l-.06.06a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.55 1H20a2.06 2.06 0 1 1 0 4.12h-.1a1.7 1.7 0 0 0-1.55 1z" />
  </Icon>
);

export const LogOut = (props) => (
  <Icon {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </Icon>
);

export const TrendingUp = (props) => (
  <Icon {...props}>
    <path d="M22 7 13.5 15.5 8.5 10.5 2 17" />
    <path d="M16 7h6v6" />
  </Icon>
);

export const TrendingDown = (props) => (
  <Icon {...props}>
    <path d="M22 17 13.5 8.5 8.5 13.5 2 7" />
    <path d="M16 17h6v-6" />
  </Icon>
);

export const Search = (props) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7.5" />
    <path d="M21 21l-4.4-4.4" />
  </Icon>
);

export const Pencil = (props) => (
  <Icon {...props}>
    <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
  </Icon>
);

export const Trash2 = (props) => (
  <Icon {...props}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-.9 14a2 2 0 0 1-2 1.9H7.9a2 2 0 0 1-2-1.9L5 6" />
    <path d="M10 11v6M14 11v6" />
  </Icon>
);

export const Plus = (props) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const X = (props) => (
  <Icon {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);

export const Eye = (props) => (
  <Icon {...props}>
    <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

export const EyeOff = (props) => (
  <Icon {...props}>
    <path d="M9.9 4.24A9.6 9.6 0 0 1 12 4c7 0 10.5 8 10.5 8a17 17 0 0 1-2.9 4.05M6.5 6.5A17.5 17.5 0 0 0 1.5 12s3.5 8 10.5 8a10 10 0 0 0 5-1.3" />
    <path d="M9.5 9.5a3 3 0 0 0 4.2 4.2" />
    <path d="M2 2l20 20" />
  </Icon>
);

export const Lock = (props) => (
  <Icon {...props}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
  </Icon>
);

export const User = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
  </Icon>
);

export const ShieldCheck = (props) => (
  <Icon {...props}>
    <path d="M12 2 4 5v6c0 5.25 3.44 9.98 8 11 4.56-1.02 8-5.75 8-11V5l-8-3z" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
);

export const Mail = (props) => (
  <Icon {...props}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
    <path d="M3 6l9 7 9-7" />
  </Icon>
);

export const Clock = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 7v5l3.2 2" />
  </Icon>
);

export const MapPin = (props) => (
  <Icon {...props}>
    <path d="M20 10.5c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z" />
    <circle cx="12" cy="10.5" r="2.7" />
  </Icon>
);

export const ChevronDown = (props) => (
  <Icon {...props}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);

export const KeyRound = (props) => (
  <Icon {...props}>
    <circle cx="8" cy="15" r="4.5" />
    <path d="M11.2 11.8 20 3M17 7l2.3 2.3M14 4l2.3 2.3" />
  </Icon>
);

export const Ban = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M5.5 5.5l13 13" />
  </Icon>
);

export const CheckCircle2 = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M8.2 12.3l2.5 2.5 5.1-5.6" />
  </Icon>
);

export const ImagePlus = (props) => (
  <Icon {...props}>
    <rect x="2.5" y="4.5" width="14" height="14" rx="2" />
    <circle cx="8" cy="10" r="1.6" />
    <path d="M3 16.5l4-4 3 3 2.5-2.5 4 4" />
    <path d="M19 3v6M16 6h6" />
  </Icon>
);

export const Bell = (props) => (
  <Icon {...props}>
    <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </Icon>
);

export const ChevronRight = (props) => (
  <Icon {...props}>
    <path d="M9 6l6 6-6 6" />
  </Icon>
);

export const ChevronLeft = (props) => (
  <Icon {...props}>
    <path d="M15 6l-6 6 6 6" />
  </Icon>
);

export const Link2 = (props) => (
  <Icon {...props}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Icon>
);

export const Loader = (props) => (
  <Icon {...props}>
    <path d="M12 2.5a9.5 9.5 0 1 0 9.5 9.5" />
  </Icon>
);

export const Save = (props) => (
  <Icon {...props}>
    <path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M8 3v6h8V3" />
    <path d="M7 21v-8h10v8" />
  </Icon>
);

export const AlertTriangle = (props) => (
  <Icon {...props}>
    <path d="M12 3.5 2.5 20h19L12 3.5z" />
    <path d="M12 10v4.2" />
    <path d="M12 17.4h.01" />
  </Icon>
);

export const GraduationCap = (props) => (
  <Icon {...props}>
    <path d="M12 3 1.5 8.5 12 14l10.5-5.5L12 3z" />
    <path d="M6 11.2V17c0 1.4 2.7 3 6 3s6-1.6 6-3v-5.8" />
    <path d="M22 8.5v6" />
  </Icon>
);

export const Info = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 11v6" />
    <path d="M12 7.2h.01" />
  </Icon>
);

export const Phone = (props) => (
  <Icon {...props}>
    <path d="M4 5c0-1.1.9-2 2-2h2.2c.5 0 .95.34 1.08.83l1 3.6c.1.4-.02.82-.32 1.1L8.6 10c1 2.4 3 4.4 5.4 5.4l1.47-1.36c.28-.3.7-.42 1.1-.32l3.6 1c.5.13.83.58.83 1.08V18c0 1.1-.9 2-2 2h-1C10.4 20 4 13.6 4 6V5z" />
  </Icon>
);

export const Facebook = (props) => (
  <Icon {...props}>
    <path d="M15.5 3h-2.3A4.2 4.2 0 0 0 9 7.2V10H6.7v3.2H9V21h3.3v-7.8h2.6l.6-3.2h-3.2V7.6c0-.9.4-1.4 1.5-1.4h1.7V3z" fill="currentColor" stroke="none" />
  </Icon>
);

export const RefreshCw = (props) => (
  <Icon {...props}>
    <path d="M20 7A8.5 8.5 0 0 0 5.6 5.6L4 7.2" />
    <path d="M4 3v4.2h4.2" />
    <path d="M4 17a8.5 8.5 0 0 0 14.4 1.4L20 16.8" />
    <path d="M20 21v-4.2h-4.2" />
  </Icon>
);

export const Layers = (props) => (
  <Icon {...props}>
    <path d="m12.83 2.18 8.58 3.9a1 1 0 0 1 0 1.83l-8.58 3.91a2 2 0 0 1-1.66 0L2.6 8.08a1 1 0 0 1 0-1.83l8.58-3.9a2 2 0 0 1 1.66 0Z" />
    <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
    <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
  </Icon>
);

export const PlayCircle = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="10 8 16 12 10 16 10 8" />
  </Icon>
);

export const UploadCloud = (props) => (
  <Icon {...props}>
    <path d="M12 13v8" />
    <path d="m8.5 16.5 3.5-3.5 3.5 3.5" />
    <path d="M20 16.9A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.9" />
  </Icon>
);

export const FolderOpen = (props) => (
  <Icon {...props}>
    <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />
  </Icon>
);

export const XCircle = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6M9 9l6 6" />
  </Icon>
);

export const Menu = (props) => (
  <Icon {...props}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Icon>
);
