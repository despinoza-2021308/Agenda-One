const express = require('express');
const router = express.Router();

const capacitadoresRoutes = require('./capacitadoresRoutes');
const clientesRoutes = require('./clientesRoutes');
const citasRoutes = require('./citasRoutes');
const reportesRoutes = require('./reportesRoutes');

router.use('/capacitadores', capacitadoresRoutes);
router.use('/clientes', clientesRoutes);
router.use('/citas', citasRoutes);
router.use('/reportes', reportesRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    service: 'Agenda Centralizada AD-RE-11 API'
  });
});

module.exports = router;
