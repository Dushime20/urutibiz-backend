require('ts-node/register');
const config = require('./database/knexfile.ts');
module.exports = config.default;
