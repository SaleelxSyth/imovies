const express = require('express');
const router = express.Router();
const showController = require('../controllers/showController');
const seatController = require('../controllers/seatController');
const { protect, authorizeRoles, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { showValidator } = require('../validators/showValidator');

router.route('/')
  .get(showController.getShows)
  .post(protect, authorizeRoles('admin'), showValidator, validate, showController.createShow);

router.route('/:id')
  .get(optionalAuth, showController.getShowById)
  .put(protect, authorizeRoles('admin'), showController.updateShow)
  .delete(protect, authorizeRoles('admin'), showController.deleteShow);

// Seats subroutes on show
router.route('/:id/seats')
  .get(optionalAuth, seatController.getSeats);

router.route('/:id/seats/lock')
  .post(protect, seatController.lockSeats);

router.route('/:id/seats/unlock')
  .post(protect, seatController.unlockSeats);

module.exports = router;
