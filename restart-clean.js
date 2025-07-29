#!/usr/bin/env node

const { exec } = require('child_process');

console.log('🔄 Restarting server without demo data...');

// Set environment and start server
process.env.NODE_ENV = 'development';

console.log(`NODE_ENV set to: ${process.env.NODE_ENV}`);
console.log('Starting server in development mode...');

const server = exec('npm run dev', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  console.log(stdout);
  if (stderr) console.error(stderr);
});

server.stdout.on('data', (data) => {
  console.log(data);
});

server.stderr.on('data', (data) => {
  console.error(data);
}); 