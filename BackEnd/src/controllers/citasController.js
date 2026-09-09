const db = require('../config/db');
const { calcularHorasDecimales } = require('../utils/timeUtils');

// Obtener citas con filtros opcionales (rango de fechas, capacitador, cliente)
async function getCitas(req, res, next) {
  try {
    const { start_date, end_date, capacitador_id, cliente_id, month, year } = req.query;

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

      query += ` ORDER BY c.fecha ASC, c.hora_inicio ASC`;

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

    citas.sort((a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio));
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
          c.modalidad, c.tipo_servicio, c.observaciones
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
    const obs = (descripcion || observaciones || '').trim();

    if (db.isPostgresConnected()) {
      const insertQuery = `
        INSERT INTO citas (
          cliente_id, cliente_nombre, capacitador_id, fecha, hora_inicio, hora_fin, 
          horas, modalidad, tipo_servicio, observaciones
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
      observaciones,
      descripcion
    } = req.body;

    let horasFinal = horas !== undefined ? parseFloat(horas) : undefined;
    if (horasFinal === undefined && hora_inicio && hora_fin) {
      horasFinal = calcularHorasDecimales(hora_inicio, hora_fin);
    }

    const obs = descripcion !== undefined ? descripcion : observaciones;

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
            observaciones = COALESCE($10, observaciones)
        WHERE id = $11
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
