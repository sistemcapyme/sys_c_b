const { Router } = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');

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

router.use(verifyToken);

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
router.put('/distribucion/asignar-lote', asignarEncargadoLote);

router.get('/aprendices', obtenerAprendicesKanban);
router.get('/aprendices/:id', obtenerAprendizPorId);
router.post('/aprendices', crearAprendizKanban);
router.put('/aprendices/:id', actualizarAprendizKanban);
router.patch('/aprendices/:id/estado', actualizarEstadoKanban);
router.patch('/aprendices/:id/encargado', asignarEncargado);
router.patch('/aprendices/:id/toggle-activo', toggleActivoAprendiz);
router.patch('/aprendices/:id/recurso', actualizarRecurso);
router.delete('/aprendices/:id', eliminarAprendiz);

module.exports = router;