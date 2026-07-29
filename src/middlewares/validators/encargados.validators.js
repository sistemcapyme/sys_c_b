const { body } = require('express-validator');
const { validateResult } = require('../validation.middleware.js');

const validateCreateEncargado = [
  body('nombre').notEmpty().isString().isLength({ max: 100 }),
  body('apellido').notEmpty().isString().isLength({ max: 100 }),
  body('email').notEmpty().isEmail().isLength({ max: 150 }),
  body('password').notEmpty().isString().isLength({ min: 6, max: 255 }),
  body('telefono').optional().isString().isLength({ max: 20 }),
  validateResult
];

const validateUpdateEncargado = [
  body('nombre').optional().isString().isLength({ max: 100 }),
  body('apellido').optional().isString().isLength({ max: 100 }),
  body('email').optional().isEmail().isLength({ max: 150 }),
  body('password').optional().isString().isLength({ min: 6, max: 255 }),
  body('telefono').optional().isString().isLength({ max: 20 }),
  body('activo').optional().isBoolean(),
  validateResult
];

module.exports = {
  validateCreateEncargado,
  validateUpdateEncargado
};