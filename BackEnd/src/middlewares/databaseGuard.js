const db = require('../config/db');

/**
 * Middleware de Integridad y Resiliencia Empresarial
 * 
 * Previene la creación, edición o eliminación de registros cuando PostgreSQL
 * no se encuentra disponible, impidiendo la acumulación de datos "fantasmas"
 * en memoria volátil (mockStore) que se perderían al reiniciar el servidor.
 */
function isTestEnvironment() {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.npm_lifecycle_event === 'test' ||
    Boolean(process.env.NODE_TEST_CONTEXT) ||
    process.argv.some(arg => typeof arg === 'string' && arg.includes('--test'))
  );
}

function requireDatabaseConnection(req, res, next) {
  // En suite de tests automatizados, permitir el modo mock
  // a menos que se configure explícitamente STRICT_DB=true
  if (isTestEnvironment() && process.env.STRICT_DB !== 'true') {
    return next();
  }

  // Permitir explícitamente si se activó la variable de entorno ALLOW_MOCK_FALLBACK
  if (process.env.ALLOW_MOCK_FALLBACK === 'true') {
    return next();
  }

  // Verificar estado de conexión real con PostgreSQL / Supabase
  if (!db.isPostgresConnected()) {
    const errorDetails = db.getLastConnectionError ? db.getLastConnectionError() : null;
    return res.status(503).json({
      error: true,
      code: 'DATABASE_UNAVAILABLE',
      serviceUnavailable: true,
      message: 'Error de conexión con la base de datos central. Por seguridad e integridad de la información, el sistema no permite guardar cambios temporales en memoria. Intente nuevamente en unos instantes.',
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    });
  }

  next();
}

module.exports = {
  requireDatabaseConnection
};
