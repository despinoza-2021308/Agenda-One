const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
  host: process.argv[2] || process.env.PGHOST || 'localhost',
  port: parseInt(process.argv[3] || process.env.PGPORT || '5432', 10),
  user: process.argv[4] || process.env.PGUSER || 'postgres',
  password: process.argv[5] || process.env.PGPASSWORD || 'postgres',
};

const targetDb = 'agenda_db';

async function runSetup() {
  console.log('🔄 Conectando a PostgreSQL local...');
  console.log(`   Host: ${config.host}:${config.port}`);
  console.log(`   Usuario: ${config.user}`);

  const adminClient = new Client({
    ...config,
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    console.log('✅ Conectado al servidor PostgreSQL exitosamente.');

    const checkDb = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDb]
    );

    if (checkDb.rows.length === 0) {
      console.log(`📦 Creando la base de datos "${targetDb}"...`);
      await adminClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`✅ Base de datos "${targetDb}" creada.`);
    } else {
      console.log(`ℹ️ La base de datos "${targetDb}" ya existe.`);
    }
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  const appClient = new Client({
    ...config,
    database: targetDb,
  });

  try {
    await appClient.connect();
    console.log(`\n📄 Ejecutando scripts en "${targetDb}"...`);

    const initSqlPath = path.resolve(__dirname, '../Database/init.sql');
    const seedSqlPath = path.resolve(__dirname, '../Database/seed.sql');

    if (fs.existsSync(initSqlPath)) {
      const initSql = fs.readFileSync(initSqlPath, 'utf-8');
      await appClient.query(initSql);
      console.log('✅ Tablas e índices creados (init.sql).');
    }

    if (fs.existsSync(seedSqlPath)) {
      const seedSql = fs.readFileSync(seedSqlPath, 'utf-8');
      await appClient.query(seedSql);
      console.log('✅ Datos de prueba insertados (seed.sql).');
    }

    console.log('\n🎉 ¡Base de datos "agenda_db" lista y poblada al 100%!');
  } catch (err) {
    console.error('❌ Error ejecutando DDL/Seed:', err.message);
  } finally {
    await appClient.end();
  }
}

runSetup();
