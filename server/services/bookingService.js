const crypto = require('crypto');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const Show = require('../models/Show');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const User = require('../models/User');
const { generateQRCode } = require('../utils/qrGenerator');
const { broadcastSeatsBooked, broadcastSeatsReleased } = require('../sockets/seatSocket');
const { sendBookingEmail, sendCancellationEmail } = require('./emailService');
const { createNotification } = require('./notificationService');
const { processRefund } = require('./paymentService');

const generateBookingCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'IMV-';
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const createPendingBooking = async ({ showId, seats, userId }) => {
  const show = await Show.findById(showId).populate('movie theatre');
  if (!show) {
    const error = new Error('Show not found');
    error.statusCode = 404;
    throw error;
  }

  // Find all the requested seats
  const seatDocs = await Seat.find({
    show: showId,
    seatNumber: { $in: seats }
  });

  if (seatDocs.length !== seats.length) {
    const error = new Error('Some requested seats do not exist in this show');
    error.statusCode = 400;
    throw error;
  }

  // Ensure seats are locked by this user and not expired
  const now = new Date();
  const invalidSeats = seatDocs.filter(
    (s) => s.status !== 'locked' || !s.lockedBy || s.lockedBy.toString() !== userId.toString() || s.lockExpiresAt < now
  );

  if (invalidSeats.length > 0) {
    const error = new Error('Seat lock expired or seats belong to another user. Please re-select your seats');
    error.statusCode = 409;
    throw error;
  }

  let totalAmount = 0;
  const seatDetails = seatDocs.map((s) => {
    totalAmount += s.price;
    return {
      seatNumber: s.seatNumber,
      type: s.type,
      price: s.price
    };
  });

  const bookingCode = generateBookingCode();
  const qrDataPayload = {
    code: bookingCode,
    movie: show.movie.title,
    theatre: show.theatre.name,
    screen: show.screenName,
    date: show.date,
    time: show.startTime,
    seats,
    total: totalAmount
  };

  const qrCodeData = await generateQRCode(qrDataPayload);

  const booking = await Booking.create({
    user: userId,
    show: showId,
    seats,
    seatDetails,
    totalAmount,
    status: 'pending',
    bookingCode,
    qrCodeData
  });

  // Attach booking ID reference to the locked seats
  await Seat.updateMany(
    { _id: { $in: seatDocs.map((s) => s._id) } },
    { $set: { booking: booking._id } }
  );

  return {
    booking,
    show
  };
};

const confirmBooking = async ({ bookingId, payment, userId }) => {
  const booking = await Booking.findById(bookingId).populate({
    path: 'show',
    populate: [{ path: 'movie' }, { path: 'theatre' }]
  });

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (booking.status === 'confirmed') {
    return booking;
  }

  // Atomically update seat status to 'booked'
  await Seat.updateMany(
    {
      show: booking.show._id,
      seatNumber: { $in: booking.seats }
    },
    {
      $set: {
        status: 'booked',
        booking: booking._id,
        lockedBy: null,
        lockExpiresAt: null
      }
    }
  );

  booking.status = 'confirmed';
  booking.payment = payment ? payment._id : null;
  await booking.save();

  // Real-time broadcast to room
  broadcastSeatsBooked(booking.show._id.toString(), {
    seats: booking.seats,
    bookingId: booking._id
  });

  const user = await User.findById(userId);

  // Send In-App Notification
  await createNotification({
    userId,
    type: 'booking',
    title: 'Booking Confirmed!',
    message: `Your booking for "${booking.show.movie.title}" is confirmed. Booking Code: ${booking.bookingCode}`,
    metadata: { bookingId: booking._id, bookingCode: booking.bookingCode }
  });

  // Send Email with Ticket Details
  if (user && user.email) {
    sendBookingEmail({
      toEmail: user.email,
      userName: user.name,
      booking,
      show: booking.show,
      movie: booking.show.movie,
      theatre: booking.show.theatre
    }).catch(() => {});
  }

  return booking;
};

const getMyBookings = async (userId, { type = 'all', page = 1, limit = 10 }) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const bookings = await Booking.find({ user: userId })
    .populate({
      path: 'show',
      populate: [{ path: 'movie' }, { path: 'theatre' }]
    })
    .populate('payment')
    .sort({ createdAt: -1 })
    .lean();

  const now = new Date();
  const classifiedBookings = bookings.map((b) => {
    let isUpcoming = true;
    if (b.show && b.show.date && b.show.startTime) {
      const showDateTime = new Date(`${b.show.date}T${b.show.startTime}:00`);
      if (showDateTime < now) {
        isUpcoming = false;
      }
    }
    return {
      ...b,
      isUpcoming
    };
  });

  let filtered = classifiedBookings;
  if (type === 'upcoming') {
    filtered = classifiedBookings.filter((b) => b.isUpcoming && b.status === 'confirmed');
  } else if (type === 'past') {
    filtered = classifiedBookings.filter((b) => !b.isUpcoming || b.status === 'cancelled' || b.status === 'refunded');
  }

  const paginated = filtered.slice(skip, skip + limitNum);

  return {
    bookings: paginated,
    pagination: {
      total: filtered.length,
      page: pageNum,
      pages: Math.ceil(filtered.length / limitNum) || 1,
      limit: limitNum
    }
  };
};

const getBookingById = async (bookingId, userId, userRole) => {
  const booking = await Booking.findById(bookingId)
    .populate({
      path: 'show',
      populate: [{ path: 'movie' }, { path: 'theatre' }]
    })
    .populate('payment')
    .populate('user', 'name email phone');

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (userRole !== 'admin' && booking.user._id.toString() !== userId.toString()) {
    const error = new Error('Unauthorized to view this booking');
    error.statusCode = 403;
    throw error;
  }

  return booking;
};

const cancelBooking = async ({ bookingId, userId, userRole, reason }) => {
  const booking = await Booking.findById(bookingId)
    .populate({
      path: 'show',
      populate: [{ path: 'movie' }, { path: 'theatre' }]
    })
    .populate('payment')
    .populate('user', 'name email');

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (userRole !== 'admin' && booking.user._id.toString() !== userId.toString()) {
    const error = new Error('Unauthorized to cancel this booking');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status === 'cancelled' || booking.status === 'refunded') {
    const error = new Error('This booking has already been cancelled');
    error.statusCode = 400;
    throw error;
  }

  // Calculate Refund Eligibility:
  // Policy: 100% refund if cancelled more than 2 hours before show; 0% after
  let refundEligible = false;
  let refundAmount = 0;

  if (booking.show && booking.show.date && booking.show.startTime) {
    const showDateTime = new Date(`${booking.show.date}T${booking.show.startTime}:00`);
    const now = new Date();
    const hoursDifference = (showDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference >= 2) {
      refundEligible = true;
      refundAmount = booking.totalAmount;
    }
  }

  // Process refund if payment exists and refund eligible
  if (refundEligible && booking.payment) {
    await processRefund({
      payment: booking.payment,
      refundAmount
    });
  }

  booking.status = refundAmount > 0 ? 'refunded' : 'cancelled';
  booking.cancellationReason = reason || 'Cancelled by user';
  booking.cancelledAt = new Date();
  booking.refundAmount = refundAmount;
  await booking.save();

  // Atomically release the seats
  await Seat.updateMany(
    {
      show: booking.show._id,
      seatNumber: { $in: booking.seats }
    },
    {
      $set: {
        status: 'available',
        lockedBy: null,
        lockExpiresAt: null,
        booking: null
      }
    }
  );

  broadcastSeatsReleased(booking.show._id.toString(), {
    seats: booking.seats,
    reason: 'Booking cancelled'
  });

  // Create In-App Notification
  await createNotification({
    userId: booking.user._id,
    type: 'booking',
    title: 'Booking Cancelled',
    message: `Your booking ${booking.bookingCode} was cancelled.${refundAmount > 0 ? ` A refund of ₹${refundAmount} has been initiated.` : ''}`,
    metadata: { bookingId: booking._id, refundAmount }
  });

  // Send Cancellation Email
  sendCancellationEmail({
    toEmail: booking.user.email,
    userName: booking.user.name,
    booking,
    refundAmount
  }).catch(() => {});

  return {
    booking,
    refundAmount,
    refundEligible
  };
};

const getAllBookingsAdmin = async (queryParams) => {
  const { page = 1, limit = 15, status, search } = queryParams;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.bookingCode = { $regex: search.trim(), $options: 'i' };
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('user', 'name email phone')
      .populate({
        path: 'show',
        populate: [{ path: 'movie' }, { path: 'theatre' }]
      })
      .populate('payment')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Booking.countDocuments(filter)
  ]);

  return {
    bookings,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      limit: limitNum
    }
  };
};

module.exports = {
  createPendingBooking,
  confirmBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookingsAdmin
};
