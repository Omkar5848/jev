// back/config/sequelize.js

import { Sequelize } from 'sequelize';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

let sequelize;

// Check if we are truly using the cloud URL
const isCloudUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech');

// ==========================================
// SCENARIO 1: CLOUD (Neon/Render)
// ==========================================
if (isCloudUrl) {
  console.log('🌍 Connecting to Cloud Database (Neon)...');
  
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true, 
        rejectUnauthorized: false // Required for Neon
      }
    }
  });

} 
// ==========================================
// SCENARIO 2: LOCAL DEVELOPMENT
// ==========================================
else {
  console.log('💻 Connecting to Local Database...');

  // If DATABASE_URL is set (but not cloud), use it. Otherwise build from parts.
  const connectionString = process.env.DATABASE_URL || `postgres://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DB}`;

  // Step 1: Check/Create DB (Auto-create database if missing)
  try {
    // Connect to default 'postgres' db first to check if 'jeevak' exists
    const tempSequelize = new Sequelize(
      `postgres://${process.env.PG_USER || 'postgres'}:${process.env.PG_PASSWORD || 'omkar'}@${process.env.PG_HOST || 'localhost'}:${process.env.PG_PORT || 5432}/postgres`, 
      { dialect: 'postgres', logging: false, dialectModule: pg }
    );
    
    const dbName = process.env.PG_DB || 'jeevak';
    await tempSequelize.query(`CREATE DATABASE "${dbName}";`);
    console.log(`✅ Database '${dbName}' created`);
    await tempSequelize.close();
  } catch (error) {
    if (error.original?.code === '42P04') {
      console.log(`ℹ️ Database already exists`);
    } else {
      console.warn('⚠️ Local DB Check warning (ignorable if DB exists):', error.message);
    }
  }

  // Step 2: Connect to the actual DB
  sequelize = new Sequelize(connectionString, {
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
    // NOTICE: No ssl options here!
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