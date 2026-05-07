const express = require('express');
const router = express.Router();
const pagosRecursosController = require('../controllers/pagosRecursos.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
router.post('/crear-preferencia', verifyToken, pagosRecursosController.crearPreferenciaRecurso);

module.exports = router;