const { Router } = require('express');
const encargadosController = require('../controllers/encargados.controller.js');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware.js');
const { validateCreateEncargado, validateUpdateEncargado } = require('../middlewares/validators/encargados.validators.js');

const router = Router();

router.use(verifyToken);
router.use(checkRole(['admin', 'lider_jcf']));

router.get('/', encargadosController.getEncargados);
router.post('/', validateCreateEncargado, encargadosController.createEncargado);
router.put('/:id', validateUpdateEncargado, encargadosController.updateEncargado);
router.delete('/:id', encargadosController.deleteEncargado);

module.exports = router;