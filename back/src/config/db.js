// back/config/sequelize.js

import { Sequelize } from 'sequelize';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

let sequelize;

// ==========================================
// SCENARIO 1: PRODUCTION (Cloud / Neon)
// ==========================================
if (process.env.DATABASE_URL) {
  console.log('🌍 Connecting to Cloud Database (Neon)...');
  
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true, 
        rejectUnauthorized: false // Required for Neon/Render SSL connections
      }
    }
  });

} 
// ==========================================
// SCENARIO 2: LOCAL DEVELOPMENT
// ==========================================
else {
  console.log('💻 Connecting to Local Database...');

  const PG_DB = process.env.PG_DB || 'jeevak';
  const PG_USER = process.env.PG_USER || 'postgres';
  const PG_PASSWORD = process.env.PG_PASSWORD || 'omkar';
  const PG_HOST = process.env.PG_HOST || 'localhost';
  const PG_PORT = process.env.PG_PORT || 5432; // Default Postgres port is 5432, usually not 5001

  // Step 1: Check/Create DB (Only needed locally)
  try {
    const tempSequelize = new Sequelize('postgres', PG_USER, PG_PASSWORD, {
      host: PG_HOST,
      port: PG_PORT,
      dialect: 'postgres',
      logging: false,
      dialectModule: pg
    });
    
    await tempSequelize.query(`CREATE DATABASE "${PG_DB}";`);
    console.log(`✅ Database '${PG_DB}' created`);
    await tempSequelize.close(); // Close temp connection
  } catch (error) {
    if (error.original?.code === '42P04') {
      console.log(`ℹ️ Database '${PG_DB}' already exists`);
    } else {
      console.warn('⚠️ Local DB Creation Check Skipped/Failed:', error.message);
    }
  }

  // Step 2: Connect to Local Target DB
  sequelize = new Sequelize(PG_DB, PG_USER, PG_PASSWORD, {
    host: PG_HOST,
    port: PG_PORT,
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

// Test Authentication
try {
  await sequelize.authenticate();
  console.log('✅ Connection has been established successfully.');
} catch (err) {
  console.error('❌ Unable to connect to the database:', err);
}

export default sequelize;