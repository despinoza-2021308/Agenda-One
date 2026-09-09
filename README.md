# Agenda Digital Centralizada y Control de Horas (AD-RE-11)

Sistema web profesional para la gestión, agendamiento y auditoría de citas y control de horas efectivas impartidas por el cuerpo de capacitadores de la empresa, reemplazando el formato manual en hoja de cálculo Excel (AD-RE-11).

Diseñado para un **ÚNICO ADMINISTRADOR** que centraliza el agendamiento y control de todas las operaciones de capacitación.

---

## 🚀 Arquitectura Técnica

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons.
- **Backend:** Node.js, Express, REST API modular, pool PostgreSQL (`pg`) con fallback transparente para desarrollo inmediato.
- **Base de Datos:** PostgreSQL 14-18+ (DDL, llaves foráneas, triggers de auditoría, índices y constraints de validación).

---

## 📁 Estructura del Proyecto

```
Agenda One/
├── Database/
│   ├── init.sql               # DDL de tablas, índices y triggers PostgreSQL
│   └── seed.sql               # Datos iniciales (Capacitadores, Clientes, Citas)
│
├── BackEnd/
│   ├── src/
│   │   ├── config/db.js       # Pool PostgreSQL y modo de respaldo
│   │   ├── controllers/       # Controladores CRUD y Analítica
│   │   ├── routes/            # Rutas REST (/api/citas, /api/reportes, etc.)
│   │   ├── middlewares/       # Manejo centralizado de errores
│   │   └── utils/timeUtils.js # Cálculo automático de horas decimales (H)
│   ├── .env                   # Variables de conexión
│   ├── server.js              # Servidor HTTP (Puerto 5000)
│   └── package.json
│
└── FrontEnd/
    ├── src/
    │   ├── components/
    │   │   ├── calendar/      # Calendario interactivo (Mes y Lista)
    │   │   ├── appointments/  # Modal de agendamiento y cálculo de horas
    │   │   ├── reports/       # Reportes ejecutivos AD-RE-11 y exportación CSV
    │   │   ├── catalogs/      # Gestión de Clientes y Capacitadores
    │   │   └── layout/        # Navbar y navegación
    │   ├── services/api.js    # Cliente API REST
    │   ├── App.jsx            # Aplicación principal
    │   └── index.css          # Estilos Tailwind y formato de impresión
    ├── vite.config.js         # Puerto 3000 con proxy a API
    └── package.json
```

---

## ⚙️ Puesta en Marcha Rápida

### 1. Backend (API REST)
```bash
cd BackEnd
npm install
node server.js
```
*El backend se inicia en `http://localhost:5000`.*

### 2. Frontend (Aplicación Web)
```bash
cd FrontEnd
npm install
npm run dev
```
*La interfaz web estará disponible en `http://localhost:3000`.*

---

## 🗄️ Configuración de PostgreSQL

Si deseas usar tu instancia local de PostgreSQL:
1. Abre tu terminal o pgAdmin.
2. Ejecuta el script de creación:
   ```bash
   psql -U postgres -f "Database/init.sql"
   psql -U postgres -d agenda_db -f "Database/seed.sql"
   ```
3. Verifica las credenciales en `BackEnd/.env`:
   ```env
   PORT=5000
   PGHOST=localhost
   PGPORT=5432
   PGUSER=postgres
   PGPASSWORD=tu_password
   PGDATABASE=agenda_db
   ```

*Nota: Si PostgreSQL no está encendido o en ejecución, el sistema activa automáticamente un motor en memoria con datos de prueba para permitir el desarrollo y pruebas de la interfaz sin interrupciones.*

---

## 📊 Características Principales del Sistema

1. **Dashboard y Calendario Centralizado:**
   - Visualización mensual de todas las citas agendadas.
   - Cada capacitador cuenta con un **color único e iniciales de 2-3 letras** (ej. `[MO]`, `[OQ]`, `[PF]`).
   - Filtro interactivo por capacitador con conteo de horas en tiempo real.
   - Acceso con un click para agendar cita en cualquier fecha.

2. **Formulario de Agendamiento Rápido:**
   - Selector de cliente y capacitador.
   - **Cálculo automático de horas decimales (H)** según las horas de inicio y fin (ej. `08:30` a `11:00` = `2.5 hrs`).
   - Switch de **Ajuste Manual** si el administrador necesita redondear o sumar tiempos de traslado.
   - Selector de modalidad (`Presencial` o `Virtual`) y tipo de servicio (`Curso`, `Asesoría`, `Auditoría`, `Reunión`, `Seguimiento`).

3. **Módulo de Reportes Ejecutivos (Formato AD-RE-11):**
   - Resumen mensual agrupado por capacitador.
   - Desglose de horas presenciales vs. virtuales y total acumulado.
   - Indicadores KPIs: Total horas del mes, total citas, % presencial/virtual y Capacitador Líder.
   - **Exportación directa a Excel (formato CSV con codificación UTF-8 BOM)**.
   - **Impresión limpia** con formato ejecutivo oficial AD-RE-11.
