const { body } = require('express-validator');

const createBookingValidator = [
  body('showId').isMongoId().withMessage('Valid show ID is required'),
  body('seats')
    .isArray({ min: 1, max: 8 })
    .withMessage('You can book between 1 and 8 seats per transaction')
];

module.exports = { createBookingValidator };
