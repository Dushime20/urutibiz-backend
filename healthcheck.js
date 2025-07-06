// Simple health check for deployment verification
// This can be used by monitoring services or load balancers

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 10000,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0); // Success
  } else {
    console.error(`Health check failed with status code: ${res.statusCode}`);
    process.exit(1); // Failure
  }
});

req.on('error', (err) => {
  console.error(`Health check failed: ${err.message}`);
  process.exit(1); // Failure
});

req.on('timeout', () => {
  console.error('Health check timed out');
  req.destroy();
  process.exit(1); // Failure
});

req.end();
