const { Router } = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const { obtenerEncargadosDisponibles } = require('../controllers/distribucion.controller.js');

const router = Router();

router.use(verifyToken);

router.get('/encargados', obtenerEncargadosDisponibles);

module.exports = router;