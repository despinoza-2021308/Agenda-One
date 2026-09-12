const db = require('../config/db');

// Obtener todos los capacitadores
async function getCapacitadores(req, res, next) {
  try {
    if (db.isPostgresConnected()) {
      const result = await db.pool.query(
        'SELECT id, nombre_completo, iniciales, color, telefono, activo, created_at FROM capacitadores ORDER BY nombre_completo ASC'
      );
      return res.json(result.rows);
    }

    // Modo respaldo en memoria
    const data = [...db.mockStore.capacitadores].sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

// Obtener capacitador por ID
async function getCapacitadorById(req, res, next) {
  try {
    const { id } = req.params;
    if (db.isPostgresConnected()) {
      const result = await db.pool.query('SELECT * FROM capacitadores WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Capacitador no encontrado' });
      }
      return res.json(result.rows[0]);
    }

    const item = db.mockStore.capacitadores.find(c => c.id === parseInt(id, 10));
    if (!item) return res.status(404).json({ message: 'Capacitador no encontrado' });
    return res.json(item);
  } catch (error) {
    next(error);
  }
}

// Crear nuevo capacitador
async function createCapacitador(req, res, next) {
  try {
    const { nombre_completo, iniciales, color, telefono } = req.body;

    if (!nombre_completo || !iniciales) {
      return res.status(400).json({ message: 'El nombre completo y las iniciales son requeridos.' });
    }

    const cleanInitials = iniciales.trim().toUpperCase();
    const cleanColor = color ? color.trim() : '#3B82F6';
    const cleanTel = telefono ? telefono.trim() : null;

    if (db.isPostgresConnected()) {
      const checkResult = await db.pool.query('SELECT id FROM capacitadores WHERE iniciales = $1', [cleanInitials]);
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ message: `Ya existe un capacitador con las iniciales '${cleanInitials}'.` });
      }

      const result = await db.pool.query(
        'INSERT INTO capacitadores (nombre_completo, iniciales, color, telefono) VALUES ($1, $2, $3, $4) RETURNING *',
        [nombre_completo.trim(), cleanInitials, cleanColor, cleanTel]
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
      nombre_completo: nombre_completo.trim(),
      iniciales: cleanInitials,
      color: cleanColor,
      telefono: cleanTel || '',
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
    const { nombre_completo, iniciales, color, telefono, activo } = req.body;

    const cleanInitials = iniciales ? iniciales.trim().toUpperCase() : undefined;
    const cleanTel = telefono !== undefined ? (telefono ? telefono.trim() : null) : undefined;

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
             activo = COALESCE($5, activo)
         WHERE id = $6 RETURNING *`,
        [nombre_completo, cleanInitials, color, cleanTel, activo, id]
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
    if (activo !== undefined) cap.activo = activo;

    return res.json(cap);
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
