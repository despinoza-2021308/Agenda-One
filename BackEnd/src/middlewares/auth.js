const rateLimit = require('express-rate-limit');
const { signAdminToken, verifyAdminToken, timingSafeEqualString } = require('../utils/tokenUtils');

// PIN de administrador configurable (por defecto 'OneCon2026')
const getAdminPin = () => String(process.env.ADMIN_PIN || 'OneCon2026').trim();

// Limitador estricto para prevenir ataques de fuerza bruta en el PIN de administración
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 6, // Máximo 6 intentos de login por IP en la ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Demasiados intentos de acceso fallidos. Por seguridad, espera 5 minutos antes de reintentar.'
  }
});

// Endpoint POST /api/auth/login
function loginHandler(req, res) {
  const { pin } = req.body;
  const configuredPin = getAdminPin();

  if (!pin || !timingSafeEqualString(String(pin).trim(), configuredPin)) {
    return res.status(401).json({
      error: true,
      message: 'El PIN de administrador ingresado es incorrecto.'
    });
  }

  // Generar JWT HS256 firmado con expiración extendida de 30 días
  const token = signAdminToken({ user: 'admin' });
  return res.json({
    success: true,
    token,
    role: 'admin',
    expiresIn: 30 * 24 * 3600,
    message: 'Acceso administrativo concedido exitosamente (Token JWT HS256 emitido).'
  });
}

// Helper para extraer y verificar el token administrativo desde cabeceras
function checkAdminCredential(req) {
  const configuredPin = getAdminPin();
  const rawHeader = req.headers['x-admin-key'] || (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : null);
  if (!rawHeader) return null;

  const clean = String(rawHeader).trim();

  // 1. Verificación matemática de Token JWT HS256
  const jwtPayload = verifyAdminToken(clean);
  if (jwtPayload) return jwtPayload;

  // 2. Soporte para el PIN directo en casos de scripts o configuración interna
  if (timingSafeEqualString(clean, configuredPin)) {
    return { role: 'admin', directPin: true };
  }

  return null;
}

// Endpoint GET /api/auth/check
function verifyHandler(req, res) {
  const adminPayload = checkAdminCredential(req);

  if (adminPayload) {
    return res.json({ 
      valid: true, 
      role: 'admin',
      exp: adminPayload.exp || null
    });
  }

  return res.status(401).json({ 
    valid: false, 
    unauthorized: true, 
    message: 'Sesión administrativa no válida o expirada. Ingrese su PIN nuevamente.' 
  });
}

// Middleware para proteger mutaciones (POST, PUT, DELETE)
function requireAdminAuth(req, res, next) {
  // Peticiones de solo lectura son públicas para permitir vista de calendario y reportes
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Rutas de autenticación y portal móvil gestionan sus propios flujos
  if (req.path.includes('/auth') || (req.originalUrl && req.originalUrl.includes('/auth'))) {
    return next();
  }

  const adminPayload = checkAdminCredential(req);
  if (adminPayload) {
    req.adminUser = adminPayload;
    return next();
  }

  return res.status(401).json({
    error: true,
    unauthorized: true,
    message: 'Acceso restringido: Se requiere PIN o Token de Administrador válido para realizar cambios.'
  });
}

module.exports = {
  authLimiter,
  loginHandler,
  verifyHandler,
  requireAdminAuth,
  checkAdminCredential
};
