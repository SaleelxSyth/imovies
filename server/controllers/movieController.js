const movieService = require('../services/movieService');

const getMovies = async (req, res, next) => {
  try {
    const result = await movieService.getMovies(req.query);
    res.status(200).json({
      success: true,
      data: result.movies,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

const getMovieById = async (req, res, next) => {
  try {
    const movie = await movieService.getMovieById(req.params.id);
    res.status(200).json({
      success: true,
      data: movie
    });
  } catch (err) {
    next(err);
  }
};

const createMovie = async (req, res, next) => {
  try {
    const movieData = { ...req.body };

    // Format genres if passed as comma-separated string or array
    if (typeof movieData.genre === 'string') {
      movieData.genre = movieData.genre.split(',').map((g) => g.trim());
    }

    if (typeof movieData.cast === 'string') {
      movieData.cast = movieData.cast.split(',').map((c) => c.trim());
    }

    // Attach uploaded poster file if provided via multer
    if (req.file) {
      movieData.posterUrl = `/uploads/${req.file.filename}`;
    }

    const movie = await movieService.createMovie(movieData);
    res.status(201).json({
      success: true,
      message: 'Movie created successfully',
      data: movie
    });
  } catch (err) {
    next(err);
  }
};

const updateMovie = async (req, res, next) => {
  try {
    const movieData = { ...req.body };

    if (typeof movieData.genre === 'string') {
      movieData.genre = movieData.genre.split(',').map((g) => g.trim());
    }

    if (typeof movieData.cast === 'string') {
      movieData.cast = movieData.cast.split(',').map((c) => c.trim());
    }

    if (req.file) {
      movieData.posterUrl = `/uploads/${req.file.filename}`;
    }

    const movie = await movieService.updateMovie(req.params.id, movieData);
    res.status(200).json({
      success: true,
      message: 'Movie updated successfully',
      data: movie
    });
  } catch (err) {
    next(err);
  }
};

const deleteMovie = async (req, res, next) => {
  try {
    await movieService.deleteMovie(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Movie deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie
};
