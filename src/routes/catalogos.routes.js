const express = require('express');
const router = express.Router();
const { 
  crearPdf, 
  obtenerTodosAdmin, 
  obtenerPublicos, 
  actualizarPdf, 
  eliminarPdf,
  descargarPdf
} = require('../controllers/catalogos.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/publicos', obtenerPublicos);
router.get('/descargar', descargarPdf);

router.post('/', verifyToken, crearPdf);
router.get('/admin', verifyToken, obtenerTodosAdmin);
router.put('/:id', verifyToken, actualizarPdf);
router.delete('/:id', verifyToken, eliminarPdf);

module.exports = router;