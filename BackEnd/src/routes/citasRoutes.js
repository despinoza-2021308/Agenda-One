const express = require('express');
const router = express.Router();
const controller = require('../controllers/citasController');
const { validateNumericId } = require('../middlewares/security');

// Validar que :id sea estrictamente numérico antes de llamar a cualquier controlador
router.param('id', validateNumericId);

router.get('/', controller.getCitas);
router.get('/:id', controller.getCitaById);
router.get('/:id/auditoria', controller.getCitaAuditoria);
router.post('/', controller.createCita);
router.put('/:id', controller.updateCita);
router.delete('/:id', controller.deleteCita);

module.exports = router;
