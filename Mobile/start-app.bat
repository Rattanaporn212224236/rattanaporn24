@echo off
chcp 65001 >nul
setlocal

echo ============================================
echo   KUSE Notify - Setup + Start
echo ============================================
echo.

echo [1/3] Installing mobile app dependencies...
echo (ลบ node_modules เก่าที่ติดตั้งไม่ครบ แล้วลงใหม่ทั้งหมด อาจใช้เวลาสักครู่)
echo.
cd /d "%~dp0mobile"

if exist node_modules (
    echo Removing old node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    del package-lock.json
)

call npm install
if errorlevel 1 (
    echo.
    echo ============================================
    echo   npm install ไม่สำเร็จ ดู error ด้านบนนี้
    echo ============================================
    pause
    exit /b 1
)

echo.
echo [2/3] Starting backend server (หน้าต่างใหม่)...
start "KUSE Notify - Server" cmd /k "cd /d "%~dp0server" && npm run dev"

echo.
echo [3/3] Starting Expo / mobile app (หน้าต่างใหม่)...
timeout /t 3 /nobreak >nul
start "KUSE Notify - Mobile (Expo)" cmd /k "cd /d "%~dp0mobile" && npm start"

echo.
echo ============================================
echo   เสร็จแล้ว! ควรมีหน้าต่างใหม่เปิดขึ้น 2 บาน:
echo   1. Server      - ต้องขึ้น "Mobile API Server running on port 3001"
echo   2. Mobile/Expo  - จะโชว์ QR code ให้สแกนด้วย Expo Go
echo.
echo   ถ้าหน้าต่างไหนขึ้น error สีแดง ให้ก็อปข้อความมาถามได้เลยค่ะ
echo ============================================
pause
