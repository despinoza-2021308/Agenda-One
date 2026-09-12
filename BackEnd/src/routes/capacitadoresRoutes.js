const express = require('express');
const router = express.Router();
const controller = require('../controllers/capacitadoresController');
const { validateNumericId } = require('../middlewares/security');

// Validar que :id sea estrictamente numérico antes de llamar a cualquier controlador
router.param('id', validateNumericId);

router.get('/', controller.getCapacitadores);
router.get('/:id', controller.getCapacitadorById);
router.post('/', controller.createCapacitador);
router.put('/:id', controller.updateCapacitador);
router.delete('/:id', controller.deleteCapacitador);

module.exports = router;
