const db = require('../config/db');

// Obtener datos consolidados del portal para un capacitador por su código de iniciales
async function getTrainerPortalData(req, res, next) {
  try {
    const rawCodigo = req.params.codigo;
    if (!rawCodigo || !String(rawCodigo).trim()) {
      return res.status(400).json({ error: true, message: 'Código de capacitador no proporcionado.' });
    }

    const codigo = String(rawCodigo).trim().toUpperCase();

    // Determinar año y mes consultado (por defecto mes actual o query params)
    const now = new Date();
    const queryYear = parseInt(req.query.year || now.getFullYear(), 10);
    const queryMonth = parseInt(req.query.month || (now.getMonth() + 1), 10);
    const todayStr = req.query.today || now.toISOString().split('T')[0];

    let capacitador = null;

    if (db.isPostgresConnected()) {
      const capRes = await db.pool.query(
        `SELECT id, nombre_completo, iniciales, color, telefono, tarifa_hora::FLOAT AS tarifa_hora, activo
         FROM capacitadores
         WHERE UPPER(TRIM(iniciales)) = $1`,
        [codigo]
      );

      if (capRes.rows.length === 0) {
        return res.status(404).json({ error: true, message: `No se encontró ningún capacitador con el código [${codigo}].` });
      }

      capacitador = capRes.rows[0];
    } else {
      capacitador = db.mockStore.capacitadores.find(
        cp => cp.iniciales && cp.iniciales.trim().toUpperCase() === codigo
      );

      if (!capacitador) {
        return res.status(404).json({ error: true, message: `No se encontró ningún capacitador con el código [${codigo}].` });
      }
    }

    if (!capacitador.activo) {
      return res.status(403).json({ error: true, message: `El capacitador [${codigo}] está marcado como inactivo.` });
    }

    // Obtener citas del capacitador
    let citas = [];

    if (db.isPostgresConnected()) {
      const citasRes = await db.pool.query(
        `SELECT 
          c.id,
          c.cliente_id,
          COALESCE(c.cliente_nombre, cl.nombre_empresa, 'Cliente General') AS cliente_nombre,
          cl.contacto AS cliente_contacto,
          cl.telefono AS cliente_telefono,
          cl.correo AS cliente_correo,
          c.capacitador_id,
          cp.nombre_completo AS capacitador_nombre,
          cp.iniciales AS capacitador_iniciales,
          cp.color AS capacitador_color,
          TO_CHAR(c.fecha, 'YYYY-MM-DD') AS fecha,
          TO_CHAR(c.hora_inicio, 'HH24:MI') AS hora_inicio,
          TO_CHAR(c.hora_fin, 'HH24:MI') AS hora_fin,
          c.horas::FLOAT AS horas,
          c.modalidad,
          c.tipo_servicio,
          COALESCE(c.estado, 'Programada') AS estado,
          c.observaciones,
          c.bitacora,
          c.firma_cliente,
          c.firmante_nombre,
          c.firmante_puesto,
          c.firmado_at,
          c.created_at,
          c.updated_at
        FROM citas c
        LEFT JOIN clientes cl ON c.cliente_id = cl.id
        INNER JOIN capacitadores cp ON c.capacitador_id = cp.id
        WHERE c.capacitador_id = $1
        ORDER BY c.fecha ASC, c.hora_inicio ASC`,
        [capacitador.id]
      );
      citas = citasRes.rows;
    } else {
      citas = db.mockStore.citas
        .filter(c => c.capacitador_id === capacitador.id)
        .map(c => {
          const cli = db.mockStore.clientes.find(item => item.id === c.cliente_id) || {};
          return {
            ...c,
            cliente_nombre: c.cliente_nombre || cli.nombre_empresa || 'Cliente General',
            cliente_contacto: cli.contacto || null,
            cliente_telefono: cli.telefono || null,
            cliente_correo: cli.correo || null,
            capacitador_nombre: capacitador.nombre_completo,
            capacitador_iniciales: capacitador.iniciales,
            capacitador_color: capacitador.color,
            estado: c.estado || 'Programada',
            horas: Number(c.horas),
            firma_cliente: c.firma_cliente || null,
            firmante_nombre: c.firmante_nombre || null,
            firmante_puesto: c.firmante_puesto || null,
            firmado_at: c.firmado_at || null
          };
        })
        .sort((a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio));
    }

    // Filtrar por mes consultado
    const citasMes = citas.filter(c => {
      const [y, m] = String(c.fecha).split('T')[0].split('-').map(Number);
      return y === queryYear && m === queryMonth;
    });

    // Citas de hoy (sin importar mes de filtro, para asegurar visualización inmediata del día actual)
    const citasHoy = citas.filter(c => {
      const fStr = String(c.fecha).split('T')[0];
      return fStr === todayStr;
    });

    // Próximas citas desde hoy hacia adelante
    const citasProximas = citas.filter(c => {
      const fStr = String(c.fecha).split('T')[0];
      return fStr >= todayStr && c.estado !== 'Cancelada' && c.estado !== 'Impartida';
    });

    // Cálculos estadísticos del mes
    const tarifa = parseFloat(capacitador.tarifa_hora) || 0;
    let horasImpartidas = 0;
    let horasProgramadas = 0;
    let citasImpartidas = 0;
    let citasEnCurso = 0;
    let citasProgramadas = 0;
    let citasCanceladas = 0;

    citasMes.forEach(c => {
      const h = parseFloat(c.horas) || 0;
      if (c.estado === 'Impartida') {
        horasImpartidas += h;
        citasImpartidas++;
      } else if (c.estado === 'En Curso') {
        horasProgramadas += h;
        citasEnCurso++;
      } else if (c.estado === 'Programada' || c.estado === 'Reprogramada') {
        horasProgramadas += h;
        citasProgramadas++;
      } else if (c.estado === 'Cancelada') {
        citasCanceladas++;
      }
    });

    const honorariosImpartidos = Math.round(horasImpartidas * tarifa * 100) / 100;
    const honorariosProyectados = Math.round((horasImpartidas + horasProgramadas) * tarifa * 100) / 100;

    return res.json({
      success: true,
      capacitador: {
        id: capacitador.id,
        nombre_completo: capacitador.nombre_completo,
        iniciales: capacitador.iniciales,
        color: capacitador.color,
        telefono: capacitador.telefono,
        tarifa_hora: tarifa
      },
      resumen: {
        year: queryYear,
        month: queryMonth,
        today: todayStr,
        horas_impartidas: Number(horasImpartidas.toFixed(2)),
        horas_programadas: Number(horasProgramadas.toFixed(2)),
        horas_totales_mes: Number((horasImpartidas + horasProgramadas).toFixed(2)),
        honorarios_impartidos: honorariosImpartidos,
        honorarios_proyectados: honorariosProyectados,
        total_citas_mes: citasMes.length,
        citas_impartidas: citasImpartidas,
        citas_en_curso: citasEnCurso,
        citas_programadas: citasProgramadas,
        citas_canceladas: citasCanceladas
      },
      citas_hoy: citasHoy,
      citas_proximas: citasProximas,
      citas_mes: citasMes
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar estado, bitácora y/o firma de conformidad de una cita
async function updateTrainerCita(req, res, next) {
  try {
    const rawCodigo = req.params.codigo;
    const { id } = req.params;
    const { estado, bitacora, firma_cliente, firmante_nombre, firmante_puesto } = req.body;

    if (!rawCodigo || !String(rawCodigo).trim()) {
      return res.status(400).json({ error: true, message: 'Código de capacitador no proporcionado.' });
    }

    const codigo = String(rawCodigo).trim().toUpperCase();

    // Validar estado permitido
    const allowedEstados = ['Programada', 'En Curso', 'Impartida'];
    const resolvedEstado = firma_cliente ? 'Impartida' : estado;

    if (resolvedEstado !== undefined && !allowedEstados.includes(resolvedEstado)) {
      return res.status(400).json({
        error: true,
        message: `Estado no válido para el portal. Valores permitidos: ${allowedEstados.join(', ')}.`
      });
    }

    if (bitacora !== undefined && bitacora !== null && typeof bitacora === 'string' && bitacora.length > 2000) {
      return res.status(400).json({
        error: true,
        message: 'La bitácora no puede superar los 2,000 caracteres.'
      });
    }

    if (db.isPostgresConnected()) {
      // 1. Verificar existencia del capacitador
      const capCheck = await db.pool.query(
        'SELECT id, nombre_completo, iniciales, activo FROM capacitadores WHERE UPPER(TRIM(iniciales)) = $1',
        [codigo]
      );
      if (capCheck.rows.length === 0) {
        return res.status(404).json({ error: true, message: 'Capacitador no encontrado.' });
      }
      const cap = capCheck.rows[0];

      // 2. Verificar que la cita exista y le pertenezca
      const citaCheck = await db.pool.query(
        'SELECT id, capacitador_id, estado, bitacora FROM citas WHERE id = $1',
        [id]
      );
      if (citaCheck.rows.length === 0) {
        return res.status(404).json({ error: true, message: 'Cita no encontrada.' });
      }
      if (citaCheck.rows[0].capacitador_id !== cap.id) {
        return res.status(403).json({ error: true, message: 'No tienes autorización para modificar esta cita.' });
      }

      // 3. Ejecutar actualización
      const updateQuery = `
        UPDATE citas
        SET estado = COALESCE($1, estado),
            bitacora = COALESCE($2, bitacora),
            firma_cliente = COALESCE($3, firma_cliente),
            firmante_nombre = COALESCE($4, firmante_nombre),
            firmante_puesto = COALESCE($5, firmante_puesto),
            firmado_at = CASE WHEN $3 IS NOT NULL THEN CURRENT_TIMESTAMP ELSE firmado_at END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
      `;
      const updateRes = await db.pool.query(updateQuery, [
        resolvedEstado || null,
        bitacora !== undefined ? bitacora : null,
        firma_cliente || null,
        firmante_nombre || null,
        firmante_puesto || null,
        id
      ]);

      return res.json({
        success: true,
        message: firma_cliente ? 'Conformidad y firma registradas exitosamente.' : 'Cita actualizada exitosamente.',
        cita: updateRes.rows[0]
      });
    }

    // Modo respaldo en memoria
    const cap = db.mockStore.capacitadores.find(
      cp => cp.iniciales && cp.iniciales.trim().toUpperCase() === codigo
    );
    if (!cap) {
      return res.status(404).json({ error: true, message: 'Capacitador no encontrado.' });
    }

    const cita = db.mockStore.citas.find(c => c.id === parseInt(id, 10));
    if (!cita) {
      return res.status(404).json({ error: true, message: 'Cita no encontrada.' });
    }
    if (cita.capacitador_id !== cap.id) {
      return res.status(403).json({ error: true, message: 'No tienes autorización para modificar esta cita.' });
    }

    if (resolvedEstado !== undefined) {
      cita.estado = resolvedEstado;
    }
    if (bitacora !== undefined) {
      cita.bitacora = bitacora;
    }
    if (firma_cliente !== undefined) {
      cita.firma_cliente = firma_cliente;
      cita.estado = 'Impartida';
      cita.firmado_at = new Date().toISOString();
    }
    if (firmante_nombre !== undefined) {
      cita.firmante_nombre = firmante_nombre;
    }
    if (firmante_puesto !== undefined) {
      cita.firmante_puesto = firmante_puesto;
    }

    return res.json({
      success: true,
      message: firma_cliente ? 'Conformidad y firma registradas exitosamente.' : 'Cita actualizada exitosamente.',
      cita
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTrainerPortalData,
  updateTrainerCita
};
