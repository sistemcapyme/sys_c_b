const { body, validationResult } = require('express-validator');

// Creamos la función validadora directamente aquí para evitar errores de importación
const validarCampos = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const validateCreateEncargado = [
  body('nombre').notEmpty().withMessage('El nombre es requerido').isLength({ max: 100 }),
  body('apellido').notEmpty().withMessage('El apellido es requerido').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Se requiere un correo válido').isLength({ max: 150 }),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('telefono').optional().isString().isLength({ max: 20 }),
  validarCampos // Usamos la función local
];

const validateUpdateEncargado = [
  body('nombre').optional().notEmpty().isLength({ max: 100 }),
  body('apellido').optional().notEmpty().isLength({ max: 100 }),
  body('email').optional().isEmail().isLength({ max: 150 }),
  body('password').optional().isLength({ min: 6 }),
  body('telefono').optional().isString().isLength({ max: 20 }),
  body('activo').optional().isBoolean(),
  validarCampos // Usamos la función local
];

module.exports = {
  validateCreateEncargado,
  validateUpdateEncargado
};