const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'agenda_db'
    };

const pool = new Pool(poolConfig);

const CLIENTES = require('../config/db').mockStore.clientes;

async function seedClientes() {
  console.log('====================================================');
  console.log('📦 INICIANDO IMPORTACIÓN DE CLIENTES REALES (CO-RE-05)');
  console.log(`📊 Total de empresas a sincronizar: ${CLIENTES.length}`);
  console.log('====================================================');

  const client = await pool.connect();
  try {
    // 1. Asegurar columnas de direccion y facturacion
    await client.query(`
      ALTER TABLE clientes ADD COLUMN IF NOT EXISTS direccion TEXT;
      ALTER TABLE clientes ADD COLUMN IF NOT EXISTS facturacion TEXT;
      ALTER TABLE clientes ALTER COLUMN nombre_empresa TYPE VARCHAR(200);
      ALTER TABLE clientes ALTER COLUMN contacto TYPE TEXT;
      ALTER TABLE clientes ALTER COLUMN telefono TYPE VARCHAR(150);
      ALTER TABLE clientes ALTER COLUMN correo TYPE VARCHAR(255);
    `);
    console.log('✅ Esquema verificado y adaptado para campos extendidos.');

    let insertados = 0;
    let actualizados = 0;

    for (const c of CLIENTES) {
      const query = `
        INSERT INTO clientes (nombre_empresa, contacto, telefono, correo, direccion, facturacion, activo)
        VALUES ($1, $2, $3, $4, $5, $6, TRUE)
        ON CONFLICT (nombre_empresa) DO UPDATE SET
          contacto = EXCLUDED.contacto,
          telefono = EXCLUDED.telefono,
          correo = EXCLUDED.correo,
          direccion = EXCLUDED.direccion,
          facturacion = EXCLUDED.facturacion,
          activo = TRUE,
          updated_at = CURRENT_TIMESTAMP
        RETURNING (xmax = 0) AS is_insert;
      `;
      const values = [
        c.nombre_empresa,
        c.contacto || null,
        c.telefono || null,
        c.correo || null,
        c.direccion || null,
        c.facturacion || null
      ];

      const res = await client.query(query, values);
      if (res.rows[0].is_insert) {
        insertados++;
      } else {
        actualizados++;
      }
    }

    console.log(`\n🎉 Sincronización finalizada con éxito:`);
    console.log(`   ✨ Nuevos clientes insertados: ${insertados}`);
    console.log(`   🔄 Clientes actualizados: ${actualizados}`);
    console.log(`   🏢 Total en base de datos: ${CLIENTES.length}`);
  } catch (err) {
    console.error('❌ Error durante la importación:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedClientes();
}

module.exports = seedClientes;
