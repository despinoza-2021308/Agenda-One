require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Servidor Backend iniciado en: http://localhost:${PORT}`);
  console.log(`📅 Sistema: Agenda Digital y Control de Horas (AD-RE-11)`);
  console.log(`📡 Endpoints API listos en: http://localhost:${PORT}/api`);
  console.log(`====================================================`);
});

// Manejo elegante de apagado
process.on('SIGTERM', () => {
  console.log('Cerrando servidor HTTP...');
  server.close(() => {
    console.log('Servidor finalizado.');
  });
});
