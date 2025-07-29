import { Knex } from 'knex';
import * as path from 'path';
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const baseConfig: Knex.Config = {
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
    directory: path.join(__dirname, 'migrations'),
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.join(__dirname, 'seeds'),
  },
};

const knexConfig: { [key: string]: Knex.Config } = {
  development: baseConfig,
  demo: baseConfig,
  test: baseConfig,
  production: baseConfig,
  // Add production config if needed
};

export default knexConfig;
