const express = require('express');
const router = express.Router();
const controller = require('../controllers/clientesController');
const { validateNumericId } = require('../middlewares/security');

// Validar que :id sea estrictamente numérico antes de llamar a cualquier controlador
router.param('id', validateNumericId);

router.get('/', controller.getClientes);
router.get('/:id', controller.getClienteById);
router.post('/', controller.createCliente);
router.put('/:id', controller.updateCliente);
router.delete('/:id', controller.deleteCliente);

module.exports = router;
