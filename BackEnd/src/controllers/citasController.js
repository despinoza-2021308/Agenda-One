const db = require('../config/db');
const { calcularHorasDecimales, validarHorarios, validarFecha } = require('../utils/timeUtils');

// Utilidad para clasificar la acción de auditoría según los cambios detectados
function resolverAccionAuditoria(prev, cambios) {
  if (!prev) {
    return { accion: 'MODIFICACION', detalles: cambios };
  }
  if (cambios.estadoFinal === 'Cancelada' && prev.estado !== 'Cancelada') {
    return {
      accion: 'CANCELACION',
      detalles: {
        motivo: cambios.obs || prev.observaciones || 'Cancelada en agenda central',
        estado_anterior: prev.estado
      }
    };
  }

  const fPrev = String(prev.fecha || '').split('T')[0];
  const fNext = cambios.fecha ? String(cambios.fecha).split('T')[0] : fPrev;
  const hIniPrev = String(prev.hora_inicio || '').slice(0, 5);
  const hIniNext = cambios.hora_inicio ? String(cambios.hora_inicio).slice(0, 5) : hIniPrev;
  const hFinPrev = String(prev.hora_fin || '').slice(0, 5);
  const hFinNext = cambios.hora_fin ? String(cambios.hora_fin).slice(0, 5) : hFinPrev;

  if (fNext !== fPrev || hIniNext !== hIniPrev || hFinNext !== hFinPrev) {
    return {
      accion: 'REPROGRAMACION',
      detalles: {
        anterior: `${fPrev} (${hIniPrev} - ${hFinPrev})`,
        nuevo: `${fNext} (${hIniNext} - ${hFinNext})`,
        motivo: cambios.obs || null
      }
    };
  }

  if (cambios.firma_cliente && !prev.firma_cliente) {
    return {
      accion: 'FIRMA_CONFORMIDAD',
      detalles: {
        firmante_nombre: cambios.firmante_nombre,
        firmante_puesto: cambios.firmante_puesto
      }
    };
  }

  return {
    accion: 'MODIFICACION',
    detalles: {
      estado: cambios.estadoFinal || prev.estado,
      horas: cambios.horasFinal || prev.horas,
      modalidad: cambios.modalidad || prev.modalidad,
      tipo_servicio: cambios.tipo_servicio || prev.tipo_servicio
    }
  };
}


function formatMockCita(c) {
  const cliente = db.mockStore.clientes.find(cli => cli.id === c.cliente_id) || {};
  const cap = db.mockStore.capacitadores.find(cp => cp.id === c.capacitador_id) || {};
  return {
    ...c,
    cliente_nombre: c.cliente_nombre || cliente.nombre_empresa || 'Cliente General',
    capacitador_nombre: cap.nombre_completo || 'Capacitador',
    capacitador_iniciales: cap.iniciales || '??',
    capacitador_color: cap.color || '#3B82F6',
    estado: c.estado || 'Programada',
    horas: Number(c.horas),
    firma_cliente: c.firma_cliente || null,
    firmante_nombre: c.firmante_nombre || null,
    firmante_puesto: c.firmante_puesto || null,
    firmado_at: c.firmado_at || null
  };
}

// Obtener citas con filtros opcionales (rango de fechas, capacitador, cliente, estado)
async function getCitas(req, res, next) {
  try {
    const { start_date, end_date, capacitador_id, cliente_id, month, year, estado, search, q, limit } = req.query;
    const searchTerm = (search || q || '').trim();

    if (db.isPostgresConnected()) {
      let query = `
        SELECT 
          c.id,
          c.cliente_id,
          COALESCE(c.cliente_nombre, cl.nombre_empresa, 'Cliente General') AS cliente_nombre,
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
        WHERE 1=1
      `;
      const params = [];

      if (start_date) {
        params.push(start_date);
        query += ` AND c.fecha >= $${params.length}`;
      }
      if (end_date) {
        params.push(end_date);
        query += ` AND c.fecha <= $${params.length}`;
      }
      if (month && year) {
        params.push(year, month);
        query += ` AND EXTRACT(YEAR FROM c.fecha) = $${params.length - 1} AND EXTRACT(MONTH FROM c.fecha) = $${params.length}`;
      }
      if (capacitador_id) {
        params.push(capacitador_id);
        query += ` AND c.capacitador_id = $${params.length}`;
      }
      if (cliente_id) {
        params.push(cliente_id);
        query += ` AND c.cliente_id = $${params.length}`;
      }
      if (estado) {
        params.push(estado);
        query += ` AND c.estado = $${params.length}`;
      }
      if (searchTerm) {
        params.push(`%${searchTerm}%`);
        query += ` AND (
          c.tipo_servicio ILIKE $${params.length} OR
          c.cliente_nombre ILIKE $${params.length} OR
          cl.nombre_empresa ILIKE $${params.length} OR
          cp.nombre_completo ILIKE $${params.length} OR
          c.observaciones ILIKE $${params.length}
        )`;
      }

      query += ` ORDER BY c.fecha DESC, c.hora_inicio DESC`;

      if (limit && !isNaN(parseInt(limit, 10))) {
        params.push(parseInt(limit, 10));
        query += ` LIMIT $${params.length}`;
      }

      try {
        const result = await db.pool.query(query, params);
        if (result.rows && result.rows.length > 0) {
          if (month && year) {
            const hasMonthRows = result.rows.some(r => {
              const [y, m] = String(r.fecha).split('T')[0].split('-').map(Number);
              return y === Number(year) && m === Number(month);
            });
            if (!hasMonthRows) {
              const mockMonthCitas = db.mockStore.citas.filter(mc => {
                const [y, m] = String(mc.fecha).split('T')[0].split('-').map(Number);
                return y === Number(year) && m === Number(month);
              });
              if (mockMonthCitas.length > 0) {
                console.warn(`⚠️ [Citas] PostgreSQL retornó 0 citas para ${year}-${month}. Usando fallback de mockStore.`);
                return res.json(mockMonthCitas.map(formatMockCita));
              }
            }
          } else if (!start_date && !end_date && !searchTerm) {
            const pgMonthKeys = new Set(result.rows.map(r => String(r.fecha).slice(0, 7)));
            const missingMockCitas = db.mockStore.citas.filter(mc => !pgMonthKeys.has(String(mc.fecha).slice(0, 7)));
            if (missingMockCitas.length > 0) {
              console.log(`ℹ️ [Citas] Complementando ${missingMockCitas.length} citas de meses ausentes en PostgreSQL.`);
              const formattedMissing = missingMockCitas.map(formatMockCita);
              return res.json([...result.rows, ...formattedMissing].sort((a, b) => b.fecha.localeCompare(a.fecha)));
            }
          }
          return res.json(result.rows);
        }
      } catch (dbErr) {
        console.warn('⚠️ [DB] Fallback a mockStore por error en consulta de citas:', dbErr.message);
      }
    }

    // Modo respaldo en memoria
    let citas = db.mockStore.citas.map(formatMockCita);

    if (start_date) {
      citas = citas.filter(c => c.fecha >= start_date);
    }
    if (end_date) {
      citas = citas.filter(c => c.fecha <= end_date);
    }
    if (month && year) {
      citas = citas.filter(c => {
        const [y, m] = c.fecha.split('-');
        return parseInt(y, 10) === parseInt(year, 10) && parseInt(m, 10) === parseInt(month, 10);
      });
    }
    if (capacitador_id) {
      citas = citas.filter(c => c.capacitador_id === parseInt(capacitador_id, 10));
    }
    if (cliente_id) {
      citas = citas.filter(c => c.cliente_id === parseInt(cliente_id, 10));
    }
    if (estado) {
      citas = citas.filter(c => c.estado === estado);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      citas = citas.filter(c => 
        (c.tipo_servicio && c.tipo_servicio.toLowerCase().includes(lower)) ||
        (c.cliente_nombre && c.cliente_nombre.toLowerCase().includes(lower)) ||
        (c.capacitador_nombre && c.capacitador_nombre.toLowerCase().includes(lower)) ||
        (c.observaciones && c.observaciones.toLowerCase().includes(lower)) ||
        (c.estado && c.estado.toLowerCase().includes(lower))
      );
    }

    if (month && year) {
      citas.sort((a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio));
    } else {
      citas.sort((a, b) => (b.fecha + b.hora_inicio).localeCompare(a.fecha + a.hora_inicio));
    }

    if (limit && !isNaN(parseInt(limit, 10))) {
      citas = citas.slice(0, parseInt(limit, 10));
    }

    return res.json(citas);
  } catch (error) {
    next(error);
  }
}

// Obtener cita individual por ID
async function getCitaById(req, res, next) {
  try {
    const { id } = req.params;

    if (db.isPostgresConnected()) {
      const result = await db.pool.query(
        `SELECT 
          c.id, c.cliente_id,
          COALESCE(c.cliente_nombre, cl.nombre_empresa, 'Cliente General') AS cliente_nombre,
          c.capacitador_id, cp.nombre_completo AS capacitador_nombre,
          cp.iniciales AS capacitador_iniciales, cp.color AS capacitador_color,
          TO_CHAR(c.fecha, 'YYYY-MM-DD') AS fecha,
          TO_CHAR(c.hora_inicio, 'HH24:MI') AS hora_inicio,
          TO_CHAR(c.hora_fin, 'HH24:MI') AS hora_fin,
          c.horas::FLOAT AS horas,
          c.modalidad, c.tipo_servicio,
          COALESCE(c.estado, 'Programada') AS estado,
          c.observaciones,
          c.bitacora,
          c.firma_cliente,
          c.firmante_nombre,
          c.firmante_puesto,
          c.firmado_at
         FROM citas c
         LEFT JOIN clientes cl ON c.cliente_id = cl.id
         INNER JOIN capacitadores cp ON c.capacitador_id = cp.id
         WHERE c.id = $1`,
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Cita no encontrada.' });
      }
      return res.json(result.rows[0]);
    }

    const c = db.mockStore.citas.find(item => item.id === parseInt(id, 10));
    if (!c) return res.status(404).json({ message: 'Cita no encontrada.' });

    const cliente = db.mockStore.clientes.find(cli => cli.id === c.cliente_id) || {};
    const cap = db.mockStore.capacitadores.find(cp => cp.id === c.capacitador_id) || {};

    return res.json({
      ...c,
      cliente_nombre: c.cliente_nombre || cliente.nombre_empresa || 'Cliente General',
      capacitador_nombre: cap.nombre_completo || 'Capacitador',
      capacitador_iniciales: cap.iniciales || '??',
      capacitador_color: cap.color || '#3B82F6',
      estado: c.estado || 'Programada',
      horas: Number(c.horas),
      firma_cliente: c.firma_cliente || null,
      firmante_nombre: c.firmante_nombre || null,
      firmante_puesto: c.firmante_puesto || null,
      firmado_at: c.firmado_at || null
    });
  } catch (error) {
    next(error);
  }
}

// Crear nueva cita
async function createCita(req, res, next) {
  try {
    const {
      cliente_nombre,
      cliente_id,
      capacitador_id,
      fecha,
      hora_inicio,
      hora_fin,
      horas,
      modalidad,
      tipo_servicio,
      estado,
      observaciones,
      descripcion
    } = req.body;

    const nombreClienteFinal = (cliente_nombre || '').trim() || (cliente_id ? `Cliente #${cliente_id}` : '');

    if (!nombreClienteFinal || !capacitador_id || !fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({
        message: 'Debes indicar el Cliente/Empresa, Capacitador, Fecha y Horarios.'
      });
    }

    if (nombreClienteFinal.length < 2 || nombreClienteFinal.length > 120) {
      return res.status(400).json({
        message: 'El nombre del cliente o empresa debe tener entre 2 y 120 caracteres.'
      });
    }

    // Validación de fecha
    const fechaVal = validarFecha(fecha);
    if (!fechaVal.valid) {
      return res.status(400).json({ message: fechaVal.error });
    }

    // Validación de horarios (inicio vs fin y límites)
    const horariosVal = validarHorarios(hora_inicio, hora_fin);
    if (!horariosVal.valid) {
      return res.status(400).json({ message: horariosVal.error });
    }

    // Horas finales calculadas o validadas
    let horasCalculadas = horas ? parseFloat(horas) : horariosVal.horas;
    if (isNaN(horasCalculadas) || horasCalculadas < 0.25 || horasCalculadas > 16) {
      return res.status(400).json({
        message: 'Las horas deben ser un número entre 0.25h (15 min) y 16.0h.'
      });
    }

    // Validación de modalidad
    const mod = modalidad || 'Presencial';
    if (!['Presencial', 'Virtual'].includes(mod)) {
      return res.status(400).json({ message: "La modalidad debe ser 'Presencial' o 'Virtual'." });
    }

    // Validación de tipo de servicio
    const serv = (tipo_servicio || 'Consultoría').trim();
    if (serv.length < 2 || serv.length > 80) {
      return res.status(400).json({ message: 'El tipo de servicio debe tener entre 2 y 80 caracteres.' });
    }

    // Validación de estado
    const validEstados = ['Programada', 'En Curso', 'Impartida', 'Cancelada', 'Reprogramada'];
    const estadoFinal = validEstados.includes(estado) ? estado : 'Programada';

    // Validación de observaciones
    const obs = (descripcion || observaciones || '').trim();
    if (obs.length > 500) {
      return res.status(400).json({ message: 'Las observaciones no pueden exceder los 500 caracteres.' });
    }

    // Validación de que el capacitador existe y está activo
    if (db.isPostgresConnected()) {
      const capCheck = await db.pool.query('SELECT id, activo, nombre_completo FROM capacitadores WHERE id = $1', [capacitador_id]);
      if (capCheck.rows.length === 0) {
        return res.status(404).json({ message: 'El capacitador seleccionado no existe.' });
      }
      if (!capCheck.rows[0].activo) {
        return res.status(400).json({ message: `El capacitador ${capCheck.rows[0].nombre_completo} se encuentra inactivo y no puede recibir nuevas asignaciones.` });
      }
    } else {
      const capCheck = db.mockStore.capacitadores.find(cp => cp.id === parseInt(capacitador_id, 10));
      if (!capCheck) {
        return res.status(404).json({ message: 'El capacitador seleccionado no existe.' });
      }
      if (capCheck.activo === false) {
        return res.status(400).json({ message: `El capacitador ${capCheck.nombre_completo} se encuentra inactivo y no puede recibir nuevas asignaciones.` });
      }
    }

    // Validación inteligente: Verificar si el capacitador ya tiene un compromiso en ese rango de horas
    // (Solo aplica si la nueva cita no es Cancelada, y solo choca con citas no canceladas)
    if (estadoFinal !== 'Cancelada') {
      if (db.isPostgresConnected()) {
        const overlapQuery = `
          SELECT c.id, 
                 TO_CHAR(c.hora_inicio, 'HH24:MI') AS hora_inicio, 
                 TO_CHAR(c.hora_fin, 'HH24:MI') AS hora_fin, 
                 c.cliente_nombre, c.tipo_servicio, c.observaciones,
                 cp.nombre_completo AS capacitador_nombre,
                 cp.iniciales AS capacitador_iniciales
          FROM citas c
          INNER JOIN capacitadores cp ON c.capacitador_id = cp.id
          WHERE c.capacitador_id = $1
            AND c.fecha = $2
            AND c.hora_inicio < $3
            AND c.hora_fin > $4
            AND (c.estado IS NULL OR c.estado <> 'Cancelada')
          LIMIT 1
        `;
        const overlapCheck = await db.pool.query(overlapQuery, [
          capacitador_id,
          fecha,
          hora_fin,
          hora_inicio
        ]);

        if (overlapCheck.rows.length > 0) {
          const conf = overlapCheck.rows[0];
          return res.status(409).json({
            error: 'CONFLICTO_HORARIO',
            message: `Conflicto de horario: [${conf.capacitador_iniciales}] ${conf.capacitador_nombre} ya tiene una cita de ${conf.hora_inicio} a ${conf.hora_fin} (${conf.observaciones || conf.tipo_servicio}) con ${conf.cliente_nombre}.`,
            conflict: conf
          });
        }
      } else {
        const conf = db.mockStore.citas.find(c =>
          c.capacitador_id === parseInt(capacitador_id, 10) &&
          c.fecha === fecha &&
          c.estado !== 'Cancelada' &&
          c.hora_inicio < hora_fin &&
          c.hora_fin > hora_inicio
        );
        if (conf) {
          const cap = db.mockStore.capacitadores.find(cp => cp.id === conf.capacitador_id) || {};
          return res.status(409).json({
            error: 'CONFLICTO_HORARIO',
            message: `Conflicto de horario: [${cap.iniciales || 'CP'}] ${cap.nombre_completo || 'El capacitador'} ya tiene una cita de ${conf.hora_inicio} a ${conf.hora_fin}.`,
            conflict: conf
          });
        }
      }
    }

    if (db.isPostgresConnected()) {
      const insertQuery = `
        INSERT INTO citas (
          cliente_id, cliente_nombre, capacitador_id, fecha, hora_inicio, hora_fin, 
          horas, modalidad, tipo_servicio, estado, observaciones
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING 
          id, cliente_id, cliente_nombre, capacitador_id,
          TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha,
          TO_CHAR(hora_inicio, 'HH24:MI') AS hora_inicio,
          TO_CHAR(hora_fin, 'HH24:MI') AS hora_fin,
          horas::FLOAT AS horas, modalidad, tipo_servicio, estado, observaciones,
          bitacora, firma_cliente, firmante_nombre, firmante_puesto, firmado_at,
          created_at, updated_at
      `;
      const result = await db.pool.query(insertQuery, [
        cliente_id || null,
        nombreClienteFinal,
        capacitador_id,
        fecha,
        hora_inicio,
        hora_fin,
        horasCalculadas,
        mod,
        serv,
        estadoFinal,
        obs || null
      ]);

      const created = result.rows[0];
      await db.registrarAuditoria({
        cita_id: created.id,
        accion: 'CREACION',
        usuario: 'Administrador',
        detalles: {
          cliente: nombreClienteFinal,
          fecha,
          hora_inicio,
          hora_fin,
          horas: horasCalculadas,
          modalidad: mod,
          tipo_servicio: serv
        },
        ip_origen: req.ip || req.headers['x-forwarded-for']
      });

      return res.status(201).json(created);
    }

    // Modo respaldo en memoria
    const newCita = {
      id: db.mockStore.nextIds.citas++,
      cliente_nombre: nombreClienteFinal,
      capacitador_id: parseInt(capacitador_id, 10),
      fecha,
      hora_inicio,
      hora_fin,
      horas: horasCalculadas,
      modalidad: mod,
      tipo_servicio: serv,
      estado: estadoFinal,
      observaciones: obs
    };

    db.mockStore.citas.push(newCita);

    await db.registrarAuditoria({
      cita_id: newCita.id,
      accion: 'CREACION',
      usuario: 'Administrador',
      detalles: {
        cliente: newCita.cliente_nombre,
        fecha,
        hora_inicio,
        hora_fin,
        horas: newCita.horas,
        modalidad: newCita.modalidad,
        tipo_servicio: newCita.tipo_servicio
      },
      ip_origen: req.ip || req.headers['x-forwarded-for']
    });

    const cap = db.mockStore.capacitadores.find(cp => cp.id === newCita.capacitador_id) || {};

    return res.status(201).json({
      ...newCita,
      cliente_nombre: newCita.cliente_nombre,
      capacitador_nombre: cap.nombre_completo,
      capacitador_iniciales: cap.iniciales,
      capacitador_color: cap.color
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar cita
async function updateCita(req, res, next) {
  try {
    const { id } = req.params;
    const {
      cliente_nombre,
      cliente_id,
      capacitador_id,
      fecha,
      hora_inicio,
      hora_fin,
      horas,
      modalidad,
      tipo_servicio,
      estado,
      observaciones,
      descripcion,
      bitacora,
      firma_cliente,
      firmante_nombre,
      firmante_puesto,
      firmado_at
    } = req.body;

    if (cliente_nombre !== undefined) {
      const cNom = cliente_nombre.trim();
      if (cNom.length < 2 || cNom.length > 120) {
        return res.status(400).json({ message: 'El nombre del cliente o empresa debe tener entre 2 y 120 caracteres.' });
      }
    }

    if (fecha !== undefined) {
      const fechaVal = validarFecha(fecha);
      if (!fechaVal.valid) {
        return res.status(400).json({ message: fechaVal.error });
      }
    }

    if (hora_inicio !== undefined && hora_fin !== undefined) {
      const horariosVal = validarHorarios(hora_inicio, hora_fin);
      if (!horariosVal.valid) {
        return res.status(400).json({ message: horariosVal.error });
      }
      if (horas === undefined) {
        horasFinal = horariosVal.horas;
      }
    }

    if (horas !== undefined) {
      const hNum = parseFloat(horas);
      if (isNaN(hNum) || hNum < 0.25 || hNum > 16) {
        return res.status(400).json({ message: 'Las horas deben estar entre 0.25h (15 min) y 16.0h.' });
      }
      horasFinal = hNum;
    }

    if (modalidad !== undefined && !['Presencial', 'Virtual'].includes(modalidad)) {
      return res.status(400).json({ message: "La modalidad debe ser 'Presencial' o 'Virtual'." });
    }

    if (tipo_servicio !== undefined) {
      const serv = tipo_servicio.trim();
      if (serv.length < 2 || serv.length > 80) {
        return res.status(400).json({ message: 'El tipo de servicio debe tener entre 2 y 80 caracteres.' });
      }
    }

    const obs = descripcion !== undefined ? descripcion : observaciones;
    if (obs && obs.trim().length > 500) {
      return res.status(400).json({ message: 'Las observaciones no pueden exceder los 500 caracteres.' });
    }

    if (capacitador_id !== undefined) {
      if (db.isPostgresConnected()) {
        const capCheck = await db.pool.query('SELECT id, activo, nombre_completo FROM capacitadores WHERE id = $1', [capacitador_id]);
        if (capCheck.rows.length === 0) {
          return res.status(404).json({ message: 'El capacitador seleccionado no existe.' });
        }
        if (!capCheck.rows[0].activo) {
          return res.status(400).json({ message: `El capacitador ${capCheck.rows[0].nombre_completo} se encuentra inactivo.` });
        }
      } else {
        const capCheck = db.mockStore.capacitadores.find(cp => cp.id === parseInt(capacitador_id, 10));
        if (!capCheck) {
          return res.status(404).json({ message: 'El capacitador seleccionado no existe.' });
        }
        if (capCheck.activo === false) {
          return res.status(400).json({ message: `El capacitador ${capCheck.nombre_completo} se encuentra inactivo.` });
        }
      }
    }

    let horasFinalCalculadas = horasFinal;

    const validEstados = ['Programada', 'En Curso', 'Impartida', 'Cancelada', 'Reprogramada'];
    const estadoFinal = estado !== undefined && validEstados.includes(estado) ? estado : undefined;

    // Validación inteligente de conflicto de horario al actualizar (solo si no es o no pasa a Cancelada)
    if (estado !== 'Cancelada' && capacitador_id && fecha && hora_inicio && hora_fin) {
      if (db.isPostgresConnected()) {
        const overlapQuery = `
          SELECT c.id, 
                 TO_CHAR(c.hora_inicio, 'HH24:MI') AS hora_inicio, 
                 TO_CHAR(c.hora_fin, 'HH24:MI') AS hora_fin, 
                 c.cliente_nombre, c.tipo_servicio, c.observaciones,
                 cp.nombre_completo AS capacitador_nombre,
                 cp.iniciales AS capacitador_iniciales
          FROM citas c
          INNER JOIN capacitadores cp ON c.capacitador_id = cp.id
          WHERE c.capacitador_id = $1
            AND c.fecha = $2
            AND c.hora_inicio < $3
            AND c.hora_fin > $4
            AND c.id <> $5
            AND (c.estado IS NULL OR c.estado <> 'Cancelada')
          LIMIT 1
        `;
        const overlapCheck = await db.pool.query(overlapQuery, [
          capacitador_id,
          fecha,
          hora_fin,
          hora_inicio,
          id
        ]);

        if (overlapCheck.rows.length > 0) {
          const conf = overlapCheck.rows[0];
          return res.status(409).json({
            error: 'CONFLICTO_HORARIO',
            message: `Conflicto de horario: [${conf.capacitador_iniciales}] ${conf.capacitador_nombre} ya tiene una cita de ${conf.hora_inicio} a ${conf.hora_fin} (${conf.observaciones || conf.tipo_servicio}) con ${conf.cliente_nombre}.`,
            conflict: conf
          });
        }
      } else {
        const conf = db.mockStore.citas.find(c =>
          c.capacitador_id === parseInt(capacitador_id, 10) &&
          c.fecha === fecha &&
          c.id !== parseInt(id, 10) &&
          c.estado !== 'Cancelada' &&
          c.hora_inicio < hora_fin &&
          c.hora_fin > hora_inicio
        );
        if (conf) {
          const cap = db.mockStore.capacitadores.find(cp => cp.id === conf.capacitador_id) || {};
          return res.status(409).json({
            error: 'CONFLICTO_HORARIO',
            message: `Conflicto de horario: [${cap.iniciales || 'CP'}] ${cap.nombre_completo || 'El capacitador'} ya tiene una cita de ${conf.hora_inicio} a ${conf.hora_fin}.`,
            conflict: conf
          });
        }
      }
    }

    if (db.isPostgresConnected()) {
      const prevCheck = await db.pool.query('SELECT * FROM citas WHERE id = $1', [id]);
      if (prevCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Cita no encontrada.' });
      }
      const prevCita = prevCheck.rows[0];

      const updateQuery = `
        UPDATE citas
        SET cliente_id = COALESCE($1, cliente_id),
            cliente_nombre = COALESCE($2, cliente_nombre),
            capacitador_id = COALESCE($3, capacitador_id),
            fecha = COALESCE($4, fecha),
            hora_inicio = COALESCE($5, hora_inicio),
            hora_fin = COALESCE($6, hora_fin),
            horas = COALESCE($7, horas),
            modalidad = COALESCE($8, modalidad),
            tipo_servicio = COALESCE($9, tipo_servicio),
            estado = COALESCE($10, estado),
            observaciones = COALESCE($11, observaciones),
            bitacora = COALESCE($12, bitacora),
            firma_cliente = COALESCE($13, firma_cliente),
            firmante_nombre = COALESCE($14, firmante_nombre),
            firmante_puesto = COALESCE($15, firmante_puesto),
            firmado_at = COALESCE($16, firmado_at)
        WHERE id = $17
        RETURNING 
          id, cliente_id, cliente_nombre, capacitador_id,
          TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha,
          TO_CHAR(hora_inicio, 'HH24:MI') AS hora_inicio,
          TO_CHAR(hora_fin, 'HH24:MI') AS hora_fin,
          horas::FLOAT AS horas, modalidad, tipo_servicio, estado, observaciones,
          bitacora, firma_cliente, firmante_nombre, firmante_puesto, firmado_at,
          created_at, updated_at
      `;

      const result = await db.pool.query(updateQuery, [
        cliente_id || null,
        cliente_nombre ? cliente_nombre.trim() : null,
        capacitador_id,
        fecha,
        hora_inicio,
        hora_fin,
        horasFinal,
        modalidad,
        tipo_servicio,
        estadoFinal,
        obs,
        bitacora !== undefined ? bitacora : null,
        firma_cliente !== undefined ? firma_cliente : null,
        firmante_nombre !== undefined ? firmante_nombre : null,
        firmante_puesto !== undefined ? firmante_puesto : null,
        firmado_at !== undefined ? firmado_at : null,
        id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Cita no encontrada.' });
      }

      const { accion, detalles } = resolverAccionAuditoria(prevCita, {
        fecha,
        hora_inicio,
        hora_fin,
        estadoFinal,
        obs,
        firma_cliente,
        firmante_nombre,
        firmante_puesto,
        horasFinal,
        modalidad,
        tipo_servicio
      });

      await db.registrarAuditoria({
        cita_id: id,
        accion,
        usuario: 'Administrador',
        detalles,
        ip_origen: req.ip || req.headers['x-forwarded-for']
      });

      return res.json(result.rows[0]);
    }

    // Modo respaldo
    const cita = db.mockStore.citas.find(c => c.id === parseInt(id, 10));
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada.' });
    const prevCita = { ...cita };

    if (cliente_nombre !== undefined) cita.cliente_nombre = cliente_nombre.trim();
    if (capacitador_id !== undefined) cita.capacitador_id = parseInt(capacitador_id, 10);
    if (fecha !== undefined) cita.fecha = fecha;
    if (hora_inicio !== undefined) cita.hora_inicio = hora_inicio;
    if (hora_fin !== undefined) cita.hora_fin = hora_fin;
    if (horasFinal !== undefined) cita.horas = horasFinal;
    if (modalidad !== undefined) cita.modalidad = modalidad;
    if (tipo_servicio !== undefined) cita.tipo_servicio = tipo_servicio;
    if (estadoFinal !== undefined) cita.estado = estadoFinal;
    if (obs !== undefined) cita.observaciones = obs;
    if (bitacora !== undefined) cita.bitacora = bitacora;
    if (firma_cliente !== undefined) cita.firma_cliente = firma_cliente;
    if (firmante_nombre !== undefined) cita.firmante_nombre = firmante_nombre;
    if (firmante_puesto !== undefined) cita.firmante_puesto = firmante_puesto;
    if (firmado_at !== undefined) cita.firmado_at = firmado_at;

    const { accion, detalles } = resolverAccionAuditoria(prevCita, {
      fecha,
      hora_inicio,
      hora_fin,
      estadoFinal,
      obs,
      firma_cliente,
      firmante_nombre,
      firmante_puesto,
      horasFinal,
      modalidad,
      tipo_servicio
    });

    await db.registrarAuditoria({
      cita_id: id,
      accion,
      usuario: 'Administrador',
      detalles,
      ip_origen: req.ip || req.headers['x-forwarded-for']
    });

    const cap = db.mockStore.capacitadores.find(cp => cp.id === cita.capacitador_id) || {};

    return res.json({
      ...cita,
      cliente_nombre: cita.cliente_nombre,
      capacitador_nombre: cap.nombre_completo,
      capacitador_iniciales: cap.iniciales,
      capacitador_color: cap.color
    });
  } catch (error) {
    next(error);
  }
}

// Eliminar cita
async function deleteCita(req, res, next) {
  try {
    const { id } = req.params;

    if (db.isPostgresConnected()) {
      const result = await db.pool.query('DELETE FROM citas WHERE id = $1 RETURNING id, cliente_nombre, fecha', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Cita no encontrada.' });
      }
      await db.registrarAuditoria({
        cita_id: id,
        accion: 'ELIMINACION',
        usuario: 'Administrador',
        detalles: { cliente: result.rows[0].cliente_nombre, fecha: result.rows[0].fecha },
        ip_origen: req.ip || req.headers['x-forwarded-for']
      });
      return res.json({ message: 'Cita eliminada correctamente.', id: result.rows[0].id });
    }

    const index = db.mockStore.citas.findIndex(c => c.id === parseInt(id, 10));
    if (index === -1) {
      return res.status(404).json({ message: 'Cita no encontrada.' });
    }

    const deletedCita = db.mockStore.citas[index];
    db.mockStore.citas.splice(index, 1);

    await db.registrarAuditoria({
      cita_id: id,
      accion: 'ELIMINACION',
      usuario: 'Administrador',
      detalles: { cliente: deletedCita.cliente_nombre, fecha: deletedCita.fecha },
      ip_origen: req.ip || req.headers['x-forwarded-for']
    });

    return res.json({ message: 'Cita eliminada correctamente.', id });
  } catch (error) {
    next(error);
  }
}

// Consultar trazabilidad / historial de auditoría de una cita
async function getCitaAuditoria(req, res, next) {
  try {
    const { id } = req.params;
    const historial = await db.obtenerAuditoriaPorCita(id);
    return res.json(historial);
  } catch (error) {
    next(error);
  }
}

// Importación masiva por lote desde Excel o migración
async function importarLoteCitas(req, res, next) {
  try {
    const { citas, mes, replaceExistingMonth = true, createMissingClients = true } = req.body;

    if (!Array.isArray(citas) || citas.length === 0) {
      return res.status(400).json({
        message: 'No se recibieron citas válidas para importar.'
      });
    }

    // Identificar los meses afectados (ej. "2026-06")
    const targetMonths = new Set();
    if (mes && /^\d{4}-\d{2}$/.test(mes)) {
      targetMonths.add(mes);
    }
    citas.forEach(c => {
      if (c.fecha && String(c.fecha).length >= 7) {
        targetMonths.add(String(c.fecha).slice(0, 7));
      }
    });

    // 1. Si replaceExistingMonth es true, limpiar las citas existentes de los meses objetivo
    if (replaceExistingMonth && targetMonths.size > 0) {
      const monthList = Array.from(targetMonths);
      if (db.isPostgresConnected()) {
        try {
          for (const m of monthList) {
            await db.pool.query(
              `DELETE FROM citas WHERE TO_CHAR(fecha, 'YYYY-MM') = $1`,
              [m]
            );
          }
        } catch (delErr) {
          console.warn('⚠️ [Import] Error al limpiar citas existentes en PostgreSQL:', delErr.message);
        }
      }
      // Limpiar en mockStore
      db.mockStore.citas = db.mockStore.citas.filter(c => !targetMonths.has(String(c.fecha).slice(0, 7)));
    }

    // 2. Resolver catálogo de clientes (buscar existentes o crear faltantes)
    let existingClients = [];
    if (db.isPostgresConnected()) {
      try {
        const clientsRes = await db.pool.query('SELECT id, nombre_empresa, alias, correlativo FROM clientes');
        existingClients = clientsRes.rows;
      } catch (_) {
        existingClients = db.mockStore.clientes;
      }
    } else {
      existingClients = db.mockStore.clientes;
    }

    // Mapa auxiliar normalizado para búsqueda rápida de clientes
    const findClientMatch = (name) => {
      if (!name) return null;
      const cleanName = String(name).trim().toUpperCase();
      return existingClients.find(ec => {
        const emp = (ec.nombre_empresa || '').toUpperCase();
        const ali = (ec.alias || '').toUpperCase();
        return emp === cleanName || ali === cleanName || cleanName.includes(emp) || emp.includes(cleanName);
      });
    };

    const clientMapCache = new Map();
    let nextCliSeq = existingClients.length + 1;

    // 3. Procesar e insertar citas
    let insertedCount = 0;
    let totalHorasImportadas = 0;
    const insertedCitasList = [];

    for (const item of citas) {
      const horasNum = parseFloat(item.horas || 0);
      if (isNaN(horasNum) || horasNum <= 0) continue; // Excluir 0 horas

      const rawCliName = (item.cliente_nombre || '').trim() || 'Cliente General';
      let resolvedClientId = item.cliente_id ? parseInt(item.cliente_id, 10) : null;
      let resolvedClientName = rawCliName;

      if (!resolvedClientId) {
        if (clientMapCache.has(rawCliName.toUpperCase())) {
          const cached = clientMapCache.get(rawCliName.toUpperCase());
          resolvedClientId = cached.id;
          resolvedClientName = cached.nombre_empresa;
        } else {
          const matched = findClientMatch(rawCliName);
          if (matched) {
            resolvedClientId = matched.id;
            resolvedClientName = matched.nombre_empresa;
            clientMapCache.set(rawCliName.toUpperCase(), matched);
          } else if (createMissingClients) {
            // Auto-crear nuevo cliente
            const newCorrelativo = `CLI-${String(nextCliSeq).padStart(3, '0')}`;
            nextCliSeq++;
            let createdCli = null;

            if (db.isPostgresConnected()) {
              try {
                const insCli = await db.pool.query(
                  `INSERT INTO clientes (correlativo, nombre_empresa, alias, direccion, contacto, telefono, email, activo)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, true)
                   RETURNING id, correlativo, nombre_empresa`,
                  [newCorrelativo, rawCliName, rawCliName, 'Oficinas Centrales', 'Contacto Principal', '2222-0000', 'contacto@empresa.com']
                );
                createdCli = insCli.rows[0];
              } catch (_) {}
            }

            if (!createdCli) {
              createdCli = {
                id: db.mockStore.nextIds.clientes++,
                correlativo: newCorrelativo,
                nombre_empresa: rawCliName,
                alias: rawCliName,
                direccion: 'Oficinas Centrales',
                contacto: 'Contacto Principal',
                telefono: '2222-0000',
                email: 'contacto@empresa.com',
                activo: true
              };
              db.mockStore.clientes.push(createdCli);
            }

            existingClients.push(createdCli);
            clientMapCache.set(rawCliName.toUpperCase(), createdCli);
            resolvedClientId = createdCli.id;
            resolvedClientName = createdCli.nombre_empresa;
          }
        }
      }

      const estadoFinal = item.estado === 'Impartida' ? 'Impartida' : 'Programada';
      const obs = (item.observaciones || item.tipo_servicio || '').trim();
      const bitacoraFinal = item.bitacora || (estadoFinal === 'Impartida' ? `Servicio impartido conforme a programación AD-RE-11: ${obs}` : null);
      const capId = parseInt(item.capacitador_id, 10) || 2; // Por defecto Oscar Quan (ID 2) si no se especifica
      const mod = ['Presencial', 'Virtual', 'Híbrida'].includes(item.modalidad) ? item.modalidad : 'Presencial';
      const serv = (item.tipo_servicio || 'Asesoría').trim();
      const hIni = item.hora_inicio || '08:00';
      const hFin = item.hora_fin || '12:00';

      let newCitaId = null;

      if (db.isPostgresConnected()) {
        try {
          const insertQuery = `
            INSERT INTO citas (
              cliente_id, cliente_nombre, capacitador_id, fecha, hora_inicio, hora_fin, 
              horas, modalidad, tipo_servicio, estado, observaciones, bitacora
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
          `;
          const insRes = await db.pool.query(insertQuery, [
            resolvedClientId || null,
            resolvedClientName,
            capId,
            item.fecha,
            hIni,
            hFin,
            horasNum,
            mod,
            serv,
            estadoFinal,
            obs || null,
            bitacoraFinal
          ]);
          newCitaId = insRes.rows[0].id;
        } catch (insErr) {
          console.warn('⚠️ [Import] Error al insertar en PostgreSQL, manteniendo en mockStore:', insErr.message);
        }
      }

      if (!newCitaId) {
        newCitaId = db.mockStore.nextIds.citas++;
      }

      // Sincronizar en mockStore
      const mockEntry = {
        id: newCitaId,
        cliente_id: resolvedClientId || null,
        cliente_nombre: resolvedClientName,
        capacitador_id: capId,
        fecha: item.fecha,
        hora_inicio: hIni,
        hora_fin: hFin,
        horas: horasNum,
        modalidad: mod,
        tipo_servicio: serv,
        estado: estadoFinal,
        observaciones: obs,
        bitacora: bitacoraFinal
      };
      db.mockStore.citas.push(mockEntry);

      insertedCitasList.push(mockEntry);
      insertedCount++;
      totalHorasImportadas += horasNum;
    }

    // Registrar auditoría del lote
    try {
      await db.registrarAuditoria({
        cita_id: null,
        accion: 'IMPORTACION_LOTE_EXCEL',
        usuario: 'Administrador',
        detalles: {
          meses: Array.from(targetMonths).join(', '),
          citasImportadas: insertedCount,
          totalHoras: totalHorasImportadas
        },
        ip_origen: req.ip || req.headers['x-forwarded-for']
      });
    } catch (_) {}

    return res.status(201).json({
      success: true,
      count: insertedCount,
      totalHoras: parseFloat(totalHorasImportadas.toFixed(2)),
      meses: Array.from(targetMonths),
      message: `Se importaron exitosamente ${insertedCount} citas (${totalHorasImportadas.toFixed(2)} horas).`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCitas,
  getCitaById,
  createCita,
  updateCita,
  deleteCita,
  getCitaAuditoria,
  importarLoteCitas
};
