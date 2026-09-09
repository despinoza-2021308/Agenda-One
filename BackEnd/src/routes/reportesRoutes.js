const express = require('express');
const router = express.Router();
const controller = require('../controllers/reportesController');

router.get('/resumen-mensual', controller.getResumenMensual);
router.get('/historico', controller.getHistorico);

module.exports = router;
