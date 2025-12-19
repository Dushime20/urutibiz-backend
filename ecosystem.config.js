module.exports = {
  apps: [{
    name: 'urutibiz-backend',
    script: 'dist/server.js',
    cwd: '/root/urutibz',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/root/.pm2/logs/urutibiz-backend-error.log',
    out_file: '/root/.pm2/logs/urutibiz-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};