const { readFileSync } = require('fs');
const { join } = require('path');

// Load .env file into an object
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const content = readFileSync(envPath, 'utf-8');
    const env = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();

module.exports = {
  apps: [
    {
      name: 'relay-web',
      cwd: './packages/web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      env: { NODE_ENV: 'production', ...env },
    },
    {
      name: 'relay-api',
      cwd: './packages/api',
      script: 'dist/index.js',
      env: { NODE_ENV: 'production', ...env },
    },
    {
      name: 'relay-caddy',
      script: '/home/bulut/.openclaw/applications/caddy',
      args: 'run --config /home/bulut/.openclaw/repos/local/relay-layer/deploy/Caddyfile',
      env: {
        XDG_DATA_HOME: '/home/bulut/.openclaw/applications/caddy-data',
        XDG_CONFIG_HOME: '/home/bulut/.openclaw/applications/caddy-config',
      },
    },
  ],
};
