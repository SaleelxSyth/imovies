const express = require('express');
const router = express.Router();
const theatreController = require('../controllers/theatreController');
const { protect, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { theatreValidator } = require('../validators/theatreValidator');

router.route('/')
  .get(theatreController.getTheatres)
  .post(protect, authorizeRoles('admin'), theatreValidator, validate, theatreController.createTheatre);

router.route('/:id')
  .get(theatreController.getTheatreById)
  .put(protect, authorizeRoles('admin'), theatreController.updateTheatre)
  .delete(protect, authorizeRoles('admin'), theatreController.deleteTheatre);

module.exports = router;
