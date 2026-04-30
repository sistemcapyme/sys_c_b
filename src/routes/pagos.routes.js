const express = require('express');
const router = express.Router();
const { crearPreferencia, webhook } = require('../controllers/pagos.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/crear-preferencia', verifyToken, crearPreferencia);
router.post('/webhook', webhook);

module.exports = router;