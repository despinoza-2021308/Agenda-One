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
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre_empresa VARCHAR(150) NOT NULL UNIQUE CONSTRAINT chk_nombre_empresa CHECK (trim(nombre_empresa) <> ''),
    contacto VARCHAR(100),
    telefono VARCHAR(30),
    correo VARCHAR(100),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    tipo_servicio VARCHAR(30) NOT NULL CHECK (tipo_servicio IN ('Asesoría', 'Curso', 'Auditoría', 'Reunión', 'Seguimiento')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_coherencia_horaria CHECK (hora_fin > hora_inicio)
);

-- 4. Índices de Alto Rendimiento para Calendario y Filtros
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_capacitador_fecha ON citas(capacitador_id, fecha);
CREATE INDEX IF NOT EXISTS idx_citas_cliente ON citas(cliente_id);
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

