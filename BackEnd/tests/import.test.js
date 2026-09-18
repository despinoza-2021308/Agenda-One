const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Pruebas de Importación Masiva de Citas por Lote (Excel)', () => {
  let server;
  let baseUrl;
  let adminToken;

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // Obtener token administrativo
    const resAuth = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: process.env.ADMIN_PIN || 'OneCon2026' })
    });
    const dataAuth = await resAuth.json();
    adminToken = dataAuth.token;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('POST /api/citas/importar-lote debe rechazar petición si no hay token administrativo (401)', async () => {
    const res = await fetch(`${baseUrl}/api/citas/importar-lote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mes: '2026-06',
        citas: []
      })
    });
    assert.strictEqual(res.status, 401);
  });

  it('POST /api/citas/importar-lote debe validar que el arreglo de citas no esté vacío (400)', async () => {
    const res = await fetch(`${baseUrl}/api/citas/importar-lote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        mes: '2026-06',
        citas: []
      })
    });
    assert.strictEqual(res.status, 400);
  });

  it('POST /api/citas/importar-lote debe importar un lote de citas y filtrar citas de 0 horas (201)', async () => {
    const mockBatch = [
      {
        cliente_nombre: 'INTECAP',
        capacitador_id: 2,
        fecha: '2026-06-01',
        hora_inicio: '08:00',
        hora_fin: '12:00',
        horas: 4,
        modalidad: 'Presencial',
        tipo_servicio: 'Capacitación',
        estado: 'Programada',
        observaciones: 'INTECAP CAPACITACIÓN 8 A 12'
      },
      {
        cliente_nombre: 'LABYMED',
        capacitador_id: 2,
        fecha: '2026-06-02',
        hora_inicio: '09:00',
        hora_fin: '13:00',
        horas: 4,
        modalidad: 'Virtual',
        tipo_servicio: 'Asesoría',
        estado: 'Programada',
        observaciones: 'LABYMED ASESORÍA VIRTUAL 9 A 13'
      },
      {
        cliente_nombre: 'REUNION VIRTUAL CERO',
        capacitador_id: 2,
        fecha: '2026-06-03',
        hora_inicio: '10:00',
        hora_fin: '11:00',
        horas: 0, // Debe ser ignorada
        modalidad: 'Virtual',
        tipo_servicio: 'Reunión',
        estado: 'Programada',
        observaciones: 'REUNION CERO HORAS'
      }
    ];

    const res = await fetch(`${baseUrl}/api/citas/importar-lote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        mes: '2026-06',
        replaceExistingMonth: true,
        citas: mockBatch
      })
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.count, 2, 'Debe haber importado exactamente 2 citas, descartando la de 0 horas');
    assert.strictEqual(data.totalHoras, 8, 'Total de horas debe ser 8.0');

    // Verificar que las citas se pueden consultar en la API
    const resGet = await fetch(`${baseUrl}/api/citas?month=6&year=2026`);
    assert.strictEqual(resGet.status, 200);
    const citasJunio = await resGet.json();
    assert.ok(citasJunio.length >= 2, 'Junio debe tener al menos las 2 citas importadas');
    const hasZero = citasJunio.some(c => parseFloat(c.horas) === 0);
    assert.strictEqual(hasZero, false, 'No deben existir citas con 0 horas');
  });
});
