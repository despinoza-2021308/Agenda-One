const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');

const db = require('../src/config/db');

describe('Pruebas de Integración de Endpoints y Robustez de API', () => {
  let server;
  let baseUrl;
  let adminToken;

  before(async () => {
    // Iniciar servidor en puerto efímero asignado por el SO (puerto 0)
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
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

  it('GET /api/health debe responder status 200 y servicio activo', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
  });

  it('POST /api/auth/login debe autenticar con PIN válido y denegar con PIN erróneo', async () => {
    // Intento con PIN inválido
    const resFail = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: 'PIN_INCORRECTO' })
    });
    assert.strictEqual(resFail.status, 401);

    // Intento con PIN válido por defecto (OneCon2026)
    const resOk = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: process.env.ADMIN_PIN || 'OneCon2026' })
    });
    assert.strictEqual(resOk.status, 200);
    const data = await resOk.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.token, 'Debe devolver un token de sesión');
    adminToken = data.token;
  });

  it('POST /api/citas debe rechazar mutaciones sin autorización administrativa (401)', async () => {
    const res = await fetch(`${baseUrl}/api/citas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente_nombre: 'Cliente de Prueba',
        capacitador_id: 1,
        fecha: '2026-09-25',
        hora_inicio: '08:00',
        hora_fin: '12:00',
        modalidad: 'Presencial',
        tipo_servicio: 'Capacitación'
      })
    });
    assert.strictEqual(res.status, 401);
  });

  it('Soporte de Payload 5MB: debe aceptar firmas digitales pesadas en Base64 sin error 413', async () => {
    // Generar una cadena Base64 simulada de más de 120 KB (que superaría el límite anterior de 50 KB)
    const largeBase64Data = 'data:image/png;base64,' + 'A'.repeat(120 * 1024);

    const res = await fetch(`${baseUrl}/api/portal/MO/citas/1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bitacora: 'Capacitación completada con éxito en planta.',
        firma_cliente: largeBase64Data,
        firmante_nombre: 'Ing. Supervisor de Planta',
        firmante_puesto: 'Jefe de Operaciones'
      })
    });

    assert.notStrictEqual(res.status, 413, 'El payload NO debe ser rechazado con 413 Payload Too Large');
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  it('Historial de Auditoría (Audit Trail): debe registrar y devolver trazabilidad en GET /api/citas/:id/auditoria', async () => {
    // 1. Consultar historial de la cita 1
    const resAuditoria = await fetch(`${baseUrl}/api/citas/1/auditoria`);
    assert.strictEqual(resAuditoria.status, 200);
    const historial = await resAuditoria.json();

    assert.ok(Array.isArray(historial), 'El historial debe ser un arreglo');
    assert.ok(historial.length > 0, 'Debe contener registros de auditoría');

    // Verificar que la última firma registrada esté en el historial
    const firmaAudit = historial.find(h => h.accion === 'FIRMA_CONFORMIDAD');
    assert.ok(firmaAudit, 'Debe registrar la acción FIRMA_CONFORMIDAD');
    assert.strictEqual(firmaAudit.usuario, 'Capacitador [MO]');
  });

  it('Creación y Reprogramación con registro automático en el Audit Trail', async () => {
    // 1. Crear una nueva cita con token admin
    const resCreate = await fetch(`${baseUrl}/api/citas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        cliente_nombre: 'Empresa Test Auditoría S.A.',
        capacitador_id: 2,
        fecha: '2026-09-29',
        hora_inicio: '08:00',
        hora_fin: '10:00',
        modalidad: 'Virtual',
        tipo_servicio: 'Consultoría',
        observaciones: 'Cita creada para probar trazabilidad.'
      })
    });

    assert.strictEqual(resCreate.status, 201);
    const nuevaCita = await resCreate.json();
    const newId = nuevaCita.id;

    // 2. Reprogramar la cita (cambiar horario de 08:00 a 10:30)
    const resUpdate = await fetch(`${baseUrl}/api/citas/${newId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        fecha: '2026-09-29',
        hora_inicio: '10:30',
        hora_fin: '12:30',
        observaciones: 'Reprogramada por ajuste de agenda del cliente.'
      })
    });

    assert.strictEqual(resUpdate.status, 200);

    // 3. Consultar la auditoría de la nueva cita
    const resHistorial = await fetch(`${baseUrl}/api/citas/${newId}/auditoria`);
    assert.strictEqual(resHistorial.status, 200);
    const eventos = await resHistorial.json();

    assert.ok(eventos.some(e => e.accion === 'CREACION'), 'Debe existir registro de CREACION');
    assert.ok(eventos.some(e => e.accion === 'REPROGRAMACION'), 'Debe existir registro de REPROGRAMACION');
  });
});
