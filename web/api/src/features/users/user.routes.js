// user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('./user.controller');

router.get('/', userController.getAllUsers);          // ดูทั้งหมด
router.get('/:id', userController.getUserById);       // ดูรายคน
router.post('/', userController.createUser);         // สร้างใหม่
router.put('/:id', userController.updateUser);       // แก้ไข
router.delete('/:id', userController.deleteUser);    // ลบ

module.exports = router;