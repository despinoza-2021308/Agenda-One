const { Pool, Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const poolConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'agenda_db',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
};

let pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : new Pool(poolConfig);

let isPostgresConnected = false;

async function ensureDatabaseExists() {
  if (connectionString) return;
  const targetDb = process.env.PGDATABASE || 'agenda_db';
  const adminClient = new Client({
    host: poolConfig.host,
    port: poolConfig.port,
    user: poolConfig.user,
    password: poolConfig.password,
    database: 'postgres',
    connectionTimeoutMillis: 3000,
  });

  try {
    await adminClient.connect();
    const checkDb = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDb]
    );
    if (checkDb.rows.length === 0) {
      console.log(`📦 [DB] Creando base de datos "${targetDb}" automáticamente...`);
      await adminClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`✅ [DB] Base de datos "${targetDb}" creada.`);
    }
  } catch (err) {
    // Si falla, el intento normal de conexión continuará
  } finally {
    try { await adminClient.end(); } catch (_) {}
  }
}


// Almacén en memoria de respaldo para desarrollo inmediato sin bloqueos
const mockStore = {
  capacitadores: [
    { id: 1, nombre_completo: 'Mariana Orellana', iniciales: 'MO', color: '#2563EB', activo: true, created_at: new Date() },
    { id: 2, nombre_completo: 'Oscar Quan', iniciales: 'OQ', color: '#7C3AED', activo: true, created_at: new Date() },
    { id: 3, nombre_completo: 'Pedro Fuentes', iniciales: 'PF', color: '#059669', activo: true, created_at: new Date() },
    { id: 4, nombre_completo: 'Zoila Galvez', iniciales: 'ZG', color: '#D97706', activo: true, created_at: new Date() },
    { id: 5, nombre_completo: 'Josue Bautista', iniciales: 'JB', color: '#DC2626', activo: true, created_at: new Date() }
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

async function autoInitTables(client) {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS capacitadores (
        id SERIAL PRIMARY KEY,
        nombre_completo VARCHAR(120) NOT NULL,
        iniciales VARCHAR(5) NOT NULL UNIQUE,
        color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nombre_empresa VARCHAR(150) NOT NULL UNIQUE,
        contacto VARCHAR(100),
        telefono VARCHAR(30),
        correo VARCHAR(100),
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS citas (
        id SERIAL PRIMARY KEY,
        cliente_id INT REFERENCES clientes(id) ON DELETE RESTRICT,
        cliente_nombre VARCHAR(150),
        capacitador_id INT NOT NULL REFERENCES capacitadores(id) ON DELETE RESTRICT,
        fecha DATE NOT NULL,
        hora_inicio TIME NOT NULL,
        hora_fin TIME NOT NULL,
        horas NUMERIC(4, 2) NOT NULL CHECK (horas > 0),
        modalidad VARCHAR(20) NOT NULL CHECK (modalidad IN ('Presencial', 'Virtual', 'Híbrida')),
        tipo_servicio VARCHAR(30) NOT NULL CHECK (tipo_servicio IN ('Asesoría', 'Curso', 'Auditoría', 'Reunión', 'Seguimiento')),
        observaciones TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const capRes = await client.query('SELECT COUNT(*) FROM capacitadores');
    if (parseInt(capRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO capacitadores (nombre_completo, iniciales, color) VALUES
        ('Mariana Orellana', 'MO', '#2563EB'),
        ('Oscar Quan', 'OQ', '#7C3AED'),
        ('Pedro Fuentes', 'PF', '#059669'),
        ('Zoila Galvez', 'ZG', '#D97706'),
        ('Josue Bautista', 'JB', '#DC2626')
        ON CONFLICT (iniciales) DO NOTHING;

        INSERT INTO clientes (nombre_empresa, contacto, telefono, correo) VALUES
        ('Industrias Alimentarias del Norte S.A.', 'Ing. Roberto Silva', '+506 2234-5678', 'rsilva@alimnorte.com'),
        ('Manufacturas Globales S.A.', 'Lic. Mariana Soto', '+506 2289-9012', 'msoto@manuglobal.com'),
        ('Distribuidora Logística Central', 'Carlos Alvarado', '+506 2440-1122', 'calvarado@districentral.com'),
        ('Servicios Médicos Especializados', 'Dra. Andrea Morales', '+506 2520-3344', 'amorales@medicosesp.com'),
        ('Corporación Financiera del Valle', 'Rodrigo Jiménez', '+506 2201-5566', 'rjimenez@finanzascv.com')
        ON CONFLICT (nombre_empresa) DO NOTHING;

        INSERT INTO citas (cliente_id, capacitador_id, fecha, hora_inicio, hora_fin, horas, modalidad, tipo_servicio, observaciones) VALUES
        (1, 1, '2026-09-07', '08:00', '12:00', 4.00, 'Presencial', 'Curso', 'Módulo 1: Buenas Prácticas de Manufactura.'),
        (2, 2, '2026-09-07', '09:00', '11:30', 2.50, 'Virtual', 'Asesoría', 'Revisión documental del Sistema de Gestión.'),
        (3, 3, '2026-09-08', '08:30', '14:30', 6.00, 'Presencial', 'Auditoría', 'Auditoría interna de procesos en planta.'),
        (4, 1, '2026-09-09', '14:00', '16:00', 2.00, 'Virtual', 'Reunión', 'Reunión de coordinación con gerencia.'),
        (5, 4, '2026-09-10', '08:00', '13:00', 5.00, 'Presencial', 'Curso', 'Capacitación en Seguridad Ocupacional.'),
        (1, 2, '2026-09-11', '10:00', '12:00', 2.00, 'Virtual', 'Seguimiento', 'Seguimiento a planes de acción correctiva.'),
        (2, 5, '2026-09-14', '08:00', '16:00', 8.00, 'Presencial', 'Auditoría', 'Jornada completa de auditoría de calidad.'),
        (3, 1, '2026-09-15', '09:00', '12:30', 3.50, 'Presencial', 'Asesoría', 'Asesoría en control estadístico de procesos.'),
        (4, 3, '2026-09-16', '13:00', '17:00', 4.00, 'Virtual', 'Curso', 'Taller virtual de gestión por procesos.'),
        (5, 2, '2026-09-18', '09:00', '11:00', 2.00, 'Virtual', 'Reunión', 'Cierre de ciclo de capacitación trimestral.');
      `);
      console.log('🌱 [DB] Tablas y datos semilla creados exitosamente en PostgreSQL.');
    }
  } catch (initErr) {
    console.warn('⚠️ [DB] Aviso en auto-inicialización de tablas:', initErr.message);
  }
}

async function testConnection() {
  await ensureDatabaseExists();
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log('✅ [DB] Conectado exitosamente a PostgreSQL:', res.rows[0].now);
    await autoInitTables(client);
    client.release();
    isPostgresConnected = true;
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
