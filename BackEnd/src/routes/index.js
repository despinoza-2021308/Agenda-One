const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const capacitadoresRoutes = require('./capacitadoresRoutes');
const clientesRoutes = require('./clientesRoutes');
const citasRoutes = require('./citasRoutes');
const reportesRoutes = require('./reportesRoutes');
const portalRoutes = require('./portalRoutes');
const { requireAdminAuth } = require('../middlewares/auth');

// Ruta de autenticación y verificación de PIN
router.use('/auth', authRoutes);

// Portal Móvil del Capacitador (acceso por código de iniciales, sin requerir PIN)
router.use('/portal', portalRoutes);

// Rutas de recursos: Las lecturas (GET) son públicas; las mutaciones (POST, PUT, DELETE) requieren autorización de Administrador
router.use('/capacitadores', requireAdminAuth, capacitadoresRoutes);
router.use('/clientes', requireAdminAuth, clientesRoutes);
router.use('/citas', requireAdminAuth, citasRoutes);
router.use('/reportes', reportesRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    service: 'Agenda Centralizada AD-RE-11 API'
  });
});

module.exports = router;
