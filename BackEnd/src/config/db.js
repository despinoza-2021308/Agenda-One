const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'agenda_db',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
});

let isPostgresConnected = false;

// Almacén en memoria de respaldo para desarrollo inmediato sin bloqueos
const mockStore = {
  capacitadores: [
    { id: 1, nombre_completo: 'Mauricio Orozco', iniciales: 'MO', color: '#2563EB', activo: true, created_at: new Date() },
    { id: 2, nombre_completo: 'Olga Quintana', iniciales: 'OQ', color: '#7C3AED', activo: true, created_at: new Date() },
    { id: 3, nombre_completo: 'Pedro Fernández', iniciales: 'PF', color: '#059669', activo: true, created_at: new Date() },
    { id: 4, nombre_completo: 'Diana Vargas', iniciales: 'DV', color: '#D97706', activo: true, created_at: new Date() },
    { id: 5, nombre_completo: 'Carlos Mendoza', iniciales: 'CM', color: '#DC2626', activo: true, created_at: new Date() }
  ],
  clientes: [
    { id: 1, nombre_empresa: 'Industrias Alimentarias del Norte S.A.', contacto: 'Ing. Roberto Silva', telefono: '+506 2234-5678', correo: 'rsilva@alimnorte.com', activo: true, created_at: new Date() },
    { id: 2, nombre_empresa: 'Manufacturas Globales S.A.', contacto: 'Lic. Mariana Soto', telefono: '+506 2289-9012', correo: 'msoto@manuglobal.com', activo: true, created_at: new Date() },
    { id: 3, nombre_empresa: 'Distribuidora Logística Central', contacto: 'Carlos Alvarado', telefono: '+506 2440-1122', correo: 'calvarado@districentral.com', activo: true, created_at: new Date() },
    { id: 4, nombre_empresa: 'Servicios Médicos Especializados', contacto: 'Dra. Andrea Morales', telefono: '+506 2520-3344', correo: 'amorales@medicosesp.com', activo: true, created_at: new Date() },
    { id: 5, nombre_empresa: 'Corporación Financiera del Valle', contacto: 'Rodrigo Jiménez', telefono: '+506 2201-5566', correo: 'rjimenez@finanzascv.com', activo: true, created_at: new Date() }
  ],
  citas: [
    { id: 1, cliente_nombre: 'Industrias Alimentarias del Norte S.A.', capacitador_id: 1, fecha: '2026-09-07', hora_inicio: '08:00', hora_fin: '12:00', horas: 4.00, modalidad: 'Presencial', tipo_servicio: 'Curso', observaciones: 'Módulo 1: Buenas Prácticas de Manufactura.' },
    { id: 2, cliente_nombre: 'Manufacturas Globales S.A.', capacitador_id: 2, fecha: '2026-09-07', hora_inicio: '09:00', hora_fin: '11:30', horas: 2.50, modalidad: 'Virtual', tipo_servicio: 'Asesoría', observaciones: 'Revisión documental del Sistema de Gestión.' },
    { id: 3, cliente_nombre: 'Distribuidora Logística Central', capacitador_id: 3, fecha: '2026-09-08', hora_inicio: '08:30', hora_fin: '14:30', horas: 6.00, modalidad: 'Presencial', tipo_servicio: 'Auditoría', observaciones: 'Auditoría interna de procesos en planta.' },
    { id: 4, cliente_nombre: 'Servicios Médicos Especializados', capacitador_id: 1, fecha: '2026-09-09', hora_inicio: '14:00', hora_fin: '16:00', horas: 2.00, modalidad: 'Virtual', tipo_servicio: 'Reunión', observaciones: 'Reunión de coordinación con gerencia.' },
    { id: 5, cliente_nombre: 'Corporación Financiera del Valle', capacitador_id: 4, fecha: '2026-09-10', hora_inicio: '08:00', hora_fin: '13:00', horas: 5.00, modalidad: 'Presencial', tipo_servicio: 'Curso', observaciones: 'Capacitación en Seguridad Ocupacional.' },
    { id: 6, cliente_nombre: 'Industrias Alimentarias del Norte S.A.', capacitador_id: 2, fecha: '2026-09-11', hora_inicio: '10:00', hora_fin: '12:00', horas: 2.00, modalidad: 'Virtual', tipo_servicio: 'Seguimiento', observaciones: 'Seguimiento a planes de acción correctiva.' },
    { id: 7, cliente_nombre: 'Manufacturas Globales S.A.', capacitador_id: 5, fecha: '2026-09-14', hora_inicio: '08:00', hora_fin: '16:00', horas: 8.00, modalidad: 'Presencial', tipo_servicio: 'Auditoría', observaciones: 'Jornada completa de auditoría de calidad.' },
    { id: 8, cliente_nombre: 'Distribuidora Logística Central', capacitador_id: 1, fecha: '2026-09-15', hora_inicio: '09:00', hora_fin: '12:30', horas: 3.50, modalidad: 'Presencial', tipo_servicio: 'Asesoría', observaciones: 'Asesoría en control estadístico de procesos.' },
    { id: 9, cliente_nombre: 'Servicios Médicos Especializados', capacitador_id: 3, fecha: '2026-09-16', hora_inicio: '13:00', hora_fin: '17:00', horas: 4.00, modalidad: 'Virtual', tipo_servicio: 'Curso', observaciones: 'Taller virtual de gestión por procesos.' },
    { id: 10, cliente_nombre: 'Corporación Financiera del Valle', capacitador_id: 2, fecha: '2026-09-18', hora_inicio: '09:00', hora_fin: '11:00', horas: 2.00, modalidad: 'Virtual', tipo_servicio: 'Reunión', observaciones: 'Cierre de ciclo de capacitación trimestral.' }
  ],
  nextIds: {
    capacitadores: 6,
    clientes: 6,
    citas: 11
  }
};

async function testConnection() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    client.release();
    isPostgresConnected = true;
    console.log('✅ [DB] Conectado exitosamente a PostgreSQL:', res.rows[0].now);
  } catch (err) {
    isPostgresConnected = false;
    console.warn('⚠️ [DB] PostgreSQL no disponible localmente (' + err.message + ').');
    console.warn('ℹ️ [DB] Activando motor de datos en memoria local con datos de seed para continuidad operativa.');
  }
}

testConnection();

module.exports = {
  pool,
  isPostgresConnected: () => isPostgresConnected,
  mockStore,
  query: async (text, params) => {
    if (isPostgresConnected) {
      return pool.query(text, params);
    }
    throw new Error('PostgreSQL not connected');
  }
};
