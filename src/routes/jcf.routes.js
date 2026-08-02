import { Router } from 'express';
import { getLideres, getLiderById, createLider, updateLider, deleteLider } from '../controllers/lideres.controller.js';
import { getEncargados, getEncargadoById, createEncargado, updateEncargado, deleteEncargado } from '../controllers/encargados.controller.js';
import { getDistribuciones, asignarJoven } from '../controllers/distribucion.controller.js';
import { getKanbanJovenes, updateKanbanStatus } from '../controllers/kanban.controller.js';

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

router.get('/distribucion', getDistribuciones);
router.put('/distribucion/asignar', asignarJoven);

router.get('/kanban', getKanbanJovenes);
router.put('/kanban/:id', updateKanbanStatus);

export default router;