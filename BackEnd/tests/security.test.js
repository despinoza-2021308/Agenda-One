const { describe, it } = require('node:test');
const assert = require('node:assert');
const { 
  hashPin, 
  comparePin, 
  isBcryptHash, 
  generateSecurePin, 
  isWeakPin 
} = require('../src/utils/tokenUtils');
const { requireDatabaseConnection } = require('../src/middlewares/databaseGuard');

describe('Pruebas de Seguridad Criptográfica de PINs (bcrypt) y Guard de Base de Datos', () => {
  it('hashPin debe generar un hash bcrypt válido de 60 caracteres que inicie con $2a$ o $2b$', async () => {
    const pin = '8492';
    const hash = await hashPin(pin);

    assert.ok(hash, 'Debe retornar un hash no nulo');
    assert.strictEqual(hash.length, 60, 'El hash bcrypt debe tener exactamente 60 caracteres');
    assert.strictEqual(isBcryptHash(hash), true, 'Debe cumplir con el formato estándar bcrypt');
  });

  it('comparePin debe validar exitosamente el PIN correcto contra el hash bcrypt', async () => {
    const pin = '3715';
    const hash = await hashPin(pin);

    const isValid = await comparePin('3715', hash);
    assert.strictEqual(isValid, true, 'El PIN correcto debe ser validado como true');

    const isInvalid = await comparePin('9999', hash);
    assert.strictEqual(isInvalid, false, 'Un PIN diferente debe ser rechazado como false');
  });

  it('comparePin debe mantener compatibilidad retroactiva con PINs legados en texto plano', async () => {
    const legacyPlaintextPin = '9524';

    const isValid = await comparePin('9524', legacyPlaintextPin);
    assert.strictEqual(isValid, true, 'Debe aceptar PIN legado idéntico');

    const isInvalid = await comparePin('0000', legacyPlaintextPin);
    assert.strictEqual(isInvalid, false, 'Debe rechazar PIN incorrecto contra PIN legado');
  });

  it('requireDatabaseConnection debe responder 503 cuando la base de datos no está disponible en modo estricto', () => {
    // Simular modo estricto donde no se permite fallback a mockStore
    const prevStrict = process.env.STRICT_DB;
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.STRICT_DB = 'true';
    process.env.NODE_ENV = 'production';

    let capturedStatus = null;
    let capturedJson = null;

    const req = { method: 'POST', path: '/api/citas' };
    const res = {
      status: (code) => {
        capturedStatus = code;
        return {
          json: (data) => {
            capturedJson = data;
            return data;
          }
        };
      }
    };
    const next = () => {
      assert.fail('No debe llamar a next() cuando la base de datos está desconectada en modo estricto');
    };

    try {
      requireDatabaseConnection(req, res, next);
      assert.strictEqual(capturedStatus, 503, 'Debe responder con código HTTP 503');
      assert.strictEqual(capturedJson.code, 'DATABASE_UNAVAILABLE');
      assert.strictEqual(capturedJson.serviceUnavailable, true);
    } finally {
      process.env.STRICT_DB = prevStrict;
      process.env.NODE_ENV = prevNodeEnv;
    }
  });
});
