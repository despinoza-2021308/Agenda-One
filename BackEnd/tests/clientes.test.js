const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Pruebas del Catálogo de Clientes Reales (109 Empresas)', () => {
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

    // Obtener token admin
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
    if (db.pool && typeof db.pool.end === 'function') {
      try {
        await db.pool.end();
      } catch (_) {}
    }
  });

  it('GET /api/clientes (Admin) debe retornar al menos 109 clientes reales ordenados con datos completos', async () => {
    const res = await fetch(`${baseUrl}/api/clientes`, {
      headers: { 'x-admin-key': 'OneCon2026' }
    });
    assert.strictEqual(res.status, 200);
    const clients = await res.json();
    assert.ok(Array.isArray(clients), 'Debe retornar un arreglo');
    assert.ok(clients.length >= 109, `Se esperaban al menos 109 clientes, se recibieron ${clients.length}`);

    // Verificar clientes clave
    const aceros = clients.find(c => c.nombre_empresa.includes('ACEROS DE GUATEMALA'));
    assert.ok(aceros, 'Debe existir ACEROS DE GUATEMALA, S.A.');
    assert.ok(aceros.telefono, 'Debe tener teléfono');
    assert.ok(aceros.correo, 'Debe tener correo');
    assert.ok(aceros.direccion, 'Debe tener dirección física');

    const colombina = clients.find(c => c.nombre_empresa.toLowerCase().includes('colombina'));
    assert.ok(colombina, 'Debe existir Colombina');

    const bayer = clients.find(c => c.nombre_empresa.includes('BAYER'));
    assert.ok(bayer, 'Debe existir BAYER S.A.');

    const labymed = clients.find(c => c.nombre_empresa.includes('LABYMED'));
    assert.ok(labymed, 'Debe existir LABYMED');
  });

  it('GET /api/clientes (Público) debe retornar lista sanitizada sin teléfonos ni correos sensibles', async () => {
    const res = await fetch(`${baseUrl}/api/clientes`);
    assert.strictEqual(res.status, 200);
    const clients = await res.json();
    assert.ok(Array.isArray(clients));
    assert.ok(clients.length >= 109);

    const aceros = clients.find(c => c.nombre_empresa.includes('ACEROS DE GUATEMALA'));
    assert.ok(aceros, 'Debe existir ACEROS');
    assert.strictEqual(aceros.telefono, undefined, 'No debe exponer teléfono a usuarios públicos');
    assert.strictEqual(aceros.correo, undefined, 'No debe exponer correo a usuarios públicos');
    assert.strictEqual(aceros.facturacion, undefined, 'No debe exponer facturación a usuarios públicos');
  });

  it('POST /api/clientes debe registrar un cliente con dirección física y correo múltiple', async () => {
    const nuevo = {
      nombre_empresa: 'Empresa Test de Integración 2026',
      contacto: 'Ing. Prueba Unitaria',
      telefono: '+502 2200-1122',
      correo: 'contacto1@test.gt, contacto2@test.gt',
      direccion: 'Km 15 Carretera a El Salvador'
    };

    const res = await fetch(`${baseUrl}/api/clientes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-admin-key': adminToken
      },
      body: JSON.stringify(nuevo)
    });

    assert.strictEqual(res.status, 201);
    const creado = await res.json();
    assert.strictEqual(creado.nombre_empresa, nuevo.nombre_empresa);
    assert.strictEqual(creado.direccion, nuevo.direccion);

    // Limpiar borrando el test
    await fetch(`${baseUrl}/api/clientes/${creado.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-admin-key': adminToken
      }
    });
  });
});
