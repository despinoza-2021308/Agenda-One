-- ====================================================================
-- SISTEMA DE AGENDA CENTRALIZADA Y CONTROL DE HORAS (MODELO AD-RE-11)
-- DDL - Inicialización de Base de Datos (PostgreSQL)
-- ====================================================================

-- 1. Tabla de Capacitadores
CREATE TABLE IF NOT EXISTS capacitadores (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(120) NOT NULL,
    iniciales VARCHAR(5) NOT NULL UNIQUE,          -- Código de 2-3 letras: 'OQ', 'MO', 'PF'
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',    -- Color distintivo en formato HEX (ej: #3B82F6)
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre_empresa VARCHAR(150) NOT NULL UNIQUE,
    contacto VARCHAR(100),
    telefono VARCHAR(30),
    correo VARCHAR(100),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Citas (Control de Horas AD-RE-11)
CREATE TABLE IF NOT EXISTS citas (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    capacitador_id INT NOT NULL REFERENCES capacitadores(id) ON DELETE RESTRICT,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    horas NUMERIC(4, 2) NOT NULL CHECK (horas > 0), -- Campo numérico decimal H (ej: 4.00, 2.50)
    modalidad VARCHAR(20) NOT NULL CHECK (modalidad IN ('Presencial', 'Virtual', 'Híbrida')),
    tipo_servicio VARCHAR(30) NOT NULL CHECK (tipo_servicio IN ('Asesoría', 'Curso', 'Auditoría', 'Reunión', 'Seguimiento')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices optimizados para calendario y consultas mensuales
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_capacitador_fecha ON citas(capacitador_id, fecha);
CREATE INDEX IF NOT EXISTS idx_citas_cliente ON citas(cliente_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_citas_updated_at ON citas;
CREATE TRIGGER trg_citas_updated_at
    BEFORE UPDATE ON citas
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
