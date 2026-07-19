const express = require('express');
const router = express.Router();
const jcfController = require('../controllers/jcf.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, jcfController.obtenerJovenes);
router.get('/:id', verifyToken, jcfController.obtenerJovenPorId);
router.post('/', verifyToken, checkRole('admin', 'colaborador'), jcfController.crearJoven);
router.put('/:id', verifyToken, checkRole('admin', 'colaborador'), jcfController.actualizarJoven);
router.patch('/:id/toggle-activo', verifyToken, checkRole('admin'), jcfController.toggleActivoJoven);
router.patch('/:id/recurso', verifyToken, checkRole('admin', 'colaborador'), jcfController.actualizarRecurso);
router.get(
  '/aprendices', 
  verifyToken, 
  checkRole(['admin', 'lider_jcf', 'encargado_jcf']), 
  obtenerAprendices
);

// Endpoint para el Drop del Kanban
router.patch(
  '/aprendices/:id/estado', 
  verifyToken, 
  checkRole(['admin', 'lider_jcf', 'encargado_jcf']), 
  actualizarEstadoKanban
);

// Endpoint para asignar encargado desde el Modal (Restringido a Admin y Líder)
router.patch(
  '/aprendices/:id/encargado', 
  verifyToken, 
  checkRole(['admin', 'lider_jcf']), 
  asignarEncargado
);

module.exports = router;