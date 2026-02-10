module.exports = {
  apps: [
    {
      name: 'relay-web',
      cwd: './packages/web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'relay-api',
      cwd: './packages/api',
      script: 'dist/index.js',
      node_args: '--experimental-specifier-resolution=node',
      env: {
        NODE_ENV: 'production',
        API_PORT: '3001',
        DATABASE_PATH: '../../relay.db',
      },
    },
  ],
};
