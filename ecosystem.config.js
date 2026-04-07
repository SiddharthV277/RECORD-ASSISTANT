module.exports = {
  apps: [
    {
      name: 'task-manager-backend',
      script: 'server.js',
      cwd: './backend',
      watch: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'task-manager-frontend',
      script: 'npx',
      args: 'vite --host',
      cwd: './frontend',
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
