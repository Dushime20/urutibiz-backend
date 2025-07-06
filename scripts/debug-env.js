/**
 * Debug Environment Variables
 */

// Load environment variables
const path = require('path');
const fs = require('fs');

console.log('=== Debugging Environment Loading ===');
console.log('Current working directory:', process.cwd());

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
console.log('Looking for .env file at:', envPath);
console.log('.env file exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('\n=== .env file content (first 10 lines) ===');
    console.log(envContent.split('\n').slice(0, 15).join('\n'));
}

// Load dotenv
require('dotenv').config();

console.log('\n=== Environment Variables After Loading ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***HIDDEN***' : 'NOT SET');
console.log('DB_SSL:', process.env.DB_SSL);
