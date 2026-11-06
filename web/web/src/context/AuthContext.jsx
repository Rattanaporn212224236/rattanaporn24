// src/context/AuthContext.jsx
// เก็บสถานะผู้ใช้ที่ล็อกอินอยู่ทั้งแอป (token + ข้อมูลผู้ใช้ + role) ไว้ที่เดียว
// เพื่อให้ทุกหน้าเช็คสิทธิ์ (super_admin / admin) และแสดงชื่อผู้ใช้จริงได้สอดคล้องกัน

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiGet, apiPost } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('adminUser');
    return raw ? JSON.parse(raw) : null;
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsReady(true);
      return;
    }
    // ตรวจสอบ token กับเซิร์ฟเวอร์อีกครั้งตอนเปิดแอป เผื่อบัญชีถูกระงับ/ข้อมูลเปลี่ยนไปหลังล็อกอินครั้งก่อน
    apiGet('/auth/me')
      .then((res) => {
        if (res?.success) {
          setUser(res.user);
          localStorage.setItem('adminUser', JSON.stringify(res.user));
        }
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('adminUser');
      })
      .finally(() => setIsReady(true));
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await apiPost('/auth/login', { username, password });
    if (res?.success) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('adminUser', JSON.stringify(res.user));
      setUser(res.user);
    }
    return res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await apiGet('/auth/me');
    if (res?.success) {
      setUser(res.user);
      localStorage.setItem('adminUser', JSON.stringify(res.user));
    }
    return res?.user;
  }, []);

  const value = {
    user,
    isReady,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'super_admin',
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth ต้องถูกเรียกใช้ภายใน <AuthProvider>');
  return ctx;
}
