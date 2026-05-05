const express = require('express');
const router = express.Router();
const pagosCatalogosController = require('../controllers/pagosCatalogos.controller');

router.post('/crear-preferencia', pagosCatalogosController.crearPreferenciaCatalogo);

module.exports = router;