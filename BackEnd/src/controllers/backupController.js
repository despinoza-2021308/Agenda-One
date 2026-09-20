const db = require('../config/db');

/**
 * Genera y descarga una copia de seguridad integral en formato JSON estructurado
 */
async function exportBackup(req, res, next) {
  try {
    const timestamp = new Date().toISOString();
    const dateStr = timestamp.split('T')[0];

    let capacitadores = [];
    let clientes = [];
    let citas = [];
    let auditoria = [];

    if (db.isPostgresConnected()) {
      const capsRes = await db.pool.query(
        'SELECT id, nombre_completo, iniciales, color, telefono, COALESCE(tarifa_hora, 150.00)::FLOAT AS tarifa_hora, pin, activo, created_at FROM capacitadores ORDER BY id ASC'
      );
      capacitadores = capsRes.rows;

      const cliRes = await db.pool.query(
        'SELECT id, nombre_empresa, contacto, telefono, correo, direccion, facturacion, activo, created_at FROM clientes ORDER BY id ASC'
      );
      clientes = cliRes.rows;

      const citasRes = await db.pool.query(`
        SELECT 
          id, cliente_id, cliente_nombre, capacitador_id,
          TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha,
          TO_CHAR(hora_inicio, 'HH24:MI') AS hora_inicio,
          TO_CHAR(hora_fin, 'HH24:MI') AS hora_fin,
          horas::FLOAT AS horas,
          modalidad, tipo_servicio, estado,
          observaciones, bitacora, firma_cliente,
          firmante_nombre, firmante_puesto, firmado_at,
          COALESCE(tarifa_hora, 150.00)::FLOAT AS tarifa_hora,
          deleted_at, created_at, updated_at
        FROM citas
        ORDER BY id ASC
      `);
      citas = citasRes.rows;

      try {
        const auditRes = await db.pool.query(
          'SELECT id, cita_id, accion, usuario, detalles, ip_origen, created_at FROM auditoria_citas ORDER BY id ASC'
        );
        auditoria = auditRes.rows;
      } catch (auditErr) {
        console.warn('⚠️ [Backup] Aviso al consultar auditoria_citas:', auditErr.message);
        auditoria = [];
      }
    } else {
      // Modo respaldo en memoria
      capacitadores = db.mockStore.capacitadores || [];
      clientes = db.mockStore.clientes || [];
      citas = db.mockStore.citas || [];
      auditoria = db.mockStore.auditoria_citas || [];
    }

    const backupPayload = {
      system: 'Agenda-One (Modelo AD-RE-11)',
      version: '1.0.4',
      generated_at: timestamp,
      created_by: req.adminUser?.user || 'Administrador',
      stats: {
        total_capacitadores: capacitadores.length,
        total_clientes: clientes.length,
        total_citas: citas.length,
        total_citas_activas: citas.filter(c => !c.deleted_at).length,
        total_citas_eliminadas: citas.filter(c => !!c.deleted_at).length,
        total_auditorias: auditoria.length
      },
      data: {
        capacitadores,
        clientes,
        citas,
        auditoria
      }
    };

    const fileName = `backup_agenda_one_${dateStr}_${Date.now().toString().slice(-6)}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.json(backupPayload);
  } catch (error) {
    next(error);
  }
}

/**
 * Restaura la base de datos a partir de un archivo de respaldo JSON estructurado
 */
async function restoreBackup(req, res, next) {
  try {
    const backupData = req.body;

    if (!backupData || !backupData.data) {
      return res.status(400).json({
        error: true,
        message: 'Archivo de respaldo inválido: No se encontró la estructura de datos requerida.'
      });
    }

    const { capacitadores = [], clientes = [], citas = [] } = backupData.data;

    if (!Array.isArray(citas) || !Array.isArray(clientes) || !Array.isArray(capacitadores)) {
      return res.status(400).json({
        error: true,
        message: 'El archivo de respaldo no contiene colecciones válidas de citas o catálogos.'
      });
    }

    if (db.isPostgresConnected()) {
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        // 1. Restaurar / Upsert Capacitadores
        for (const cap of capacitadores) {
          if (!cap.iniciales || !cap.nombre_completo) continue;
          await client.query(`
            INSERT INTO capacitadores (nombre_completo, iniciales, color, telefono, tarifa_hora, pin, activo)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (iniciales) DO UPDATE SET
              nombre_completo = EXCLUDED.nombre_completo,
              color = EXCLUDED.color,
              telefono = COALESCE(EXCLUDED.telefono, capacitadores.telefono),
              tarifa_hora = COALESCE(EXCLUDED.tarifa_hora, capacitadores.tarifa_hora),
              pin = COALESCE(EXCLUDED.pin, capacitadores.pin),
              activo = EXCLUDED.activo
          `, [
            cap.nombre_completo,
            cap.iniciales,
            cap.color || '#3B82F6',
            cap.telefono || null,
            cap.tarifa_hora || 150.00,
            cap.pin || null,
            cap.activo !== false
          ]);
        }

        // 2. Restaurar / Upsert Clientes
        for (const cli of clientes) {
          if (!cli.nombre_empresa) continue;
          await client.query(`
            INSERT INTO clientes (nombre_empresa, contacto, telefono, correo, direccion, facturacion, activo)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (nombre_empresa) DO UPDATE SET
              contacto = COALESCE(EXCLUDED.contacto, clientes.contacto),
              telefono = COALESCE(EXCLUDED.telefono, clientes.telefono),
              correo = COALESCE(EXCLUDED.correo, clientes.correo),
              direccion = COALESCE(EXCLUDED.direccion, clientes.direccion),
              facturacion = COALESCE(EXCLUDED.facturacion, clientes.facturacion),
              activo = EXCLUDED.activo
          `, [
            cli.nombre_empresa,
            cli.contacto || null,
            cli.telefono || null,
            cli.correo || null,
            cli.direccion || null,
            cli.facturacion || null,
            cli.activo !== false
          ]);
        }

        // 3. Restaurar Citas
        let restoredCitasCount = 0;
        for (const c of citas) {
          if (!c.fecha || !c.hora_inicio || !c.hora_fin) continue;

          // Resolver ID del capacitador por iniciales o por ID
          let capId = c.capacitador_id;
          if (c.capacitador_iniciales) {
            const fCap = await client.query('SELECT id FROM capacitadores WHERE iniciales = $1', [c.capacitador_iniciales]);
            if (fCap.rows.length > 0) capId = fCap.rows[0].id;
          }

          // Resolver ID del cliente si existe
          let cliId = c.cliente_id || null;
          if (!cliId && c.cliente_nombre) {
            const fCli = await client.query('SELECT id FROM clientes WHERE nombre_empresa = $1', [c.cliente_nombre]);
            if (fCli.rows.length > 0) cliId = fCli.rows[0].id;
          }

          if (!capId) continue;

          await client.query(`
            INSERT INTO citas (
              cliente_id, cliente_nombre, capacitador_id, fecha, hora_inicio, hora_fin,
              horas, modalidad, tipo_servicio, estado, observaciones, bitacora,
              firma_cliente, firmante_nombre, firmante_puesto, firmado_at,
              tarifa_hora, deleted_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
            )
          `, [
            cliId,
            c.cliente_nombre || 'Cliente General',
            capId,
            c.fecha,
            c.hora_inicio,
            c.hora_fin,
            c.horas || 1,
            c.modalidad || 'Presencial',
            c.tipo_servicio || 'Capacitación',
            c.estado || 'Programada',
            c.observaciones || null,
            c.bitacora || null,
            c.firma_cliente || null,
            c.firmante_nombre || null,
            c.firmante_puesto || null,
            c.firmado_at || null,
            c.tarifa_hora || 150.00,
            c.deleted_at || null
          ]);
          restoredCitasCount++;
        }

        await client.query('COMMIT');
        client.release();

        return res.json({
          success: true,
          message: `Restauración completada con éxito. Se sincronizaron ${capacitadores.length} capacitadores, ${clientes.length} clientes y ${restoredCitasCount} citas.`,
          stats: {
            capacitadores: capacitadores.length,
            clientes: clientes.length,
            citas: restoredCitasCount
          }
        });
      } catch (dbErr) {
        await client.query('ROLLBACK');
        client.release();
        throw dbErr;
      }
    }

    // Modo respaldo en memoria
    return res.json({
      success: true,
      message: 'Restauración simulada en memoria completada.',
      stats: {
        capacitadores: capacitadores.length,
        clientes: clientes.length,
        citas: citas.length
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  exportBackup,
  restoreBackup
};
