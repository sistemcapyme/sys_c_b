const { Router } = require('express');
const { getLideres, getLiderById, createLider, updateLider, deleteLider } = require('../controllers/lideres.controller.js');
const { getEncargados, getEncargadoById, createEncargado, updateEncargado, deleteEncargado } = require('../controllers/encargados.controller.js');
const { getAprendices, asignarAprendiz } = require('../controllers/aprendices.controller.js');
const { getKanbanAprendices, updateKanbanStatus } = require('../controllers/kanban.controller.js');

const router = Router();

router.get('/lideres', getLideres);
router.get('/lideres/:id', getLiderById);
router.post('/lideres', createLider);
router.put('/lideres/:id', updateLider);
router.delete('/lideres/:id', deleteLider);

router.get('/encargados', getEncargados);
router.get('/encargados/:id', getEncargadoById);
router.post('/encargados', createEncargado);
router.put('/encargados/:id', updateEncargado);
router.delete('/encargados/:id', deleteEncargado);

router.get('/aprendices', getAprendices);
router.put('/aprendices/asignar', asignarAprendiz);

router.get('/kanban', getKanbanAprendices);
router.put('/kanban/:id', updateKanbanStatus);

module.exports = router;