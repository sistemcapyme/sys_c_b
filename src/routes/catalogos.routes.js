const express = require('express');
const router = express.Router();
const catalogosController = require('../controllers/catalogos.controller');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('imagen'), catalogosController.crearPdf);
router.get('/admin', catalogosController.obtenerTodosAdmin);
router.get('/publicos', catalogosController.obtenerPublicos);
router.put('/:id', upload.single('imagen'), catalogosController.actualizarPdf);
router.delete('/:id', catalogosController.eliminarPdf);
router.get('/descargar', catalogosController.descargarPdf);

module.exports = router;