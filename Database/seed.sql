-- ====================================================================
-- SISTEMA DE AGENDA CENTRALIZADA Y CONTROL DE HORAS (MODELO AD-RE-11)
-- SEED - Datos de Prueba Iniciales
-- ====================================================================

-- 1. Insertar Capacitadores con Iniciales y Colores Distintivos
INSERT INTO capacitadores (nombre_completo, iniciales, color) VALUES
('Mariana Orellana', 'MO', '#2563EB'),     -- Azul Royal
('Oscar Quan', 'OQ', '#7C3AED'),           -- Violeta / Púrpura
('Pedro Fuentes', 'PF', '#059669'),        -- Esmeralda
('Zoila Galvez', 'ZG', '#D97706'),         -- Ámbar / Naranja
('Josue Bautista', 'JB', '#DC2626')        -- Rojo Carmesí
ON CONFLICT (iniciales) DO NOTHING;

-- 2. Insertar Clientes / Empresas
INSERT INTO clientes (nombre_empresa, contacto, telefono, correo) VALUES
('Industrias Alimentarias del Norte S.A.', 'Ing. Roberto Silva', '+506 2234-5678', 'rsilva@alimnorte.com'),
('Manufacturas Globales S.A.', 'Lic. Mariana Soto', '+506 2289-9012', 'msoto@manuglobal.com'),
('Distribuidora Logística Central', 'Carlos Alvarado', '+506 2440-1122', 'calvarado@districentral.com'),
('Servicios Médicos Especializados', 'Dra. Andrea Morales', '+506 2520-3344', 'amorales@medicosesp.com'),
('Corporación Financiera del Valle', 'Rodrigo Jiménez', '+506 2201-5566', 'rjimenez@finanzascv.com')
ON CONFLICT (nombre_empresa) DO NOTHING;

-- 3. Insertar Citas (Septiembre 2026 - Control de Horas)
-- Nota: se asocian a capacitadores y clientes existentes con horarios coherentes
INSERT INTO citas (cliente_id, cliente_nombre, capacitador_id, fecha, hora_inicio, hora_fin, horas, modalidad, tipo_servicio, estado, observaciones) VALUES
(1, 'Industrias Alimentarias del Norte S.A.', 1, '2026-09-01', '08:30', '11:30', 3.00, 'Presencial', 'Curso', 'Impartida', 'Inducción de Seguridad Industrial para nuevos ingresos.'),
(2, 'Manufacturas Globales S.A.', 4, '2026-09-02', '09:00', '13:00', 4.00, 'Virtual', 'Curso', 'Impartida', 'Taller de Liderazgo Estratégico y Trabajo en Equipo.'),
(3, 'Distribuidora Logística Central', 5, '2026-09-03', '08:00', '14:00', 6.00, 'Presencial', 'Auditoría', 'Impartida', 'Auditoría ISO 9001 - Fase 1: Almacenes y distribución.'),
(4, 'Servicios Médicos Especializados', 2, '2026-09-04', '10:00', '13:30', 3.50, 'Virtual', 'Asesoría', 'Impartida', 'Gestión Documental y estandarización de procesos clínicos.'),
(1, 'Industrias Alimentarias del Norte S.A.', 1, '2026-09-07', '08:00', '12:00', 4.00, 'Presencial', 'Curso', 'Impartida', 'Módulo 1: Buenas Prácticas de Manufactura.'),
(2, 'Manufacturas Globales S.A.', 2, '2026-09-07', '09:00', '11:30', 2.50, 'Virtual', 'Asesoría', 'Impartida', 'Revisión documental del Sistema de Gestión.'),
(3, 'Distribuidora Logística Central', 3, '2026-09-08', '08:30', '14:30', 6.00, 'Presencial', 'Auditoría', 'Impartida', 'Auditoría interna de procesos en planta.'),
(4, 'Servicios Médicos Especializados', 1, '2026-09-09', '14:00', '16:00', 2.00, 'Virtual', 'Reunión', 'En Curso', 'Reunión de coordinación con gerencia.'),
(5, 'Corporación Financiera del Valle', 4, '2026-09-10', '08:00', '13:00', 5.00, 'Presencial', 'Curso', 'Programada', 'Capacitación en Seguridad Ocupacional.'),
(1, 'Industrias Alimentarias del Norte S.A.', 2, '2026-09-11', '10:00', '12:00', 2.00, 'Virtual', 'Seguimiento', 'Programada', 'Seguimiento a planes de acción correctiva.'),
(2, 'Manufacturas Globales S.A.', 5, '2026-09-14', '08:00', '16:00', 8.00, 'Presencial', 'Auditoría', 'Programada', 'Jornada completa de auditoría de calidad.'),
(3, 'Distribuidora Logística Central', 1, '2026-09-15', '09:00', '12:30', 3.50, 'Presencial', 'Asesoría', 'Programada', 'Asesoría en control estadístico de procesos.'),
(4, 'Servicios Médicos Especializados', 3, '2026-09-16', '13:00', '17:00', 4.00, 'Virtual', 'Curso', 'Cancelada', 'Taller virtual de gestión por procesos.'),
(5, 'Corporación Financiera del Valle', 3, '2026-09-17', '08:00', '12:00', 4.00, 'Presencial', 'Curso', 'Reprogramada', 'Capacitación en Manejo Defensivo y Flotilla.'),
(5, 'Corporación Financiera del Valle', 2, '2026-09-18', '09:00', '11:00', 2.00, 'Virtual', 'Reunión', 'Programada', 'Cierre de ciclo de capacitación trimestral.'),
(1, 'Industrias Alimentarias del Norte S.A.', 5, '2026-09-21', '08:00', '13:00', 5.00, 'Presencial', 'Curso', 'Programada', 'Mantenimiento Productivo Total (TPM) en líneas de envasado.'),
(2, 'Manufacturas Globales S.A.', 1, '2026-09-22', '08:30', '15:00', 6.50, 'Presencial', 'Auditoría', 'Programada', 'Auditoría de Cumplimiento Ambiental y Gestión de Residuos.'),
(3, 'Distribuidora Logística Central', 4, '2026-09-23', '09:00', '12:00', 3.00, 'Virtual', 'Curso', 'Programada', 'Seminario de Finanzas y Costos Logísticos.'),
(4, 'Servicios Médicos Especializados', 2, '2026-09-24', '14:00', '16:00', 2.00, 'Virtual', 'Seguimiento', 'Programada', 'Seguimiento a acciones correctivas de bioseguridad.'),
(5, 'Corporación Financiera del Valle', 3, '2026-09-25', '09:00', '13:00', 4.00, 'Presencial', 'Curso', 'Programada', 'Evaluación y Certificación de Competencias Laborales.'),
(1, 'Industrias Alimentarias del Norte S.A.', 1, '2026-09-28', '14:00', '16:30', 2.50, 'Virtual', 'Reunión', 'Programada', 'Reunión de Cierre Mensual y revisión de KPIs de capacitación.'),
(2, 'Manufacturas Globales S.A.', 4, '2026-09-29', '09:00', '12:00', 3.00, 'Virtual', 'Curso', 'Programada', 'Ergonomía en el Puesto de Trabajo y Prevención de Lesiones.'),
(3, 'Distribuidora Logística Central', 5, '2026-09-30', '08:00', '12:00', 4.00, 'Presencial', 'Auditoría', 'Programada', 'Presentación de Resultados Finales de Auditoría Modelo AD-RE-11.');
