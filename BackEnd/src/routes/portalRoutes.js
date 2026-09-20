const express = require('express');
const router = express.Router();
const portalController = require('../controllers/portalController');
const { authLimiter } = require('../middlewares/auth');
const { requireDatabaseConnection } = require('../middlewares/databaseGuard');

// Inicio de sesión del capacitador con Código y PIN privado (protegido contra fuerza bruta)
router.post('/login', authLimiter, portalController.loginTrainer);

// Obtener datos del portal del capacitador (citas, estadísticas y honorarios)
router.get('/:codigo', portalController.getTrainerPortalData);

// Actualizar estado, bitácora o firma de una cita asignada al capacitador (soporta PATCH y POST)
router.patch('/:codigo/citas/:id', requireDatabaseConnection, portalController.updateTrainerCita);
router.post('/:codigo/citas/:id', requireDatabaseConnection, portalController.updateTrainerCita);

module.exports = router;

