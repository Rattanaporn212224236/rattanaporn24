const express = require('express');
const router = express.Router();
const masterController = require('./master.controller');

// URL: /api/master/departments
router.get('/departments', masterController.getAllDepartments);

// URL: /api/master/categories
router.get('/categories', masterController.getAllCategories);

module.exports = router;