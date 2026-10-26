const theatreService = require('../services/theatreService');

const getTheatres = async (req, res, next) => {
  try {
    const theatres = await theatreService.getTheatres(req.query.city);
    res.status(200).json({
      success: true,
      data: theatres
    });
  } catch (err) {
    next(err);
  }
};

const getTheatreById = async (req, res, next) => {
  try {
    const theatre = await theatreService.getTheatreById(req.params.id);
    res.status(200).json({
      success: true,
      data: theatre
    });
  } catch (err) {
    next(err);
  }
};

const createTheatre = async (req, res, next) => {
  try {
    const theatre = await theatreService.createTheatre(req.body);
    res.status(201).json({
      success: true,
      message: 'Theatre created successfully',
      data: theatre
    });
  } catch (err) {
    next(err);
  }
};

const updateTheatre = async (req, res, next) => {
  try {
    const theatre = await theatreService.updateTheatre(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Theatre updated successfully',
      data: theatre
    });
  } catch (err) {
    next(err);
  }
};

const deleteTheatre = async (req, res, next) => {
  try {
    await theatreService.deleteTheatre(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Theatre deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre
};
