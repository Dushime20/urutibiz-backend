require('dotenv').config();
try {
  require('ts-node/register');
  require('tsconfig-paths/register');
} catch (e) {
  // Ignore errors in production if TS support is not needed/available
}
const path = require('path');

/**
 * Knex configuration for production
 * Works without ts-node dependency
 */
module.exports = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'urutibiz_db',
    user: process.env.DB_USER || 'urutibiz_user',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  migrations: {
    directory: path.join(__dirname, 'database', 'migrations'),
    tableName: 'knex_migrations',
    loadExtensions: ['.js', '.ts'],
  },
  seeds: {
    directory: path.join(__dirname, 'database', 'seeds'),
    extension: 'js',
  },
  pool: {
    min: 2,
    max: 10,
  },
};
