require('dotenv').config();

// For production: use the database/knexfile.ts with ts-node
// This is a simple wrapper that delegates to the real config
try {
  require('ts-node/register');
  const config = require('./database/knexfile.ts');
  module.exports = config.default || config;
} catch (error) {
  // Fallback if ts-node is not available
  const path = require('path');
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
}