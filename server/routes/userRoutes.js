const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const adminController = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Current user profile
router.route('/profile')
  .get(protect, userController.getProfile)
  .put(protect, userController.updateProfile);

// Favorites / Watchlist
router.route('/favorites')
  .get(protect, userController.getFavorites);

router.route('/favorites/:movieId')
  .post(protect, userController.addFavorite)
  .delete(protect, userController.removeFavorite);

// Admin user management routes
router.get('/', protect, authorizeRoles('admin'), adminController.getAllUsers);
router.patch('/:id/block', protect, authorizeRoles('admin'), adminController.toggleBlockUser);

module.exports = router;
