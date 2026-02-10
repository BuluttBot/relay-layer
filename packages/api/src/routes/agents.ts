import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../db/client.js';

export async function agentRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/api/agents', async () => {
    const db = getDb();
    const agents = db.prepare('SELECT * FROM agents ORDER BY created_at ASC').all() as any[];
    return agents.map(a => {
      const completed = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE assigned_to = ? AND status IN ('done','burak','published')").get(a.id) as { c: number }).c;
      const projects = db.prepare('SELECT project_id FROM agent_projects WHERE agent_id = ?').all(a.id).map((r: any) => r.project_id);
      const currentTask = a.current_task_id ? db.prepare('SELECT title FROM tasks WHERE id = ?').get(a.current_task_id) as { title: string } | undefined : undefined;
      return { ...a, skills: a.skills ? JSON.parse(a.skills) : null, tasks_completed: completed, projects, current_task_title: currentTask?.title };
    });
  });

  app.get('/api/agents/:id', async (req, reply) => {
    const db = getDb();
    const { id } = req.params as { id: string };
    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as any;
    if (!agent) return reply.code(404).send({ error: 'Agent not found' });
    const completed = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE assigned_to = ? AND status IN ('done','burak','published')").get(id) as { c: number }).c;
    const projects = db.prepare('SELECT project_id FROM agent_projects WHERE agent_id = ?').all(id).map((r: any) => r.project_id);
    return { ...agent, skills: agent.skills ? JSON.parse(agent.skills) : null, tasks_completed: completed, projects };
  });

  app.post('/api/agents', async (req, reply) => {
    const db = getDb();
    const body = req.body as any;
    if (!body.id || !body.name) return reply.code(400).send({ error: 'id and name required' });
    db.prepare(`INSERT INTO agents (id, name, title, tag, description, avatar, skills, model, thinking_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(body.id, body.name, body.title || null, body.tag || null, body.description || null, body.avatar || null, body.skills ? JSON.stringify(body.skills) : null, body.model || null, body.thinking_level || null);
    return reply.code(201).send({ id: body.id });
  });

  app.patch('/api/agents/:id', async (req, reply) => {
    const db = getDb();
    const { id } = req.params as { id: string };
    const updates = req.body as Record<string, any>;
    const fields: string[] = ['updated_at = ?'];
    const values: any[] = [new Date().toISOString()];
    for (const key of ['name', 'title', 'tag', 'description', 'avatar', 'model', 'thinking_level', 'status', 'current_task_id']) {
      if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(updates[key]); }
    }
    if (updates.skills !== undefined) { fields.push('skills = ?'); values.push(JSON.stringify(updates.skills)); }
    values.push(id);
    db.prepare(`UPDATE agents SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
  });

  app.post('/api/agents/:id/projects', async (req, reply) => {
    const db = getDb();
    const { id } = req.params as { id: string };
    const { project_id } = req.body as { project_id: string };
    if (!project_id) return reply.code(400).send({ error: 'project_id required' });
    db.prepare('INSERT OR IGNORE INTO agent_projects (agent_id, project_id) VALUES (?, ?)').run(id, project_id);
    return { success: true };
  });

  app.delete('/api/agents/:id/projects/:pid', async (req) => {
    const db = getDb();
    const { id, pid } = req.params as { id: string; pid: string };
    db.prepare('DELETE FROM agent_projects WHERE agent_id = ? AND project_id = ?').run(id, pid);
    return { success: true };
  });
}
