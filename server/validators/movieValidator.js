const { body } = require('express-validator');

const movieValidator = [
  body('title').trim().notEmpty().withMessage('Movie title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('genre').notEmpty().withMessage('At least one genre is required'),
  body('language').trim().notEmpty().withMessage('Language is required'),
  body('duration').isNumeric().withMessage('Duration must be a number in minutes'),
  body('releaseDate').notEmpty().withMessage('Release date is required'),
  body('status')
    .optional()
    .isIn(['now_showing', 'upcoming', 'archived'])
    .withMessage('Status must be now_showing, upcoming, or archived')
];

module.exports = { movieValidator };
