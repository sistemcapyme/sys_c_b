const express = require('express');
const router = express.Router();
const enlacesController = require('../controllers/enlaces.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authMiddleware, enlacesController.obtenerEnlaces);
router.get('/:id', authMiddleware, enlacesController.obtenerEnlacePorId);
router.post('/', authMiddleware, upload.single('imagen'), enlacesController.crearEnlace);
router.put('/:id', authMiddleware, upload.single('imagen'), enlacesController.actualizarEnlace);
router.delete('/:id', authMiddleware, enlacesController.eliminarEnlace);
router.patch('/:id/toggle-activo', authMiddleware, enlacesController.toggleActivoEnlace);
router.post('/:id/solicitar-acceso', authMiddleware, enlacesController.solicitarAcceso);
router.post('/confirmar', authMiddleware, enlacesController.confirmarPorReferencia);
router.get('/:id/accesos', authMiddleware, enlacesController.obtenerAccesos);
router.get('/:id/mi-pago', authMiddleware, enlacesController.obtenerMiPago);

module.exports = router;