const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middlewares globales
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de API
app.use('/api', apiRoutes);

// Ruta raíz de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: 'API REST - Agenda Digital Centralizada y Control de Horas (AD-RE-11)',
    version: '1.0.0',
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

// Middleware de manejo de errores
app.use(errorHandler);

module.exports = app;
