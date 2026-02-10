import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyWebsocket from '@fastify/websocket';
import { initDb, seedDb } from './db/client.js';
import { authRoutes } from './routes/auth.js';
import { taskRoutes } from './routes/tasks.js';
import { eventRoutes } from './routes/events.js';
import { projectRoutes } from './routes/projects.js';
import { agentRoutes } from './routes/agents.js';
import { statsRoutes } from './routes/stats.js';
import { commsRoutes } from './routes/comms.js';
import { setupWebSocket } from './ws/server.js';

const PORT = parseInt(process.env.API_PORT || '3001', 10);

async function start() {
  initDb();
  seedDb();

  const app = Fastify({ logger: true, trustProxy: true });

  await app.register(fastifyCors, {
    origin: process.env.NODE_ENV === 'production' ? 'https://relay.kukso.com' : true,
    credentials: true,
  });

  await app.register(fastifyCookie, {
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  });

  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(fastifyWebsocket);

  await app.register(authRoutes);
  await app.register(taskRoutes);
  await app.register(eventRoutes);
  await app.register(projectRoutes);
  await app.register(agentRoutes);
  await app.register(statsRoutes);
  await app.register(commsRoutes);

  setupWebSocket(app);

  app.get('/api/health', async () => ({ status: 'ok', time: new Date().toISOString() }));

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Relay API running on port ${PORT}`);
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
