require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Check if compiled migrations exist (production), otherwise use source (development)
const compiledMigrationsPath = path.join(__dirname, 'dist', 'database', 'migrations');
const sourceMigrationsPath = path.join(__dirname, 'database', 'migrations');
const migrationsPath = fs.existsSync(compiledMigrationsPath) ? compiledMigrationsPath : sourceMigrationsPath;

console.log('[Knex] Using migrations from:', migrationsPath);

/**
 * Root Knex configuration for CLI usage.
 * Ensures migrations and seeds run with environment variables.
 */
module.exports = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  },
  migrations: {
    directory: migrationsPath,
    tableName: 'knex_migrations',
    extension: fs.existsSync(compiledMigrationsPath) ? 'js' : 'ts',
    loadExtensions: [fs.existsSync(compiledMigrationsPath) ? '.js' : '.ts'],
  },
  seeds: {
    directory: path.join(__dirname, 'database', 'seeds'),
  },
};