const express = require('express');
const router = express.Router();
const pagosRecursosController = require('../controllers/pagosRecursos.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/crear-preferencia', authMiddleware, pagosRecursosController.crearPreferenciaRecurso);

module.exports = router;