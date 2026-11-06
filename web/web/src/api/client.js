// src/api/client.js
// จุดกลางสำหรับยิง request ไปยัง Backend API ทุกที่ในแอป
// แนบ JWT token ให้อัตโนมัติ และแปลง error ของเซิร์ฟเวอร์ให้เป็นข้อความไทยอ่านง่าย

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่า Backend API กำลังรันอยู่');
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (response.status === 401) {
    // เซสชันหมดอายุ หรือยังไม่ได้ล็อกอิน -> เคลียร์ session แล้วเด้งกลับหน้า login
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    if (!path.includes('/auth/login') && window.location.pathname !== '/') {
      window.location.href = '/';
    }
  }

  if (!response.ok) {
    const message = data?.message || `เกิดข้อผิดพลาด (HTTP ${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const apiGet = (path) => request(path, { method: 'GET' });
export const apiPost = (path, body, opts = {}) => request(path, { method: 'POST', body, ...opts });
export const apiPut = (path, body, opts = {}) => request(path, { method: 'PUT', body, ...opts });
export const apiPatch = (path, body) => request(path, { method: 'PATCH', body });
export const apiDelete = (path) => request(path, { method: 'DELETE' });

export function buildFileUrl(relativePath) {
  if (!relativePath) return null;
  const origin = API_BASE.replace(/\/api\/?$/, '');
  return `${origin}${relativePath}`;
}
