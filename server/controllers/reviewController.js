const reviewService = require('../services/reviewService');

const getMovieReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const includeUnapproved = req.user && req.user.role === 'admin';
    const reviews = await reviewService.getMovieReviews(id, includeUnapproved);

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (err) {
    next(err);
  }
};

const addReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    const review = await reviewService.addReview({
      userId,
      movieId: id,
      rating: Number(rating),
      comment
    });

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: review
    });
  } catch (err) {
    next(err);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params; // review id
    const { rating, comment } = req.body;
    const userId = req.user._id;

    const review = await reviewService.updateReview({
      reviewId: id,
      userId,
      rating: rating !== undefined ? Number(rating) : undefined,
      comment
    });

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (err) {
    next(err);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    await reviewService.deleteReview(id, userId, isAdmin);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

const moderateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const review = await reviewService.moderateReview(id, isApproved);

    res.status(200).json({
      success: true,
      message: `Review ${isApproved ? 'approved' : 'rejected'} successfully`,
      data: review
    });
  } catch (err) {
    next(err);
  }
};

const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const reviews = await reviewService.getAllReviewsAdmin();
    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMovieReviews,
  addReview,
  updateReview,
  deleteReview,
  moderateReview,
  getAllReviewsAdmin
};
