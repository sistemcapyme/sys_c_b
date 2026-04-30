import { Router } from 'express';
import { 
  crearPdf, 
  obtenerTodosAdmin, 
  obtenerPublicos, 
  actualizarPdf, 
  eliminarPdf,
  descargarPdf
} from '../controllers/catalogos.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/publicos', obtenerPublicos);
router.get('/descargar', descargarPdf);

router.post('/', verifyToken, crearPdf);
router.get('/admin', verifyToken, obtenerTodosAdmin);
router.put('/:id', verifyToken, actualizarPdf);
router.delete('/:id', verifyToken, eliminarPdf);

export default router;