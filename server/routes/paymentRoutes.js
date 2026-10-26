const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Protected user payment routes
router.post('/create-order', protect, paymentController.createPaymentOrder);
router.post('/verify', protect, paymentController.verifyPayment);
router.get('/status/:bookingId', protect, paymentController.getPaymentStatus);
router.post('/expire/:bookingId', protect, paymentController.expirePayment);

// Public payment routes for QR phone scan (no login required)
router.get('/pay-info/:token', paymentController.getPublicPayInfo);
router.post('/public-confirm/:token', paymentController.confirmPublicPayment);
router.post('/public-cancel/:token', paymentController.cancelPublicPayment);

router.get('/', protect, authorizeRoles('admin'), paymentController.getAllPaymentsAdmin);

module.exports = router;
