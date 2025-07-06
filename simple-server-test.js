const http = require('http');

// Simple health check
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

console.log('Testing server connectivity...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    console.log('✅ Server is responding!');
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('❌ Server connection failed:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Server connection timed out');
  req.destroy();
  process.exit(1);
});

req.setTimeout(5000);
req.end();
