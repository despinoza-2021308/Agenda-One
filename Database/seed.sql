-- ====================================================================
-- SISTEMA DE AGENDA CENTRALIZADA Y CONTROL DE HORAS (MODELO AD-RE-11)
-- SEED - Datos de Prueba Iniciales
-- ====================================================================

-- 1. Insertar Capacitadores con Iniciales y Colores Distintivos
INSERT INTO capacitadores (nombre_completo, iniciales, color) VALUES
('Mauricio Orozco', 'MO', '#2563EB'),     -- Azul Royal
('Olga Quintana', 'OQ', '#7C3AED'),       -- Violeta / Púrpura
('Pedro Fernández', 'PF', '#059669'),     -- Esmeralda
('Diana Vargas', 'DV', '#D97706'),        -- Ámbar / Naranja
('Carlos Mendoza', 'CM', '#DC2626')       -- Rojo Carmesí
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
-- Nota: se asocian a capacitadores y clientes existentes
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
