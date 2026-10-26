const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.put('/:id', protect, reviewController.updateReview);
router.delete('/:id', protect, reviewController.deleteReview);

// Admin review moderation
router.get('/admin', protect, authorizeRoles('admin'), reviewController.getAllReviewsAdmin);
router.patch('/:id/moderate', protect, authorizeRoles('admin'), reviewController.moderateReview);

module.exports = router;
