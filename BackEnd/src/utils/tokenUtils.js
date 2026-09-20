const crypto = require('crypto');

// Clave secreta para la firma criptográfica de tokens (configurable en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'agenda_one_secret_corporate_key_2026_iso_ad_re_11';

// Lista de PINs considerados inseguros o predecibles
const WEAK_PINS = new Set([
  '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
  '1234', '4321', '1212', '2121', '0123', '9876', '2025', '2026', '2027', '1001', '1002'
]);

/**
 * Comprueba si un PIN de 4 dígitos es débil o predecible
 */
function isWeakPin(pin) {
  if (!pin) return true;
  const s = String(pin).trim();
  if (!/^\d{4}$/.test(s)) return true;
  if (WEAK_PINS.has(s)) return true;
  
  // Todos los dígitos iguales (ej: 7777)
  if (s[0] === s[1] && s[1] === s[2] && s[2] === s[3]) return true;

  // Secuencias consecutivas ascendentes o descendentes (ej: 2345, 8765)
  const digits = s.split('').map(Number);
  const isAsc = digits[1] === digits[0] + 1 && digits[2] === digits[1] + 1 && digits[3] === digits[2] + 1;
  const isDesc = digits[1] === digits[0] - 1 && digits[2] === digits[1] - 1 && digits[3] === digits[2] - 1;
  if (isAsc || isDesc) return true;

  return false;
}

/**
 * Genera un PIN aleatorio seguro de 4 dígitos con alta entropía
 */
function generateSecurePin() {
  let pin = '';
  let attempts = 0;
  do {
    // Generación criptográfica no determinista
    const num = crypto.randomInt(1000, 9999);
    pin = String(num);
    attempts++;
  } while (isWeakPin(pin) && attempts < 100);

  return pin;
}

/**
 * Comparación segura de cadenas en tiempo constante (inmune a timing attacks)
 */
function timingSafeEqualString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Firma un JSON Web Token estándar (HS256) con expiración
 */
function signToken(payload, expiresInSeconds = 8 * 3600, secret = JWT_SECRET) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Verifica matemáticamente un token JWT (firma y fecha de expiración)
 */
function verifyToken(token, secret = JWT_SECRET) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signature] = parts;

  // 1. Recalcular firma esperada
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  // 2. Comparación en tiempo constante de la firma
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  // 3. Decodificar payload
  try {
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);

    // 4. Validar expiración (exp)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch (_) {
    return null;
  }
}

/**
 * Tokens específicos de Administración (30 días de validez mientras el programa esté activo)
 */
function signAdminToken(adminData = {}) {
  return signToken({ role: 'admin', ...adminData }, 30 * 24 * 3600);
}

function verifyAdminToken(token) {
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

/**
 * Tokens específicos de Capacitador Móvil (30 días de validez para móviles)
 */
function signTrainerToken(trainerData = {}) {
  return signToken({ role: 'trainer', ...trainerData }, 30 * 24 * 3600);
}

function verifyTrainerToken(token) {
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'trainer') return null;
  return payload;
}

module.exports = {
  JWT_SECRET,
  isWeakPin,
  generateSecurePin,
  timingSafeEqualString,
  signToken,
  verifyToken,
  signAdminToken,
  verifyAdminToken,
  signTrainerToken,
  verifyTrainerToken
};
