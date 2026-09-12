const rateLimit = require('express-rate-limit');

// PIN de administrador configurable (por defecto 'OneCon2026')
const getAdminPin = () => String(process.env.ADMIN_PIN || 'OneCon2026').trim();

// Generador y validador de token de sesión administrativa
const generateToken = (pin) => Buffer.from(`admin:${pin}:agenda_one_session`).toString('base64');

// Limitador estricto para prevenir ataques de fuerza bruta en el PIN
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

  if (!pin || String(pin).trim() !== configuredPin) {
    return res.status(401).json({
      error: true,
      message: 'El PIN de administrador ingresado es incorrecto.'
    });
  }

  const token = generateToken(configuredPin);
  return res.json({
    success: true,
    token,
    role: 'admin',
    message: 'Acceso administrativo concedido exitosamente.'
  });
}

// Endpoint GET /api/auth/check
function verifyHandler(req, res) {
  const configuredPin = getAdminPin();
  const expectedToken = generateToken(configuredPin);
  const provided = req.headers['x-admin-key'] || (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : null);

  if (provided === expectedToken || provided === configuredPin) {
    return res.json({ valid: true, role: 'admin' });
  }

  return res.status(401).json({ valid: false, message: 'Sesión administrativa no válida o expirada.' });
}

// Middleware para proteger mutaciones (POST, PUT, DELETE)
function requireAdminAuth(req, res, next) {
  // Peticiones de solo lectura son públicas para permitir vista de calendario y reportes
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Rutas de autenticación no requieren token previo
  if (req.path.includes('/auth') || (req.originalUrl && req.originalUrl.includes('/auth'))) {
    return next();
  }

  const configuredPin = getAdminPin();
  const expectedToken = generateToken(configuredPin);
  const provided = req.headers['x-admin-key'] || (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : null);

  if (provided === expectedToken || provided === configuredPin) {
    return next();
  }

  return res.status(401).json({
    error: true,
    unauthorized: true,
    message: 'Acceso restringido: Se requiere PIN de Administrador para crear, modificar o eliminar registros.'
  });
}

module.exports = {
  authLimiter,
  loginHandler,
  verifyHandler,
  requireAdminAuth
};
