const express = require('express');
const router = express.Router();
const controller = require('../controllers/citasController');
const { validateNumericId } = require('../middlewares/security');

// Importación masiva por lote (Excel / migración)
router.post('/importar-lote', controller.importarLoteCitas);

// Rutas de papelera y vaciado (deben ir antes de router.param('id') para no validar 'papelera' como número)
router.get('/eliminadas', controller.getCitasEliminadas);
router.delete('/papelera/vaciar', controller.vaciarPapelera);

// Validar que :id sea estrictamente numérico antes de llamar a cualquier controlador
router.param('id', validateNumericId);

router.get('/', controller.getCitas);
router.get('/:id', controller.getCitaById);
router.get('/:id/auditoria', controller.getCitaAuditoria);
router.post('/', controller.createCita);
router.post('/:id/restaurar', controller.restaurarCita);
router.put('/:id', controller.updateCita);
router.delete('/:id/permanente', controller.eliminarCitaPermanente);
router.delete('/:id', controller.deleteCita);

module.exports = router;
