import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import * as statsService from '../services/statsService.js';

export async function statsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/api/stats/overview', async () => statsService.getOverview());
  app.get('/api/stats/agents', async () => statsService.getAgentStats());
  app.get('/api/stats/costs', async (req) => {
    const { range } = req.query as { range?: string };
    return statsService.getCosts(range);
  });
  app.get('/api/stats/pipeline', async () => statsService.getPipelineStats());
}
