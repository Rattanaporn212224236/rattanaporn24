# API กลาง — ระบบแจ้งงานกิจกรรม คณะวิทยาศาสตร์และวิศวกรรมศาสตร์ มก.ฉกส.

รวม backend จาก `web\web\server` (เว็บแอดมิน) และ `Mobile\api` (แอป Expo) เดิม เข้าเป็นเซิร์ฟเวอร์เดียว
ต่อฐานข้อมูล MySQL `kuse_event` ตัวเดียวกัน ไม่มีการเขียน logic ทางธุรกิจ/SQL ใหม่ — ย้ายโค้ดเดิม 1:1
ยกเว้นจุดเดียวที่ปรับปรุง (ดูหัวข้อ "สิ่งที่ปรับปรุงเพิ่มเติม" ด้านล่าง)

## โครงสร้าง 3 ส่วนของโปรเจกต์ (หลังรวมแล้ว)

```
C:\Project\
  API\        <- (ใหม่) เซิร์ฟเวอร์กลาง พอร์ต 5000 — รันตัวนี้แทน web\web\server และ Mobile\api
  web\web\    <- เว็บแอดมิน (Vite/React) — แก้แค่ .env ให้ชี้มาที่ API ตัวใหม่ (จริง ๆ ไม่ต้องแก้เพราะพอร์ตเดิม)
  Mobile\mobile\  <- แอป Expo — แก้ไฟล์ "API Service" ให้ชี้มาที่ API ตัวใหม่แล้ว
```

`web\web\server` และ `Mobile\api` **ยังไม่ถูกลบ** ตอนนี้ (เก็บไว้เป็นข้อมูลอ้างอิง/สำรอง) จนกว่าคุณจะทดสอบ
API ตัวใหม่แล้วมั่นใจว่าใช้งานได้ 100% — ดูหัวข้อ "ขั้นตอนถัดไป" ท้ายเอกสารนี้

## Endpoint ทั้งหมด (39 endpoint ครบทุกอันจากทั้งสองระบบเดิม)

### ฝั่งแอดมิน (เว็บ) — ต้องแนบ `Authorization: Bearer <token>` ยกเว้น `/auth/login`

| Method | Path | คำอธิบาย |
|---|---|---|
| POST | `/api/auth/login` | เข้าสู่ระบบแอดมิน |
| GET | `/api/auth/me` | ข้อมูลแอดมินที่ล็อกอินอยู่ |
| PUT | `/api/users/me` | แก้ไขข้อมูลตัวเอง |
| PUT | `/api/users/me/password` | เปลี่ยนรหัสผ่านตัวเอง |
| GET/POST/PUT/DELETE | `/api/users` , `/api/users/:id` | จัดการบัญชีแอดมิน (super_admin) |
| POST | `/api/users/:id/reset-password` | รีเซ็ตรหัสผ่าน (super_admin) |
| GET | `/api/departments/categories` | รายการหมวดหมู่ |
| GET/POST/PUT/DELETE | `/api/departments` , `/api/departments/:id` | จัดการหน่วยงาน (POST/PUT/DELETE เฉพาะ super_admin) |
| GET | `/api/events/stats` | สถิติภาพรวม (แดชบอร์ด) |
| GET/POST/PUT/PATCH/DELETE | `/api/events` , `/api/events/:id` | CRUD กิจกรรม + อัปโหลดรูป |
| DELETE | `/api/events/:id/images/:imageId` | ลบรูปกิจกรรม |

### ฝั่งแอป Expo — ไม่ต้อง login

| Method | Path | คำอธิบาย |
|---|---|---|
| GET | `/api/categories` , `/api/categories/departments/all` , `/api/categories/departments/filter/:id` | หมวดหมู่/หน่วยงาน |
| GET | `/api/public-events` , `/api/public-events/all-details` , `/api/public-events/:id` , `/api/public-events/debug/counts` | กิจกรรม (อ่านอย่างเดียว) — **เดิมคือ `/api/events` บนเซิร์ฟเวอร์แยก** |
| POST | `/api/app-users/register` | ลงทะเบียนผู้ใช้แบบไม่ login (device_token) — **เดิมคือ `/api/users/register`** |
| PUT | `/api/app-users/:appUserId/push-token` | บันทึก Expo push token |
| GET | `/api/app-users/:appUserId` | ข้อมูลผู้ใช้ |
| GET/POST/DELETE | `/api/saved-events/:appUserId` , `/api/saved-events` , `/api/saved-events/:appUserId/:eventId` | กิจกรรมที่บันทึกไว้ |
| GET/POST | `/api/notifications` , `/api/notifications/unread-count` , `/api/notifications/mark-seen` , `/api/notifications/trigger-test` | แจ้งเตือน |

**ทำไม `/api/events` กับ `/api/users` ของแอปถึงเปลี่ยนชื่อ**: ทั้งสอง path นี้ฝั่งเว็บแอดมินใช้ไปแล้ว
(คนละความหมาย คนละตาราง คนละ auth) รันบนเซิร์ฟเวอร์เดียวกันแล้วชนกันไม่ได้ จึงต้องเปลี่ยน prefix ฝั่งแอป
แทน (แก้แล้วในไฟล์ `Mobile\mobile\src\api\eventsApi.js` และ `usersApi.js` — จุดเดียวที่แตะ, ไม่ใช่ UI/logic)

### Static
`GET /uploads/events/*` — รูปกิจกรรม (ย้ายไฟล์เดิมมาครบ 88 ไฟล์แล้ว)

## วิธีรันทั้ง 3 โปรเจกต์พร้อมกัน (สำหรับ dev)

เปิด 3 terminal แยกกัน:

```powershell
# 1) API กลาง (ต้องรันก่อนตัวอื่น ๆ)
cd C:\Project\API
npm install
npm run dev          # nodemon, auto-restart เวลาแก้โค้ด — เช็คว่าเห็น "KUSE Event API (รวม web+mobile) พร้อมใช้งานที่ http://localhost:5000"

# 2) เว็บแอดมิน
cd C:\Project\web\web
npm install           # (ถ้ายังไม่เคยรัน)
npm run dev            # Vite dev server ที่ http://localhost:5173

# 3) แอป Expo
cd C:\Project\Mobile\mobile
npm install            # (ถ้ายังไม่เคยรัน)
npm start               # แล้วกด a (Android emulator) / กด w (เว็บ) / สแกน QR ด้วย Expo Go บนมือถือจริง
```

ก่อนรัน API ต้องเปิด MySQL (เช่น XAMPP) ไว้ก่อนเสมอ — ค่าเชื่อมต่อฐานข้อมูลอยู่ใน `C:\Project\API\.env`
(คัดลอกค่ามาจาก `web\web\.env` เดิมให้แล้ว ไม่ต้องพิมพ์ใหม่)

## แก้ปัญหา IP/Network ของ Expo บนเครื่องจริง

แอปจะ **auto-detect IP ของเครื่องที่รัน `expo start` ให้เองอัตโนมัติ** (ไฟล์ `src/config/env.js`) โดยอ่านจาก
`Constants.expoConfig.hostUri` ที่ Expo ฝังมาให้เสมอ (เช่น `192.168.1.25:8081` → ต่อ API ที่
`http://192.168.1.25:5000`) **ปกติไม่ต้องตั้งค่าอะไรเอง** ทั้งบน Emulator และเครื่องจริง ตราบใดที่:

1. คอมพิวเตอร์ที่รัน `npm start` กับมือถือ **ต่อ Wi-Fi วงเดียวกัน**
2. Windows Firewall ไม่ได้บล็อกพอร์ต 5000 และ 8081 (ถ้าเจอ "Network request failed" ครั้งแรกที่รันบนเครื่องจริง
   ให้ลองอนุญาต Node.js ผ่าน Firewall เมื่อ Windows ถามตอนรัน `npm run dev` / `npm start`)
3. เซิร์ฟเวอร์ API เปิดอยู่จริง (ดูข้อ 1 ด้านบน) — API ผูก listen ไว้ที่ `0.0.0.0` แล้ว (รับ request จากทุก IP
   ของเครื่อง ไม่ใช่แค่ localhost) จึงเข้าถึงจาก IP วง LAN ได้แน่นอน

ถ้า auto-detect ไม่ตรง (เช่น รันผ่าน `npm run start:tunnel`, ทดสอบข้าม subnet, หรือมือถือกับคอมอยู่คนละวง
Wi-Fi แก้ไม่ได้) ให้ตั้งค่าทับตรง ๆ ที่ `C:\Project\Mobile\mobile\.env`:

```
EXPO_PUBLIC_API_URL=http://<IP เครื่องที่รัน API>:5000
```

หา IP เครื่องได้จาก `ipconfig` (มองหา IPv4 Address ของวง Wi-Fi ที่ต่ออยู่) แก้ค่านี้แล้วต้อง **restart
`expo start` ใหม่** (env var ของ Expo อ่านตอน bundle เริ่มทำงานเท่านั้น แก้แล้วไม่ auto-reload)

## สิ่งที่ปรับปรุงเพิ่มเติม (นอกเหนือจากการย้ายโค้ด 1:1)

1. **รูปกิจกรรมโหลดได้แน่นอนขึ้นบนมือถือเครื่องจริง**: เดิม URL รูปภาพที่แอปมือถือได้รับ สร้างจาก
   `ADMIN_SERVER_URL=http://localhost:5000` (ค่า hardcode ใน `.env` เดิม) ซึ่ง **ใช้ไม่ได้จริงบนมือถือ**
   เพราะ "localhost" ของมือถือคือตัวมือถือเอง ไม่ใช่เครื่อง server (บั๊กแฝงเดิม ไม่เกี่ยวกับงานนี้โดยตรง
   แต่เจอระหว่างรวมโค้ดและแก้ไปพร้อมกันเพราะเป็นเรื่อง IP/Network ของ Expo เหมือนกัน) ตอนนี้ API สร้าง
   URL รูปจาก host ที่ client เรียกเข้ามาจริง (`req.get('host')`) แทน ตรงกับ IP ที่แอป auto-detect ไว้เป๊ะ ๆ
   เสมอ ไม่ว่าจะเปิดผ่าน localhost, IP วง LAN, หรือ tunnel
2. **ลบ dependency ที่ไม่ได้ใช้จริงออก 2 ตัว**: `node-schedule` และ `firebase-admin` (ประกาศไว้ใน
   `Mobile\api\package.json` เดิม แต่ไม่มีจุดไหน `require()` จริงในโค้ด — ตรวจแล้วด้วย grep) ระบบแจ้งเตือน
   จริงใช้ `setInterval` + Expo Push API ธรรมดา ไม่ได้ใช้ทั้งสองแพ็กเกจนี้
3. **CORS แบบไดนามิก**: จากเดิม origin เดียว (`http://localhost:5173`) เป็นอนุญาต localhost ทุกพอร์ต + IP
   วง LAN ส่วนตัวทุกพอร์ตอัตโนมัติ (ตั้งค่าเพิ่มได้ผ่าน `CORS_EXTRA_ORIGINS` ใน `.env`)

**ไม่ได้แตะ**: SQL query, business logic, การคำนวณสถานะกิจกรรม, การแก้ปี พ.ศ./ค.ศ., ระบบสิทธิ์
(role-based), ฟิลด์ข้อมูลใด ๆ — ทุกอย่างเหมือนเดิม 100% เพียงแค่ย้ายที่อยู่ไฟล์และแปลง syntax
CommonJS → ESM ให้เข้ากับโครงสร้างใหม่

## หมายเหตุสำคัญ

- **`C:\Project\web\api`** เป็นโค้ดที่ดูเหมือนเคยพยายามรวม API มาก่อนแล้ว แต่ถูกทิ้งไว้กลางคัน (ไฟล์ล่าสุด
  27 มิ.ย. 2569 เก่ากว่าโค้ดจริงเกือบ 2 เดือน, ตั้ง `PORT=5173` ชนกับ Vite เอง, ไม่มีอะไรอ้างอิงถึงเลย) **ไม่ได้
  ถูกนำมาผสมในรอบนี้** เพราะเสี่ยงย้อนแย้ง/ล้าสมัยกว่า logic ปัจจุบัน หากไม่ต้องการเก็บไว้ ลบทิ้งได้เลย
- **`Mobile\mobile` มี git แต่ tracking ไม่ครบ**: พบว่าหลายไฟล์ (รวมทั้งโฟลเดอร์ `src/` ทั้งหมด) ยังไม่เคย
  ถูก commit เลยตั้งแต่แรก (`git status` ขึ้น `??`/`A` เกือบทั้งโปรเจกต์) แนะนำให้ `git add -A && git commit`
  ครั้งหนึ่งตอนนี้ เพื่อให้มี snapshot ที่กู้คืนได้จริงถ้าต้องย้อนกลับ
- **`web\web`, `web\api`, `Mobile\api` ไม่มี git เลย** — แนะนำให้ zip สำรองโฟลเดอร์เหล่านี้ไว้เองก่อนจะให้ผม
  ลบ `web\web\server` และ `Mobile\api` ในขั้นตอนถัดไป

## ขั้นตอนถัดไป (รอคุณทดสอบก่อน)

1. รันตามเช็คลิสต์ด้านล่างให้ครบ
2. ถ้าทุกอย่างทำงานปกติ 100% แจ้งกลับมา แล้วผมจะลบ `web\web\server` และ `Mobile\api` ให้ (Step 3 ของงาน
   ที่ขอไว้ — "ลบเมื่อมั่นใจว่า API กลางทำงานได้ 100% แล้ว") จะสำรองไว้ให้ก่อนลบเสมอ
3. ถ้าเจอปัญหาอะไร แจ้งข้อความ error หรือพฤติกรรมที่ผิดปกติมาได้เลย

### เช็คลิสต์ทดสอบ

- [ ] `http://localhost:5000/api/health` ตอบ `{"success":true,...}` และ terminal ของ API ขึ้น
      "เชื่อมต่อฐานข้อมูล kuse_event สำเร็จ"
- [ ] เว็บแอดมิน: login, ดูแดชบอร์ด, สร้าง/แก้ไข/ลบกิจกรรม (พร้อมอัปโหลดรูป), จัดการหน่วยงาน,
      จัดการบัญชีผู้ใช้ — ทำงานเหมือนเดิมทุกหน้า
- [ ] แอป Expo (emulator หรือเครื่องจริง): เห็นรายการกิจกรรม, กดเข้าดูรายละเอียด (รูปโหลดขึ้น),
      บันทึก/ยกเลิกบันทึกกิจกรรม, หน้าแจ้งเตือน, ไม่เจอ "Network request failed"
- [ ] รูปกิจกรรมเก่าที่เคยอัปโหลดไว้ก่อนหน้ายังโหลดได้ปกติ (ทั้งจากเว็บและแอป)
