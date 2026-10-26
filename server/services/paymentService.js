const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const { logger } = require('../utils/logger');

let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (razorpayInstance) return razorpayInstance;

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (key_id && key_secret && !key_id.includes('mock')) {
    try {
      razorpayInstance = new Razorpay({
        key_id,
        key_secret
      });
    } catch (err) {
      logger.warn(`Razorpay init failed, will use mock payment mode: ${err.message}`);
    }
  }
  return razorpayInstance;
};

const createOrder = async ({ amount, currency = 'INR', receipt, bookingId, userId }) => {
  const paymentMode = process.env.PAYMENT_MODE || 'qr';

  // If PAYMENT_MODE is 'qr' (default real payment QR flow)
  if (paymentMode !== 'instant') {
    const orderId = `order_qr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const qrToken = crypto.randomBytes(24).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5-minute expiry

    let payment = await Payment.findOne({ booking: bookingId, status: 'created' });
    if (payment) {
      payment.qrToken = qrToken;
      payment.tokenExpiresAt = tokenExpiresAt;
      payment.tokenUsed = false;
      payment.orderId = orderId;
      payment.amount = amount;
      await payment.save();
    } else {
      payment = await Payment.create({
        booking: bookingId,
        user: userId,
        gateway: 'QRPay',
        orderId,
        amount,
        currency,
        status: 'created',
        qrToken,
        tokenExpiresAt,
        tokenUsed: false,
        logs: [{ event: 'order_created_qr', metadata: { amount, receipt, qrToken } }]
      });
    }

    const Booking = require('../models/Booking');
    await Booking.findByIdAndUpdate(bookingId, { payment: payment._id });

    return {
      id: orderId,
      token: qrToken,
      expiresAt: tokenExpiresAt,
      amount: Math.round(amount * 100),
      rawAmount: amount,
      currency,
      receipt,
      paymentMode: 'qr',
      paymentId: payment._id
    };
  }

  // Fallback old flow only if PAYMENT_MODE=instant
  const isMock = process.env.MOCK_PAYMENT_MODE === 'true' || !getRazorpayInstance();

  if (isMock) {
    const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payment = await Payment.create({
      booking: bookingId,
      user: userId,
      gateway: 'MockRazorpay',
      orderId: mockOrderId,
      amount,
      currency,
      status: 'created',
      logs: [{ event: 'order_created_mock', metadata: { amount, receipt } }]
    });

    const Booking = require('../models/Booking');
    await Booking.findByIdAndUpdate(bookingId, { payment: payment._id });

    return {
      id: mockOrderId,
      amount: Math.round(amount * 100),
      rawAmount: amount,
      currency,
      receipt,
      isMock: true,
      paymentMode: 'instant',
      paymentId: payment._id
    };
  }

  try {
    const rzp = getRazorpayInstance();
    const options = {
      amount: Math.round(amount * 100), // Razorpay accepts in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`
    };

    const order = await rzp.orders.create(options);

    const payment = await Payment.create({
      booking: bookingId,
      user: userId,
      gateway: 'Razorpay',
      orderId: order.id,
      amount,
      currency,
      status: 'created',
      logs: [{ event: 'order_created', metadata: order }]
    });

    const Booking = require('../models/Booking');
    await Booking.findByIdAndUpdate(bookingId, { payment: payment._id });

    return {
      ...order,
      rawAmount: amount,
      isMock: false,
      paymentMode: 'instant'
    };
  } catch (error) {
    logger.error(`Razorpay order creation error: ${error.message}`);
    throw error;
  }
};

const verifyPayment = async ({ orderId, paymentId, signature, bookingId, userId }) => {
  const isMock = process.env.MOCK_PAYMENT_MODE === 'true' || orderId.startsWith('order_mock_') || !getRazorpayInstance();

  if (isMock) {
    const payment = await Payment.findOneAndUpdate(
      { orderId },
      {
        $set: {
          paymentId: paymentId || `pay_mock_${Date.now()}`,
          signature: signature || 'mock_verified_signature',
          status: 'success'
        },
        $push: {
          logs: {
            event: 'payment_verified_mock',
            metadata: { orderId, paymentId }
          }
        }
      },
      { new: true }
    );
    return { success: true, isMock: true, payment };
  }

  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === signature;

    if (!isValid) {
      await Payment.findOneAndUpdate(
        { orderId },
        {
          $set: { status: 'failed', paymentId, signature },
          $push: { logs: { event: 'signature_verification_failed' } }
        }
      );
      const error = new Error('Invalid payment signature verification failed');
      error.statusCode = 400;
      throw error;
    }

    const payment = await Payment.findOneAndUpdate(
      { orderId },
      {
        $set: {
          paymentId,
          signature,
          status: 'success'
        },
        $push: {
          logs: {
            event: 'payment_verified',
            metadata: { orderId, paymentId }
          }
        }
      },
      { new: true }
    );

    return { success: true, isMock: false, payment };
  } catch (err) {
    throw err;
  }
};

const processRefund = async ({ payment, refundAmount }) => {
  if (!payment) return null;

  if (payment.gateway === 'MockRazorpay' || process.env.MOCK_PAYMENT_MODE === 'true') {
    const mockRefundId = `rfnd_mock_${Date.now()}`;
    await Payment.findByIdAndUpdate(payment._id, {
      $set: {
        status: 'refunded',
        refundId: mockRefundId
      },
      $push: {
        logs: {
          event: 'refund_processed_mock',
          metadata: { refundAmount, refundId: mockRefundId }
        }
      }
    });
    return { id: mockRefundId, amount: refundAmount, status: 'processed' };
  }

  try {
    const rzp = getRazorpayInstance();
    const refund = await rzp.payments.refund(payment.paymentId, {
      amount: Math.round(refundAmount * 100)
    });

    await Payment.findByIdAndUpdate(payment._id, {
      $set: {
        status: 'refunded',
        refundId: refund.id
      },
      $push: {
        logs: {
          event: 'refund_processed',
          metadata: refund
        }
      }
    });

    return refund;
  } catch (error) {
    logger.error(`Refund processing failed: ${error.message}`);
    throw error;
  }
};

const getPublicPayInfo = async (token) => {
  if (!token) {
    const error = new Error('Token is required');
    error.statusCode = 400;
    throw error;
  }

  const payment = await Payment.findOne({ qrToken: token }).populate({
    path: 'booking',
    populate: {
      path: 'show',
      populate: [{ path: 'movie' }, { path: 'theatre' }]
    }
  });

  if (!payment) {
    const error = new Error('Invalid or non-existent payment session');
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  if (payment.tokenUsed) {
    return {
      success: false,
      status: 'used',
      message: 'This payment link has already been used.',
      amount: payment.amount
    };
  }

  if ((payment.tokenExpiresAt && payment.tokenExpiresAt < now) || payment.status === 'expired') {
    return {
      success: false,
      status: 'expired',
      message: 'This payment link has expired.',
      amount: payment.amount
    };
  }

  const booking = payment.booking;
  if (!booking || booking.status === 'cancelled') {
    return {
      success: false,
      status: 'cancelled',
      message: 'This booking has been cancelled.',
      amount: payment.amount
    };
  }

  if (booking.status === 'confirmed') {
    return {
      success: false,
      status: 'already_confirmed',
      message: 'This booking has already been paid and confirmed.',
      amount: payment.amount
    };
  }

  return {
    success: true,
    status: 'active',
    data: {
      token: payment.qrToken,
      amount: payment.amount,
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
      movieTitle: booking.show?.movie?.title || 'Movie',
      moviePoster: booking.show?.movie?.posterUrl,
      theatreName: booking.show?.theatre?.name,
      screenName: booking.show?.screenName,
      date: booking.show?.date,
      startTime: booking.show?.startTime,
      seats: booking.seats,
      expiresAt: payment.tokenExpiresAt
    }
  };
};

const confirmPublicPayment = async (token) => {
  if (!token) {
    const error = new Error('Payment token is required');
    error.statusCode = 400;
    throw error;
  }

  const payment = await Payment.findOne({ qrToken: token }).populate('booking');
  if (!payment) {
    const error = new Error('Invalid payment session');
    error.statusCode = 404;
    throw error;
  }

  if (payment.tokenUsed) {
    const error = new Error('This payment link has already been used');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  if ((payment.tokenExpiresAt && payment.tokenExpiresAt < now) || payment.status === 'expired') {
    const error = new Error('This payment session has expired');
    error.statusCode = 400;
    throw error;
  }

  const booking = payment.booking;
  if (!booking) {
    const error = new Error('Associated booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (booking.status !== 'pending') {
    const error = new Error(`Booking is in ${booking.status} state, cannot confirm`);
    error.statusCode = 400;
    throw error;
  }

  // 1. Mark payment as successful and token as used
  payment.status = 'success';
  payment.tokenUsed = true;
  payment.paymentId = `pay_qr_${Date.now()}`;
  payment.signature = 'qr_verified_server';
  payment.logs.push({
    event: 'qr_payment_confirmed_by_server',
    timestamp: new Date(),
    metadata: { token }
  });
  await payment.save();

  // 2. Confirm booking, change seats to 'booked', create notification, send email
  const bookingService = require('./bookingService');
  const confirmedBooking = await bookingService.confirmBooking({
    bookingId: booking._id,
    payment,
    userId: booking.user
  });

  // 3. Socket broadcast for real-time notification on client
  const { broadcastPaymentConfirmed } = require('../sockets/seatSocket');
  broadcastPaymentConfirmed(booking._id.toString(), {
    bookingId: booking._id,
    status: 'confirmed'
  });

  return {
    success: true,
    message: 'Payment verified and booking confirmed successfully',
    bookingId: booking._id,
    bookingCode: confirmedBooking.bookingCode
  };
};

const cancelPublicPayment = async (token) => {
  if (!token) {
    const error = new Error('Token is required');
    error.statusCode = 400;
    throw error;
  }

  const payment = await Payment.findOne({ qrToken: token }).populate('booking');
  if (!payment) {
    const error = new Error('Payment session not found');
    error.statusCode = 404;
    throw error;
  }

  payment.status = 'cancelled';
  payment.tokenUsed = true;
  payment.logs.push({ event: 'cancelled_by_user_on_public_page', timestamp: new Date() });
  await payment.save();

  const booking = payment.booking;
  if (booking && booking.status === 'pending') {
    booking.status = 'cancelled';
    booking.cancellationReason = 'Cancelled by customer during payment';
    booking.cancelledAt = new Date();
    await booking.save();

    // Release seats
    const Seat = require('../models/Seat');
    const { broadcastSeatsReleased, broadcastPaymentCancelled } = require('../sockets/seatSocket');
    await Seat.updateMany(
      { show: booking.show, seatNumber: { $in: booking.seats } },
      { $set: { status: 'available', lockedBy: null, lockExpiresAt: null, booking: null } }
    );

    broadcastSeatsReleased(booking.show.toString(), {
      seats: booking.seats,
      reason: 'Payment cancelled'
    });

    broadcastPaymentCancelled(booking._id.toString(), {
      bookingId: booking._id,
      status: 'cancelled'
    });
  }

  return { success: true, message: 'Payment cancelled and seats released' };
};

const expirePayment = async ({ bookingId, userId }) => {
  const Booking = require('../models/Booking');
  const Seat = require('../models/Seat');
  const { broadcastSeatsReleased, broadcastPaymentCancelled } = require('../sockets/seatSocket');

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (userId && booking.user.toString() !== userId.toString()) {
    const error = new Error('Unauthorized');
    error.statusCode = 403;
    throw error;
  }

  // Mark payment expired
  await Payment.updateMany(
    { booking: bookingId, status: { $in: ['created', 'pending'] } },
    {
      $set: { status: 'expired', tokenUsed: true },
      $push: { logs: { event: 'payment_expired_timeout', timestamp: new Date() } }
    }
  );

  if (booking.status === 'pending') {
    booking.status = 'cancelled';
    booking.cancellationReason = 'Payment timed out';
    booking.cancelledAt = new Date();
    await booking.save();

    // Release seats using existing seat-lock logic
    await Seat.updateMany(
      { show: booking.show, seatNumber: { $in: booking.seats } },
      { $set: { status: 'available', lockedBy: null, lockExpiresAt: null, booking: null } }
    );

    broadcastSeatsReleased(booking.show.toString(), {
      seats: booking.seats,
      reason: 'Payment timed out'
    });

    broadcastPaymentCancelled(booking._id.toString(), {
      bookingId: booking._id,
      status: 'expired'
    });
  }

  return { success: true, message: 'Payment timed out, booking cancelled and seats released' };
};

const getPaymentStatus = async (bookingId) => {
  const Booking = require('../models/Booking');
  const booking = await Booking.findById(bookingId).populate('payment');
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  const payment = booking.payment || (await Payment.findOne({ booking: bookingId }).sort({ createdAt: -1 }));

  return {
    bookingId: booking._id,
    bookingStatus: booking.status,
    paymentStatus: payment ? payment.status : 'none',
    isConfirmed: booking.status === 'confirmed',
    isCancelled: booking.status === 'cancelled' || booking.status === 'refunded',
    isExpired:
      payment?.status === 'expired' ||
      (booking.status === 'cancelled' && booking.cancellationReason?.includes('timed out')),
    tokenUsed: payment?.tokenUsed || false
  };
};

module.exports = {
  createOrder,
  verifyPayment,
  processRefund,
  getPublicPayInfo,
  confirmPublicPayment,
  cancelPublicPayment,
  expirePayment,
  getPaymentStatus
};
