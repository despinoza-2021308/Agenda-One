const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Pruebas de Papelera (Soft Delete), Restauración y Exportación de Backup', () => {
  let server;
  let baseUrl;
  let adminToken;
  let testCitaId;

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // Obtener token de Administrador
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: process.env.ADMIN_PIN || 'OneCon2026' })
    });
    const loginData = await loginRes.json();
    adminToken = loginData.token;

    // Crear una cita de prueba para los tests de soft delete y restauración
    const citaRes = await fetch(`${baseUrl}/api/citas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        cliente_nombre: 'Empresa Test Backup S.A.',
        capacitador_id: 1,
        fecha: '2026-10-15',
        hora_inicio: '10:00',
        hora_fin: '12:00',
        horas: 2.0,
        modalidad: 'Presencial',
        tipo_servicio: 'Capacitación Respaldo',
        estado: 'Programada'
      })
    });
    const citaData = await citaRes.json();
    testCitaId = citaData.id;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (db.pool && typeof db.pool.end === 'function') {
      try {
        await db.pool.end();
      } catch (_) {}
    }
  });

  it('DELETE /api/citas/:id debe mover la cita a la papelera (Soft Delete)', async () => {
    const res = await fetch(`${baseUrl}/api/citas/${testCitaId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.match(data.message, /papelera/i);
  });

  it('GET /api/citas NO debe listar citas eliminadas por defecto', async () => {
    const res = await fetch(`${baseUrl}/api/citas?start_date=2026-10-01&end_date=2026-10-31`);
    assert.strictEqual(res.status, 200);
    const citas = await res.json();
    const found = citas.find(c => c.id === testCitaId);
    assert.strictEqual(found, undefined, 'La cita en papelera no debe aparecer en la lista activa');
  });

  it('GET /api/citas/eliminadas debe mostrar la cita en la papelera', async () => {
    const res = await fetch(`${baseUrl}/api/citas/eliminadas`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    assert.strictEqual(res.status, 200);
    const eliminadas = await res.json();
    const found = eliminadas.find(c => c.id === testCitaId);
    assert.ok(found, 'La cita eliminada debe aparecer en la papelera');
    assert.strictEqual(found.cliente_nombre, 'Empresa Test Backup S.A.');
  });

  it('POST /api/citas/:id/restaurar debe recuperar la cita al calendario activo', async () => {
    const res = await fetch(`${baseUrl}/api/citas/${testCitaId}/restaurar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.match(data.message, /restaurada exitosamente/i);

    // Verificar que reaparece en la lista de citas activas
    const checkRes = await fetch(`${baseUrl}/api/citas?start_date=2026-10-01&end_date=2026-10-31`);
    const citas = await checkRes.json();
    const found = citas.find(c => c.id === testCitaId);
    assert.ok(found, 'La cita restaurada debe reaparecer en la lista activa');
  });

  it('GET /api/backup/export sin token debe responder 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/backup/export`);
    assert.strictEqual(res.status, 401);
  });

  it('GET /api/backup/export con token debe generar un JSON estructurado completo', async () => {
    const res = await fetch(`${baseUrl}/api/backup/export`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get('content-type'), /application\/json/i);
    assert.match(res.headers.get('content-disposition'), /attachment; filename="backup_agenda_one_/i);

    const backup = await res.json();
    assert.ok(backup.system, 'Debe incluir el identificador del sistema');
    assert.ok(backup.stats, 'Debe incluir estadísticas de respaldo');
    assert.ok(backup.data, 'Debe incluir los datos');
    assert.ok(Array.isArray(backup.data.citas), 'Debe incluir array de citas');
    assert.ok(Array.isArray(backup.data.clientes), 'Debe incluir array de clientes');
    assert.ok(Array.isArray(backup.data.capacitadores), 'Debe incluir array de capacitadores');
  });
});
