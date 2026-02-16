require('dotenv').config();

// Use the TypeScript knexfile from database folder
require('ts-node/register');
const config = require('./database/knexfile.ts');
module.exports = config.default || config;