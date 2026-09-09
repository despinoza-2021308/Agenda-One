const db = require('../config/db');

// Obtener todos los clientes
async function getClientes(req, res, next) {
  try {
    if (db.isPostgresConnected()) {
      const result = await db.pool.query(
        'SELECT id, nombre_empresa, contacto, telefono, correo, activo, created_at FROM clientes ORDER BY nombre_empresa ASC'
      );
      return res.json(result.rows);
    }

    const data = [...db.mockStore.clientes].sort((a, b) => a.nombre_empresa.localeCompare(b.nombre_empresa));
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

// Obtener cliente por ID
async function getClienteById(req, res, next) {
  try {
    const { id } = req.params;
    if (db.isPostgresConnected()) {
      const result = await db.pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }
      return res.json(result.rows[0]);
    }

    const item = db.mockStore.clientes.find(c => c.id === parseInt(id, 10));
    if (!item) return res.status(404).json({ message: 'Cliente no encontrado' });
    return res.json(item);
  } catch (error) {
    next(error);
  }
}

// Crear cliente
async function createCliente(req, res, next) {
  try {
    const { nombre_empresa, contacto, telefono, correo } = req.body;

    if (!nombre_empresa || !nombre_empresa.trim()) {
      return res.status(400).json({ message: 'El nombre de la empresa es requerido.' });
    }

    const cleanNombre = nombre_empresa.trim();

    if (db.isPostgresConnected()) {
      const exists = await db.pool.query('SELECT id FROM clientes WHERE LOWER(nombre_empresa) = LOWER($1)', [cleanNombre]);
      if (exists.rows.length > 0) {
        return res.status(400).json({ message: 'Ya existe una empresa registrada con ese nombre.' });
      }

      const result = await db.pool.query(
        'INSERT INTO clientes (nombre_empresa, contacto, telefono, correo) VALUES ($1, $2, $3, $4) RETURNING *',
        [cleanNombre, contacto?.trim() || null, telefono?.trim() || null, correo?.trim() || null]
      );
      return res.status(201).json(result.rows[0]);
    }

    // Modo respaldo
    const exists = db.mockStore.clientes.some(c => c.nombre_empresa.toLowerCase() === cleanNombre.toLowerCase());
    if (exists) {
      return res.status(400).json({ message: 'Ya existe una empresa registrada con ese nombre.' });
    }

    const newCliente = {
      id: db.mockStore.nextIds.clientes++,
      nombre_empresa: cleanNombre,
      contacto: contacto?.trim() || '',
      telefono: telefono?.trim() || '',
      correo: correo?.trim() || '',
      activo: true,
      created_at: new Date()
    };
    db.mockStore.clientes.push(newCliente);
    return res.status(201).json(newCliente);
  } catch (error) {
    next(error);
  }
}

// Actualizar cliente
async function updateCliente(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre_empresa, contacto, telefono, correo, activo } = req.body;

    if (db.isPostgresConnected()) {
      if (nombre_empresa) {
        const check = await db.pool.query(
          'SELECT id FROM clientes WHERE LOWER(nombre_empresa) = LOWER($1) AND id <> $2',
          [nombre_empresa.trim(), id]
        );
        if (check.rows.length > 0) {
          return res.status(400).json({ message: 'Ya existe otro cliente con ese nombre de empresa.' });
        }
      }

      const result = await db.pool.query(
        `UPDATE clientes
         SET nombre_empresa = COALESCE($1, nombre_empresa),
             contacto = COALESCE($2, contacto),
             telefono = COALESCE($3, telefono),
             correo = COALESCE($4, correo),
             activo = COALESCE($5, activo)
         WHERE id = $6 RETURNING *`,
        [nombre_empresa?.trim(), contacto?.trim(), telefono?.trim(), correo?.trim(), activo, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }
      return res.json(result.rows[0]);
    }

    // Modo respaldo
    const cliente = db.mockStore.clientes.find(c => c.id === parseInt(id, 10));
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });

    if (nombre_empresa) cliente.nombre_empresa = nombre_empresa.trim();
    if (contacto !== undefined) cliente.contacto = contacto.trim();
    if (telefono !== undefined) cliente.telefono = telefono.trim();
    if (correo !== undefined) cliente.correo = correo.trim();
    if (activo !== undefined) cliente.activo = activo;

    return res.json(cliente);
  } catch (error) {
    next(error);
  }
}

// Eliminar / Desactivar cliente
async function deleteCliente(req, res, next) {
  try {
    const { id } = req.params;

    if (db.isPostgresConnected()) {
      const citasCount = await db.pool.query('SELECT COUNT(*) FROM citas WHERE cliente_id = $1', [id]);
      if (parseInt(citasCount.rows[0].count, 10) > 0) {
        await db.pool.query('UPDATE clientes SET activo = FALSE WHERE id = $1', [id]);
        return res.json({ message: 'Cliente desactivado (mantiene histórico de citas).' });
      }
      await db.pool.query('DELETE FROM clientes WHERE id = $1', [id]);
      return res.json({ message: 'Cliente eliminado correctamente.' });
    }

    // Modo respaldo
    const hasCitas = db.mockStore.citas.some(ci => ci.cliente_id === parseInt(id, 10));
    if (hasCitas) {
      const cli = db.mockStore.clientes.find(c => c.id === parseInt(id, 10));
      if (cli) cli.activo = false;
      return res.json({ message: 'Cliente desactivado (mantiene histórico de citas).' });
    }

    db.mockStore.clientes = db.mockStore.clientes.filter(c => c.id !== parseInt(id, 10));
    return res.json({ message: 'Cliente eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente
};
