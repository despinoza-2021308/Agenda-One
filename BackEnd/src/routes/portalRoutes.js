const express = require('express');
const router = express.Router();
const portalController = require('../controllers/portalController');

// Obtener datos del portal del capacitador (citas, estadísticas y honorarios)
router.get('/:codigo', portalController.getTrainerPortalData);

// Actualizar estado, bitácora o firma de una cita asignada al capacitador (soporta PATCH y POST)
router.patch('/:codigo/citas/:id', portalController.updateTrainerCita);
router.post('/:codigo/citas/:id', portalController.updateTrainerCita);

module.exports = router;
