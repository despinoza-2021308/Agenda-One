const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const {
  securityHeaders,
  corsOptions,
  generalLimiter,
  mutationLimiter,
  sanitizeInput
} = require('./middlewares/security');

const app = express();

// 1. Ocultar huella tecnológica de Express
app.disable('x-powered-by');

// 2. Confianza en proxies inversos (indispensable para Vercel Serverless y Rate Limiting preciso)
app.set('trust proxy', 1);

// 3. Cabeceras de seguridad HTTP con Helmet
app.use(securityHeaders);

// 4. Política estricta y dinámica de CORS
app.use(cors(corsOptions));

// 5. Control de Tasa de Peticiones (Rate Limiting)
app.use('/api', generalLimiter);
app.use('/', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return mutationLimiter(req, res, next);
  }
  next();
});

// 6. Límites estrictos de tamaño de payload (protección contra DoS por memoria)
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// 7. Sanitización preventiva de entradas contra inyecciones XSS
app.use(sanitizeInput);

// 8. Rutas de API (soporta tanto prefijo /api como llamadas directas en Vercel Serverless)
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// 9. Ruta raíz de bienvenida e información de salud de la API
app.get('/', (req, res) => {
  res.json({
    message: 'API REST - Agenda Digital Centralizada y Control de Horas (AD-RE-11)',
    version: '1.0.0',
    security: {
      headers: 'Helmet 8.x Active',
      cors: 'Whitelisted Dynamic',
      rateLimit: 'Active (250 req/15min read, 40 req/min write)',
      sanitization: 'Anti-XSS Recursive Guard'
    },
    endpoints: {
      capacitadores: '/api/capacitadores',
      clientes: '/api/clientes',
      citas: '/api/citas',
      reportes_mensual: '/api/reportes/resumen-mensual?year=2026&month=9',
      reportes_historico: '/api/reportes/historico',
      health: '/api/health'
    }
  });
});

// 10. Middleware centralizado de manejo de errores
app.use(errorHandler);

module.exports = app;
