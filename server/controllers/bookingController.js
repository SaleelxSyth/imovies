const bookingService = require('../services/bookingService');

const createBooking = async (req, res, next) => {
  try {
    const { showId, seats } = req.body;
    const userId = req.user._id;

    const result = await bookingService.createPendingBooking({
      showId,
      seats,
      userId
    });

    res.status(201).json({
      success: true,
      message: 'Booking initialized successfully',
      data: result.booking
    });
  } catch (err) {
    next(err);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const result = await bookingService.getMyBookings(userId, req.query);

    res.status(200).json({
      success: true,
      data: result.bookings,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(
      req.params.id,
      req.user._id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    next(err);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const result = await bookingService.cancelBooking({
      bookingId: req.params.id,
      userId: req.user._id,
      userRole: req.user.role,
      reason
    });

    res.status(200).json({
      success: true,
      message: result.refundEligible
        ? `Booking cancelled. Refund of ₹${result.refundAmount} initiated.`
        : 'Booking cancelled. Not eligible for refund (within 2 hours of showtime).',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

const getAllBookingsAdmin = async (req, res, next) => {
  try {
    const result = await bookingService.getAllBookingsAdmin(req.query);
    res.status(200).json({
      success: true,
      data: result.bookings,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookingsAdmin
};
