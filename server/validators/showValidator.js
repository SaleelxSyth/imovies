const { body } = require('express-validator');

const showValidator = [
  body('movie').isMongoId().withMessage('Valid movie ID is required'),
  body('theatre').isMongoId().withMessage('Valid theatre ID is required'),
  body('screenName').trim().notEmpty().withMessage('Screen name is required'),
  body('date').notEmpty().withMessage('Show date is required'),
  body('startTime').notEmpty().withMessage('Start time is required')
];

module.exports = { showValidator };
