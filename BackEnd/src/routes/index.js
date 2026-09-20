const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const capacitadoresRoutes = require('./capacitadoresRoutes');
const clientesRoutes = require('./clientesRoutes');
const citasRoutes = require('./citasRoutes');
const reportesRoutes = require('./reportesRoutes');
const portalRoutes = require('./portalRoutes');
const { requireAdminAuth } = require('../middlewares/auth');
const { requireDatabaseConnection } = require('../middlewares/databaseGuard');

// Ruta de autenticación y verificación de PIN
router.use('/auth', authRoutes);

// Portal Móvil del Capacitador (acceso por código de iniciales y firmas)
router.use('/portal', portalRoutes);

// Rutas de recursos: Las lecturas (GET) son públicas; las mutaciones requieren autorización de Administrador y base de datos activa
router.use('/capacitadores', requireAdminAuth, requireDatabaseConnection, capacitadoresRoutes);
router.use('/clientes', requireAdminAuth, requireDatabaseConnection, clientesRoutes);
router.use('/citas', requireAdminAuth, requireDatabaseConnection, citasRoutes);
router.use('/reportes', reportesRoutes);

router.get('/health', (req, res) => {
  const db = require('../config/db');
  res.json({
    status: 'ok',
    timestamp: new Date(),
    service: 'Agenda Centralizada AD-RE-11 API',
    database: {
      connected: db.isPostgresConnected(),
      mode: db.isPostgresConnected() ? 'PostgreSQL (Cloud Persistente)' : 'Memoria RAM (mockStore fallback)',
      diagnostics: db.getConnectionDiagnostics(),
      error: db.getLastConnectionError()
    }
  });
});

module.exports = router;
