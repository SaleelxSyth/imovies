const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createBookingValidator } = require('../validators/bookingValidator');

// User's own bookings
router.get('/my', protect, bookingController.getMyBookings);

// Create pending booking from locked seats
router.post('/', protect, createBookingValidator, validate, bookingController.createBooking);

// Single booking details
router.get('/:id', protect, bookingController.getBookingById);

// Cancel booking (with refund logic and seat release)
router.put('/:id/cancel', protect, bookingController.cancelBooking);

// Admin view all bookings
router.get('/', protect, authorizeRoles('admin'), bookingController.getAllBookingsAdmin);

module.exports = router;
