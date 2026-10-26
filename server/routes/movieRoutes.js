const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const reviewController = require('../controllers/reviewController');
const { protect, authorizeRoles, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { movieValidator } = require('../validators/movieValidator');

// Public browse & search
router.route('/')
  .get(movieController.getMovies)
  .post(protect, authorizeRoles('admin'), upload.single('poster'), movieValidator, validate, movieController.createMovie);

router.route('/:id')
  .get(movieController.getMovieById)
  .put(protect, authorizeRoles('admin'), upload.single('poster'), movieController.updateMovie)
  .delete(protect, authorizeRoles('admin'), movieController.deleteMovie);

// Nested reviews under movies: /movies/:id/reviews
router.route('/:id/reviews')
  .get(optionalAuth, reviewController.getMovieReviews)
  .post(protect, reviewController.addReview);

module.exports = router;
