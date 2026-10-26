const adminService = require('../services/adminService');

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
};

const getRevenueReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await adminService.getRevenueReport({ startDate, endDate });
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const result = await adminService.getAllUsers(req.query);
    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

const toggleBlockUser = async (req, res, next) => {
  try {
    const result = await adminService.toggleBlockUser(req.params.id);
    res.status(200).json({
      success: true,
      message: result.isBlocked ? 'User has been blocked' : 'User has been unblocked',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getRevenueReport,
  getAllUsers,
  toggleBlockUser
};
