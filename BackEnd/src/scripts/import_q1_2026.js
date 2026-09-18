const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const CAPACITADORES = [
  { nombre_completo: 'Oscar Quan', iniciales: 'OQ', color: '#2563EB', tarifa_hora: 200.00 },
  { nombre_completo: 'Mariana Orellana', iniciales: 'MO', color: '#DB2777', tarifa_hora: 175.00 },
  { nombre_completo: 'Jaime Avalos', iniciales: 'JA', color: '#059669', tarifa_hora: 150.00 },
  { nombre_completo: 'Luis Teo', iniciales: 'LT', color: '#D97706', tarifa_hora: 175.00 },
  { nombre_completo: 'Byron Jerez', iniciales: 'BJ', color: '#DC2626', tarifa_hora: 175.00 },
  { nombre_completo: 'Pedro Fuentes', iniciales: 'PF', color: '#0D9488', tarifa_hora: 175.00 },
  { nombre_completo: 'Zoila Galvez', iniciales: 'ZG', color: '#7C3AED', tarifa_hora: 150.00 },
  { nombre_completo: 'Josue Bautista', iniciales: 'JB', color: '#4F46E5', tarifa_hora: 150.00 }
];

const CLIENTES = [
  { nombre_empresa: 'Labymed S.A.', contacto: 'Coordinación Labymed' },
  { nombre_empresa: 'Daco Heavy S.A.', contacto: 'Operaciones Daco' },
  { nombre_empresa: 'Fábrica La Popular S.A.', contacto: 'Gestión Calidad' },
  { nombre_empresa: 'Industrias Licoreras de Guatemala', contacto: 'Recursos Humanos' },
  { nombre_empresa: 'Forza Delivery S.A.', contacto: 'Logística Forza' },
  { nombre_empresa: 'Grupo Enlace S.A.', contacto: 'Dirección Enlace' },
  { nombre_empresa: 'Semillas del Campo S.A.', contacto: 'Producción Semillas' },
  { nombre_empresa: 'Soluservi S.A.', contacto: 'Administración Soluservi' },
  { nombre_empresa: 'Conecta S.A.', contacto: 'Capacitación Conecta' },
  { nombre_empresa: 'INTECAP', contacto: 'Coordinación Diplomados' },
  { nombre_empresa: 'Acefos S.A.', contacto: 'Gerencia Acefos' },
  { nombre_empresa: 'Colombina S.A.', contacto: 'Planta Colombina' },
  { nombre_empresa: 'One Consulting (Auditoría Interna)', contacto: 'Dirección de Calidad' },
  { nombre_empresa: 'Corporación Financiera del Valle', contacto: 'Gerencia de Riesgos' },
  { nombre_empresa: 'Ministerio de la Defensa', contacto: 'Oficial de Enlace' },
  { nombre_empresa: 'Ingenio Madre Tierra S.A.', contacto: 'Supervisión FSC' },
  { nombre_empresa: 'Calacó S.A.', contacto: 'Dirección Calacó' },
  { nombre_empresa: 'Agricenter S.A.', contacto: 'Capacitación Agricenter' },
  { nombre_empresa: 'Ética Empresarial', contacto: 'Comité de Ética' },
  { nombre_empresa: 'Seguimiento de Proyectos One', contacto: 'Dirección One Consulting' }
];

// Citas Reales Enero, Febrero y Marzo 2026 de One Consulting
const CITAS = [
  // ==========================================
  // ENERO 2026 (OFICIAL AD-RE-11 - 32 CITAS)
  // ==========================================
  {
    cliente: "Labymed S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-07',
    hora_inicio: '13:00',
    hora_fin: '17:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "LABYMED ASESORIA PRESENCIAL 13 A 17"
  },
  {
    cliente: "Daco Heavy S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-08',
    hora_inicio: '07:00',
    hora_fin: '11:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "DACOHEAVY ASESORIA PRESENCIAL 7 A 11"
  },
  {
    cliente: "Fábrica La Popular S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-09',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "LA POPULAR CURSO VIRTUAL 8 A 12"
  },
  {
    cliente: "Industrias Licoreras de Guatemala",
    capacitador: 'OQ',
    fecha: '2026-01-12',
    hora_inicio: '08:30',
    hora_fin: '09:00',
    horas: 0.50,
    modalidad: 'Virtual',
    tipo_servicio: 'Normas',
    estado: 'Impartida',
    observaciones: "LICORERA REUNIÓN VIRTUAL 8:30 A 9"
  },
  {
    cliente: "Forza Delivery S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-12',
    hora_inicio: '09:00',
    hora_fin: '12:00',
    horas: 3.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "FORZA ASESORIA PRESENCIAL 9 A 12"
  },
  {
    cliente: "Labymed S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-12',
    hora_inicio: '13:00',
    hora_fin: '17:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "LABYMED ASESORIA PRESENCIAL 13 A 17"
  },
  {
    cliente: "Labymed S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-13',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "LABYMED CURSO PRESENCIAL 8 a 12"
  },
  {
    cliente: "Daco Heavy S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-14',
    hora_inicio: '07:00',
    hora_fin: '11:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "DACOHEAVY ASESORIA PRESENCIAL 7 A 11"
  },
  {
    cliente: "Grupo Enlace S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-15',
    hora_inicio: '08:00',
    hora_fin: '09:00',
    horas: 1.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Normas',
    estado: 'Impartida',
    observaciones: "REUNIÓN ENLACE PRESENCIAL 8 A 9"
  },
  {
    cliente: "Fábrica La Popular S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-16',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "LA POPULAR CURSO VIRTUAL 8 A 12"
  },
  {
    cliente: "Labymed S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-19',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "LABYMED ASESORIA PRESENCIAL 8 A 12"
  },
  {
    cliente: "Labymed S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-20',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "LABYMED CURSO PRESENCIAL 8 a 12"
  },
  {
    cliente: "Daco Heavy S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-21',
    hora_inicio: '07:00',
    hora_fin: '11:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "DACOHEAVY ASESORIA PRESENCIAL 7 A 11"
  },
  {
    cliente: "Soluservi S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-21',
    hora_inicio: '14:00',
    hora_fin: '17:00',
    horas: 3.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "SOLUSERSA ASESORIA PRESENCIAL 14 A 17"
  },
  {
    cliente: "Forza Delivery S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-22',
    hora_inicio: '09:00',
    hora_fin: '12:00',
    horas: 3.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "FORZA ASESORIA PRESENCIAL 9 A 12"
  },
  {
    cliente: "Semillas del Campo S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-22',
    hora_inicio: '14:00',
    hora_fin: '16:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "SEMILLAS CURSO VIRTUAL 14 A 16"
  },
  {
    cliente: "Fábrica La Popular S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-23',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "LA POPULAR CURSO VIRTUAL 8 A 12"
  },
  {
    cliente: "Semillas del Campo S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-23',
    hora_inicio: '14:00',
    hora_fin: '16:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "SEMILLAS CURSO VIRTUAL 14 A 16"
  },
  {
    cliente: "Forza Delivery S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-26',
    hora_inicio: '09:00',
    hora_fin: '12:00',
    horas: 3.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "FORZA ASESORIA PRESENCIAL 9 A 12"
  },
  {
    cliente: "Labymed S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-26',
    hora_inicio: '13:00',
    hora_fin: '17:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "LABYMED ASESORIA PRESENCIAL 13 A 17"
  },
  {
    cliente: "Corporación Etisa, S.A",
    capacitador: 'OQ',
    fecha: '2026-01-27',
    hora_inicio: '10:00',
    hora_fin: '12:00',
    horas: 2.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Normas',
    estado: 'Impartida',
    observaciones: "REUNIÓN ETISA PRESENCIAL 10 a 12"
  },
  {
    cliente: "Soluservi S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-27',
    hora_inicio: '14:00',
    hora_fin: '17:00',
    horas: 3.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "SOLUSERSA ASESORIA PRESENCIAL 14 A 17"
  },
  {
    cliente: "Labymed S.A.",
    capacitador: 'BJ',
    fecha: '2026-01-27',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "LABYMED CURSO PRESENCIAL 8 a 12"
  },
  {
    cliente: "Daco Heavy S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-28',
    hora_inicio: '07:00',
    hora_fin: '11:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "DACOHEAVY ASESORIA PRESENCIAL 7 A 11"
  },
  {
    cliente: "Semillas del Campo S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-28',
    hora_inicio: '14:00',
    hora_fin: '16:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "SEMILLAS CURSO VIRTUAL 14 A 16"
  },
  {
    cliente: "One Consulting (Auditoría Interna)",
    capacitador: 'OQ',
    fecha: '2026-01-28',
    hora_inicio: '17:00',
    hora_fin: '18:00',
    horas: 1.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Normas',
    estado: 'Impartida',
    observaciones: "ONE REUNIÓN VIRTUAL 17 A 18"
  },
  {
    cliente: "One Consulting (Auditoría Interna)",
    capacitador: 'OQ',
    fecha: '2026-01-29',
    hora_inicio: '07:00',
    hora_fin: '07:30',
    horas: 0.50,
    modalidad: 'Presencial',
    tipo_servicio: 'Normas',
    estado: 'Impartida',
    observaciones: "MISA ANIVERSARIO ONE 7:00 A 7:30 am TIVOLI 16 años TODOS"
  },
  {
    cliente: "Forza Delivery S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-29',
    hora_inicio: '09:00',
    hora_fin: '12:00',
    horas: 3.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "FORZA ASESORIA PRESENCIAL 9 A 12"
  },
  {
    cliente: "Semillas del Campo S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-29',
    hora_inicio: '14:00',
    hora_fin: '16:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "SEMILLAS CURSO VIRTUAL 14 A 16"
  },
  {
    cliente: "One Consulting (Auditoría Interna)",
    capacitador: 'OQ',
    fecha: '2026-01-29',
    hora_inicio: '13:00',
    hora_fin: '17:00',
    horas: 4.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Auditoría',
    estado: 'Impartida',
    observaciones: "AUDITORIA INTERNA VIRTUAL TODOS 13 A 17 OQ SR"
  },
  {
    cliente: "Fábrica La Popular S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-30',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "LA POPULAR CURSO VIRTUAL 8 A 12"
  },
  {
    cliente: "Semillas del Campo S.A.",
    capacitador: 'OQ',
    fecha: '2026-01-30',
    hora_inicio: '14:00',
    hora_fin: '16:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "SEMILLAS CURSO VIRTUAL 14 A 16"
  },
  // ==========================================
  // FEBRERO 2026 (OFICIAL AD-RE-11 - 39 CITAS)
  // ==========================================
  {
    cliente: "LABYMED",
    capacitador: 'OQ',
    fecha: '2026-02-02',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "LABYMED ASESORIA PRESENCIAL 8 A 12"
  },
  {
    cliente: "LABYMED",
    capacitador: 'OQ',
    fecha: '2026-02-03',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "LABYMED CURSO PRESENCIAL 8 a 12"
  },
  {
    cliente: "DACOHEAVY",
    capacitador: 'OQ',
    fecha: '2026-02-04',
    hora_inicio: '07:00',
    hora_fin: '11:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "DACOHEAVY ASESORIA PRESENCIAL 7 A 11"
  },
  {
    cliente: "COLOMBINA",
    capacitador: 'OQ',
    fecha: '2026-02-05',
    hora_inicio: '07:00',
    hora_fin: '16:00',
    horas: 8.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "COLOMBINA CURSOS PRESENCIAL 7 A 16"
  },
  {
    cliente: "COLOMBINA",
    capacitador: 'OQ',
    fecha: '2026-02-06',
    hora_inicio: '07:00',
    hora_fin: '16:00',
    horas: 8.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "COLOMBINA CURSOS PRESENCIAL 7 A 16"
  },
  {
    cliente: "CONECTA",
    capacitador: 'OQ',
    fecha: '2026-02-02',
    hora_inicio: '14:00',
    hora_fin: '15:30',
    horas: 1.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "CONECTA CURSO VIRTUAL 14 A 15:30"
  },
  {
    cliente: "CONECTA",
    capacitador: 'OQ',
    fecha: '2026-02-03',
    hora_inicio: '14:00',
    hora_fin: '15:30',
    horas: 1.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "CONECTA CURSO VIRTUAL 14 A 15:30"
  },
  {
    cliente: "ONE CONSULTING",
    capacitador: 'OQ',
    fecha: '2026-02-04',
    hora_inicio: '12:00',
    hora_fin: '19:00',
    horas: 7.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Normas',
    estado: 'Impartida',
    observaciones: "REVISIÓN POR LA DIRECCIÓN VIRTUAL 12 A 19"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-02-02',
    hora_inicio: '19:00',
    hora_fin: '21:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP INTECAP INT 9001 VIRTUAL 19 A 21"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-02-04',
    hora_inicio: '19:00',
    hora_fin: '21:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP INTECAP INT 9001 VIRTUAL 19 A 21"
  },
  {
    cliente: "ACEROS DE GUATEMALA, S.A.",
    capacitador: 'JA',
    fecha: '2026-02-03',
    hora_inicio: '07:00',
    hora_fin: '16:00',
    horas: 8.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "ACEROS G CURSO PRESENCIAL 7 A 16"
  },
  {
    cliente: "ONE CONSULTING",
    capacitador: 'OQ',
    fecha: '2026-02-09',
    hora_inicio: '08:00',
    hora_fin: '17:00',
    horas: 9.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Auditoría',
    estado: 'Impartida',
    observaciones: "AUDITORÍA VIRTUAL ONE ENTE CERTIFICADOR ICONTEC 8 a 17 TODOS"
  },
  {
    cliente: "LABYMED",
    capacitador: 'OQ',
    fecha: '2026-02-10',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "LABYMED CURSO PRESENCIAL 8 a 12"
  },
  {
    cliente: "FORZA",
    capacitador: 'OQ',
    fecha: '2026-02-12',
    hora_inicio: '09:00',
    hora_fin: '12:00',
    horas: 3.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "FORZA ASESORIA PRESENCIAL 9 A 12"
  },
  {
    cliente: "COLOMBINA",
    capacitador: 'OQ',
    fecha: '2026-02-13',
    hora_inicio: '07:00',
    hora_fin: '16:00',
    horas: 8.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "COLOMBINA CURSOS PRESENCIAL 7 A 16"
  },
  {
    cliente: "LABYMED",
    capacitador: 'OQ',
    fecha: '2026-02-11',
    hora_inicio: '13:00',
    hora_fin: '17:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "LABYMED ASESORIA PRESENCIAL 13 A 17"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-02-11',
    hora_inicio: '19:00',
    hora_fin: '21:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP INTECAP AUD 9001 VIRTUAL 19 A 21"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-02-09',
    hora_inicio: '19:00',
    hora_fin: '21:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP INTECAP AUD 9001 VIRTUAL 19 A 21"
  },
  {
    cliente: "SOLUSERSA",
    capacitador: 'OQ',
    fecha: '2026-02-16',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "SOLUSERSA ASESORIA PRESENCIAL 8 A 12"
  },
  {
    cliente: "LABYMED",
    capacitador: 'OQ',
    fecha: '2026-02-17',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "LABYMED ASESORIA PRESENCIAL 8 A 12"
  },
  {
    cliente: "LABYMED",
    capacitador: 'OQ',
    fecha: '2026-02-18',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "LABYMED CURSO PRESENCIAL 8 a 12"
  },
  {
    cliente: "SOLUSERSA",
    capacitador: 'OQ',
    fecha: '2026-02-19',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "SOLUSERSA ASESORIA PRESENCIAL                8 A 12"
  },
  {
    cliente: "ONE CONSULTING",
    capacitador: 'OQ',
    fecha: '2026-02-20',
    hora_inicio: '08:00',
    hora_fin: '11:00',
    horas: 3.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Normas',
    estado: 'Impartida',
    observaciones: "REUNIÓN INDICADORES 8 A 11"
  },
  {
    cliente: "UNIVERSIDAD DEL VALLE",
    capacitador: 'OQ',
    fecha: '2026-02-16',
    hora_inicio: '16:30',
    hora_fin: '17:00',
    horas: 4.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Normas',
    estado: 'Impartida',
    observaciones: "DEL VALLE REUNIÓN VIRTUAL 16:30 A 17"
  },
  {
    cliente: "LABYMED",
    capacitador: 'OQ',
    fecha: '2026-02-18',
    hora_inicio: '13:00',
    hora_fin: '17:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "LABYMED ASESORIA PRESENCIAL 13 A 17"
  },
  {
    cliente: "SOLUSERSA",
    capacitador: 'OQ',
    fecha: '2026-02-20',
    hora_inicio: '11:00',
    hora_fin: '13:00',
    horas: 3.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "SOLUSERSA ASESORIA VIRTUAL 11 A 13"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-02-16',
    hora_inicio: '19:00',
    hora_fin: '21:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP INTECAP AUD 9001 VIRTUAL 19 A 21"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-02-18',
    hora_inicio: '19:00',
    hora_fin: '21:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP INTECAP AUD 9001 VIRTUAL 19 A 21"
  },
  {
    cliente: "MINISTERIO DE LA DEFENSA",
    capacitador: 'OQ',
    fecha: '2026-02-19',
    hora_inicio: '14:00',
    hora_fin: '15:00',
    horas: 1.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "MINISTERIO DEFENSA PRESENCIAL 14 A 15"
  },
  {
    cliente: "FORZA",
    capacitador: 'BJ',
    fecha: '2026-02-19',
    hora_inicio: '09:00',
    hora_fin: '10:00',
    horas: 1.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "FORZA ASESORIA PRESENCIAL 9 A 10"
  },
  {
    cliente: "MADRE TIERRA",
    capacitador: 'OQ',
    fecha: '2026-02-23',
    hora_inicio: '07:00',
    hora_fin: '16:00',
    horas: 8.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Auditoría',
    estado: 'Impartida',
    observaciones: "MADRE TIERRA FSSC AUDITORIA PRESENCIAL 7 A 16"
  },
  {
    cliente: "MADRE TIERRA",
    capacitador: 'OQ',
    fecha: '2026-02-24',
    hora_inicio: '07:00',
    hora_fin: '16:00',
    horas: 8.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Auditoría',
    estado: 'Impartida',
    observaciones: "MADRE TIERRA FSSC AUDITORIA PRESENCIAL 7 A 16"
  },
  {
    cliente: "MADRE TIERRA",
    capacitador: 'OQ',
    fecha: '2026-02-25',
    hora_inicio: '07:00',
    hora_fin: '16:00',
    horas: 8.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Auditoría',
    estado: 'Impartida',
    observaciones: "MADRE TIERRA FSSC AUDITORIA PRESENCIAL 7 A 16"
  },
  {
    cliente: "MADRE TIERRA",
    capacitador: 'OQ',
    fecha: '2026-02-26',
    hora_inicio: '07:00',
    hora_fin: '16:00',
    horas: 8.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Auditoría',
    estado: 'Impartida',
    observaciones: "MADRE TIERRA FSSC AUDITORIA PRESENCIAL 7 A 16"
  },
  {
    cliente: "MADRE TIERRA",
    capacitador: 'OQ',
    fecha: '2026-02-27',
    hora_inicio: '07:00',
    hora_fin: '16:00',
    horas: 8.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Auditoría',
    estado: 'Impartida',
    observaciones: "MADRE TIERRA FSSC AUDITORIA PRESENCIAL 7 A 16"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-02-23',
    hora_inicio: '19:00',
    hora_fin: '21:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP INTECAP AUD 9001 VIRTUAL 19 A 21"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-02-25',
    hora_inicio: '19:00',
    hora_fin: '21:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP INTECAP AUD 9001 VIRTUAL 19 A 21"
  },
  {
    cliente: "COLOMBINA",
    capacitador: 'MO',
    fecha: '2026-02-27',
    hora_inicio: '07:00',
    hora_fin: '16:00',
    horas: 8.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "COLOMBINA CURSOS PRESENCIAL 7 A 16"
  },
  {
    cliente: "ACEROS DE GUATEMALA, S.A.",
    capacitador: 'JA',
    fecha: '2026-02-24',
    hora_inicio: '07:00',
    hora_fin: '16:00',
    horas: 8.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "ACEROS G CURSO PRESENCIAL 7 A 16"
  },
  // ==========================================
  // MARZO 2026 (OFICIAL AD-RE-11 - 45 CITAS)
  // ==========================================
  {
    cliente: "LABYMED",
    capacitador: 'OQ',
    fecha: '2026-03-02',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "LABYMED ASESORIA PRESENCIAL 8 A 12"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-03-02',
    hora_inicio: '19:00',
    hora_fin: '21:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP INTECAP INT 9001 VIRTUAL 19 A 21"
  },
  {
    cliente: "FORZA",
    capacitador: 'OQ',
    fecha: '2026-03-03',
    hora_inicio: '09:00',
    hora_fin: '13:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "FORZA ASESORIA PRESENCIAL 9 A 13"
  },
  {
    cliente: "LA POPULAR",
    capacitador: 'OQ',
    fecha: '2026-03-03',
    hora_inicio: '14:00',
    hora_fin: '17:00',
    horas: 4.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "LA POPULAR CURSO VIRTUAL 14 A 17"
  },
  {
    cliente: "LICORERA",
    capacitador: 'OQ',
    fecha: '2026-03-04',
    hora_inicio: '13:00',
    hora_fin: '17:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "LICORERA ASESORIA PRESENCIAL 13 A 17"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-03-04',
    hora_inicio: '19:00',
    hora_fin: '21:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP INTECAP INT 9001 VIRTUAL 19 A 21"
  },
  {
    cliente: "COLOMBINA",
    capacitador: 'OQ',
    fecha: '2026-03-05',
    hora_inicio: '07:00',
    hora_fin: '16:00',
    horas: 8.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "COLOMBINA CURSOS PRESENCIAL 7 A 16"
  },
  {
    cliente: "COLOMBINA",
    capacitador: 'OQ',
    fecha: '2026-03-06',
    hora_inicio: '07:00',
    hora_fin: '16:00',
    horas: 8.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "COLOMBINA CURSOS PRESENCIAL 7 A 16"
  },
  {
    cliente: "FORZA",
    capacitador: 'OQ',
    fecha: '2026-03-09',
    hora_inicio: '09:00',
    hora_fin: '13:00',
    horas: 4.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "FORZA ASESORIA VIRTUAL 9 A 13"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-03-09',
    hora_inicio: '19:00',
    hora_fin: '21:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP INTECAP INT 9001 VIRTUAL 19 A 21"
  },
  {
    cliente: "LABYMED",
    capacitador: 'OQ',
    fecha: '2026-03-10',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "LABYMED ASESORIA PRESENCIAL 8 A 12"
  },
  {
    cliente: "LA POPULAR",
    capacitador: 'OQ',
    fecha: '2026-03-10',
    hora_inicio: '14:00',
    hora_fin: '17:00',
    horas: 4.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "LA POPULAR CURSO VIRTUAL 14 A 17"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-03-10',
    hora_inicio: '18:00',
    hora_fin: '21:00',
    horas: 3.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP 2 INTECAP INT 9001 VIRTUAL 18 A 21"
  },
  {
    cliente: "DACOHEAVY",
    capacitador: 'OQ',
    fecha: '2026-03-11',
    hora_inicio: '07:00',
    hora_fin: '11:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "DACOHEAVY ASESORIA PRESENCIAL 7 A 11"
  },
  {
    cliente: "LICORERA",
    capacitador: 'OQ',
    fecha: '2026-03-11',
    hora_inicio: '13:00',
    hora_fin: '17:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "LICORERA ASESORIA PRESENCIAL 13 A 17"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-03-11',
    hora_inicio: '19:00',
    hora_fin: '21:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP INTECAP INT 9001 VIRTUAL 19 A 21"
  },
  {
    cliente: "LA POPULAR",
    capacitador: 'OQ',
    fecha: '2026-03-12',
    hora_inicio: '14:00',
    hora_fin: '17:00',
    horas: 4.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "LA POPULAR CURSO VIRTUAL 14 A 17"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-03-12',
    hora_inicio: '18:00',
    hora_fin: '21:00',
    horas: 3.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP 2 INTECAP INT 9001 VIRTUAL 18 A 21"
  },
  {
    cliente: "COLOMBINA",
    capacitador: 'OQ',
    fecha: '2026-03-13',
    hora_inicio: '07:00',
    hora_fin: '16:00',
    horas: 8.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "COLOMBINA CURSOS PRESENCIAL 7 A 16"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-03-13',
    hora_inicio: '18:00',
    hora_fin: '21:00',
    horas: 3.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP 2 INTECAP INT 9001 VIRTUAL 18 A 21"
  },
  {
    cliente: "LICORERA",
    capacitador: 'OQ',
    fecha: '2026-03-16',
    hora_inicio: '14:00',
    hora_fin: '17:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "LICORERA ASESORIA PRESENCIAL 14 A 17"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-03-16',
    hora_inicio: '19:00',
    hora_fin: '21:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP INTECAP INT 9001 VIRTUAL 19 A 21"
  },
  {
    cliente: "LABYMED",
    capacitador: 'OQ',
    fecha: '2026-03-17',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "LABYMED ASESORIA PRESENCIAL 8 A 12"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-03-17',
    hora_inicio: '18:00',
    hora_fin: '21:00',
    horas: 3.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP 2 INTECAP INT 9001 VIRTUAL 18 A 21"
  },
  {
    cliente: "DACOHEAVY",
    capacitador: 'OQ',
    fecha: '2026-03-18',
    hora_inicio: '07:00',
    hora_fin: '11:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "DACOHEAVY ASESORIA PRESENCIAL 7 A 11"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-03-18',
    hora_inicio: '19:00',
    hora_fin: '21:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP INTECAP INT 9001 VIRTUAL 19 A 21"
  },
  {
    cliente: "FORZA",
    capacitador: 'OQ',
    fecha: '2026-03-19',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "FORZA ASESORIA PRESENCIAL 8 A 12"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-03-19',
    hora_inicio: '18:00',
    hora_fin: '21:00',
    horas: 3.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP 2 INTECAP INT 9001 VIRTUAL 18 A 21"
  },
  {
    cliente: "UNIVERSIDAD DEL VALLE",
    capacitador: 'OQ',
    fecha: '2026-03-20',
    hora_inicio: '08:00',
    hora_fin: '10:00',
    horas: 3.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DEL VALLE PRESENCIAL 8 A 10"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-03-20',
    hora_inicio: '18:00',
    hora_fin: '21:00',
    horas: 3.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP 2 INTECAP INT 9001 VIRTUAL 18 A 21"
  },
  {
    cliente: "LABYMED",
    capacitador: 'OQ',
    fecha: '2026-03-23',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "LABYMED ASESORIA PRESENCIAL 8 A 12"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-03-23',
    hora_inicio: '19:00',
    hora_fin: '21:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP INTECAP INT 9001 VIRTUAL 19 A 21"
  },
  {
    cliente: "ENLACE",
    capacitador: 'OQ',
    fecha: '2026-03-24',
    hora_inicio: '13:00',
    hora_fin: '17:00',
    horas: 4.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Normas',
    estado: 'Impartida',
    observaciones: "ENLACE REUNIÓN VIRTUAL 13 A 17"
  },
  {
    cliente: "LA POPULAR",
    capacitador: 'LT',
    fecha: '2026-03-24',
    hora_inicio: '14:00',
    hora_fin: '17:00',
    horas: 3.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "LA POPULAR CURSO VIRTUAL 14 A 17"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-03-24',
    hora_inicio: '18:00',
    hora_fin: '21:00',
    horas: 3.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP 2 INTECAP INT 9001 VIRTUAL 18 A 21"
  },
  {
    cliente: "DACOHEAVY",
    capacitador: 'OQ',
    fecha: '2026-03-25',
    hora_inicio: '07:00',
    hora_fin: '11:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "DACOHEAVY ASESORIA PRESENCIAL 7 A 11"
  },
  {
    cliente: "LICORERA",
    capacitador: 'OQ',
    fecha: '2026-03-25',
    hora_inicio: '13:00',
    hora_fin: '17:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "LICORERA ASESORIA PRESENCIAL 13 A 17"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-03-25',
    hora_inicio: '19:00',
    hora_fin: '21:00',
    horas: 2.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP INTECAP INT 9001 VIRTUAL 19 A 21"
  },
  {
    cliente: "FORZA",
    capacitador: 'OQ',
    fecha: '2026-03-26',
    hora_inicio: '09:00',
    hora_fin: '13:00',
    horas: 4.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Consultoría',
    estado: 'Impartida',
    observaciones: "FORZA ASESORIA PRESENCIAL 9 A 13"
  },
  {
    cliente: "LA POPULAR",
    capacitador: 'LT',
    fecha: '2026-03-26',
    hora_inicio: '14:00',
    hora_fin: '17:00',
    horas: 3.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "LA POPULAR CURSO VIRTUAL 14 A 17"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-03-26',
    hora_inicio: '18:00',
    hora_fin: '21:00',
    horas: 3.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP 2 INTECAP INT 9001 VIRTUAL 18 A 21"
  },
  {
    cliente: "COLOMBINA",
    capacitador: 'OQ',
    fecha: '2026-03-27',
    hora_inicio: '07:00',
    hora_fin: '16:00',
    horas: 8.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "COLOMBINA CURSOS PRESENCIAL 7 A 16"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-03-27',
    hora_inicio: '18:00',
    hora_fin: '21:00',
    horas: 3.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP 2 INTECAP INT 9001 VIRTUAL 18 A 21"
  },
  {
    cliente: "AGROCARNES",
    capacitador: 'OQ',
    fecha: '2026-03-30',
    hora_inicio: '08:00',
    hora_fin: '17:00',
    horas: 8.00,
    modalidad: 'Presencial',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "AGROCARNES CURSOS PRESENCIAL 8 A 17"
  },
  {
    cliente: "INTECAP",
    capacitador: 'OQ',
    fecha: '2026-03-31',
    hora_inicio: '18:00',
    hora_fin: '21:00',
    horas: 3.00,
    modalidad: 'Virtual',
    tipo_servicio: 'Capacitación',
    estado: 'Impartida',
    observaciones: "DIP 2 INTECAP INT 9001 VIRTUAL 18 A 21"
  }
];

async function run() {
  console.log('🚀 Iniciando importación de Enero, Febrero y Marzo 2026...');

  // 1. Asegurar capacitadores
  console.log('👥 Verificando catálogo de capacitadores...');
  for (const cap of CAPACITADORES) {
    await pool.query(`
      INSERT INTO capacitadores (nombre_completo, iniciales, color, tarifa_hora, activo)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (iniciales) DO UPDATE 
      SET nombre_completo = EXCLUDED.nombre_completo,
          tarifa_hora = EXCLUDED.tarifa_hora,
          activo = true
    `, [cap.nombre_completo, cap.iniciales, cap.color, cap.tarifa_hora]);
  }

  // 2. Asegurar clientes
  console.log('🏢 Verificando catálogo de clientes...');
  for (const cli of CLIENTES) {
    await pool.query(`
      INSERT INTO clientes (nombre_empresa, contacto, activo)
      VALUES ($1, $2, true)
      ON CONFLICT (nombre_empresa) DO NOTHING
    `, [cli.nombre_empresa, cli.contacto]);
  }

  // 3. Obtener mapas de IDs
  const capsRes = await pool.query('SELECT id, iniciales FROM capacitadores');
  const capMap = new Map();
  capsRes.rows.forEach(r => capMap.set(r.iniciales.toUpperCase().trim(), r.id));

  const cliRes = await pool.query('SELECT id, nombre_empresa FROM clientes');
  const cliMap = new Map();
  cliRes.rows.forEach(r => cliMap.set(r.nombre_empresa.trim(), r.id));

  // 4. Limpiar citas de ENE, FEB y MAR 2026 para evitar duplicados
  console.log('🧹 Limpiando registros previos de Enero, Febrero y Marzo 2026...');
  await pool.query(`
    DELETE FROM citas 
    WHERE (EXTRACT(YEAR FROM fecha) = 2026 AND EXTRACT(MONTH FROM fecha) IN (1, 2, 3))
  `);

  // 5. Insertar citas
  console.log(`📅 Insertando ${CITAS.length} citas reales de Enero, Febrero y Marzo 2026...`);
  let inserted = 0;
  for (const cita of CITAS) {
    const capId = capMap.get(cita.capacitador.toUpperCase().trim());
    const cliId = cliMap.get(cita.cliente.trim());

    if (!capId) {
      console.warn(`⚠️ Capacitador no encontrado: ${cita.capacitador}`);
      continue;
    }

    await pool.query(`
      INSERT INTO citas (
        cliente_id, cliente_nombre, capacitador_id, fecha, hora_inicio, hora_fin,
        horas, modalidad, tipo_servicio, estado, observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      cliId || null,
      cita.cliente,
      capId,
      cita.fecha,
      cita.hora_inicio,
      cita.hora_fin,
      cita.horas,
      cita.modalidad,
      cita.tipo_servicio,
      cita.estado || 'Impartida',
      cita.observaciones
    ]);
    inserted++;
  }

  console.log(`✅ ¡Éxito total! Se insertaron ${inserted} citas oficiales en PostgreSQL (Supabase).`);
  await pool.end();
}

run().catch(err => {
  console.error('❌ Error en la importación:', err);
  pool.end();
});
