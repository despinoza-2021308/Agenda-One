const db = require('../config/db');
const { validarTelefono } = require('../utils/timeUtils');
const { generateSecurePin, isWeakPin } = require('../utils/tokenUtils');
const { checkAdminCredential } = require('../middlewares/auth');

// Obtener todos los capacitadores (PIN y tarifa_hora solo visibles para Administrador)
async function getCapacitadores(req, res, next) {
  try {
    const isAdmin = !!checkAdminCredential(req);

    if (db.isPostgresConnected()) {
      const result = await db.pool.query(
        'SELECT id, nombre_completo, iniciales, color, telefono, COALESCE(tarifa_hora, 150.00)::FLOAT AS tarifa_hora, pin, activo, created_at FROM capacitadores ORDER BY nombre_completo ASC'
      );
      
      if (!isAdmin) {
        return res.json(result.rows.map(c => ({
          id: c.id,
          nombre_completo: c.nombre_completo,
          iniciales: c.iniciales,
          color: c.color,
          activo: c.activo
        })));
      }
      return res.json(result.rows);
    }

    // Modo respaldo en memoria
    const data = [...db.mockStore.capacitadores]
      .map(c => ({ ...c, tarifa_hora: Number(c.tarifa_hora || 150.00) }))
      .sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));

    if (!isAdmin) {
      return res.json(data.map(c => ({
        id: c.id,
        nombre_completo: c.nombre_completo,
        iniciales: c.iniciales,
        color: c.color,
        activo: c.activo
      })));
    }

    return res.json(data);
  } catch (error) {
    next(error);
  }
}

// Obtener capacitador por ID
async function getCapacitadorById(req, res, next) {
  try {
    const { id } = req.params;
    const isAdmin = !!checkAdminCredential(req);

    if (db.isPostgresConnected()) {
      const result = await db.pool.query(
        'SELECT id, nombre_completo, iniciales, color, telefono, COALESCE(tarifa_hora, 150.00)::FLOAT AS tarifa_hora, pin, activo, created_at FROM capacitadores WHERE id = $1',
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Capacitador no encontrado' });
      }
      const cap = result.rows[0];
      if (!isAdmin) {
        return res.json({
          id: cap.id,
          nombre_completo: cap.nombre_completo,
          iniciales: cap.iniciales,
          color: cap.color,
          activo: cap.activo
        });
      }
      return res.json(cap);
    }

    const item = db.mockStore.capacitadores.find(c => c.id === parseInt(id, 10));
    if (!item) return res.status(404).json({ message: 'Capacitador no encontrado' });
    const cap = { ...item, tarifa_hora: Number(item.tarifa_hora || 150.00) };
    if (!isAdmin) {
      return res.json({
        id: cap.id,
        nombre_completo: cap.nombre_completo,
        iniciales: cap.iniciales,
        color: cap.color,
        activo: cap.activo
      });
    }
    return res.json(cap);
  } catch (error) {
    next(error);
  }
}

// Crear nuevo capacitador
async function createCapacitador(req, res, next) {
  try {
    const { nombre_completo, iniciales, color, telefono, tarifa_hora, pin } = req.body;

    if (!nombre_completo || !iniciales) {
      return res.status(400).json({ message: 'El nombre completo y las iniciales son requeridos.' });
    }

    const cleanNombre = nombre_completo.trim();
    if (cleanNombre.length < 3 || cleanNombre.length > 100) {
      return res.status(400).json({ message: 'El nombre del capacitador debe tener entre 3 y 100 caracteres.' });
    }

    const cleanInitials = iniciales.trim().toUpperCase();
    if (!/^[A-Z0-9]{2,4}$/.test(cleanInitials)) {
      return res.status(400).json({ message: 'Las iniciales deben contener entre 2 y 4 caracteres alfanuméricos en mayúsculas (ej: DE, CP1).' });
    }

    const cleanColor = color ? color.trim() : '#3B82F6';
    if (!/^#[0-9A-Fa-f]{6}$/.test(cleanColor)) {
      return res.status(400).json({ message: 'El color debe ser un código hexadecimal válido de 6 caracteres (ej: #3B82F6).' });
    }

    const cleanTel = telefono ? telefono.trim() : null;
    if (cleanTel && !validarTelefono(cleanTel)) {
      return res.status(400).json({ message: 'El teléfono debe contener al menos 8 dígitos numéricos válidos.' });
    }

    let cleanTarifa = 150.00;
    if (tarifa_hora !== undefined && tarifa_hora !== null && tarifa_hora !== '') {
      cleanTarifa = Number(tarifa_hora);
      if (isNaN(cleanTarifa) || cleanTarifa < 0) {
        return res.status(400).json({ message: 'La tarifa por hora debe ser un valor numérico mayor o igual a 0.' });
      }
    }

    // Validar o generar PIN seguro de 4 dígitos
    let cleanPin = null;
    if (pin !== undefined && pin !== null && String(pin).trim() !== '') {
      cleanPin = String(pin).trim();
      if (!/^\d{4}$/.test(cleanPin)) {
        return res.status(400).json({ message: 'El PIN debe contener exactamente 4 dígitos numéricos (ej: 8492).' });
      }
      if (isWeakPin(cleanPin)) {
        return res.status(400).json({ message: 'El PIN ingresado es débil o predecible (números consecutivos o repetidos). Elija un PIN seguro.' });
      }
    } else {
      cleanPin = generateSecurePin();
    }

    if (db.isPostgresConnected()) {
      const checkResult = await db.pool.query('SELECT id FROM capacitadores WHERE iniciales = $1', [cleanInitials]);
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ message: `Ya existe un capacitador con las iniciales '${cleanInitials}'.` });
      }

      const result = await db.pool.query(
        'INSERT INTO capacitadores (nombre_completo, iniciales, color, telefono, tarifa_hora, pin) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nombre_completo, iniciales, color, telefono, COALESCE(tarifa_hora, 150.00)::FLOAT AS tarifa_hora, pin, activo, created_at',
        [cleanNombre, cleanInitials, cleanColor, cleanTel, cleanTarifa, cleanPin]
      );
      return res.status(201).json(result.rows[0]);
    }

    // Modo respaldo
    const exists = db.mockStore.capacitadores.some(c => c.iniciales === cleanInitials);
    if (exists) {
      return res.status(400).json({ message: `Ya existe un capacitador con las iniciales '${cleanInitials}'.` });
    }

    const newCap = {
      id: db.mockStore.nextIds.capacitadores++,
      nombre_completo: cleanNombre,
      iniciales: cleanInitials,
      color: cleanColor,
      telefono: cleanTel || '',
      tarifa_hora: cleanTarifa,
      pin: cleanPin,
      activo: true,
      created_at: new Date()
    };
    db.mockStore.capacitadores.push(newCap);
    return res.status(201).json(newCap);
  } catch (error) {
    next(error);
  }
}

// Actualizar capacitador
async function updateCapacitador(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre_completo, iniciales, color, telefono, tarifa_hora, activo, pin } = req.body;

    const cleanNombre = nombre_completo !== undefined ? nombre_completo.trim() : undefined;
    if (cleanNombre !== undefined && (cleanNombre.length < 3 || cleanNombre.length > 100)) {
      return res.status(400).json({ message: 'El nombre del capacitador debe tener entre 3 y 100 caracteres.' });
    }

    const cleanInitials = iniciales ? iniciales.trim().toUpperCase() : undefined;
    if (cleanInitials !== undefined && !/^[A-Z0-9]{2,4}$/.test(cleanInitials)) {
      return res.status(400).json({ message: 'Las iniciales deben contener entre 2 y 4 caracteres alfanuméricos en mayúsculas (ej: DE, CP1).' });
    }

    const cleanColor = color !== undefined ? color.trim() : undefined;
    if (cleanColor !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(cleanColor)) {
      return res.status(400).json({ message: 'El color debe ser un código hexadecimal válido de 6 caracteres (ej: #3B82F6).' });
    }

    const cleanTel = telefono !== undefined ? (telefono ? telefono.trim() : null) : undefined;
    if (cleanTel && !validarTelefono(cleanTel)) {
      return res.status(400).json({ message: 'El teléfono debe contener al menos 8 dígitos numéricos válidos.' });
    }

    let cleanTarifa = undefined;
    if (tarifa_hora !== undefined && tarifa_hora !== null && tarifa_hora !== '') {
      cleanTarifa = Number(tarifa_hora);
      if (isNaN(cleanTarifa) || cleanTarifa < 0) {
        return res.status(400).json({ message: 'La tarifa por hora debe ser un valor numérico mayor o igual a 0.' });
      }
    }

    let cleanPin = undefined;
    if (pin !== undefined && pin !== null && String(pin).trim() !== '') {
      cleanPin = String(pin).trim();
      if (!/^\d{4}$/.test(cleanPin)) {
        return res.status(400).json({ message: 'El PIN debe contener exactamente 4 dígitos numéricos (ej: 8492).' });
      }
      if (isWeakPin(cleanPin)) {
        return res.status(400).json({ message: 'El PIN ingresado es débil o predecible (números consecutivos o repetidos). Elija un PIN seguro.' });
      }
    }

    if (db.isPostgresConnected()) {
      if (cleanInitials) {
        const checkResult = await db.pool.query(
          'SELECT id FROM capacitadores WHERE iniciales = $1 AND id <> $2',
          [cleanInitials, id]
        );
        if (checkResult.rows.length > 0) {
          return res.status(400).json({ message: `Las iniciales '${cleanInitials}' ya están asignadas a otro capacitador.` });
        }
      }

      const result = await db.pool.query(
        `UPDATE capacitadores 
         SET nombre_completo = COALESCE($1, nombre_completo),
             iniciales = COALESCE($2, iniciales),
             color = COALESCE($3, color),
             telefono = COALESCE($4, telefono),
             tarifa_hora = COALESCE($5, tarifa_hora),
             activo = COALESCE($6, activo),
             pin = COALESCE($7, pin)
         WHERE id = $8 RETURNING id, nombre_completo, iniciales, color, telefono, COALESCE(tarifa_hora, 150.00)::FLOAT AS tarifa_hora, pin, activo, created_at`,
        [cleanNombre, cleanInitials, cleanColor, cleanTel, cleanTarifa, activo, cleanPin, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Capacitador no encontrado' });
      }
      return res.json(result.rows[0]);
    }

    // Modo respaldo
    const cap = db.mockStore.capacitadores.find(c => c.id === parseInt(id, 10));
    if (!cap) return res.status(404).json({ message: 'Capacitador no encontrado' });

    if (cleanInitials && cleanInitials !== cap.iniciales) {
      if (db.mockStore.capacitadores.some(c => c.iniciales === cleanInitials && c.id !== cap.id)) {
        return res.status(400).json({ message: `Las iniciales '${cleanInitials}' ya están en uso.` });
      }
      cap.iniciales = cleanInitials;
    }

    if (nombre_completo !== undefined) cap.nombre_completo = nombre_completo;
    if (color !== undefined) cap.color = color;
    if (telefono !== undefined) cap.telefono = telefono;
    if (cleanTarifa !== undefined) cap.tarifa_hora = cleanTarifa;
    if (activo !== undefined) cap.activo = activo;
    if (cleanPin !== undefined) cap.pin = cleanPin;

    return res.json({ ...cap, tarifa_hora: Number(cap.tarifa_hora || 150.00) });
  } catch (error) {
    next(error);
  }
}

// Eliminar / Desactivar capacitador
async function deleteCapacitador(req, res, next) {
  try {
    const { id } = req.params;

    if (db.isPostgresConnected()) {
      // Verificar si tiene citas asociadas
      const citasCount = await db.pool.query('SELECT COUNT(*) FROM citas WHERE capacitador_id = $1', [id]);
      if (parseInt(citasCount.rows[0].count, 10) > 0) {
        // Soft delete para mantener histórico
        await db.pool.query('UPDATE capacitadores SET activo = FALSE WHERE id = $1', [id]);
        return res.json({ message: 'Capacitador desactivado (conserva histórico de citas).' });
      }
      await db.pool.query('DELETE FROM capacitadores WHERE id = $1', [id]);
      return res.json({ message: 'Capacitador eliminado correctamente.' });
    }

    // Modo respaldo
    const hasCitas = db.mockStore.citas.some(ci => ci.capacitador_id === parseInt(id, 10));
    if (hasCitas) {
      const cap = db.mockStore.capacitadores.find(c => c.id === parseInt(id, 10));
      if (cap) cap.activo = false;
      return res.json({ message: 'Capacitador desactivado (conserva histórico de citas).' });
    }

    db.mockStore.capacitadores = db.mockStore.capacitadores.filter(c => c.id !== parseInt(id, 10));
    return res.json({ message: 'Capacitador eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCapacitadores,
  getCapacitadorById,
  createCapacitador,
  updateCapacitador,
  deleteCapacitador
};

