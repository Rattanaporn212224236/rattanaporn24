# คู่มือสร้างโปรเจกต์ KU CSC Student Management REST API แบบ Step by Step

คู่มือนี้ใช้สำหรับสอนนักศึกษาเขียน Backend REST API ด้วยตนเอง โดยใช้ Node.js, Express.js, MySQL และเขียน SQL เองผ่าน `mysql2/promise`

## 1. เตรียมเครื่องมือ

ต้องติดตั้งเครื่องมือต่อไปนี้ก่อนเริ่ม:

- Node.js
- MySQL Server
- โปรแกรมเขียนโค้ด เช่น VS Code
- โปรแกรมทดสอบ API เช่น Postman หรือ Thunder Client

ตรวจสอบ Node.js:

```bash
node -v
npm -v
```

## 2. สร้างโฟลเดอร์โปรเจกต์

```bash
mkdir ku-csc-student-api
cd ku-csc-student-api
```

เริ่มต้น Node.js project:

```bash
npm init -y
```

## 3. ติดตั้ง Packages

ติดตั้ง package หลัก:

```bash
npm install express mysql2 cors dotenv
```

ติดตั้ง package สำหรับตอนพัฒนา:

```bash
npm install --save-dev nodemon
```

## 4. แก้ไข package.json

เปิดไฟล์ `package.json` แล้วเพิ่ม `scripts`:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

## 5. สร้างโครงสร้างโฟลเดอร์

สร้างโฟลเดอร์ตามนี้:

```text
ku-csc-student-api/
  src/
    app.js
    server.js

    config/
      db.js

    features/
      students/
        student.routes.js
        student.controller.js
        student.service.js
        student.repository.js
        student.validation.js

    middlewares/
      errorHandler.js
      notFound.js

    utils/
      response.js

  database/
    schema.sql
    seed.sql

  .env
  .env.example
  package.json
```

แนวคิดของโครงสร้างนี้:

- `src/` เก็บ source code ของ server
- `config/` เก็บไฟล์ตั้งค่า เช่น database
- `features/` เก็บโค้ดแยกตามฟีเจอร์
- `features/students/` เก็บโค้ดทั้งหมดที่เกี่ยวกับข้อมูลนักศึกษา
- `middlewares/` เก็บ middleware สำหรับจัดการ request, response และ error
- `utils/` เก็บ helper function ที่ใช้ซ้ำได้
- `database/` เก็บไฟล์ SQL

## 6. สร้างไฟล์ .env

สร้างไฟล์ `.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ku_csc_student_db
```

เปลี่ยน `DB_PASSWORD` ให้ตรงกับรหัสผ่าน MySQL ของเครื่องตัวเอง

สร้างไฟล์ `.env.example` เพื่อเป็นตัวอย่าง:

```env
PORT=5000
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ku_csc_student_db
```

## 7. สร้างไฟล์เชื่อมต่อ MySQL

ไฟล์ `src/config/db.js`

```js
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ku_csc_student_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  const connection = await pool.getConnection();
  connection.release();
}

module.exports = {
  pool,
  testConnection
};
```

ไฟล์นี้ใช้ `createPool()` เพื่อสร้าง connection pool สำหรับเชื่อมต่อ MySQL

## 8. สร้าง Helper สำหรับ Response

ไฟล์ `src/utils/response.js`

```js
function success(res, message, data = null, statusCode = 200) {
  const body = {
    success: true,
    message
  };

  if (data !== null) {
    body.data = data;
  }

  return res.status(statusCode).json(body);
}

function error(res, message, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message
  });
}

module.exports = {
  success,
  error
};
```

เป้าหมายคือทำให้ API ตอบกลับ JSON เป็นรูปแบบเดียวกัน

## 9. สร้าง Express App

ไฟล์ `src/app.js`

```js
const express = require("express");
const cors = require("cors");

const studentRoutes = require("./features/students/student.routes");
const { testConnection } = require("./config/db");
const { success } = require("./utils/response");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}));
app.use(express.json());

app.get("/api/health", (req, res) => {
  return success(res, "Server is running");
});

app.get("/api/db-health", async (req, res, next) => {
  try {
    await testConnection();
    return success(res, "Database connection is working");
  } catch (error) {
    return next(error);
  }
});

app.use("/api/students", studentRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
```

หน้าที่ของไฟล์นี้:

- สร้าง Express app
- เปิดใช้งาน CORS
- เปิดใช้งาน JSON body parser
- สร้าง route `/api/health`
- สร้าง route `/api/db-health`
- เชื่อม route ของ students
- เชื่อม middleware จัดการ error

## 10. สร้างไฟล์ Start Server

ไฟล์ `src/server.js`

```js
require("dotenv").config();

const app = require("./app");
const { testConnection } = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await testConnection();
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
```

ไฟล์นี้เป็นจุดเริ่มต้นของ server

## 11. สร้าง Middleware สำหรับ Route ที่ไม่มีอยู่

ไฟล์ `src/middlewares/notFound.js`

```js
function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

module.exports = notFound;
```

ถ้าผู้ใช้เรียก API path ที่ไม่มีอยู่ จะส่ง error ไปให้ `errorHandler`

## 12. สร้าง Middleware สำหรับ Error

ไฟล์ `src/middlewares/errorHandler.js`

```js
const { error } = require("../utils/response");

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "ER_DUP_ENTRY") {
    return error(res, "Student code already exists", 409);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  return error(res, message, statusCode);
}

module.exports = errorHandler;
```

ไฟล์นี้ช่วยให้ error ทุกจุดตอบกลับเป็น JSON รูปแบบเดียวกัน

## 13. สร้าง Database Schema

ไฟล์ `database/schema.sql`

```sql
CREATE DATABASE IF NOT EXISTS ku_csc_student_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ku_csc_student_db;

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_code VARCHAR(20) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  faculty VARCHAR(150) NOT NULL,
  major VARCHAR(150) NOT NULL,
  year TINYINT NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(20),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

คำอธิบายคำสั่ง SQL สำคัญ:

- `CREATE DATABASE` สร้างฐานข้อมูล
- `CREATE TABLE` สร้างตาราง
- `PRIMARY KEY` กำหนด key หลัก
- `AUTO_INCREMENT` เพิ่มเลข id อัตโนมัติ
- `UNIQUE` ห้ามข้อมูลซ้ำ
- `NOT NULL` ห้ามเป็นค่าว่าง

## 14. สร้าง Seed Data

ไฟล์ `database/seed.sql`

```sql
USE ku_csc_student_db;

INSERT INTO students
  (student_code, first_name, last_name, faculty, major, year, email, phone)
VALUES
  ('6410450001', 'สมชาย', 'ใจดี', 'คณะวิทยาศาสตร์และวิศวกรรมศาสตร์', 'วิทยาการคอมพิวเตอร์', 3, '6410450001@ku.th', '0812345678'),
  ('6510450002', 'สมหญิง', 'รักเรียน', 'คณะวิทยาศาสตร์และวิศวกรรมศาสตร์', 'เทคโนโลยีสารสนเทศ', 2, '6510450002@ku.th', '0823456789'),
  ('6610450003', 'อนันต์', 'ตั้งใจเรียน', 'คณะวิทยาศาสตร์และวิศวกรรมศาสตร์', 'วิศวกรรมคอมพิวเตอร์', 1, '6610450003@ku.th', '0834567890');
```

รัน SQL:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

## 15. สร้าง Validation

ไฟล์ `src/features/students/student.validation.js`

```js
function createValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function validateId(id) {
  const numberId = Number(id);

  if (!Number.isInteger(numberId) || numberId <= 0) {
    throw createValidationError("Student id must be a positive number");
  }

  return numberId;
}

function validateRequired(value, fieldName) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw createValidationError(`${fieldName} is required`);
  }
}

function validateStudent(data) {
  validateRequired(data.student_code, "student_code");
  validateRequired(data.first_name, "first_name");
  validateRequired(data.last_name, "last_name");
  validateRequired(data.faculty, "faculty");
  validateRequired(data.major, "major");
  validateRequired(data.year, "year");

  const year = Number(data.year);

  if (!Number.isInteger(year) || year < 1 || year > 8) {
    throw createValidationError("year must be a number between 1 and 8");
  }

  return {
    student_code: String(data.student_code).trim(),
    first_name: String(data.first_name).trim(),
    last_name: String(data.last_name).trim(),
    faculty: String(data.faculty).trim(),
    major: String(data.major).trim(),
    year,
    email: data.email ? String(data.email).trim() : null,
    phone: data.phone ? String(data.phone).trim() : null
  };
}

module.exports = {
  validateId,
  validateStudent
};
```

ไฟล์นี้ใช้ตรวจสอบข้อมูลก่อนส่งไปบันทึกในฐานข้อมูล

## 16. สร้าง Repository สำหรับเขียน SQL

ไฟล์ `src/features/students/student.repository.js`

```js
const { pool } = require("../../config/db");

const studentSelectFields = `
  id,
  student_code,
  first_name,
  last_name,
  faculty,
  major,
  year,
  email,
  phone,
  created_at,
  updated_at
`;

async function findAll() {
  const sql = `
    SELECT ${studentSelectFields}
    FROM students
    ORDER BY id DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findById(id) {
  const sql = `
    SELECT ${studentSelectFields}
    FROM students
    WHERE id = ?
  `;

  const [rows] = await pool.query(sql, [id]);
  return rows[0] || null;
}

async function create(student) {
  const sql = `
    INSERT INTO students
      (student_code, first_name, last_name, faculty, major, year, email, phone)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    student.student_code,
    student.first_name,
    student.last_name,
    student.faculty,
    student.major,
    student.year,
    student.email,
    student.phone
  ];

  const [result] = await pool.query(sql, values);
  return result.insertId;
}

async function update(id, student) {
  const sql = `
    UPDATE students
    SET
      student_code = ?,
      first_name = ?,
      last_name = ?,
      faculty = ?,
      major = ?,
      year = ?,
      email = ?,
      phone = ?
    WHERE id = ?
  `;

  const values = [
    student.student_code,
    student.first_name,
    student.last_name,
    student.faculty,
    student.major,
    student.year,
    student.email,
    student.phone,
    id
  ];

  const [result] = await pool.query(sql, values);
  return result.affectedRows;
}

async function remove(id) {
  const sql = "DELETE FROM students WHERE id = ?";
  const [result] = await pool.query(sql, [id]);
  return result.affectedRows;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove
};
```

จุดสำคัญ:

- ใช้ `?` เพื่อแทนค่าจากผู้ใช้
- ไม่เอาค่าจากผู้ใช้มาต่อ string SQL โดยตรง
- วิธีนี้ช่วยลดความเสี่ยง SQL Injection

## 17. สร้าง Service

ไฟล์ `src/features/students/student.service.js`

```js
const studentRepository = require("./student.repository");
const {
  validateStudent,
  validateId
} = require("./student.validation");

async function getAllStudents() {
  return studentRepository.findAll();
}

async function getStudentById(id) {
  const studentId = validateId(id);
  const student = await studentRepository.findById(studentId);

  if (!student) {
    const error = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }

  return student;
}

async function createStudent(studentData) {
  const validData = validateStudent(studentData);
  const newStudentId = await studentRepository.create(validData);
  return getStudentById(newStudentId);
}

async function updateStudent(id, studentData) {
  const studentId = validateId(id);
  await getStudentById(studentId);

  const validData = validateStudent(studentData);
  await studentRepository.update(studentId, validData);

  return getStudentById(studentId);
}

async function deleteStudent(id) {
  const studentId = validateId(id);
  await getStudentById(studentId);
  await studentRepository.remove(studentId);
}

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
```

Service เป็นชั้นที่รวม logic ของระบบ เช่น ตรวจว่า id มีอยู่จริงหรือไม่

## 18. สร้าง Controller

ไฟล์ `src/features/students/student.controller.js`

```js
const studentService = require("./student.service");
const { success } = require("../../utils/response");

async function getAllStudents(req, res, next) {
  try {
    const students = await studentService.getAllStudents();
    return success(res, "Students fetched successfully", students);
  } catch (error) {
    return next(error);
  }
}

async function getStudentById(req, res, next) {
  try {
    const student = await studentService.getStudentById(req.params.id);
    return success(res, "Student fetched successfully", student);
  } catch (error) {
    return next(error);
  }
}

async function createStudent(req, res, next) {
  try {
    const student = await studentService.createStudent(req.body);
    return success(res, "Student created successfully", student, 201);
  } catch (error) {
    return next(error);
  }
}

async function updateStudent(req, res, next) {
  try {
    const student = await studentService.updateStudent(req.params.id, req.body);
    return success(res, "Student updated successfully", student);
  } catch (error) {
    return next(error);
  }
}

async function deleteStudent(req, res, next) {
  try {
    await studentService.deleteStudent(req.params.id);
    return success(res, "Student deleted successfully");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
```

Controller ทำหน้าที่รับ request และส่ง response

## 19. สร้าง Routes

ไฟล์ `src/features/students/student.routes.js`

```js
const express = require("express");

const studentController = require("./student.controller");

const router = express.Router();

router.get("/", studentController.getAllStudents);
router.get("/:id", studentController.getStudentById);
router.post("/", studentController.createStudent);
router.put("/:id", studentController.updateStudent);
router.delete("/:id", studentController.deleteStudent);

module.exports = router;
```

REST API endpoints ที่ได้:

```text
GET     /api/students
GET     /api/students/:id
POST    /api/students
PUT     /api/students/:id
DELETE  /api/students/:id
```

## 20. สร้าง .gitignore

ไฟล์ `.gitignore`

```text
node_modules/
.env
npm-debug.log*
.DS_Store
```

ไม่ควร commit `node_modules/` และ `.env`

## 21. รัน Server

หลังจากสร้าง database และตั้งค่า `.env` แล้ว รัน:

```bash
npm run dev
```

ถ้าสำเร็จจะเห็นข้อความประมาณนี้:

```text
Database connected successfully
Server is running on port 5000
```

## 22. ทดสอบ API

ทดสอบ server:

```http
GET http://localhost:5000/api/health
```

ทดสอบ database:

```http
GET http://localhost:5000/api/db-health
```

ดึงข้อมูลนักศึกษาทั้งหมด:

```http
GET http://localhost:5000/api/students
```

ดึงข้อมูลนักศึกษา 1 คน:

```http
GET http://localhost:5000/api/students/1
```

เพิ่มนักศึกษา:

```http
POST http://localhost:5000/api/students
Content-Type: application/json
```

Body:

```json
{
  "student_code": "6710450004",
  "first_name": "กิตติ",
  "last_name": "เรียนดี",
  "faculty": "คณะวิทยาศาสตร์และวิศวกรรมศาสตร์",
  "major": "วิทยาการคอมพิวเตอร์",
  "year": 1,
  "email": "6710450004@ku.th",
  "phone": "0845678901"
}
```

แก้ไขข้อมูลนักศึกษา:

```http
PUT http://localhost:5000/api/students/1
Content-Type: application/json
```

ลบนักศึกษา:

```http
DELETE http://localhost:5000/api/students/1
```

## 23. ลำดับการทำงานของ Request

ตัวอย่าง `GET /api/students`:

```text
Browser/Postman/React
-> student.routes.js
-> student.controller.js
-> student.service.js
-> student.repository.js
-> MySQL
-> ส่งข้อมูลกลับเป็น JSON
```

## 24. แนวคิด REST CRUD

```text
GET     /api/students       = อ่านข้อมูลทั้งหมด
GET     /api/students/:id   = อ่านข้อมูล 1 รายการ
POST    /api/students       = เพิ่มข้อมูลใหม่
PUT     /api/students/:id   = แก้ไขข้อมูล
DELETE  /api/students/:id   = ลบข้อมูล
```

## 25. สรุปสิ่งที่นักศึกษาจะได้เรียนรู้

หลังทำโปรเจกต์นี้ นักศึกษาจะเข้าใจ:

- การสร้าง Node.js project
- การใช้ Express.js
- การสร้าง REST API
- การเชื่อมต่อ MySQL
- การเขียน SQL พื้นฐาน
- การใช้ prepared statement ด้วย `?`
- การแบ่งโค้ดเป็น routes, controllers, services, repositories
- การจัดการ validation และ error เบื้องต้น
- การทดสอบ API ก่อนนำไปเชื่อมกับ React

