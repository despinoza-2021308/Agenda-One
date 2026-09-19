const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// 1. Cabeceras de seguridad HTTP con Helmet
const securityHeaders = helmet({
  contentSecurityPolicy: false, // Mantiene compatibilidad con Vite y recursos CDN sin romper assets
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
});

// 2. Configuración dinámica y restringida de CORS
const ALLOWED_ORIGINS = [
  'https://agendaone-one.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (curl, healthchecks internos o llamadas server-to-server)
    if (!origin) return callback(null, true);

    // Permitir dominios definidos en la lista blanca
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);

    // Permitir cualquier subdominio preview generado por Vercel para este repositorio
    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);

    // Permitir orígenes adicionales mediante variable de entorno si existen
    if (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.split(',').includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Acceso no permitido por la política de seguridad CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-admin-key', 'x-trainer-pin'],
  credentials: true,
  maxAge: 86400 // Cache de preflight por 24 horas
};

// 3. Limitadores de Tasa de Peticiones (Rate Limiting)
// Limitador general para lecturas y navegación
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 250, // Máximo 250 peticiones por cada 15 min por IP
  standardHeaders: true, // Cabeceras estándar RateLimit-* (RFC 7807)
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Demasiadas solicitudes desde esta IP. Por favor intenta de nuevo en unos minutos.'
  }
});

// Limitador estricto para operaciones de escritura / mutación (POST, PUT, DELETE)
const mutationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 40, // Máximo 40 operaciones de escritura/borrado por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Límite de operaciones por minuto alcanzado. Por favor espera unos segundos antes de guardar o eliminar nuevamente.'
  }
});

// 4. Sanitización preventiva Anti-XSS recursiva
function stripDangerousChars(val) {
  if (typeof val === 'string') {
    // Si es una imagen en formato Data URL (ej: firma digital), proteger el Base64 de alteraciones accidentales
    if (val.startsWith('data:image/')) {
      return val.replace(/\0/g, '').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    return val
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Elimina scripts completos
      .replace(/javascript:/gi, '') // Elimina pseudo-protocolo javascript:
      .replace(/on\w+\s*=/gi, '') // Elimina handlers inline de eventos (onload, onerror, onclick)
      .replace(/\0/g, ''); // Elimina bytes nulos
  }
  if (Array.isArray(val)) {
    return val.map(stripDangerousChars);
  }
  if (val !== null && typeof val === 'object') {
    const cleaned = {};
    for (const key of Object.keys(val)) {
      cleaned[key] = stripDangerousChars(val[key]);
    }
    return cleaned;
  }
  return val;
}

function sanitizeInput(req, res, next) {
  if (req.body) {
    req.body = stripDangerousChars(req.body);
  }
  if (req.query) {
    req.query = stripDangerousChars(req.query);
  }
  if (req.params) {
    req.params = stripDangerousChars(req.params);
  }
  next();
}

// 5. Guardia de Validación para IDs numéricos en parámetros de ruta
function validateNumericId(req, res, next, paramValue) {
  const val = paramValue !== undefined ? paramValue : req.params?.id;
  if (val !== undefined) {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0 || String(num) !== String(val).trim()) {
      return res.status(400).json({
        error: true,
        message: 'El identificador del recurso en la URL debe ser un número entero positivo válido.'
      });
    }
  }
  next();
}

module.exports = {
  securityHeaders,
  corsOptions,
  generalLimiter,
  mutationLimiter,
  sanitizeInput,
  validateNumericId
};
