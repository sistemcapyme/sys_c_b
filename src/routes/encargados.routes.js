const { Router } = require('express');
const encargadosController = require('../controllers/encargados.controller.js');
const { verifyToken } = require('../middlewares/auth.middleware.js');
const { validateCreateEncargado, validateUpdateEncargado } = require('../middlewares/validators/encargados.validators.js');

const router = Router();

// 1. Verificamos el token del usuario
router.use(verifyToken);

// 2. Validación manual e infalible de roles (Evita el Error 403)
router.use((req, res, next) => {
  // Tomamos el usuario de la request (soporta req.usuario o req.user dependiendo de tu sistema)
  const usuario = req.usuario || req.user;
  
  if (!usuario) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  // Verificamos si es admin o lider_jcf
  if (usuario.rol === 'admin' || usuario.rol === 'lider_jcf') {
    next(); // Si tiene el rol correcto, lo dejamos pasar
  } else {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de admin o lider_jcf.' });
  }
});

// Rutas CRUD
router.get('/', encargadosController.getEncargados);
router.post('/', validateCreateEncargado, encargadosController.createEncargado);
router.put('/:id', validateUpdateEncargado, encargadosController.updateEncargado);
router.delete('/:id', encargadosController.deleteEncargado);

module.exports = router;