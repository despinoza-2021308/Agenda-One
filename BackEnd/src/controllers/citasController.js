const db = require('../config/db');
const { calcularHorasDecimales } = require('../utils/timeUtils');

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

      if (month && year) {
        query += ` ORDER BY c.fecha ASC, c.hora_inicio ASC`;
      } else {
        query += ` ORDER BY c.fecha DESC, c.hora_inicio ASC`;
      }

      if (limit && !isNaN(parseInt(limit, 10))) {
        params.push(parseInt(limit, 10));
        query += ` LIMIT $${params.length}`;
      }

      const result = await db.pool.query(query, params);
      return res.json(result.rows);
    }

    // Modo respaldo en memoria
    let citas = db.mockStore.citas.map(c => {
      const cliente = db.mockStore.clientes.find(cli => cli.id === c.cliente_id) || {};
      const cap = db.mockStore.capacitadores.find(cp => cp.id === c.capacitador_id) || {};
      return {
        ...c,
        cliente_nombre: c.cliente_nombre || cliente.nombre_empresa || 'Cliente General',
        capacitador_nombre: cap.nombre_completo || 'Capacitador',
        capacitador_iniciales: cap.iniciales || '??',
        capacitador_color: cap.color || '#3B82F6',
        estado: c.estado || 'Programada',
        horas: Number(c.horas)
      };
    });

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
          c.observaciones
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
      horas: Number(c.horas)
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

    // Cálculo automático de horas si no fue provisto o es manual
    let horasCalculadas = horas ? parseFloat(horas) : calcularHorasDecimales(hora_inicio, hora_fin);
    if (isNaN(horasCalculadas) || horasCalculadas <= 0) {
      horasCalculadas = calcularHorasDecimales(hora_inicio, hora_fin);
    }

    const mod = modalidad || 'Presencial';
    const serv = tipo_servicio || 'Curso';
    const validEstados = ['Programada', 'En Curso', 'Impartida', 'Cancelada', 'Reprogramada'];
    const estadoFinal = validEstados.includes(estado) ? estado : 'Programada';
    const obs = (descripcion || observaciones || '').trim();

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
        RETURNING *
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

      return res.status(201).json(result.rows[0]);
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
      descripcion
    } = req.body;

    let horasFinal = horas !== undefined ? parseFloat(horas) : undefined;
    if (horasFinal === undefined && hora_inicio && hora_fin) {
      horasFinal = calcularHorasDecimales(hora_inicio, hora_fin);
    }

    const validEstados = ['Programada', 'En Curso', 'Impartida', 'Cancelada', 'Reprogramada'];
    const estadoFinal = estado !== undefined && validEstados.includes(estado) ? estado : undefined;

    const obs = descripcion !== undefined ? descripcion : observaciones;

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
            observaciones = COALESCE($11, observaciones)
        WHERE id = $12
        RETURNING *
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
        id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Cita no encontrada.' });
      }
      return res.json(result.rows[0]);
    }

    // Modo respaldo
    const cita = db.mockStore.citas.find(c => c.id === parseInt(id, 10));
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada.' });

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
      const result = await db.pool.query('DELETE FROM citas WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Cita no encontrada.' });
      }
      return res.json({ message: 'Cita eliminada correctamente.', id: result.rows[0].id });
    }

    const index = db.mockStore.citas.findIndex(c => c.id === parseInt(id, 10));
    if (index === -1) {
      return res.status(404).json({ message: 'Cita no encontrada.' });
    }

    db.mockStore.citas.splice(index, 1);
    return res.json({ message: 'Cita eliminada correctamente.', id });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCitas,
  getCitaById,
  createCita,
  updateCita,
  deleteCita
};
