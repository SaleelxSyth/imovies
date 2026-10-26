const Review = require('../models/Review');

const getMovieReviews = async (movieId, includeUnapproved = false) => {
  const filter = { movie: movieId };
  if (!includeUnapproved) {
    filter.isApproved = true;
  }

  return await Review.find(filter)
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .lean();
};

const addReview = async ({ userId, movieId, rating, comment }) => {
  // Check if review already exists
  const existingReview = await Review.findOne({ user: userId, movie: movieId });
  if (existingReview) {
    const error = new Error('You have already submitted a review for this movie');
    error.statusCode = 400;
    throw error;
  }

  const review = await Review.create({
    user: userId,
    movie: movieId,
    rating,
    comment,
    isApproved: true
  });

  return await review.populate('user', 'name');
};

const updateReview = async ({ reviewId, userId, rating, comment }) => {
  const review = await Review.findOne({ _id: reviewId, user: userId });
  if (!review) {
    const error = new Error('Review not found or not authorized to edit');
    error.statusCode = 404;
    throw error;
  }

  review.rating = rating !== undefined ? rating : review.rating;
  review.comment = comment !== undefined ? comment : review.comment;
  await review.save();

  return await review.populate('user', 'name');
};

const deleteReview = async (reviewId, userId, isAdmin = false) => {
  const filter = { _id: reviewId };
  if (!isAdmin) {
    filter.user = userId;
  }

  const review = await Review.findOneAndDelete(filter);
  if (!review) {
    const error = new Error('Review not found or not authorized to delete');
    error.statusCode = 404;
    throw error;
  }

  return review;
};

const moderateReview = async (reviewId, isApproved) => {
  const review = await Review.findByIdAndUpdate(
    reviewId,
    { isApproved },
    { new: true }
  ).populate('user', 'name');

  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  // Recalculate average rating
  await Review.calculateAverageRating(review.movie);

  return review;
};

const getAllReviewsAdmin = async () => {
  return await Review.find()
    .populate('user', 'name email')
    .populate('movie', 'title')
    .sort({ createdAt: -1 })
    .lean();
};

module.exports = {
  getMovieReviews,
  addReview,
  updateReview,
  deleteReview,
  moderateReview,
  getAllReviewsAdmin
};
