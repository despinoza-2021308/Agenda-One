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

  it('DELETE /api/citas/:id/permanente debe eliminar la cita definitivamente de la papelera', async () => {
    // Primero enviamos la cita de prueba a la papelera (soft delete)
    await fetch(`${baseUrl}/api/citas/${testCitaId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    // Ahora ejecutamos la eliminación definitiva
    const res = await fetch(`${baseUrl}/api/citas/${testCitaId}/permanente`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.match(data.message, /definitivamente/i);

    // Verificar que ya no está en la papelera
    const papeleraRes = await fetch(`${baseUrl}/api/citas/eliminadas`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const eliminadas = await papeleraRes.json();
    const found = eliminadas.find(c => c.id === testCitaId);
    assert.strictEqual(found, undefined, 'La cita eliminada permanentemente no debe figurar en la papelera');

    // Intentar eliminarla de nuevo debe responder 404
    const retryRes = await fetch(`${baseUrl}/api/citas/${testCitaId}/permanente`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(retryRes.status, 404);
  });

  it('DELETE /api/citas/papelera/vaciar debe eliminar por completo todas las citas en papelera', async () => {
    // Crear dos citas y enviarlas a la papelera
    const c1Res = await fetch(`${baseUrl}/api/citas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        cliente_nombre: 'Empresa Vaciar 1',
        capacitador_id: 1,
        fecha: '2026-11-10',
        hora_inicio: '08:00',
        hora_fin: '10:00',
        horas: 2.0,
        modalidad: 'Virtual',
        tipo_servicio: 'Capacitación',
        estado: 'Programada'
      })
    });
    const c1 = await c1Res.json();

    const c2Res = await fetch(`${baseUrl}/api/citas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        cliente_nombre: 'Empresa Vaciar 2',
        capacitador_id: 2,
        fecha: '2026-11-11',
        hora_inicio: '10:00',
        hora_fin: '12:00',
        horas: 2.0,
        modalidad: 'Presencial',
        tipo_servicio: 'Asesoría',
        estado: 'Programada'
      })
    });
    const c2 = await c2Res.json();

    // Soft delete de ambas
    await fetch(`${baseUrl}/api/citas/${c1.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } });
    await fetch(`${baseUrl}/api/citas/${c2.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } });

    // Vaciar papelera
    const vaciarRes = await fetch(`${baseUrl}/api/citas/papelera/vaciar`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert.strictEqual(vaciarRes.status, 200);
    const vaciarData = await vaciarRes.json();
    assert.strictEqual(vaciarData.success, true);
    assert.ok(vaciarData.count >= 2, 'El contador debe reflejar al menos las 2 citas eliminadas');

    // La papelera debe estar vacía o sin esas dos citas
    const finalPapeleraRes = await fetch(`${baseUrl}/api/citas/eliminadas`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const finalPapelera = await finalPapeleraRes.json();
    assert.strictEqual(finalPapelera.find(c => c.id === c1.id), undefined);
    assert.strictEqual(finalPapelera.find(c => c.id === c2.id), undefined);
  });

  it('Conflicto de Horario: una cita en papelera NO debe bloquear un nuevo agendamiento en su horario', async () => {
    // 1. Crear una cita a las 14:00 - 16:00
    const createRes = await fetch(`${baseUrl}/api/citas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        cliente_nombre: 'Empresa Test Conflicto',
        capacitador_id: 3,
        fecha: '2026-12-05',
        hora_inicio: '14:00',
        hora_fin: '16:00',
        horas: 2.0,
        modalidad: 'Presencial',
        tipo_servicio: 'Consultoría',
        estado: 'Programada'
      })
    });
    assert.strictEqual(createRes.status, 201);
    const citaCreada = await createRes.json();

    // 2. Mover la cita a la papelera (soft delete)
    const delRes = await fetch(`${baseUrl}/api/citas/${citaCreada.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(delRes.status, 200);

    // 3. Intentar crear una nueva cita para el mismo capacitador en el mismo horario (14:00 - 16:00)
    // Debe permitirse (201) y no responder 409 Conflicto
    const newRes = await fetch(`${baseUrl}/api/citas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        cliente_nombre: 'Empresa Reemplazo Horario',
        capacitador_id: 3,
        fecha: '2026-12-05',
        hora_inicio: '14:00',
        hora_fin: '16:00',
        horas: 2.0,
        modalidad: 'Virtual',
        tipo_servicio: 'Capacitación',
        estado: 'Programada'
      })
    });
    assert.strictEqual(newRes.status, 201, 'No debe existir conflicto con citas que están en la papelera');
  });

  it('Reportes y Portal: citas en papelera NO deben sumar horas en reportes ni mostrarse en el portal móvil', async () => {
    // Consultar horas iniciales del mes 2026-12
    const repAntesRes = await fetch(`${baseUrl}/api/reportes/resumen-mensual?year=2026&month=12`);
    const repAntes = await repAntesRes.json();
    const horasAntes = repAntes.kpis.totalHorasMes;

    // Crear una cita de 4 horas en 2026-12-15
    const createRes = await fetch(`${baseUrl}/api/citas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        cliente_nombre: 'Empresa Reporte Test',
        capacitador_id: 1, // Mariana Orellana (MO)
        fecha: '2026-12-15',
        hora_inicio: '08:00',
        hora_fin: '12:00',
        horas: 4.0,
        modalidad: 'Presencial',
        tipo_servicio: 'Capacitación',
        estado: 'Programada'
      })
    });
    const cita = await createRes.json();

    // Comprobar que sumó 4 horas
    const repConCitaRes = await fetch(`${baseUrl}/api/reportes/resumen-mensual?year=2026&month=12`);
    const repConCita = await repConCitaRes.json();
    assert.strictEqual(repConCita.kpis.totalHorasMes, horasAntes + 4);

    // Mover a papelera
    await fetch(`${baseUrl}/api/citas/${cita.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    // Comprobar que en el reporte ya NO suma las 4 horas
    const repDespuesRes = await fetch(`${baseUrl}/api/reportes/resumen-mensual?year=2026&month=12`);
    const repDespues = await repDespuesRes.json();
    assert.strictEqual(repDespues.kpis.totalHorasMes, horasAntes, 'El reporte no debe sumar horas de citas en papelera');

    // Comprobar que en el portal móvil tampoco aparece
    const portalRes = await fetch(`${baseUrl}/api/portal/MO?year=2026&month=12`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const portalData = await portalRes.json();
    const foundInPortal = (portalData.citas_mes || []).find(c => c.id === cita.id);
    assert.strictEqual(foundInPortal, undefined, 'La cita en papelera no debe aparecer en el portal móvil');
  });

  it('POST /api/backup/restore debe restaurar los datos sin duplicar registros', async () => {
    // Exportar el backup actual
    const exportRes = await fetch(`${baseUrl}/api/backup/export`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const backupJson = await exportRes.json();
    const totalOriginal = backupJson.stats.total_citas;

    // Restaurar inmediatamente el mismo backup
    const restoreRes = await fetch(`${baseUrl}/api/backup/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify(backupJson)
    });
    assert.strictEqual(restoreRes.status, 200);

    // Exportar de nuevo y comprobar que el número de citas NO se duplicó
    const export2Res = await fetch(`${baseUrl}/api/backup/export`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const backup2Json = await export2Res.json();
    assert.strictEqual(backup2Json.stats.total_citas, totalOriginal, 'El total de citas debe ser el mismo y no duplicarse');
  });
});


