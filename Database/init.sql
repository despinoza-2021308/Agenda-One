-- ====================================================================
-- SISTEMA DE AGENDA CENTRALIZADA Y CONTROL DE HORAS (MODELO AD-RE-11)
-- DDL - Inicialización Segura y Optimizada (PostgreSQL / Supabase)
-- ====================================================================

-- 1. Tabla de Capacitadores
CREATE TABLE IF NOT EXISTS capacitadores (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(120) NOT NULL,
    iniciales VARCHAR(5) NOT NULL UNIQUE CONSTRAINT chk_iniciales_val CHECK (length(trim(iniciales)) BETWEEN 2 AND 5),
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6' CONSTRAINT chk_color_hex CHECK (color ~* '^#[0-9A-Fa-f]{6}$'),
    telefono VARCHAR(30),
    tarifa_hora NUMERIC(10, 2) NOT NULL DEFAULT 150.00 CONSTRAINT chk_tarifa_hora CHECK (tarifa_hora >= 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO capacitadores (id, nombre_completo, iniciales, color, tarifa_hora) VALUES
(1, 'Mariana Orellana', 'MO', '#2563EB', 175.00),
(2, 'Oscar Quan', 'OQ', '#7C3AED', 200.00),
(3, 'Pedro Fuentes', 'PF', '#059669', 175.00),
(4, 'Zoila Galvez', 'ZG', '#D97706', 150.00),
(5, 'Josue Bautista', 'JB', '#DC2626', 150.00),
(6, 'Jaime Avalos', 'JA', '#059669', 150.00),
(7, 'Luis Teo', 'LT', '#D97706', 175.00),
(8, 'Byron Jerez', 'BJ', '#DC2626', 175.00)
ON CONFLICT (iniciales) DO UPDATE SET 
  nombre_completo = EXCLUDED.nombre_completo,
  color = EXCLUDED.color;

-- 2. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre_empresa VARCHAR(200) NOT NULL UNIQUE CONSTRAINT chk_nombre_empresa CHECK (trim(nombre_empresa) <> ''),
    contacto TEXT,
    telefono VARCHAR(150),
    correo VARCHAR(255),
    direccion TEXT,
    facturacion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS facturacion TEXT;
ALTER TABLE clientes ALTER COLUMN nombre_empresa TYPE VARCHAR(200);
ALTER TABLE clientes ALTER COLUMN contacto TYPE TEXT;
ALTER TABLE clientes ALTER COLUMN telefono TYPE VARCHAR(150);
ALTER TABLE clientes ALTER COLUMN correo TYPE VARCHAR(255);

-- 3. Tabla de Citas (Control de Horas AD-RE-11)
CREATE TABLE IF NOT EXISTS citas (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE RESTRICT,
    cliente_nombre VARCHAR(150),
    capacitador_id INT NOT NULL REFERENCES capacitadores(id) ON DELETE RESTRICT,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    horas NUMERIC(4, 2) NOT NULL CONSTRAINT chk_horas_limite CHECK (horas > 0 AND horas <= 24),
    modalidad VARCHAR(20) NOT NULL CHECK (modalidad IN ('Presencial', 'Virtual', 'Híbrida')),
    tipo_servicio VARCHAR(50) NOT NULL CHECK (tipo_servicio IN ('Consultoría', 'Capacitación', 'Auditoría', 'Normas', 'Requerimientos Legales', 'Mediciones', 'Consultoria', 'Capacitacion', 'Auditoria')),
    estado VARCHAR(25) NOT NULL DEFAULT 'Programada' CHECK (estado IN ('Programada', 'En Curso', 'Impartida', 'Cancelada', 'Reprogramada')),
    observaciones TEXT,
    bitacora TEXT,
    firma_cliente TEXT,
    firmante_nombre VARCHAR(120),
    firmante_puesto VARCHAR(100),
    firmado_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_coherencia_horaria CHECK (hora_fin > hora_inicio)
);

ALTER TABLE citas ADD COLUMN IF NOT EXISTS bitacora TEXT;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS firma_cliente TEXT;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS firmante_nombre VARCHAR(120);
ALTER TABLE citas ADD COLUMN IF NOT EXISTS firmante_puesto VARCHAR(100);
ALTER TABLE citas ADD COLUMN IF NOT EXISTS firmado_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE citas ALTER COLUMN tipo_servicio TYPE VARCHAR(50);

DO $$
BEGIN
    ALTER TABLE citas DROP CONSTRAINT IF EXISTS citas_tipo_servicio_check;
    ALTER TABLE citas ADD CONSTRAINT citas_tipo_servicio_check 
      CHECK (tipo_servicio IN (
        'Consultoría', 'Capacitación', 'Auditoría', 'Normas', 'Requerimientos Legales', 'Mediciones',
        'Consultoria', 'Capacitacion', 'Auditoria',
        'Asesoría', 'Curso', 'Reunión', 'Seguimiento'
      ));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 4. Índices de Alto Rendimiento para Calendario y Filtros
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_capacitador_fecha ON citas(capacitador_id, fecha);
CREATE INDEX IF NOT EXISTS idx_citas_cliente ON citas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON citas(estado);
CREATE INDEX IF NOT EXISTS idx_capacitadores_activo ON capacitadores(activo);
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(activo);

-- 5. Función de Auditoría para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Triggers automáticos sin palabras destructivas (CREATE OR REPLACE TRIGGER)
CREATE OR REPLACE TRIGGER trg_citas_updated_at
    BEFORE UPDATE ON citas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_capacitadores_updated_at
    BEFORE UPDATE ON capacitadores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Seguridad Supabase: Row Level Security (RLS) y Políticas de Acceso
ALTER TABLE capacitadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'capacitadores' AND policyname = 'Acceso total capacitadores') THEN
        CREATE POLICY "Acceso total capacitadores" ON capacitadores FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clientes' AND policyname = 'Acceso total clientes') THEN
        CREATE POLICY "Acceso total clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'citas' AND policyname = 'Acceso total citas') THEN
        CREATE POLICY "Acceso total citas" ON citas FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 8. Tabla de Auditoría de Citas (Trazabilidad y Control de Cambios)
CREATE TABLE IF NOT EXISTS auditoria_citas (
    id SERIAL PRIMARY KEY,
    cita_id INT NOT NULL,
    accion VARCHAR(50) NOT NULL, -- 'CREACION', 'MODIFICACION', 'REPROGRAMACION', 'CANCELACION', 'FIRMA_CONFORMIDAD', 'ELIMINACION'
    usuario VARCHAR(100) NOT NULL DEFAULT 'Administrador',
    detalles JSONB,
    ip_origen VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_cita_id ON auditoria_citas(cita_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria_citas(created_at);

ALTER TABLE auditoria_citas ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'auditoria_citas' AND policyname = 'Acceso total auditoria') THEN
        CREATE POLICY "Acceso total auditoria" ON auditoria_citas FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;


