const { spawn } = require('child_process');

console.log('Starting server with detailed logging...');

const server = spawn('npx', ['ts-node-dev', '--respawn', '--transpile-only', '-r', 'tsconfig-paths/register', 'src/server.ts'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.kill();
  process.exit(0);
});
