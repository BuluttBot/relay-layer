import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../db/client.js';

export async function commsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/api/comms', async (req) => {
    const db = getDb();
    const { projectId, agentId, limit: lim } = req.query as { projectId?: string; agentId?: string; limit?: string };
    const limit = Math.min(parseInt(lim || '100', 10), 500);
    let sql = 'SELECT * FROM communications WHERE 1=1';
    const params: (string | number)[] = [];
    if (projectId) { sql += ' AND project_id = ?'; params.push(projectId); }
    if (agentId) { sql += ' AND (from_agent_id = ? OR to_agent_id = ?)'; params.push(agentId, agentId); }
    sql += ' ORDER BY created_at ASC LIMIT ?';
    params.push(limit);
    return db.prepare(sql).all(...params);
  });
}
