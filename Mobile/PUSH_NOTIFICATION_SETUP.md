# คู่มือติดตั้งระบบแจ้งเตือนล่วงหน้า (Push Notification)

โค้ดทั้งหมดเขียนเสร็จแล้ว เหลือแค่ขั้นตอนที่ต้องทำในเครื่องจริง/บัญชี Expo ของคุณเอง (ทำจาก sandbox นี้ไม่ได้)

## 1. รัน SQL เพิ่มในฐานข้อมูล (phpMyAdmin เหมือนตอน import kuse_event.sql)

```sql
ALTER TABLE app_users ADD COLUMN push_token VARCHAR(255) DEFAULT NULL AFTER device_token;

CREATE TABLE notifications (
  notification_id INT(11) NOT NULL AUTO_INCREMENT,
  event_id INT(11) DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id),
  KEY fk_notifications_event (event_id),
  CONSTRAINT fk_notifications_event FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

## 2. ติดตั้ง dependency ฝั่ง mobile ใหม่ (มี expo-notifications, expo-device เพิ่มเข้ามา)

```bash
cd mobile
rm -rf node_modules package-lock.json
npm install
```

## 3. ผูกโปรเจกต์กับ Expo Application Services (EAS)

Push notification จริงทดสอบใน Expo Go ไม่ได้แล้ว (ตัดตั้งแต่ SDK 53) ต้องสร้าง "development build" ผ่าน EAS

```bash
npm install -g eas-cli
eas login
cd mobile
eas init
```

`eas init` จะพิมพ์ **projectId** ออกมา ให้เอาไปแทนที่ `"PUT_YOUR_EAS_PROJECT_ID_HERE"` ใน `mobile/app.json` (ตำแหน่ง `extra.eas.projectId`)

## 4. อัปโหลด Firebase key เป็น FCM V1 credential (สำหรับ Android)

```bash
eas credentials
```

เลือก **Android → Push Notifications → Manage your FCM Api Key** แล้วอัปโหลดไฟล์ `server/firebase-key.json` ตัวเดิม (โปรเจกต์ `project1-addd6` ที่ตั้งไว้แล้ว — ไม่ต้องสร้าง Firebase project ใหม่ ไม่ต้องยุ่งกับ Firestore Rules เลย)

## 5. Build development build แล้วติดตั้งลงเครื่องจริง

```bash
eas build --profile development --platform android
```

(ถ้าจะทำ iOS ด้วยต้องมี Apple Developer account ปีละ ~3,500 บาท ใช้ `--platform ios`)

build เสร็จ โหลดไฟล์มาติดตั้งในเครื่อง แล้วรัน:

```bash
npx expo start --dev-client
```

สแกน QR ด้วย **แอป dev build ที่เพิ่งติดตั้ง** (ไม่ใช่ Expo Go)

## 6. เปิด server

```bash
cd server
npm run dev
```

Cron จะรันทุกวัน 09:00 น. เช็คกิจกรรมที่เหลืออีก 3 วัน (`is_published = 1`) แล้ว:
- ส่ง push ให้ทุกคนที่กด "อนุญาตแจ้งเตือน" ในแอป (มี `push_token` เก็บไว้)
- บันทึกลงตาราง `notifications` เสมอ ไว้โชว์ในหน้า "การแจ้งเตือน" (ใช้งานได้แม้ยังไม่มีใครอนุญาต push)

## ทดสอบแบบไม่ต้องรอถึง 9 โมง

ยิง POST ไปที่นี่เพื่อ trigger ทันที (มี route นี้ไว้ debug):

```
POST http://<server-ip>:3001/api/notifications/trigger-test
```

หรือแก้ `event_date` ของกิจกรรมในฐานข้อมูลให้ห่างจากวันนี้พอดี 3 วัน แล้วยิง endpoint ข้างบน

## สรุปว่าอะไรทำงานได้เลย vs ต้องรอ setup

| ส่วน | สถานะ |
|---|---|
| ประวัติแจ้งเตือนในแอป (หน้า "การแจ้งเตือน") | ใช้ได้ทันทีหลังรัน SQL ข้อ 1 ไม่ต้องรอ EAS |
| แจ้งเตือนขึ้นหน้าจอเครื่อง (push จริง) | ต้องทำครบข้อ 2-5 ก่อน |
| Cron ตรวจกิจกรรมล่วงหน้า 3 วัน | ทำงานทันทีที่เปิด server (ข้อ 6) |
