// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* หน้าแรก: ฟอร์ม Login สีขาว-แดงแบบเต็มจอ */}
          <Route path="/" element={<LoginPage />} />

          {/* พาร์ทหลังบ้านเมื่อแอดมินกดเข้าสู่ระบบสำเร็จ (ต้องล็อกอินก่อนเท่านั้น) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* เส้นทางอื่น ๆ ที่ไม่รู้จัก ให้กลับไปหน้า Login */}
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
