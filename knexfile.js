require('dotenv').config();
const path = require('path');

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
    directory: path.join(__dirname, 'database', 'migrations'),
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.join(__dirname, 'database', 'seeds'),
  },
};

require('ts-node/register');
const config = require('./database/knexfile.ts');
module.exports = config.default;
