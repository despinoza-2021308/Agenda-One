const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();
const { Pool, Client } = require('pg');

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
    { id: 1, nombre_completo: 'Mariana Orellana', iniciales: 'MO', color: '#2563EB', telefono: '+502 5555-1001', tarifa_hora: 175.00, activo: true, created_at: new Date() },
    { id: 2, nombre_completo: 'Oscar Quan', iniciales: 'OQ', color: '#7C3AED', telefono: '+502 5555-1002', tarifa_hora: 200.00, activo: true, created_at: new Date() },
    { id: 3, nombre_completo: 'Pedro Fuentes', iniciales: 'PF', color: '#059669', telefono: '+502 5555-1003', tarifa_hora: 175.00, activo: true, created_at: new Date() },
    { id: 4, nombre_completo: 'Zoila Galvez', iniciales: 'ZG', color: '#D97706', telefono: '+502 5555-1004', tarifa_hora: 150.00, activo: true, created_at: new Date() },
    { id: 5, nombre_completo: 'Josue Bautista', iniciales: 'JB', color: '#DC2626', telefono: '+502 5555-1005', tarifa_hora: 150.00, activo: true, created_at: new Date() }
  ],
  clientes: [
    { id: 1, nombre_empresa: 'Industrias Alimentarias del Norte S.A.', contacto: 'Ing. Roberto Silva', telefono: '+502 5555-1122', correo: 'rsilva@alimnorte.gt', activo: true, created_at: new Date() },
    { id: 2, nombre_empresa: 'Manufacturas Globales S.A.', contacto: 'Lic. Mariana Soto', telefono: '+502 5555-2233', correo: 'msoto@manuglobal.gt', activo: true, created_at: new Date() },
    { id: 3, nombre_empresa: 'Distribuidora Logística Central', contacto: 'Carlos Alvarado', telefono: '+502 5555-3344', correo: 'calvarado@districentral.gt', activo: true, created_at: new Date() },
    { id: 4, nombre_empresa: 'Servicios Médicos Especializados', contacto: 'Dra. Andrea Morales', telefono: '+502 5555-4455', correo: 'amorales@medicosesp.gt', activo: true, created_at: new Date() },
    { id: 5, nombre_empresa: 'Corporación Financiera del Valle', contacto: 'Rodrigo Jiménez', telefono: '+502 5555-5566', correo: 'rjimenez@finanzascv.gt', activo: true, created_at: new Date() },
    { id: 6, nombre_empresa: 'Agropecuaria San Francisco S.A.', contacto: 'Ing. Carlos Mendoza', telefono: '+502 5555-6677', correo: 'cmendoza@agrosanfrancisco.gt', activo: true, created_at: new Date() },
    { id: 7, nombre_empresa: 'Farmacéutica Panamericana S.A.', contacto: 'Licda. Sofía Castillo', telefono: '+502 5555-7788', correo: 'scastillo@farmapanamericana.gt', activo: true, created_at: new Date() },
    { id: 8, nombre_empresa: 'Constructora e Inmobiliaria Metropolitana', contacto: 'Arq. Fernando Ramos', telefono: '+502 5555-8899', correo: 'framos@metropolitana.gt', activo: true, created_at: new Date() },
    { id: 9, nombre_empresa: 'Banco Regional del Sur', contacto: 'Lic. Claudia Estrada', telefono: '+502 5555-9900', correo: 'cestrada@bancoregional.gt', activo: true, created_at: new Date() },
    { id: 10, nombre_empresa: 'Supermercados La Unión S.A.', contacto: 'Lic. Mario Velásquez', telefono: '+502 5555-0011', correo: 'mvelasquez@launion.gt', activo: true, created_at: new Date() }
  ],
  citas: [
    // Semana 1: Septiembre 01 - 04
    { id: 1, cliente_nombre: 'Industrias Alimentarias del Norte S.A.', capacitador_id: 1, fecha: '2026-09-01', hora_inicio: '08:30', hora_fin: '11:30', horas: 3.00, modalidad: 'Presencial', tipo_servicio: 'Capacitación', estado: 'Impartida', observaciones: 'Inducción de Seguridad Industrial para nuevos ingresos.', bitacora: 'Inducción impartida a 16 operarios de nuevo ingreso. Aprobación del test al 100%.', firma_cliente: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100"><path d="M20,60 Q60,10 100,50 T180,40 T260,65" fill="none" stroke="%231e293b" stroke-width="3" stroke-linecap="round"/></svg>', firmante_nombre: 'Ing. Roberto Silva', firmante_puesto: 'Gerente de Planta', firmado_at: '2026-09-01T11:35:00.000Z' },
    { id: 2, cliente_nombre: 'Agropecuaria San Francisco S.A.', capacitador_id: 2, fecha: '2026-09-01', hora_inicio: '14:00', hora_fin: '16:30', horas: 2.50, modalidad: 'Virtual', tipo_servicio: 'Consultoría', estado: 'Impartida', observaciones: 'Revisión preliminar de protocolos de inocuidad agrícola.', bitacora: 'Revisados 8 procedimientos de empaque de hortalizas y trazabilidad de campo.' },
    { id: 3, cliente_nombre: 'Manufacturas Globales S.A.', capacitador_id: 4, fecha: '2026-09-02', hora_inicio: '09:00', hora_fin: '13:00', horas: 4.00, modalidad: 'Virtual', tipo_servicio: 'Capacitación', estado: 'Impartida', observaciones: 'Taller de Liderazgo Estratégico y Trabajo en Equipo.', bitacora: 'Taller participativo con 14 mandos medios. Dinámica de retroalimentación concluida.' },
    { id: 4, cliente_nombre: 'Farmacéutica Panamericana S.A.', capacitador_id: 3, fecha: '2026-09-02', hora_inicio: '14:00', hora_fin: '17:00', horas: 3.00, modalidad: 'Presencial', tipo_servicio: 'Mediciones', estado: 'Impartida', observaciones: 'Validación de áreas limpias y bitácoras de temperatura.', bitacora: 'Inspeccionadas 3 cámaras frías. Se calibraron los termohigrómetros de control ambiental.' },
    { id: 5, cliente_nombre: 'Distribuidora Logística Central', capacitador_id: 5, fecha: '2026-09-03', hora_inicio: '08:00', hora_fin: '14:00', horas: 6.00, modalidad: 'Presencial', tipo_servicio: 'Auditoría', estado: 'Impartida', observaciones: 'Auditoría ISO 9001 - Fase 1: Almacenes y distribución.', bitacora: 'Auditoría concluida con éxito. 2 no conformidades menores en señalización de pasillos.' },
    { id: 6, cliente_nombre: 'Constructora e Inmobiliaria Metropolitana', capacitador_id: 1, fecha: '2026-09-03', hora_inicio: '09:30', hora_fin: '12:00', horas: 2.50, modalidad: 'Presencial', tipo_servicio: 'Capacitación', estado: 'Impartida', observaciones: 'Prevención de riesgos en trabajos de altura y uso de arnés.', bitacora: 'Capacitación práctica con 22 operarios y armadores. Revisión física de líneas de vida.' },
    { id: 7, cliente_nombre: 'Servicios Médicos Especializados', capacitador_id: 2, fecha: '2026-09-04', hora_inicio: '09:00', hora_fin: '12:00', horas: 3.00, modalidad: 'Virtual', tipo_servicio: 'Consultoría', estado: 'Impartida', observaciones: 'Estandarización de procesos clínicos y consentimiento digital.', bitacora: 'Aprobado el flujo de atención para consulta externa y expedientes electrónicos.' },
    { id: 8, cliente_nombre: 'Banco Regional del Sur', capacitador_id: 4, fecha: '2026-09-04', hora_inicio: '14:00', hora_fin: '16:30', horas: 2.50, modalidad: 'Virtual', tipo_servicio: 'Normas', estado: 'Impartida', observaciones: 'Alineación de necesidades formativas de servicio al cliente.', bitacora: 'Definido el cronograma de capacitación para cajeros y personal de plataforma.' },

    // Semana 2: Septiembre 07 - 11
    { id: 9, cliente_nombre: 'Industrias Alimentarias del Norte S.A.', capacitador_id: 1, fecha: '2026-09-07', hora_inicio: '08:00', hora_fin: '12:00', horas: 4.00, modalidad: 'Presencial', tipo_servicio: 'Capacitación', estado: 'Impartida', observaciones: 'Módulo 1: Buenas Prácticas de Manufactura en planta.', bitacora: 'Se capacitó al personal operativo de planta (18 personas). Evaluación promedio: 88/100.' },
    { id: 10, cliente_nombre: 'Manufacturas Globales S.A.', capacitador_id: 2, fecha: '2026-09-07', hora_inicio: '09:00', hora_fin: '11:30', horas: 2.50, modalidad: 'Virtual', tipo_servicio: 'Consultoría', estado: 'Impartida', observaciones: 'Revisión documental del Sistema de Gestión de Calidad.', bitacora: 'Revisados los procedimientos PR-01 al PR-04. Pendiente actualizar matriz de riesgos.' },
    { id: 11, cliente_nombre: 'Supermercados La Unión S.A.', capacitador_id: 3, fecha: '2026-09-07', hora_inicio: '14:00', hora_fin: '17:00', horas: 3.00, modalidad: 'Presencial', tipo_servicio: 'Consultoría', estado: 'Impartida', observaciones: 'Control de mermas y protocolos de higiene en perecederos.', bitacora: 'Capacitado el equipo de carnicería y frutas. Se establecieron checklists diarios.' },
    { id: 12, cliente_nombre: 'Distribuidora Logística Central', capacitador_id: 3, fecha: '2026-09-08', hora_inicio: '08:30', hora_fin: '14:30', horas: 6.00, modalidad: 'Presencial', tipo_servicio: 'Auditoría', estado: 'Impartida', observaciones: 'Auditoría interna de procesos en planta y transporte.', bitacora: 'Auditoría completada satisfactoriamente. Se levantaron 2 no conformidades menores.' },
    { id: 13, cliente_nombre: 'Banco Regional del Sur', capacitador_id: 5, fecha: '2026-09-08', hora_inicio: '10:00', hora_fin: '12:30', horas: 2.50, modalidad: 'Virtual', tipo_servicio: 'Capacitación', estado: 'Impartida', observaciones: 'Ciberseguridad y prevención de phishing para ejecutivos.', bitacora: 'Participaron 28 oficiales de crédito. Se realizó simulación de correo malicioso.' },
    { id: 14, cliente_nombre: 'Agropecuaria San Francisco S.A.', capacitador_id: 4, fecha: '2026-09-09', hora_inicio: '08:30', hora_fin: '11:30', horas: 3.00, modalidad: 'Presencial', tipo_servicio: 'Capacitación', estado: 'Impartida', observaciones: 'Manejo seguro de químicos agrícolas y primeros auxilios.', bitacora: 'Taller de campo en finca. 15 técnicos completaron la prueba de uso correcto de caretas.' },
    { id: 15, cliente_nombre: 'Servicios Médicos Especializados', capacitador_id: 1, fecha: '2026-09-09', hora_inicio: '14:00', hora_fin: '16:00', horas: 2.00, modalidad: 'Virtual', tipo_servicio: 'Normas', estado: 'Impartida', observaciones: 'Reunión de coordinación con gerencia médica.', bitacora: 'Módulo concluido con 15 asistentes. Acuerdos: entrega de informe final el viernes.' },
    { id: 16, cliente_nombre: 'Corporación Financiera del Valle', capacitador_id: 2, fecha: '2026-09-09', hora_inicio: '14:00', hora_fin: '16:00', horas: 2.00, modalidad: 'Virtual', tipo_servicio: 'Consultoría', estado: 'En Curso', observaciones: 'Sesión de análisis de riesgo crediticio y auditoría de carteras.', bitacora: null },
    { id: 17, cliente_nombre: 'Farmacéutica Panamericana S.A.', capacitador_id: 3, fecha: '2026-09-09', hora_inicio: '16:30', hora_fin: '18:30', horas: 2.00, modalidad: 'Virtual', tipo_servicio: 'Requerimientos Legales', estado: 'Programada', observaciones: 'Revisión del plan de capacitación de fin de año.', bitacora: null },
    { id: 18, cliente_nombre: 'Corporación Financiera del Valle', capacitador_id: 4, fecha: '2026-09-10', hora_inicio: '08:00', hora_fin: '13:00', horas: 5.00, modalidad: 'Presencial', tipo_servicio: 'Capacitación', estado: 'Programada', observaciones: 'Capacitación en Seguridad Ocupacional y brigadas de evacuación.', bitacora: null },
    { id: 19, cliente_nombre: 'Constructora e Inmobiliaria Metropolitana', capacitador_id: 5, fecha: '2026-09-10', hora_inicio: '09:00', hora_fin: '12:00', horas: 3.00, modalidad: 'Presencial', tipo_servicio: 'Consultoría', estado: 'Programada', observaciones: 'Supervisión de protocolos de seguridad en obra gris.', bitacora: null },
    { id: 20, cliente_nombre: 'Farmacéutica Panamericana S.A.', capacitador_id: 3, fecha: '2026-09-10', hora_inicio: '14:00', hora_fin: '16:30', horas: 2.50, modalidad: 'Virtual', tipo_servicio: 'Requerimientos Legales', estado: 'Programada', observaciones: 'Seguimiento a planes de acción correctiva de auditoría interna.', bitacora: null },
    { id: 21, cliente_nombre: 'Supermercados La Unión S.A.', capacitador_id: 1, fecha: '2026-09-11', hora_inicio: '08:30', hora_fin: '12:00', horas: 3.50, modalidad: 'Presencial', tipo_servicio: 'Capacitación', estado: 'Programada', observaciones: 'Atención de quejas y resolución de conflictos en punto de venta.', bitacora: null },
    { id: 22, cliente_nombre: 'Industrias Alimentarias del Norte S.A.', capacitador_id: 2, fecha: '2026-09-11', hora_inicio: '10:00', hora_fin: '12:00', horas: 2.00, modalidad: 'Virtual', tipo_servicio: 'Requerimientos Legales', estado: 'Programada', observaciones: 'Seguimiento a planes de acción de HACCP.', bitacora: null },
    { id: 23, cliente_nombre: 'Manufacturas Globales S.A.', capacitador_id: 5, fecha: '2026-09-11', hora_inicio: '14:00', hora_fin: '17:00', horas: 3.00, modalidad: 'Presencial', tipo_servicio: 'Mediciones', estado: 'Programada', observaciones: 'Revisión de planos eléctricos y etiquetado LOTO.', bitacora: null },

    // Semana 3: Septiembre 14 - 18
    { id: 24, cliente_nombre: 'Manufacturas Globales S.A.', capacitador_id: 5, fecha: '2026-09-14', hora_inicio: '08:00', hora_fin: '16:00', horas: 8.00, modalidad: 'Presencial', tipo_servicio: 'Auditoría', estado: 'Programada', observaciones: 'Jornada completa de auditoría de calidad ISO 9001.', bitacora: null },
    { id: 25, cliente_nombre: 'Agropecuaria San Francisco S.A.', capacitador_id: 1, fecha: '2026-09-14', hora_inicio: '09:00', hora_fin: '12:30', horas: 3.50, modalidad: 'Presencial', tipo_servicio: 'Consultoría', estado: 'Programada', observaciones: 'Asesoría en Buenas Prácticas Agrícolas (BPA).', bitacora: null },
    { id: 26, cliente_nombre: 'Distribuidora Logística Central', capacitador_id: 1, fecha: '2026-09-15', hora_inicio: '09:00', hora_fin: '12:30', horas: 3.50, modalidad: 'Presencial', tipo_servicio: 'Consultoría', estado: 'Programada', observaciones: 'Asesoría en control estadístico de procesos de entrega.', bitacora: null },
    { id: 27, cliente_nombre: 'Banco Regional del Sur', capacitador_id: 2, fecha: '2026-09-15', hora_inicio: '14:00', hora_fin: '17:00', horas: 3.00, modalidad: 'Virtual', tipo_servicio: 'Capacitación', estado: 'Programada', observaciones: 'Taller de Cumplimiento Regulatorio y Prevención de Lavado de Dinero.', bitacora: null },
    { id: 28, cliente_nombre: 'Farmacéutica Panamericana S.A.', capacitador_id: 3, fecha: '2026-09-16', hora_inicio: '08:30', hora_fin: '12:30', horas: 4.00, modalidad: 'Presencial', tipo_servicio: 'Capacitación', estado: 'Programada', observaciones: 'Buenas Prácticas de Almacenamiento y Distribución (BPAD).', bitacora: null },
    { id: 29, cliente_nombre: 'Servicios Médicos Especializados', capacitador_id: 3, fecha: '2026-09-16', hora_inicio: '13:00', hora_fin: '17:00', horas: 4.00, modalidad: 'Virtual', tipo_servicio: 'Capacitación', estado: 'Cancelada', observaciones: 'Taller virtual de gestión por procesos (Reprogramado a solicitud de cliente).', bitacora: null },
    { id: 30, cliente_nombre: 'Supermercados La Unión S.A.', capacitador_id: 4, fecha: '2026-09-16', hora_inicio: '14:00', hora_fin: '16:30', horas: 2.50, modalidad: 'Presencial', tipo_servicio: 'Requerimientos Legales', estado: 'Programada', observaciones: 'Revisión de implementación de metodología 5S en bodega central.', bitacora: null },
    { id: 31, cliente_nombre: 'Corporación Financiera del Valle', capacitador_id: 3, fecha: '2026-09-17', hora_inicio: '08:00', hora_fin: '12:00', horas: 4.00, modalidad: 'Presencial', tipo_servicio: 'Capacitación', estado: 'Reprogramada', observaciones: 'Capacitación en Manejo Defensivo y Seguridad de Flotilla.', bitacora: null },
    { id: 32, cliente_nombre: 'Constructora e Inmobiliaria Metropolitana', capacitador_id: 5, fecha: '2026-09-17', hora_inicio: '09:00', hora_fin: '13:00', horas: 4.00, modalidad: 'Presencial', tipo_servicio: 'Capacitación', estado: 'Programada', observaciones: 'Seguridad en Espacios Confinados y Excavaciones.', bitacora: null },
    { id: 33, cliente_nombre: 'Industrias Alimentarias del Norte S.A.', capacitador_id: 1, fecha: '2026-09-17', hora_inicio: '14:30', hora_fin: '17:00', horas: 2.50, modalidad: 'Virtual', tipo_servicio: 'Consultoría', estado: 'Programada', observaciones: 'Diseño de indicadores de desempeño para supervisores.', bitacora: null },
    { id: 34, cliente_nombre: 'Corporación Financiera del Valle', capacitador_id: 2, fecha: '2026-09-18', hora_inicio: '09:00', hora_fin: '11:00', horas: 2.00, modalidad: 'Virtual', tipo_servicio: 'Normas', estado: 'Programada', observaciones: 'Cierre de ciclo de capacitación trimestral y entrega de notas.', bitacora: null },
    { id: 35, cliente_nombre: 'Agropecuaria San Francisco S.A.', capacitador_id: 4, fecha: '2026-09-18', hora_inicio: '13:30', hora_fin: '16:30', horas: 3.00, modalidad: 'Presencial', tipo_servicio: 'Capacitación', estado: 'Programada', observaciones: 'Comité de Salud y Seguridad Ocupacional: Funciones y responsabilidades.', bitacora: null },

    // Semana 4: Septiembre 21 - 25
    { id: 36, cliente_nombre: 'Industrias Alimentarias del Norte S.A.', capacitador_id: 5, fecha: '2026-09-21', hora_inicio: '08:00', hora_fin: '13:00', horas: 5.00, modalidad: 'Presencial', tipo_servicio: 'Capacitación', estado: 'Programada', observaciones: 'Mantenimiento Productivo Total (TPM) en líneas de envasado.', bitacora: null },
    { id: 37, cliente_nombre: 'Banco Regional del Sur', capacitador_id: 3, fecha: '2026-09-21', hora_inicio: '14:00', hora_fin: '17:00', horas: 3.00, modalidad: 'Virtual', tipo_servicio: 'Consultoría', estado: 'Programada', observaciones: 'Optimización de tiempos de espera y atención en agencias.', bitacora: null },
    { id: 38, cliente_nombre: 'Manufacturas Globales S.A.', capacitador_id: 1, fecha: '2026-09-22', hora_inicio: '08:30', hora_fin: '15:00', horas: 6.50, modalidad: 'Presencial', tipo_servicio: 'Auditoría', estado: 'Programada', observaciones: 'Auditoría de Cumplimiento Ambiental y Gestión de Residuos.', bitacora: null },
    { id: 39, cliente_nombre: 'Farmacéutica Panamericana S.A.', capacitador_id: 2, fecha: '2026-09-22', hora_inicio: '09:00', hora_fin: '12:00', horas: 3.00, modalidad: 'Virtual', tipo_servicio: 'Consultoría', estado: 'Programada', observaciones: 'Análisis de Causa Raíz (RCA) para desviaciones de calidad.', bitacora: null },
    { id: 40, cliente_nombre: 'Distribuidora Logística Central', capacitador_id: 4, fecha: '2026-09-23', hora_inicio: '09:00', hora_fin: '12:00', horas: 3.00, modalidad: 'Virtual', tipo_servicio: 'Capacitación', estado: 'Programada', observaciones: 'Seminario de Finanzas y Costos Operativos para Jefaturas.', bitacora: null },
    { id: 41, cliente_nombre: 'Supermercados La Unión S.A.', capacitador_id: 5, fecha: '2026-09-23', hora_inicio: '14:00', hora_fin: '17:30', horas: 3.50, modalidad: 'Presencial', tipo_servicio: 'Normas', estado: 'Programada', observaciones: 'Manejo Seguro de Montacargas y Equipos de Tracción.', bitacora: null },
    { id: 42, cliente_nombre: 'Constructora e Inmobiliaria Metropolitana', capacitador_id: 1, fecha: '2026-09-24', hora_inicio: '08:30', hora_fin: '12:30', horas: 4.00, modalidad: 'Presencial', tipo_servicio: 'Capacitación', estado: 'Programada', observaciones: 'Liderazgo de Cuadrillas y Comunicación Efectiva en Obra.', bitacora: null },
    { id: 43, cliente_nombre: 'Servicios Médicos Especializados', capacitador_id: 2, fecha: '2026-09-24', hora_inicio: '14:00', hora_fin: '16:00', horas: 2.00, modalidad: 'Virtual', tipo_servicio: 'Requerimientos Legales', estado: 'Programada', observaciones: 'Seguimiento a acciones correctivas de bioseguridad hospitalaria.', bitacora: null },
    { id: 44, cliente_nombre: 'Corporación Financiera del Valle', capacitador_id: 3, fecha: '2026-09-25', hora_inicio: '09:00', hora_fin: '13:00', horas: 4.00, modalidad: 'Presencial', tipo_servicio: 'Capacitación', estado: 'Programada', observaciones: 'Evaluación y Certificación de Competencias Laborales.', bitacora: null },
    { id: 45, cliente_nombre: 'Agropecuaria San Francisco S.A.', capacitador_id: 4, fecha: '2026-09-25', hora_inicio: '14:00', hora_fin: '17:00', horas: 3.00, modalidad: 'Virtual', tipo_servicio: 'Consultoría', estado: 'Programada', observaciones: 'Revisión del Manual de Bienestar Laboral y Clima Organizacional.', bitacora: null },

    // Semana 5: Septiembre 28 - 30
    { id: 46, cliente_nombre: 'Farmacéutica Panamericana S.A.', capacitador_id: 5, fecha: '2026-09-28', hora_inicio: '08:30', hora_fin: '12:30', horas: 4.00, modalidad: 'Presencial', tipo_servicio: 'Auditoría', estado: 'Programada', observaciones: 'Pre-auditoría de Certificación BPM ante autoridad sanitaria.', bitacora: null },
    { id: 47, cliente_nombre: 'Industrias Alimentarias del Norte S.A.', capacitador_id: 1, fecha: '2026-09-28', hora_inicio: '14:00', hora_fin: '16:30', horas: 2.50, modalidad: 'Virtual', tipo_servicio: 'Normas', estado: 'Programada', observaciones: 'Reunión de Cierre Mensual y revisión de KPIs del Modelo AD-RE-11.', bitacora: null },
    { id: 48, cliente_nombre: 'Manufacturas Globales S.A.', capacitador_id: 4, fecha: '2026-09-29', hora_inicio: '09:00', hora_fin: '12:00', horas: 3.00, modalidad: 'Virtual', tipo_servicio: 'Normas', estado: 'Programada', observaciones: 'Ergonomía en el Puesto de Trabajo y Prevención de Lesiones.', bitacora: null },
    { id: 49, cliente_nombre: 'Banco Regional del Sur', capacitador_id: 2, fecha: '2026-09-29', hora_inicio: '13:30', hora_fin: '16:30', horas: 3.00, modalidad: 'Virtual', tipo_servicio: 'Consultoría', estado: 'Programada', observaciones: 'Asesoría en Plan de Continuidad de Negocio (BCP).', bitacora: null },
    { id: 50, cliente_nombre: 'Distribuidora Logística Central', capacitador_id: 5, fecha: '2026-09-30', hora_inicio: '08:00', hora_fin: '12:00', horas: 4.00, modalidad: 'Presencial', tipo_servicio: 'Auditoría', estado: 'Programada', observaciones: 'Presentación de Resultados Finales de Auditoría de Cierre Trimestral.', bitacora: null },
    { id: 51, cliente_nombre: 'Supermercados La Unión S.A.', capacitador_id: 3, fecha: '2026-09-30', hora_inicio: '13:00', hora_fin: '16:00', horas: 3.00, modalidad: 'Presencial', tipo_servicio: 'Normas', estado: 'Programada', observaciones: 'Sesión ejecutiva de balance de horas y satisfacción de capacitaciones.', bitacora: null }
  ],
  auditoria_citas: [
    {
      id: 1,
      cita_id: 1,
      accion: 'CREACION',
      usuario: 'Administrador',
      detalles: { notas: 'Cita registrada en agendamiento central.' },
      ip_origen: '127.0.0.1',
      created_at: new Date('2026-08-25T10:00:00.000Z')
    },
    {
      id: 2,
      cita_id: 1,
      accion: 'FIRMA_CONFORMIDAD',
      usuario: 'Capacitador [MO]',
      detalles: { firmante_nombre: 'Ing. Roberto Silva', firmante_puesto: 'Gerente de Planta' },
      ip_origen: '127.0.0.1',
      created_at: new Date('2026-09-01T11:35:00.000Z')
    }
  ],
  nextIds: {
    capacitadores: 6,
    clientes: 11,
    citas: 52,
    auditoria_citas: 3
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
        telefono VARCHAR(30),
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE capacitadores ADD COLUMN IF NOT EXISTS telefono VARCHAR(30);
      ALTER TABLE capacitadores ADD COLUMN IF NOT EXISTS tarifa_hora NUMERIC(10, 2) NOT NULL DEFAULT 150.00;

      UPDATE capacitadores SET tarifa_hora = 200.00 WHERE iniciales = 'OQ' AND tarifa_hora = 150.00;
      UPDATE capacitadores SET tarifa_hora = 175.00 WHERE iniciales IN ('MO', 'PF') AND tarifa_hora = 150.00;

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
        tipo_servicio VARCHAR(50) NOT NULL CHECK (tipo_servicio IN ('Consultoría', 'Capacitación', 'Auditoría', 'Normas', 'Requerimientos Legales', 'Mediciones', 'Consultoria', 'Capacitacion', 'Auditoria')),
        estado VARCHAR(25) NOT NULL DEFAULT 'Programada',
        observaciones TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE citas ADD COLUMN IF NOT EXISTS estado VARCHAR(25) NOT NULL DEFAULT 'Programada';
      ALTER TABLE citas ADD COLUMN IF NOT EXISTS bitacora TEXT;
      ALTER TABLE citas ALTER COLUMN tipo_servicio TYPE VARCHAR(50);
      ALTER TABLE citas DROP CONSTRAINT IF EXISTS citas_tipo_servicio_check;
      ALTER TABLE citas ADD CONSTRAINT citas_tipo_servicio_check CHECK (tipo_servicio IN (
        'Consultoría', 'Capacitación', 'Auditoría', 'Normas', 'Requerimientos Legales', 'Mediciones',
        'Consultoria', 'Capacitacion', 'Auditoria',
        'Asesoría', 'Asesoria', 'Curso', 'Reunión', 'Reunion', 'Seguimiento'
      ));
      UPDATE citas SET tipo_servicio = 'Capacitación' WHERE tipo_servicio IN ('Curso');
      UPDATE citas SET tipo_servicio = 'Consultoría' WHERE tipo_servicio IN ('Asesoría', 'Asesoria');
      UPDATE citas SET tipo_servicio = 'Normas' WHERE tipo_servicio IN ('Reunión', 'Reunion');
      UPDATE citas SET tipo_servicio = 'Requerimientos Legales' WHERE tipo_servicio IN ('Seguimiento');

      CREATE TABLE IF NOT EXISTS auditoria_citas (
        id SERIAL PRIMARY KEY,
        cita_id INT NOT NULL,
        accion VARCHAR(50) NOT NULL,
        usuario VARCHAR(100) NOT NULL DEFAULT 'Administrador',
        detalles JSONB,
        ip_origen VARCHAR(45),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_auditoria_cita_id ON auditoria_citas(cita_id);
      CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria_citas(created_at);
    `);

    const capRes = await client.query('SELECT COUNT(*) FROM capacitadores');
    if (parseInt(capRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO capacitadores (nombre_completo, iniciales, color, tarifa_hora) VALUES
        ('Mariana Orellana', 'MO', '#2563EB', 175.00),
        ('Oscar Quan', 'OQ', '#7C3AED', 200.00),
        ('Pedro Fuentes', 'PF', '#059669', 175.00),
        ('Zoila Galvez', 'ZG', '#D97706', 150.00),
        ('Josue Bautista', 'JB', '#DC2626', 150.00)
        ON CONFLICT (iniciales) DO UPDATE SET tarifa_hora = EXCLUDED.tarifa_hora;

        INSERT INTO clientes (nombre_empresa, contacto, telefono, correo) VALUES
        ('Industrias Alimentarias del Norte S.A.', 'Ing. Roberto Silva', '+502 5555-1122', 'rsilva@alimnorte.gt'),
        ('Manufacturas Globales S.A.', 'Lic. Mariana Soto', '+502 5555-2233', 'msoto@manuglobal.gt'),
        ('Distribuidora Logística Central', 'Carlos Alvarado', '+502 5555-3344', 'calvarado@districentral.gt'),
        ('Servicios Médicos Especializados', 'Dra. Andrea Morales', '+502 5555-4455', 'amorales@medicosesp.gt'),
        ('Corporación Financiera del Valle', 'Rodrigo Jiménez', '+502 5555-5566', 'rjimenez@finanzascv.gt'),
        ('Agropecuaria San Francisco S.A.', 'Ing. Carlos Mendoza', '+502 5555-6677', 'cmendoza@agrosanfrancisco.gt'),
        ('Farmacéutica Panamericana S.A.', 'Licda. Sofía Castillo', '+502 5555-7788', 'scastillo@farmapanamericana.gt'),
        ('Constructora e Inmobiliaria Metropolitana', 'Arq. Fernando Ramos', '+502 5555-8899', 'framos@metropolitana.gt'),
        ('Banco Regional del Sur', 'Lic. Claudia Estrada', '+502 5555-9900', 'cestrada@bancoregional.gt'),
        ('Supermercados La Unión S.A.', 'Lic. Mario Velásquez', '+502 5555-0011', 'mvelasquez@launion.gt')
        ON CONFLICT (nombre_empresa) DO NOTHING;

        INSERT INTO citas (cliente_id, capacitador_id, fecha, hora_inicio, hora_fin, horas, modalidad, tipo_servicio, estado, observaciones) VALUES
        (1, 1, '2026-09-01', '08:30', '11:30', 3.00, 'Presencial', 'Capacitación', 'Impartida', 'Inducción de Seguridad Industrial para nuevos ingresos.'),
        (6, 2, '2026-09-01', '14:00', '16:30', 2.50, 'Virtual', 'Consultoría', 'Impartida', 'Revisión preliminar de protocolos de inocuidad agrícola.'),
        (2, 4, '2026-09-02', '09:00', '13:00', 4.00, 'Virtual', 'Capacitación', 'Impartida', 'Taller de Liderazgo Estratégico y Trabajo en Equipo.'),
        (7, 3, '2026-09-02', '14:00', '17:00', 3.00, 'Presencial', 'Mediciones', 'Impartida', 'Validación de áreas limpias y bitácoras de temperatura.'),
        (3, 5, '2026-09-03', '08:00', '14:00', 6.00, 'Presencial', 'Auditoría', 'Impartida', 'Auditoría ISO 9001 - Fase 1: Almacenes y distribución.'),
        (8, 1, '2026-09-03', '09:30', '12:00', 2.50, 'Presencial', 'Capacitación', 'Impartida', 'Prevención de riesgos en trabajos de altura y uso de arnés.'),
        (4, 2, '2026-09-04', '09:00', '12:00', 3.00, 'Virtual', 'Consultoría', 'Impartida', 'Estandarización de procesos clínicos y consentimiento digital.'),
        (9, 4, '2026-09-04', '14:00', '16:30', 2.50, 'Virtual', 'Normas', 'Impartida', 'Alineación de necesidades formativas de servicio al cliente.'),
        (1, 1, '2026-09-07', '08:00', '12:00', 4.00, 'Presencial', 'Capacitación', 'Impartida', 'Módulo 1: Buenas Prácticas de Manufactura en planta.'),
        (2, 2, '2026-09-07', '09:00', '11:30', 2.50, 'Virtual', 'Consultoría', 'Impartida', 'Revisión documental del Sistema de Gestión de Calidad.'),
        (10, 3, '2026-09-07', '14:00', '17:00', 3.00, 'Presencial', 'Consultoría', 'Impartida', 'Control de mermas y protocolos de higiene en perecederos.'),
        (3, 3, '2026-09-08', '08:30', '14:30', 6.00, 'Presencial', 'Auditoría', 'Impartida', 'Auditoría interna de procesos en planta y transporte.'),
        (9, 5, '2026-09-08', '10:00', '12:30', 2.50, 'Virtual', 'Capacitación', 'Impartida', 'Ciberseguridad y prevención de phishing para ejecutivos.'),
        (6, 4, '2026-09-09', '08:30', '11:30', 3.00, 'Presencial', 'Capacitación', 'Impartida', 'Manejo seguro de químicos agrícolas y primeros auxilios.'),
        (4, 1, '2026-09-09', '14:00', '16:00', 2.00, 'Virtual', 'Normas', 'Impartida', 'Reunión de coordinación con gerencia médica.'),
        (5, 2, '2026-09-09', '14:00', '16:00', 2.00, 'Virtual', 'Consultoría', 'En Curso', 'Sesión de análisis de riesgo crediticio y auditoría de carteras.'),
        (7, 3, '2026-09-09', '16:30', '18:30', 2.00, 'Virtual', 'Requerimientos Legales', 'Programada', 'Revisión del plan de capacitación de fin de año.'),
        (5, 4, '2026-09-10', '08:00', '13:00', 5.00, 'Presencial', 'Capacitación', 'Programada', 'Capacitación en Seguridad Ocupacional y brigadas de evacuación.'),
        (8, 5, '2026-09-10', '09:00', '12:00', 3.00, 'Presencial', 'Consultoría', 'Programada', 'Supervisión de protocolos de seguridad en obra gris.'),
        (7, 3, '2026-09-10', '14:00', '16:30', 2.50, 'Virtual', 'Requerimientos Legales', 'Programada', 'Seguimiento a planes de acción correctiva de auditoría interna.'),
        (10, 1, '2026-09-11', '08:30', '12:00', 3.50, 'Presencial', 'Capacitación', 'Programada', 'Atención de quejas y resolución de conflictos en punto de venta.'),
        (1, 2, '2026-09-11', '10:00', '12:00', 2.00, 'Virtual', 'Requerimientos Legales', 'Programada', 'Seguimiento a planes de acción de HACCP.'),
        (2, 5, '2026-09-11', '14:00', '17:00', 3.00, 'Presencial', 'Mediciones', 'Programada', 'Revisión de planos eléctricos y etiquetado LOTO.'),
        (2, 5, '2026-09-14', '08:00', '16:00', 8.00, 'Presencial', 'Auditoría', 'Programada', 'Jornada completa de auditoría de calidad ISO 9001.'),
        (6, 1, '2026-09-14', '09:00', '12:30', 3.50, 'Presencial', 'Consultoría', 'Programada', 'Asesoría en Buenas Prácticas Agrícolas (BPA).'),
        (3, 1, '2026-09-15', '09:00', '12:30', 3.50, 'Presencial', 'Consultoría', 'Programada', 'Asesoría en control estadístico de procesos de entrega.'),
        (9, 2, '2026-09-15', '14:00', '17:00', 3.00, 'Virtual', 'Capacitación', 'Programada', 'Taller de Cumplimiento Regulatorio y Prevención de Lavado de Dinero.'),
        (7, 3, '2026-09-16', '08:30', '12:30', 4.00, 'Presencial', 'Capacitación', 'Programada', 'Buenas Prácticas de Almacenamiento y Distribución (BPAD).'),
        (4, 3, '2026-09-16', '13:00', '17:00', 4.00, 'Virtual', 'Capacitación', 'Cancelada', 'Taller virtual de gestión por procesos (Reprogramado a solicitud de cliente).'),
        (10, 4, '2026-09-16', '14:00', '16:30', 2.50, 'Presencial', 'Requerimientos Legales', 'Programada', 'Revisión de implementación de metodología 5S en bodega central.'),
        (5, 3, '2026-09-17', '08:00', '12:00', 4.00, 'Presencial', 'Capacitación', 'Reprogramada', 'Capacitación en Manejo Defensivo y Seguridad de Flotilla.'),
        (8, 5, '2026-09-17', '09:00', '13:00', 4.00, 'Presencial', 'Capacitación', 'Programada', 'Seguridad en Espacios Confinados y Excavaciones.'),
        (1, 1, '2026-09-17', '14:30', '17:00', 2.50, 'Virtual', 'Consultoría', 'Programada', 'Diseño de indicadores de desempeño para supervisores.'),
        (5, 2, '2026-09-18', '09:00', '11:00', 2.00, 'Virtual', 'Normas', 'Programada', 'Cierre de ciclo de capacitación trimestral y entrega de notas.'),
        (6, 4, '2026-09-18', '13:30', '16:30', 3.00, 'Presencial', 'Capacitación', 'Programada', 'Comité de Salud y Seguridad Ocupacional: Funciones y responsabilidades.'),
        (1, 5, '2026-09-21', '08:00', '13:00', 5.00, 'Presencial', 'Capacitación', 'Programada', 'Mantenimiento Productivo Total (TPM) en líneas de envasado.'),
        (9, 3, '2026-09-21', '14:00', '17:00', 3.00, 'Virtual', 'Consultoría', 'Programada', 'Optimización de tiempos de espera y atención en agencias.'),
        (2, 1, '2026-09-22', '08:30', '15:00', 6.50, 'Presencial', 'Auditoría', 'Programada', 'Auditoría de Cumplimiento Ambiental y Gestión de Residuos.'),
        (7, 2, '2026-09-22', '09:00', '12:00', 3.00, 'Virtual', 'Consultoría', 'Programada', 'Análisis de Causa Raíz (RCA) para desviaciones de calidad.'),
        (3, 4, '2026-09-23', '09:00', '12:00', 3.00, 'Virtual', 'Capacitación', 'Programada', 'Seminario de Finanzas y Costos Operativos para Jefaturas.'),
        (10, 5, '2026-09-23', '14:00', '17:30', 3.50, 'Presencial', 'Normas', 'Programada', 'Manejo Seguro de Montacargas y Equipos de Tracción.'),
        (8, 1, '2026-09-24', '08:30', '12:30', 4.00, 'Presencial', 'Capacitación', 'Programada', 'Liderazgo de Cuadrillas y Comunicación Efectiva en Obra.'),
        (4, 2, '2026-09-24', '14:00', '16:00', 2.00, 'Virtual', 'Requerimientos Legales', 'Programada', 'Seguimiento a acciones correctivas de bioseguridad hospitalaria.'),
        (5, 3, '2026-09-25', '09:00', '13:00', 4.00, 'Presencial', 'Capacitación', 'Programada', 'Evaluación y Certificación de Competencias Laborales.'),
        (6, 4, '2026-09-25', '14:00', '17:00', 3.00, 'Virtual', 'Consultoría', 'Programada', 'Revisión del Manual de Bienestar Laboral y Clima Organizacional.'),
        (7, 5, '2026-09-28', '08:30', '12:30', 4.00, 'Presencial', 'Auditoría', 'Programada', 'Pre-auditoría de Certificación BPM ante autoridad sanitaria.'),
        (1, 1, '2026-09-28', '14:00', '16:30', 2.50, 'Virtual', 'Normas', 'Programada', 'Reunión de Cierre Mensual y revisión de KPIs del Modelo AD-RE-11.'),
        (2, 4, '2026-09-29', '09:00', '12:00', 3.00, 'Virtual', 'Normas', 'Programada', 'Ergonomía en el Puesto de Trabajo y Prevención de Lesiones.'),
        (9, 2, '2026-09-29', '13:30', '16:30', 3.00, 'Virtual', 'Consultoría', 'Programada', 'Asesoría en Plan de Continuidad de Negocio (BCP).'),
        (3, 5, '2026-09-30', '08:00', '12:00', 4.00, 'Presencial', 'Auditoría', 'Programada', 'Presentación de Resultados Finales de Auditoría de Cierre Trimestral.'),
        (10, 3, '2026-09-30', '13:00', '16:00', 3.00, 'Presencial', 'Normas', 'Programada', 'Sesión ejecutiva de balance de horas y satisfacción de capacitaciones.');

        CREATE TABLE IF NOT EXISTS auditoria_citas (
          id SERIAL PRIMARY KEY,
          cita_id INT NOT NULL,
          accion VARCHAR(50) NOT NULL,
          usuario VARCHAR(100) NOT NULL DEFAULT 'Administrador',
          detalles JSONB,
          ip_origen VARCHAR(45),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_auditoria_cita_id ON auditoria_citas(cita_id);
        CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria_citas(created_at);
      `);
      console.log('🌱 [DB] Tablas y datos semilla creados exitosamente en PostgreSQL.');
    }
  } catch (initErr) {
    console.warn('⚠️ [DB] Aviso en auto-inicialización de tablas:', initErr.message);
  }
}

let initPromise = null;

async function testConnection() {
  await ensureDatabaseExists();
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log('✅ [DB] Conectado exitosamente a PostgreSQL:', res.rows[0].now);
    await autoInitTables(client);
    client.release();
    isPostgresConnected = true;
    return true;
  } catch (err) {
    isPostgresConnected = false;
    console.warn('⚠️ [DB] PostgreSQL no disponible localmente (' + err.message + ').');
    console.warn('ℹ️ [DB] Activando motor de datos en memoria local con datos de seed para continuidad operativa.');
    return false;
  }
}

function ensureConnected() {
  if (!initPromise) {
    initPromise = testConnection();
  }
  return initPromise;
}

ensureConnected();

async function registrarAuditoria({ cita_id, accion, usuario = 'Administrador', detalles = null, ip_origen = null }) {
  const timestamp = new Date();
  if (isPostgresConnected) {
    try {
      const res = await pool.query(
        `INSERT INTO auditoria_citas (cita_id, accion, usuario, detalles, ip_origen, created_at)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          Number(cita_id),
          accion,
          usuario,
          detalles ? JSON.stringify(detalles) : null,
          ip_origen || null,
          timestamp
        ]
      );
      return res.rows[0];
    } catch (err) {
      console.error('⚠️ [Auditoría] Error al insertar en PostgreSQL:', err.message);
    }
  }

  // Respaldo en mockStore
  const newAudit = {
    id: (mockStore.nextIds.auditoria_citas = (mockStore.nextIds.auditoria_citas || mockStore.auditoria_citas.length + 1) + 1),
    cita_id: Number(cita_id),
    accion,
    usuario,
    detalles: typeof detalles === 'object' && detalles !== null ? detalles : null,
    ip_origen: ip_origen || null,
    created_at: timestamp
  };
  mockStore.auditoria_citas.push(newAudit);
  return newAudit;
}

async function obtenerAuditoriaPorCita(cita_id) {
  if (isPostgresConnected) {
    try {
      const res = await pool.query(
        `SELECT * FROM auditoria_citas WHERE cita_id = $1 ORDER BY created_at DESC`,
        [Number(cita_id)]
      );
      return res.rows.map(row => ({
        ...row,
        detalles: typeof row.detalles === 'string' ? JSON.parse(row.detalles) : row.detalles
      }));
    } catch (err) {
      console.error('⚠️ [Auditoría] Error al consultar en PostgreSQL:', err.message);
    }
  }

  return mockStore.auditoria_citas
    .filter(a => Number(a.cita_id) === Number(cita_id))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

module.exports = {
  pool,
  ensureConnected,
  isPostgresConnected: () => isPostgresConnected,
  mockStore,
  registrarAuditoria,
  obtenerAuditoriaPorCita,
  query: async (text, params) => {
    if (isPostgresConnected) {
      return pool.query(text, params);
    }
    throw new Error('PostgreSQL not connected');
  }
};
