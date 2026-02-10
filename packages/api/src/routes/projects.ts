import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../db/client.js';

export async function projectRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/api/projects', async () => {
    const db = getDb();
    const projects = db.prepare('SELECT * FROM projects ORDER BY created_at ASC').all();
    return projects.map((p: any) => {
      const agents = db.prepare('SELECT agent_id FROM agent_projects WHERE project_id = ?').all(p.id).map((a: any) => a.agent_id);
      const taskCount = (db.prepare('SELECT COUNT(*) as c FROM tasks WHERE project_id = ?').get(p.id) as { c: number }).c;
      return { ...p, agents, task_count: taskCount };
    });
  });

  app.get('/api/projects/:id', async (req, reply) => {
    const db = getDb();
    const { id } = req.params as { id: string };
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
    if (!project) return reply.code(404).send({ error: 'Project not found' });
    const agents = db.prepare('SELECT agent_id FROM agent_projects WHERE project_id = ?').all(id).map((a: any) => a.agent_id);
    const taskCount = (db.prepare('SELECT COUNT(*) as c FROM tasks WHERE project_id = ?').get(id) as { c: number }).c;
    return { ...project, agents, task_count: taskCount };
  });

  app.post('/api/projects', async (req, reply) => {
    const db = getDb();
    const { id, name, description, icon } = req.body as { id: string; name: string; description?: string; icon?: string };
    if (!id || !name) return reply.code(400).send({ error: 'id and name required' });
    db.prepare('INSERT INTO projects (id, name, description, icon) VALUES (?, ?, ?, ?)').run(id, name, description || null, icon || null);
    return reply.code(201).send(db.prepare('SELECT * FROM projects WHERE id = ?').get(id));
  });

  app.patch('/api/projects/:id', async (req, reply) => {
    const db = getDb();
    const { id } = req.params as { id: string };
    const updates = req.body as Record<string, string>;
    const fields: string[] = ['updated_at = ?'];
    const values: string[] = [new Date().toISOString()];
    for (const key of ['name', 'description', 'icon']) {
      if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(updates[key]); }
    }
    values.push(id);
    db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  });
}
