const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Pruebas del Estado En Negociación (Citas Tentativas)', () => {
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

    const resAuth = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: process.env.ADMIN_PIN || 'OneCon2026' })
    });
    const authData = await resAuth.json();
    adminToken = authData.token;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('POST /api/citas debe permitir crear una cita con estado "En Negociación"', async () => {
    const nuevaCita = {
      cliente_nombre: 'Corporación Negociación Test S.A.',
      capacitador_id: 1,
      fecha: '2026-10-15',
      hora_inicio: '10:00',
      hora_fin: '12:00',
      modalidad: 'Presencial',
      tipo_servicio: 'Consultoría',
      estado: 'En Negociación',
      observaciones: 'Propuesta de fecha enviada al cliente para confirmación'
    };

    const res = await fetch(`${baseUrl}/api/citas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-admin-key': adminToken
      },
      body: JSON.stringify(nuevaCita)
    });

    assert.strictEqual(res.status, 201);
    const creada = await res.json();
    assert.strictEqual(creada.estado, 'En Negociación');
    assert.strictEqual(creada.cliente_nombre, nuevaCita.cliente_nombre);
    testCitaId = creada.id;
  });

  it('GET /api/citas debe listar la cita con estado "En Negociación"', async () => {
    const res = await fetch(`${baseUrl}/api/citas?start_date=2026-10-01&end_date=2026-10-31`);
    assert.strictEqual(res.status, 200);
    const citas = await res.json();
    const encontrada = citas.find(c => c.id === testCitaId);
    assert.ok(encontrada, 'La cita en negociación debe figurar en la lista');
    assert.strictEqual(encontrada.estado, 'En Negociación');
  });

  it('PUT /api/citas/:id debe permitir cambiar el estado de "En Negociación" a "Programada"', async () => {
    const res = await fetch(`${baseUrl}/api/citas/${testCitaId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-admin-key': adminToken
      },
      body: JSON.stringify({
        estado: 'Programada',
        observaciones: 'Cliente confirmó la fecha propuesta'
      })
    });

    assert.strictEqual(res.status, 200);
    const actualizada = await res.json();
    assert.strictEqual(actualizada.estado, 'Programada');
  });

  it('POST /api/citas debe permitir guardar con permitir_solapamiento para citas tentativas', async () => {
    // Intentar agendar en un horario que choca con testCitaId (10:00 a 12:00) pero con permitir_solapamiento: true
    const citaTentativa = {
      cliente_nombre: 'Cliente Prospecto Solapado',
      capacitador_id: 1,
      fecha: '2026-10-15',
      hora_inicio: '10:30',
      hora_fin: '11:30',
      modalidad: 'Virtual',
      tipo_servicio: 'Capacitación',
      estado: 'En Negociación',
      permitir_solapamiento: true
    };

    const res = await fetch(`${baseUrl}/api/citas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-admin-key': adminToken
      },
      body: JSON.stringify(citaTentativa)
    });

    assert.strictEqual(res.status, 201);
    const creada = await res.json();
    assert.strictEqual(creada.estado, 'En Negociación');

    // Limpiar borrando la cita creada
    await fetch(`${baseUrl}/api/citas/${creada.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'x-admin-key': adminToken }
    });
  });

  it('GET /api/reportes/resumen-mensual debe incluir métricas de citas_en_negociacion', async () => {
    const res = await fetch(`${baseUrl}/api/reportes/resumen-mensual?year=2026&month=10`);
    assert.strictEqual(res.status, 200);
    const rep = await res.json();
    assert.ok(rep.kpis, 'Debe retornar KPIs');
    assert.ok('citasEnNegociacion' in rep.kpis, 'Debe incluir citasEnNegociacion en KPIs');
  });
});
