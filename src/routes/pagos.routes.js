import { Router } from 'express';
import { crearPreferencia, webhook } from '../controllers/pagos.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/crear-preferencia', verifyToken, crearPreferencia);
router.post('/webhook', webhook);

export default router;