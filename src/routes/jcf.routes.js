const { Router } = require('express');

const {
  getLideres,
  getLiderById,
  createLider,
  updateLider,
  toggleActivoLider,
  deleteLider
} = require('../controllers/lideres.controller.js');

const {
  getEncargados,
  getEncargadoById,
  createEncargado,
  updateEncargado,
  toggleActivoEncargado,
  deleteEncargado
} = require('../controllers/encargados.controller.js');

const {
  obtenerDistribucion,
  obtenerEncargadosDisponibles,
  asignarEncargado,
  asignarEncargadoLote
} = require('../controllers/distribucion.controller.js');

const {
  obtenerAprendicesKanban,
  obtenerAprendizPorId,
  crearAprendizKanban,
  actualizarAprendizKanban,
  actualizarEstadoKanban,
  toggleActivoAprendiz,
  actualizarRecurso,
  eliminarAprendiz
} = require('../controllers/kanban.controller.js');

const router = Router();

router.get('/lideres', getLideres);
router.get('/lideres/:id', getLiderById);
router.post('/lideres', createLider);
router.put('/lideres/:id', updateLider);
router.patch('/lideres/:id/activo', toggleActivoLider);
router.delete('/lideres/:id', deleteLider);

router.get('/encargados', getEncargados);
router.get('/encargados/:id', getEncargadoById);
router.post('/encargados', createEncargado);
router.put('/encargados/:id', updateEncargado);
router.patch('/encargados/:id/activo', toggleActivoEncargado);
router.delete('/encargados/:id', deleteEncargado);

router.get('/distribucion', obtenerDistribucion);
router.get('/distribucion/encargados-disponibles', obtenerEncargadosDisponibles);
router.put('/distribucion/:id/asignar', asignarEncargado);
router.put('/distribucion/asignar-lote', asignarEncargadoLote);

router.get('/kanban', obtenerAprendicesKanban);
router.get('/kanban/:id', obtenerAprendizPorId);
router.post('/kanban', crearAprendizKanban);
router.put('/kanban/:id', actualizarAprendizKanban);
router.patch('/kanban/:id/estado', actualizarEstadoKanban);
router.patch('/kanban/:id/activo', toggleActivoAprendiz);
router.patch('/kanban/:id/recurso', actualizarRecurso);
router.delete('/kanban/:id', eliminarAprendiz);

module.exports = router;