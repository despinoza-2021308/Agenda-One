const express = require('express');
const router = express.Router();
const controller = require('../controllers/capacitadoresController');

router.get('/', controller.getCapacitadores);
router.get('/:id', controller.getCapacitadorById);
router.post('/', controller.createCapacitador);
router.put('/:id', controller.updateCapacitador);
router.delete('/:id', controller.deleteCapacitador);

module.exports = router;
