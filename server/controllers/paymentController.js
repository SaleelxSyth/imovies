const paymentService = require('../services/paymentService');
const bookingService = require('../services/bookingService');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

const createPaymentOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized for this booking'
      });
    }

    const order = await paymentService.createOrder({
      amount: booking.totalAmount,
      receipt: `rcpt_${booking.bookingCode}`,
      bookingId: booking._id,
      userId
    });

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature, bookingId } = req.body;
    const userId = req.user._id;

    // 1. Verify Payment
    const verification = await paymentService.verifyPayment({
      orderId,
      paymentId,
      signature,
      bookingId,
      userId
    });

    // 2. Confirm booking and commit booked seats
    const confirmedBooking = await bookingService.confirmBooking({
      bookingId,
      payment: verification.payment,
      userId
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed successfully',
      data: {
        booking: confirmedBooking,
        payment: verification.payment
      }
    });
  } catch (err) {
    next(err);
  }
};

const getAllPaymentsAdmin = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email')
      .populate('booking', 'bookingCode totalAmount seats')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (err) {
    next(err);
  }
};

const getPublicPayInfo = async (req, res, next) => {
  try {
    const result = await paymentService.getPublicPayInfo(req.params.token);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const confirmPublicPayment = async (req, res, next) => {
  try {
    const result = await paymentService.confirmPublicPayment(req.params.token);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const cancelPublicPayment = async (req, res, next) => {
  try {
    const result = await paymentService.cancelPublicPayment(req.params.token);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const expirePayment = async (req, res, next) => {
  try {
    const result = await paymentService.expirePayment({
      bookingId: req.params.bookingId,
      userId: req.user?._id
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getPaymentStatus = async (req, res, next) => {
  try {
    const result = await paymentService.getPaymentStatus(req.params.bookingId);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getAllPaymentsAdmin,
  getPublicPayInfo,
  confirmPublicPayment,
  cancelPublicPayment,
  expirePayment,
  getPaymentStatus
};
