-- ====================================================================
-- SISTEMA DE AGENDA CENTRALIZADA Y CONTROL DE HORAS (MODELO AD-RE-11)
-- SEED - Datos de Prueba Iniciales
-- ====================================================================

-- 1. Insertar Capacitadores con Iniciales, Colores Distintivos y Tarifas por Hora (Quetzales)
INSERT INTO capacitadores (nombre_completo, iniciales, color, tarifa_hora) VALUES
('Mariana Orellana', 'MO', '#2563EB', 175.00),     -- Azul Royal (Q 175.00/hr)
('Oscar Quan', 'OQ', '#7C3AED', 200.00),           -- Violeta / Púrpura (Q 200.00/hr)
('Pedro Fuentes', 'PF', '#059669', 175.00),        -- Esmeralda (Q 175.00/hr)
('Zoila Galvez', 'ZG', '#D97706', 150.00),         -- Ámbar / Naranja (Q 150.00/hr)
('Josue Bautista', 'JB', '#DC2626', 150.00)        -- Rojo Carmesí (Q 150.00/hr)
ON CONFLICT (iniciales) DO UPDATE SET tarifa_hora = EXCLUDED.tarifa_hora;

-- 2. Insertar Clientes / Empresas
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

-- 3. Insertar Citas (Septiembre 2026 - Control de Horas)
INSERT INTO citas (cliente_id, cliente_nombre, capacitador_id, fecha, hora_inicio, hora_fin, horas, modalidad, tipo_servicio, estado, observaciones) VALUES
(1, 'Industrias Alimentarias del Norte S.A.', 1, '2026-09-01', '08:30', '11:30', 3.00, 'Presencial', 'Curso', 'Impartida', 'Inducción de Seguridad Industrial para nuevos ingresos.'),
(6, 'Agropecuaria San Francisco S.A.', 2, '2026-09-01', '14:00', '16:30', 2.50, 'Virtual', 'Asesoría', 'Impartida', 'Revisión preliminar de protocolos de inocuidad agrícola.'),
(2, 'Manufacturas Globales S.A.', 4, '2026-09-02', '09:00', '13:00', 4.00, 'Virtual', 'Curso', 'Impartida', 'Taller de Liderazgo Estratégico y Trabajo en Equipo.'),
(7, 'Farmacéutica Panamericana S.A.', 3, '2026-09-02', '14:00', '17:00', 3.00, 'Presencial', 'Asesoría', 'Impartida', 'Validación de áreas limpias y bitácoras de temperatura.'),
(3, 'Distribuidora Logística Central', 5, '2026-09-03', '08:00', '14:00', 6.00, 'Presencial', 'Auditoría', 'Impartida', 'Auditoría ISO 9001 - Fase 1: Almacenes y distribución.'),
(8, 'Constructora e Inmobiliaria Metropolitana', 1, '2026-09-03', '09:30', '12:00', 2.50, 'Presencial', 'Curso', 'Impartida', 'Prevención de riesgos en trabajos de altura y uso de arnés.'),
(4, 'Servicios Médicos Especializados', 2, '2026-09-04', '09:00', '12:00', 3.00, 'Virtual', 'Asesoría', 'Impartida', 'Estandarización de procesos clínicos y consentimiento digital.'),
(9, 'Banco Regional del Sur', 4, '2026-09-04', '14:00', '16:30', 2.50, 'Virtual', 'Reunión', 'Impartida', 'Alineación de necesidades formativas de servicio al cliente.'),
(1, 'Industrias Alimentarias del Norte S.A.', 1, '2026-09-07', '08:00', '12:00', 4.00, 'Presencial', 'Curso', 'Impartida', 'Módulo 1: Buenas Prácticas de Manufactura en planta.'),
(2, 'Manufacturas Globales S.A.', 2, '2026-09-07', '09:00', '11:30', 2.50, 'Virtual', 'Asesoría', 'Impartida', 'Revisión documental del Sistema de Gestión de Calidad.'),
(10, 'Supermercados La Unión S.A.', 3, '2026-09-07', '14:00', '17:00', 3.00, 'Presencial', 'Asesoría', 'Impartida', 'Control de mermas y protocolos de higiene en perecederos.'),
(3, 'Distribuidora Logística Central', 3, '2026-09-08', '08:30', '14:30', 6.00, 'Presencial', 'Auditoría', 'Impartida', 'Auditoría interna de procesos en planta y transporte.'),
(9, 'Banco Regional del Sur', 5, '2026-09-08', '10:00', '12:30', 2.50, 'Virtual', 'Curso', 'Impartida', 'Ciberseguridad y prevención de phishing para ejecutivos.'),
(6, 'Agropecuaria San Francisco S.A.', 4, '2026-09-09', '08:30', '11:30', 3.00, 'Presencial', 'Curso', 'Impartida', 'Manejo seguro de químicos agrícolas y primeros auxilios.'),
(4, 'Servicios Médicos Especializados', 1, '2026-09-09', '14:00', '16:00', 2.00, 'Virtual', 'Reunión', 'Impartida', 'Reunión de coordinación con gerencia médica.'),
(5, 'Corporación Financiera del Valle', 2, '2026-09-09', '14:00', '16:00', 2.00, 'Virtual', 'Asesoría', 'En Curso', 'Sesión de análisis de riesgo crediticio y auditoría de carteras.'),
(7, 'Farmacéutica Panamericana S.A.', 3, '2026-09-09', '16:30', '18:30', 2.00, 'Virtual', 'Seguimiento', 'Programada', 'Revisión del plan de capacitación de fin de año.'),
(5, 'Corporación Financiera del Valle', 4, '2026-09-10', '08:00', '13:00', 5.00, 'Presencial', 'Curso', 'Programada', 'Capacitación en Seguridad Ocupacional y brigadas de evacuación.'),
(8, 'Constructora e Inmobiliaria Metropolitana', 5, '2026-09-10', '09:00', '12:00', 3.00, 'Presencial', 'Asesoría', 'Programada', 'Supervisión de protocolos de seguridad en obra gris.'),
(7, 'Farmacéutica Panamericana S.A.', 3, '2026-09-10', '14:00', '16:30', 2.50, 'Virtual', 'Seguimiento', 'Programada', 'Seguimiento a planes de acción correctiva de auditoría interna.'),
(10, 'Supermercados La Unión S.A.', 1, '2026-09-11', '08:30', '12:00', 3.50, 'Presencial', 'Curso', 'Programada', 'Atención de quejas y resolución de conflictos en punto de venta.'),
(1, 'Industrias Alimentarias del Norte S.A.', 2, '2026-09-11', '10:00', '12:00', 2.00, 'Virtual', 'Seguimiento', 'Programada', 'Seguimiento a planes de acción de HACCP.'),
(2, 'Manufacturas Globales S.A.', 5, '2026-09-11', '14:00', '17:00', 3.00, 'Presencial', 'Asesoría', 'Programada', 'Revisión de planos eléctricos y etiquetado LOTO.'),
(2, 'Manufacturas Globales S.A.', 5, '2026-09-14', '08:00', '16:00', 8.00, 'Presencial', 'Auditoría', 'Programada', 'Jornada completa de auditoría de calidad ISO 9001.'),
(6, 'Agropecuaria San Francisco S.A.', 1, '2026-09-14', '09:00', '12:30', 3.50, 'Presencial', 'Asesoría', 'Programada', 'Asesoría en Buenas Prácticas Agrícolas (BPA).'),
(3, 'Distribuidora Logística Central', 1, '2026-09-15', '09:00', '12:30', 3.50, 'Presencial', 'Asesoría', 'Programada', 'Asesoría en control estadístico de procesos de entrega.'),
(9, 'Banco Regional del Sur', 2, '2026-09-15', '14:00', '17:00', 3.00, 'Virtual', 'Curso', 'Programada', 'Taller de Cumplimiento Regulatorio y Prevención de Lavado de Dinero.'),
(7, 'Farmacéutica Panamericana S.A.', 3, '2026-09-16', '08:30', '12:30', 4.00, 'Presencial', 'Curso', 'Programada', 'Buenas Prácticas de Almacenamiento y Distribución (BPAD).'),
(4, 'Servicios Médicos Especializados', 3, '2026-09-16', '13:00', '17:00', 4.00, 'Virtual', 'Curso', 'Cancelada', 'Taller virtual de gestión por procesos (Reprogramado a solicitud de cliente).'),
(10, 'Supermercados La Unión S.A.', 4, '2026-09-16', '14:00', '16:30', 2.50, 'Presencial', 'Seguimiento', 'Programada', 'Revisión de implementación de metodología 5S en bodega central.'),
(5, 'Corporación Financiera del Valle', 3, '2026-09-17', '08:00', '12:00', 4.00, 'Presencial', 'Curso', 'Reprogramada', 'Capacitación en Manejo Defensivo y Seguridad de Flotilla.'),
(8, 'Constructora e Inmobiliaria Metropolitana', 5, '2026-09-17', '09:00', '13:00', 4.00, 'Presencial', 'Curso', 'Programada', 'Seguridad en Espacios Confinados y Excavaciones.'),
(1, 'Industrias Alimentarias del Norte S.A.', 1, '2026-09-17', '14:30', '17:00', 2.50, 'Virtual', 'Asesoría', 'Programada', 'Diseño de indicadores de desempeño para supervisores.'),
(5, 'Corporación Financiera del Valle', 2, '2026-09-18', '09:00', '11:00', 2.00, 'Virtual', 'Reunión', 'Programada', 'Cierre de ciclo de capacitación trimestral y entrega de notas.'),
(6, 'Agropecuaria San Francisco S.A.', 4, '2026-09-18', '13:30', '16:30', 3.00, 'Presencial', 'Curso', 'Programada', 'Comité de Salud y Seguridad Ocupacional: Funciones y responsabilidades.'),
(1, 'Industrias Alimentarias del Norte S.A.', 5, '2026-09-21', '08:00', '13:00', 5.00, 'Presencial', 'Curso', 'Programada', 'Mantenimiento Productivo Total (TPM) en líneas de envasado.'),
(9, 'Banco Regional del Sur', 3, '2026-09-21', '14:00', '17:00', 3.00, 'Virtual', 'Asesoría', 'Programada', 'Optimización de tiempos de espera y atención en agencias.'),
(2, 'Manufacturas Globales S.A.', 1, '2026-09-22', '08:30', '15:00', 6.50, 'Presencial', 'Auditoría', 'Programada', 'Auditoría de Cumplimiento Ambiental y Gestión de Residuos.'),
(7, 'Farmacéutica Panamericana S.A.', 2, '2026-09-22', '09:00', '12:00', 3.00, 'Virtual', 'Asesoría', 'Programada', 'Análisis de Causa Raíz (RCA) para desviaciones de calidad.'),
(3, 'Distribuidora Logística Central', 4, '2026-09-23', '09:00', '12:00', 3.00, 'Virtual', 'Curso', 'Programada', 'Seminario de Finanzas y Costos Operativos para Jefaturas.'),
(10, 'Supermercados La Unión S.A.', 5, '2026-09-23', '14:00', '17:30', 3.50, 'Presencial', 'Curso', 'Programada', 'Manejo Seguro de Montacargas y Equipos de Tracción.'),
(8, 'Constructora e Inmobiliaria Metropolitana', 1, '2026-09-24', '08:30', '12:30', 4.00, 'Presencial', 'Curso', 'Programada', 'Liderazgo de Cuadrillas y Comunicación Efectiva en Obra.'),
(4, 'Servicios Médicos Especializados', 2, '2026-09-24', '14:00', '16:00', 2.00, 'Virtual', 'Seguimiento', 'Programada', 'Seguimiento a acciones correctivas de bioseguridad hospitalaria.'),
(5, 'Corporación Financiera del Valle', 3, '2026-09-25', '09:00', '13:00', 4.00, 'Presencial', 'Curso', 'Programada', 'Evaluación y Certificación de Competencias Laborales.'),
(6, 'Agropecuaria San Francisco S.A.', 4, '2026-09-25', '14:00', '17:00', 3.00, 'Virtual', 'Asesoría', 'Programada', 'Revisión del Manual de Bienestar Laboral y Clima Organizacional.'),
(7, 'Farmacéutica Panamericana S.A.', 5, '2026-09-28', '08:30', '12:30', 4.00, 'Presencial', 'Auditoría', 'Programada', 'Pre-auditoría de Certificación BPM ante autoridad sanitaria.'),
(1, 'Industrias Alimentarias del Norte S.A.', 1, '2026-09-28', '14:00', '16:30', 2.50, 'Virtual', 'Reunión', 'Programada', 'Reunión de Cierre Mensual y revisión de KPIs del Modelo AD-RE-11.'),
(2, 'Manufacturas Globales S.A.', 4, '2026-09-29', '09:00', '12:00', 3.00, 'Virtual', 'Curso', 'Programada', 'Ergonomía en el Puesto de Trabajo y Prevención de Lesiones.'),
(9, 'Banco Regional del Sur', 2, '2026-09-29', '13:30', '16:30', 3.00, 'Virtual', 'Asesoría', 'Programada', 'Asesoría en Plan de Continuidad de Negocio (BCP).'),
(3, 'Distribuidora Logística Central', 5, '2026-09-30', '08:00', '12:00', 4.00, 'Presencial', 'Auditoría', 'Programada', 'Presentación de Resultados Finales de Auditoría de Cierre Trimestral.'),
(10, 'Supermercados La Unión S.A.', 3, '2026-09-30', '13:00', '16:00', 3.00, 'Presencial', 'Reunión', 'Programada', 'Sesión ejecutiva de balance de horas y satisfacción de capacitaciones.');
