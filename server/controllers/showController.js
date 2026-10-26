const showService = require('../services/showService');
const seatService = require('../services/seatService');

const getShows = async (req, res, next) => {
  try {
    const shows = await showService.getShows(req.query);
    res.status(200).json({
      success: true,
      data: shows
    });
  } catch (err) {
    next(err);
  }
};

const getShowById = async (req, res, next) => {
  try {
    const show = await showService.getShowById(req.params.id);
    const userId = req.user ? req.user._id : null;
    const seats = await seatService.getSeatsForShow(show._id, userId);

    res.status(200).json({
      success: true,
      data: {
        ...show.toObject(),
        seats
      }
    });
  } catch (err) {
    next(err);
  }
};

const createShow = async (req, res, next) => {
  try {
    const show = await showService.createShow(req.body);
    res.status(201).json({
      success: true,
      message: 'Show created with seats generated automatically',
      data: show
    });
  } catch (err) {
    next(err);
  }
};

const updateShow = async (req, res, next) => {
  try {
    const show = await showService.updateShow(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Show updated successfully',
      data: show
    });
  } catch (err) {
    next(err);
  }
};

const deleteShow = async (req, res, next) => {
  try {
    await showService.deleteShow(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Show and associated seats deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getShows,
  getShowById,
  createShow,
  updateShow,
  deleteShow
};
