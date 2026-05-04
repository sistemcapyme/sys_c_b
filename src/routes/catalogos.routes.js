const express = require('0express');
const router = express.Router();
const catalogosController = require('../controllers/catalogos.controller');

router.post('/', catalogosController.crearPdf);
router.get('/admin', catalogosController.obtenerTodosAdmin);
router.get('/publicos', catalogosController.obtenerPublicos);
router.put('/:id', catalogosController.actualizarPdf);
router.delete('/:id', catalogosController.eliminarPdf);
router.get('/descargar', catalogosController.descargarPdf);

module.exports = router;