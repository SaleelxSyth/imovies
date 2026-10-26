const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/stats', protect, authorizeRoles('admin'), adminController.getDashboardStats);
router.get('/reports/revenue', protect, authorizeRoles('admin'), adminController.getRevenueReport);

module.exports = router;
