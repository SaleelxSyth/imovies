const seatService = require('../services/seatService');

const getSeats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user._id : null;
    const seats = await seatService.getSeatsForShow(id, userId);

    res.status(200).json({
      success: true,
      data: seats
    });
  } catch (err) {
    next(err);
  }
};

const lockSeats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { seats } = req.body;
    const userId = req.user._id;

    const result = await seatService.lockSeats(id, seats, userId);

    res.status(200).json({
      success: true,
      message: 'Seats locked successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

const unlockSeats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { seats } = req.body;
    const userId = req.user ? req.user._id : null;

    const result = await seatService.unlockSeats(id, seats, userId);

    res.status(200).json({
      success: true,
      message: 'Seats unlocked successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSeats,
  lockSeats,
  unlockSeats
};
