const express = require('express');
const router = express.Router();
const jcfController = require('../controllers/jcf.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

router.get('/aprendices', verifyToken, checkRole('admin', 'lider_jcf', 'encargado_jcf'), jcfController.obtenerAprendices);
router.patch('/aprendices/:id/estado', verifyToken, checkRole('admin', 'lider_jcf', 'encargado_jcf'), jcfController.actualizarEstadoKanban);
router.patch('/aprendices/:id/encargado', verifyToken, checkRole('admin', 'lider_jcf'), jcfController.asignarEncargado);

router.get('/lideres', verifyToken, checkRole('admin'), jcfController.obtenerLideres);
router.post('/lideres', verifyToken, checkRole('admin'), jcfController.crearLider);

router.post('/negocios', verifyToken, checkRole('admin'), jcfController.crearNegocio);

router.get('/', verifyToken, jcfController.obtenerJovenes);
router.post('/', verifyToken, checkRole('admin', 'colaborador'), jcfController.crearJoven);
router.get('/:id', verifyToken, jcfController.obtenerJovenPorId);
router.put('/:id', verifyToken, checkRole('admin', 'colaborador'), jcfController.actualizarJoven);
router.patch('/:id/toggle-activo', verifyToken, checkRole('admin'), jcfController.toggleActivoJoven);
router.patch('/:id/recurso', verifyToken, checkRole('admin', 'colaborador'), jcfController.actualizarRecurso);

module.exports = router;
