const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');

const getMovies = async (queryParams) => {
  const {
    search,
    genre,
    language,
    city,
    theatreId,
    date,
    rating,
    status,
    page = 1,
    limit = 12,
    sortBy = 'releaseDate',
    order = 'desc'
  } = queryParams;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (genre) {
    const genres = genre.split(',').map((g) => g.trim());
    filter.genre = { $in: genres };
  }

  if (language) {
    filter.language = new RegExp(`^${language.trim()}$`, 'i');
  }

  if (rating) {
    filter.rating = { $gte: Number(rating) };
  }

  if (search && search.trim()) {
    filter.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { genre: { $regex: search.trim(), $options: 'i' } },
      { cast: { $regex: search.trim(), $options: 'i' } },
      { director: { $regex: search.trim(), $options: 'i' } }
    ];
  }

  // If filtered by city, theatre, or date, find movies currently having shows matching those criteria
  if (city || theatreId || date) {
    const showFilter = { status: 'active' };

    if (date) {
      showFilter.date = date;
    }

    if (theatreId) {
      showFilter.theatre = theatreId;
    } else if (city) {
      const theatresInCity = await Theatre.find({
        city: new RegExp(`^${city.trim()}$`, 'i')
      }).select('_id');
      const theatreIds = theatresInCity.map((t) => t._id);
      showFilter.theatre = { $in: theatreIds };
    }

    const matchingShows = await Show.find(showFilter).distinct('movie');
    filter._id = { $in: matchingShows };
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const sortOptions = {};
  if (sortBy === 'rating') {
    sortOptions.rating = sortOrder;
  } else if (sortBy === 'title') {
    sortOptions.title = sortOrder;
  } else {
    sortOptions.releaseDate = sortOrder;
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const [movies, total] = await Promise.all([
    Movie.find(filter).sort(sortOptions).skip(skip).limit(limitNum).lean(),
    Movie.countDocuments(filter)
  ]);

  return {
    movies,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      limit: limitNum
    }
  };
};

const getMovieById = async (id) => {
  const movie = await Movie.findById(id);
  if (!movie) {
    const error = new Error('Movie not found');
    error.statusCode = 404;
    throw error;
  }
  return movie;
};

const createMovie = async (movieData) => {
  return await Movie.create(movieData);
};

const updateMovie = async (id, updateData) => {
  const movie = await Movie.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });
  if (!movie) {
    const error = new Error('Movie not found');
    error.statusCode = 404;
    throw error;
  }
  return movie;
};

const deleteMovie = async (id) => {
  const movie = await Movie.findByIdAndDelete(id);
  if (!movie) {
    const error = new Error('Movie not found');
    error.statusCode = 404;
    throw error;
  }
  // Also clean up shows associated with this movie
  await Show.deleteMany({ movie: id });
  return movie;
};

module.exports = {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie
};
