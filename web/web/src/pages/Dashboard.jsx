// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import '../styles/Dashboard.css';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../api/client';
import useCountUp from '../hooks/useCountUp';
import kuseLogo from '../assets/LOGO_KU.png';
import kunakaAvatar from '../assets/KUnaka.jpg';
import {
  LayoutDashboard, Users, Building2, CalendarPlus, CalendarRange, Settings, LogOut,
  TrendingUp, TrendingDown, Layers, PlayCircle, MapPin, Clock, AlertTriangle, Menu, X,
} from '../components/Icons';

// จานสีสำหรับกราฟแท่ง "อันดับกิจกรรมแยกตามหน่วยงาน" — ให้แต่ละหน่วยงานมีสีของตัวเอง
// (ใช้สีที่มีอยู่แล้วในระบบ ธีมหลัก + ทองแบรนด์ + เขียวมรกตจากโลโก้ KUSE + สีที่ใช้ซ้ำกับปุ่ม action อื่น ๆ)
const DEPT_BAR_PALETTE = ['#7B1113', '#C9A24B', '#0B7C74', '#3B82F6', '#8B5CF6', '#F59E0B'];

// รูปแบบวันที่จัดกิจกรรม แสดงเป็น วัน เดือน ปี (เช่น 21 มิ.ย. 2569) แทนรูปแบบดิบจากฐานข้อมูล (ปี-เดือน-วัน)
const formatEventDate = (d) => {
  if (!d) return '';
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
};

import SiteFooter from '../components/SiteFooter';

// Import หน้า Component ย่อยมารอแสดงผลในพื้นที่เนื้อหาขวา
import UserManagement from './UserManagement';
import MainData from './MainData';
import CreateEvent from './CreateEvent';
import EventList from './EventList';
import AccountSettings from './AccountSettings';

// เมนูทั้งหมดในระบบ จัดกลุ่มตามหมวดหมู่ พร้อมระบุว่า role ไหนมีสิทธิ์เห็นเมนูนี้บ้าง
// ตามขอบเขต: Super Admin เห็นทุกเมนู, Admin ระดับหน่วยงานไม่มีสิทธิ์ "จัดการสิทธิ์ผู้ใช้งาน" และ "จัดการข้อมูลหลัก"
const MENU_GROUPS = [
  {
    label: 'ข้อมูลวิเคราะห์',
    items: [{ key: 'dashboard', icon: LayoutDashboard, label: 'แดชบอร์ด', roles: ['super_admin', 'admin'] }],
  },
  {
    label: 'ส่วนการจัดการ',
    items: [
      { key: 'users', icon: Users, label: 'จัดการสิทธิ์ผู้ใช้งาน', roles: ['super_admin'] },
      { key: 'maindata', icon: Building2, label: 'จัดการข้อมูลหลัก', roles: ['super_admin'] },
      { key: 'create', icon: CalendarPlus, label: 'สร้างกิจกรรม', roles: ['super_admin', 'admin'] },
      { key: 'list', icon: CalendarRange, label: 'รายการกิจกรรม', roles: ['super_admin', 'admin'] },
    ],
  },
  {
    label: 'บัญชีผู้ใช้',
    items: [{ key: 'account', icon: Settings, label: 'จัดการบัญชี', roles: ['super_admin', 'admin'] }],
  },
];

const MENU_ITEMS = MENU_GROUPS.flatMap((g) => g.items);

const MENU_TITLES = {
  dashboard: 'แดชบอร์ด',
  users: 'จัดการสิทธิ์ผู้ใช้งาน',
  maindata: 'จัดการข้อมูลหลัก',
  create: 'สร้างกิจกรรมใหม่',
  list: 'การจัดการกิจกรรม',
  account: 'จัดการบัญชี',
};

const ROLE_LABEL = { super_admin: 'Super Admin', admin: 'Admin (หน่วยงาน)' };
const MONTH_LABELS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TIME_STATUS_LABEL = { upcoming: 'กำลังจะจัด', ongoing: 'กำลังดำเนินการ', completed: 'เสร็จสิ้นแล้ว' };
const TIME_STATUS_COLOR = { upcoming: '#3B82F6', ongoing: '#C9A24B', completed: '#7B1113' };

// เทียบยอดกิจกรรมเดือนปัจจุบันกับเดือนก่อนหน้า (จากข้อมูลจริงที่ backend คำนวณมาให้ใน stats.monthly)
// ใช้แสดง "แนวโน้ม" ที่มาจากข้อมูลจริงเท่านั้น ไม่ใช่ค่าที่แต่งขึ้น
function computeTrend(monthlyArr) {
  const now = new Date().getMonth();
  if (now === 0) return null; // ม.ค. ยังไม่มีเดือนก่อนหน้าในปีเดียวกันให้เทียบ
  const current = monthlyArr[now] || 0;
  const previous = monthlyArr[now - 1] || 0;
  if (previous === 0) {
    if (current === 0) return { percent: 0, up: true };
    return { percent: 100, up: true };
  }
  const percent = Math.round(((current - previous) / previous) * 100);
  return { percent: Math.abs(percent), up: percent >= 0 };
}

// การ์ด KPI พรีเมียม: ไอคอน + ตัวเลขนับไล่ขึ้น + คำอธิบายสั้น + แนวโน้ม (ถ้ามีข้อมูลจริงรองรับ)
function KpiCard({ icon: IconComp, label, value, suffix = '', variant, delay = 0, trend, sparkline }) {
  const animated = useCountUp(value);
  return (
    <div className={`kpi-card kpi-card--${variant}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="kpi-card-top">
        <div className="kpi-card-icon"><IconComp size={22} strokeWidth={1.7} /></div>
        {trend && (
          <span className={`kpi-trend ${trend.up ? 'kpi-trend--up' : 'kpi-trend--down'}`}>
            {trend.up ? <TrendingUp size={13} strokeWidth={2} /> : <TrendingDown size={13} strokeWidth={2} />}
            {trend.percent}%
          </span>
        )}
      </div>
      <h3 className="kpi-value">{animated.toLocaleString()}{suffix}</h3>
      <p className="kpi-label">{label}</p>
      {sparkline && (
        <div className="kpi-sparkline">
          <ResponsiveContainer width="100%" height={34}>
            <AreaChart data={sparkline.map((v, i) => ({ i, v }))}>
              <defs>
                <linearGradient id={`spark-${variant}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--kpi-spark-color)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--kpi-spark-color)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="var(--kpi-spark-color)" strokeWidth={2} fill={`url(#spark-${variant})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.role || 'admin';

  const visibleMenus = MENU_ITEMS.filter((item) => item.roles.includes(role));

  const [activeMenu, setActiveMenu] = useState('dashboard');
  // เมนูด้านซ้ายบนมือถือ/แท็บเล็ตแนวตั้ง: ซ่อนเป็น off-canvas แล้วเปิด/ปิดด้วยปุ่มแฮมเบอร์เกอร์
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // วันที่ปัจจุบันจริง แสดงในแถบหัวข้อ อัปเดตทุกนาทีเผื่อเปิดค้างไว้ข้ามวัน
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const todayLabel = now.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ป้องกันกรณีพิเศษ: ถ้า state ค้างอยู่ที่เมนูที่ role นี้ไม่มีสิทธิ์ (เช่น ถูกลดสิทธิ์ระหว่างใช้งาน) ให้เด้งกลับหน้าแดชบอร์ด
  useEffect(() => {
    if (!visibleMenus.some((m) => m.key === activeMenu)) {
      setActiveMenu('dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const [stats, setStats] = useState({
    total: 0,
    appUserCount: 0,
    ongoing: 0,
    upcoming: 0,
    finished: 0,
    successRate: 100,
    byDepartment: [],
  });
  const [monthlyData, setMonthlyData] = useState(new Array(12).fill(0));
  const [statsError, setStatsError] = useState('');
  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    if (activeMenu !== 'dashboard') return;

    let cancelled = false;
    apiGet('/events/stats')
      .then((data) => {
        if (cancelled || !data) return;
        setStats({
          total: data.total || 0,
          appUserCount: data.appUserCount || 0,
          ongoing: data.ongoing || 0,
          upcoming: data.upcoming || 0,
          finished: data.finished || 0,
          successRate: data.successRate ?? 100,
          byDepartment: data.byDepartment || [],
        });
        if (data.monthly) setMonthlyData(data.monthly);
        setStatsError('');
      })
      .catch((err) => setStatsError(err.message));

    // รายการล่าสุด (ใช้ endpoint /events เดิม ระบบกรองตามสิทธิ์หน่วยงานให้อัตโนมัติอยู่แล้วฝั่ง backend)
    apiGet('/events')
      .then((res) => {
        if (cancelled) return;
        setRecentEvents((res.data || []).slice(0, 5));
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [activeMenu]);

  const handleLogout = () => {
    if (window.confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
      logout();
      navigate('/');
    }
  };

  const trend = useMemo(() => computeTrend(monthlyData), [monthlyData]);

  const areaData = MONTH_LABELS.map((label, i) => ({ month: label, count: monthlyData[i] || 0 }));

  const donutData = [
    { name: TIME_STATUS_LABEL.upcoming, value: stats.upcoming, color: TIME_STATUS_COLOR.upcoming },
    { name: TIME_STATUS_LABEL.ongoing, value: stats.ongoing, color: TIME_STATUS_COLOR.ongoing },
    { name: TIME_STATUS_LABEL.completed, value: stats.finished, color: TIME_STATUS_COLOR.completed },
  ];
  const donutTotal = donutData.reduce((sum, d) => sum + d.value, 0);

  const deptRankingData = [...stats.byDepartment]
    .sort((a, b) => b.event_count - a.event_count)
    .slice(0, 6)
    .map((d) => ({ name: d.dept_name, count: d.event_count }));

  const renderContent = () => {
    switch (activeMenu) {
      case 'users':
        return role === 'super_admin' ? <UserManagement /> : null;
      case 'maindata':
        return role === 'super_admin' ? <MainData /> : null;
      case 'create':
        return <CreateEvent onCreated={() => setActiveMenu('list')} />;
      case 'list':
        return <EventList />;
      case 'account':
        return <AccountSettings />;
      case 'dashboard':
      default:
        return (
          <>
            <section className="summary-cards-container">
              <KpiCard
                icon={Layers}
                variant="primary"
                delay={0}
                label={role === 'super_admin' ? 'กิจกรรมทั้งหมด (ทุกหน่วยงาน)' : 'กิจกรรมของหน่วยงานฉัน'}
                value={stats.total}
                trend={trend}
                sparkline={monthlyData}
              />
              <KpiCard icon={PlayCircle} variant="rose" delay={80} label="กิจกรรมที่กำลังดำเนินอยู่" value={stats.ongoing} />
              <KpiCard icon={Users} variant="gold" delay={160} label="ผู้ใช้งานแอปพลิเคชัน (อุปกรณ์ที่ลงทะเบียน)" value={stats.appUserCount} />
              <KpiCard icon={TrendingUp} variant="slate" delay={240} label="อัตราการจัดสำเร็จ (ไม่ถูกยกเลิก)" value={stats.successRate} suffix="%" />
            </section>

            {statsError && <div className="alert-banner alert-error" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><AlertTriangle size={16} strokeWidth={1.8} /> {statsError}</div>}

            <section className="charts-flex-container">
              <div className="chart-box main-area-chart fade-in-up" style={{ animationDelay: '320ms' }}>
                <h4>สถิติกิจกรรมรายเดือน (ปีปัจจุบัน)</h4>
                <div style={{ height: '270px', marginTop: '14px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaData} margin={{ top: 26, right: 16, left: 4, bottom: 8 }}>
                      <defs>
                        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7B1113" stopOpacity={0.32} />
                          <stop offset="100%" stopColor="#C9A24B" stopOpacity={0.03} />
                        </linearGradient>
                        <linearGradient id="areaStroke" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#7B1113" />
                          <stop offset="100%" stopColor="#C9A24B" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E7E8F0" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: '#6B6B78' }}
                        axisLine={{ stroke: '#E7E8F0' }}
                        tickLine={false}
                        label={{ value: 'เดือน', position: 'insideBottom', offset: -6, fontSize: 11.5, fill: '#6B6B78', fontWeight: 600 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: '#6B6B78' }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'จำนวนกิจกรรม (ครั้ง)', angle: -90, position: 'insideLeft', fontSize: 11.5, fill: '#6B6B78', fontWeight: 600 }}
                      />
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E7E8F0', fontSize: 13 }} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="จำนวนกิจกรรม"
                        stroke="url(#areaStroke)"
                        strokeWidth={2.6}
                        fill="url(#areaFill)"
                        activeDot={{ r: 5, fill: '#7B1113' }}
                        label={{ position: 'top', fontSize: 10.5, fill: '#7B1113', fontWeight: 700, formatter: (v) => (v > 0 ? v : '') }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-box side-donut-chart fade-in-up" style={{ animationDelay: '400ms' }}>
                <h4>สัดส่วนสถานะกิจกรรม (ตามช่วงเวลาจริง)</h4>
                <div style={{ height: '250px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={3}
                        cornerRadius={6}
                        stroke="none"
                        label={({ percent }) => (percent > 0 ? `${Math.round(percent * 100)}%` : '')}
                        labelLine={false}
                      >
                        {donutData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E7E8F0', fontSize: 13 }} />
                      <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: 12.5 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center-label">
                    <span className="donut-center-value">{donutTotal}</span>
                    <span className="donut-center-caption">กิจกรรมทั้งหมด</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="charts-flex-container" style={{ marginTop: '25px' }}>
              {role === 'super_admin' && deptRankingData.length > 0 && (
                <div className="chart-box main-area-chart fade-in-up" style={{ animationDelay: '480ms' }}>
                  <h4>อันดับกิจกรรมแยกตามหน่วยงาน</h4>
                  <div style={{ height: '280px', marginTop: '14px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptRankingData} layout="vertical" margin={{ top: 5, right: 34, left: 10, bottom: 24 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E7E8F0" horizontal={false} />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={{ fontSize: 12, fill: '#6B6B78' }}
                          axisLine={false}
                          tickLine={false}
                          label={{ value: 'จำนวนกิจกรรม (ครั้ง)', position: 'insideBottom', offset: -14, fontSize: 11.5, fill: '#6B6B78', fontWeight: 600 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={160}
                          tick={{ fontSize: 12.5, fill: '#26262E' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E7E8F0', fontSize: 13 }} cursor={{ fill: 'rgba(123,17,19,0.05)' }} />
                        <Bar dataKey="count" name="จำนวนกิจกรรม" radius={[0, 8, 8, 0]} barSize={16} label={{ position: 'right', fontSize: 11.5, fill: '#26262E', fontWeight: 700 }}>
                          {deptRankingData.map((entry, i) => (
                            <Cell key={entry.name} fill={DEPT_BAR_PALETTE[i % DEPT_BAR_PALETTE.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="chart-box side-donut-chart fade-in-up" style={{ animationDelay: '560ms' }}>
                <h4>กิจกรรมล่าสุด</h4>
                <div className="activity-timeline">
                  {recentEvents.length === 0 ? (
                    <p className="timeline-empty">ยังไม่มีกิจกรรมในระบบ</p>
                  ) : (
                    recentEvents.map((ev) => (
                      <div className="timeline-item" key={ev.event_id}>
                        <span className={`timeline-dot timeline-dot--${ev.time_status}`} />
                        <div className="timeline-body">
                          <p className="timeline-title">{ev.event_title}</p>
                          <div className="timeline-meta">
                            <span><Clock size={12} /> {formatEventDate(ev.event_date)}</span>
                            {ev.dept_name && <span><MapPin size={12} /> {ev.dept_name}</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </>
        );
    }
  };

  return (
    <div className="dashboard-wrapper">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar-zone ${sidebarOpen ? 'sidebar-zone--open' : ''}`}>
        <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="ปิดเมนู">
          <X size={20} strokeWidth={2} />
        </button>
        <div className="sidebar-logo-container">
          <div className="sidebar-logo-chip">
            <img src={kuseLogo} alt="KUSE" className="sidebar-logo-img" />
          </div>
          <div className="sidebar-brand-title">ระบบแจ้งงานกิจกรรม</div>
          <div className="sidebar-brand-faculty">คณะวิทยาศาสตร์และวิศวกรรมศาสตร์</div>
        </div>

        <nav className="sidebar-menu">
          {MENU_GROUPS.map((group) => {
            const items = group.items.filter((item) => item.roles.includes(role));
            if (items.length === 0) return null;
            return (
              <div className="sidebar-group" key={group.label}>
                <div className="sidebar-group-label">{group.label}</div>
                {items.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={item.key}
                      className={`menu-item ${activeMenu === item.key ? 'active' : ''}`}
                      onClick={() => {
                        setActiveMenu(item.key);
                        setSidebarOpen(false); // ปิดเมนูอัตโนมัติหลังเลือกหน้าบนมือถือ
                      }}
                    >
                      <span className="menu-item-icon"><ItemIcon size={18} strokeWidth={1.8} /></span>
                      {item.label}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <LogOut size={17} strokeWidth={1.8} /> ออกจากระบบ
        </button>
      </aside>

      <main className="main-content-zone">
        <header className="content-header">
          <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(true)} aria-label="เปิดเมนู">
            <Menu size={22} strokeWidth={2} />
          </button>
          <div className="content-header-titles">
            <h2>{MENU_TITLES[activeMenu]}</h2>
            <span className="content-header-date">{todayLabel}</span>
          </div>
          <div className="admin-status">
            <div className="admin-status-text">
              <span className="bold-name">{user?.full_name || user?.username}</span>
              <span className={`role-chip role-chip--${role}`}>{ROLE_LABEL[role] || role}</span>
              {user?.dept_name && <span className="dept-chip">{user.dept_name}</span>}
              <span className="online-indicator"><i /> สถานะออนไลน์</span>
            </div>
            <div className="admin-avatar">
              <img src={kunakaAvatar} alt="KU" className="admin-avatar-img" />
            </div>
          </div>
        </header>

        {renderContent()}

        <SiteFooter />
      </main>
    </div>
  );
}
