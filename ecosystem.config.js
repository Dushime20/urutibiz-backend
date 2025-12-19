module.exports = {
  apps: [{
    name: 'urutibiz-backend',
    script: 'dist/server.js',
    cwd: '/root/urutibz',
    node_args: '-r tsconfig-paths/register',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};

