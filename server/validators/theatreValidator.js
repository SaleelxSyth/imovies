const { body } = require('express-validator');

const theatreValidator = [
  body('name').trim().notEmpty().withMessage('Theatre name is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('location').trim().notEmpty().withMessage('Location/address is required')
];

module.exports = { theatreValidator };
