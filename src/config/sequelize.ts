import { Sequelize } from 'sequelize';

const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_SSL,
  DATABASE_URL,
} = process.env as Record<string, string>;

export const sequelize = DATABASE_URL
  ? new Sequelize(DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    })
  : new Sequelize(DB_NAME as string, DB_USER as string, DB_PASSWORD as string, {
      host: DB_HOST,
      port: Number(DB_PORT || 5432),
      dialect: 'postgres',
      logging: false,
      dialectOptions: DB_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: false } } : undefined,
    });

export default sequelize;


