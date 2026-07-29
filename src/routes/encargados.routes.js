import { Router } from 'express';
import * as encargadosController from '../controllers/encargados.controller.js';
import { verifyToken, checkRole } from '../middlewares/auth.middleware.js';
import { validateCreateEncargado, validateUpdateEncargado } from '../middlewares/validators/encargados.validators.js';

const router = Router();

// Protegemos todas las rutas para que solo admin y lider_jcf puedan acceder
router.use(verifyToken);
router.use(checkRole(['admin', 'lider_jcf']));

router.get('/', encargadosController.getEncargados);
router.post('/', validateCreateEncargado, encargadosController.createEncargado);
router.put('/:id', validateUpdateEncargado, encargadosController.updateEncargado);
router.delete('/:id', encargadosController.deleteEncargado);

export default router;