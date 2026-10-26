const User = require('../models/User');
const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const Seat = require('../models/Seat');
const Show = require('../models/Show');
const Payment = require('../models/Payment');

const getDashboardStats = async () => {
  const [totalUsers, totalBookings, confirmedBookings, totalMovies, totalShows] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Booking.countDocuments(),
    Booking.find({ status: 'confirmed' }),
    Movie.countDocuments(),
    Show.countDocuments({ status: 'active' })
  ]);

  // Total revenue from confirmed bookings
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Seat occupancy rate
  const [totalSeats, bookedSeats] = await Promise.all([
    Seat.countDocuments(),
    Seat.countDocuments({ status: 'booked' })
  ]);
  const occupancyRate = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

  // Top movies by revenue / bookings
  const topMoviesAgg = await Booking.aggregate([
    { $match: { status: 'confirmed' } },
    {
      $lookup: {
        from: 'shows',
        localField: 'show',
        foreignField: '_id',
        as: 'showData'
      }
    },
    { $unwind: '$showData' },
    {
      $group: {
        _id: '$showData.movie',
        revenue: { $sum: '$totalAmount' },
        bookingsCount: { $sum: 1 },
        totalSeatsBooked: { $sum: { $size: '$seats' } }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'movies',
        localField: '_id',
        foreignField: '_id',
        as: 'movie'
      }
    },
    { $unwind: '$movie' },
    {
      $project: {
        movieId: '$_id',
        title: '$movie.title',
        posterUrl: '$movie.posterUrl',
        revenue: 1,
        bookingsCount: 1,
        totalSeatsBooked: 1
      }
    }
  ]);

  // Recent 7 days revenue trend
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const revenueTrend = await Booking.aggregate([
    {
      $match: {
        status: 'confirmed',
        createdAt: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        dailyRevenue: { $sum: '$totalAmount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    overview: {
      totalUsers,
      totalBookings,
      confirmedBookingsCount: confirmedBookings.length,
      totalRevenue,
      totalMovies,
      totalShows,
      occupancyRate,
      totalSeats,
      bookedSeats
    },
    topMovies: topMoviesAgg,
    revenueTrend
  };
};

const getRevenueReport = async ({ startDate, endDate }) => {
  const filter = { status: 'confirmed' };
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const report = await Booking.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        totalBookings: { $sum: 1 },
        totalSeats: { $sum: { $size: '$seats' } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const summary = report.reduce(
    (acc, day) => {
      acc.totalRevenue += day.revenue;
      acc.totalBookings += day.totalBookings;
      acc.totalSeats += day.totalSeats;
      return acc;
    },
    { totalRevenue: 0, totalBookings: 0, totalSeats: 0 }
  );

  return { summary, dailyReport: report };
};

const getAllUsers = async (queryParams) => {
  const { search, page = 1, limit = 20 } = queryParams;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { email: { $regex: search.trim(), $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    User.countDocuments(filter)
  ]);

  return {
    users,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      limit: limitNum
    }
  };
};

const toggleBlockUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'admin') {
    const error = new Error('Admin users cannot be blocked');
    error.statusCode = 400;
    throw error;
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isBlocked: user.isBlocked
  };
};

module.exports = {
  getDashboardStats,
  getRevenueReport,
  getAllUsers,
  toggleBlockUser
};
