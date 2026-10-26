const Theatre = require('../models/Theatre');

const getTheatres = async (city) => {
  const filter = {};
  if (city) {
    filter.city = new RegExp(`^${city.trim()}$`, 'i');
  }
  return await Theatre.find(filter).sort({ name: 1 }).lean();
};

const getTheatreById = async (id) => {
  const theatre = await Theatre.findById(id);
  if (!theatre) {
    const error = new Error('Theatre not found');
    error.statusCode = 404;
    throw error;
  }
  return theatre;
};

const createTheatre = async (theatreData) => {
  return await Theatre.create(theatreData);
};

const updateTheatre = async (id, updateData) => {
  const theatre = await Theatre.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });
  if (!theatre) {
    const error = new Error('Theatre not found');
    error.statusCode = 404;
    throw error;
  }
  return theatre;
};

const deleteTheatre = async (id) => {
  const theatre = await Theatre.findByIdAndDelete(id);
  if (!theatre) {
    const error = new Error('Theatre not found');
    error.statusCode = 404;
    throw error;
  }
  return theatre;
};

module.exports = {
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre
};
