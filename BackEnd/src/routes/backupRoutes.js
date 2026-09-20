const express = require('express');
const router = express.Router();
const controller = require('../controllers/backupController');
const { requireAdminStrict } = require('../middlewares/auth');
const { requireDatabaseConnection } = require('../middlewares/databaseGuard');

// Ambas rutas requieren credenciales de Administrador y base de datos activa
router.use(requireAdminStrict);
router.use(requireDatabaseConnection);

// Exportar copia de seguridad completa (descarga archivo JSON)
router.get('/export', controller.exportBackup);

// Restaurar base de datos a partir de archivo de respaldo JSON
router.post('/restore', controller.restoreBackup);

module.exports = router;
