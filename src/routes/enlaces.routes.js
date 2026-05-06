const express = require('express');
const router = express.Router();
const enlacesController = require('../controllers/enlaces.controller');
const { verifyToken } = require('../middlewares/auth.middleware'); 

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', verifyToken, enlacesController.obtenerEnlaces);
router.get('/:id', verifyToken, enlacesController.obtenerEnlacePorId);
router.post('/', verifyToken, upload.single('imagen'), enlacesController.crearEnlace);
router.put('/:id', verifyToken, upload.single('imagen'), enlacesController.actualizarEnlace);
router.delete('/:id', verifyToken, enlacesController.eliminarEnlace);
router.patch('/:id/toggle-activo', verifyToken, enlacesController.toggleActivoEnlace);
router.post('/:id/solicitar-acceso', verifyToken, enlacesController.solicitarAcceso);
router.post('/confirmar', verifyToken, enlacesController.confirmarPorReferencia);
router.get('/:id/accesos', verifyToken, enlacesController.obtenerAccesos);
router.get('/:id/mi-pago', verifyToken, enlacesController.obtenerMiPago);

module.exports = router;