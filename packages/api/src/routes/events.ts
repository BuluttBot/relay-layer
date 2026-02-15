import type { FastifyInstance } from 'fastify';
import { requireAuth, requireApiKey } from '../middleware/auth.js';
import { getDb } from '../db/client.js';
import { relayEventSchema } from '@relay-layer/shared';
import { nanoid } from 'nanoid';
import { broadcast } from '../ws/server.js';
import * as taskService from '../services/taskService.js';

export async function eventRoutes(app: FastifyInstance) {
  // Agent event ingestion (API key auth)
  app.post('/api/events', { preHandler: requireApiKey }, async (req, reply) => {
    const parsed = relayEventSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues });

    const db = getDb();
    const event = parsed.data;
    const id = event.id || `evt_${nanoid(16)}`;
    const timestamp = event.timestamp || new Date().toISOString();
    const meta = event.meta || { version: '0.1.0' };

    db.prepare(`INSERT INTO events (id, type, timestamp, source_agent_id, source_agent_name, source_session_key, project_id, payload, correlation_id, parent_event_id, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, event.type, timestamp, event.source.agentId, event.source.agentName,
      event.source.sessionKey || null, event.projectId,
      JSON.stringify(event.payload), meta.correlationId || null,
      meta.parentEventId || null, meta.version
    );

    // Side effects based on event type
    const payload = event.payload as Record<string, unknown>;
    const taskId = (payload.taskId as string) || meta.correlationId;

    if (taskId) {
      switch (event.type) {
        case 'task.assigned':
          taskService.updateTask(taskId, { status: 'assigned', assigned_to: (payload.assignedTo as Record<string, string>)?.agentId, assigned_by: payload.assignedBy as string });
          break;
        case 'task.started':
          taskService.updateTask(taskId, { status: 'in_progress' });
          break;
        case 'task.progress':
          if (payload.progress !== undefined) taskService.updateTask(taskId, { progress: payload.progress as number });
          if (payload.logEntry) taskService.addTaskLog(taskId, { stage: payload.stage as string, message: payload.logEntry as string, progress: payload.progress as number, artifacts: payload.artifacts as unknown[] });
          break;
        case 'task.completed':
          taskService.updateTask(taskId, { status: 'review', progress: 100 });
          break;
        case 'task.review_passed':
          taskService.updateTask(taskId, { status: 'done' });
          break;
        case 'task.review_failed':
          taskService.updateTask(taskId, { status: 'in_progress' });
          break;
        case 'task.awaiting_approval':
          taskService.updateTask(taskId, { status: 'burak' });
          break;
        case 'task.approved':
          taskService.updateTask(taskId, { status: 'published' });
          break;
        case 'task.rejected':
          taskService.updateTask(taskId, { status: 'review' });
          break;
        case 'task.report':
          const reportPayload = payload as { content: string; artifacts?: unknown[] };
          taskService.addTaskReport(taskId, {
            agentId: event.source.agentId,
            agentName: event.source.agentName,
            content: reportPayload.content,
            artifacts: reportPayload.artifacts
          });
          break;
      }
    }

    // Handle token usage
    if (payload.tokenUsage) {
      const tu = payload.tokenUsage as Record<string, unknown>;
      db.prepare(`INSERT INTO token_usage (id, task_id, agent_id, project_id, session_key, input_tokens, output_tokens, model, thinking_level, estimated_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        `tu_${nanoid(12)}`, taskId || null, event.source.agentId, event.projectId,
        event.source.sessionKey || null, tu.input || 0, tu.output || 0,
        tu.model || null, tu.thinkingLevel || null, tu.estimatedCost || 0
      );
    }

    // Handle agent status events
    if (event.type.startsWith('agent.')) {
      const agentId = (payload.agentId as string) || event.source.agentId;
      const newStatus = payload.newStatus as string;
      if (agentId && newStatus) {
        db.prepare('UPDATE agents SET status = ?, updated_at = ? WHERE id = ?').run(newStatus, new Date().toISOString(), agentId);
        broadcast('agent_status', { agentId, status: newStatus });
      }
    }

    // Handle comms events
    if (event.type.startsWith('comms.') && payload.from && payload.to) {
      const from = payload.from as Record<string, string>;
      const to = payload.to as Record<string, string>;
      db.prepare(`INSERT INTO communications (id, from_agent_id, from_agent_name, to_agent_id, to_agent_name, content, reply_to, session_key, project_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        `msg_${nanoid(12)}`, from.agentId, from.agentName, to.agentId, to.agentName,
        payload.content as string, payload.replyTo as string || null,
        payload.sessionKey as string || null, event.projectId
      );
    }

    // Broadcast asynchronously (non-blocking)
    setImmediate(() => {
      broadcast('event', { id, type: event.type, timestamp, source: event.source, projectId: event.projectId, payload: event.payload });
    });
    
    return reply.code(201).send({ id, type: event.type });
  });

  // Query events (session auth)
  app.get('/api/events', { preHandler: requireAuth }, async (req) => {
    const db = getDb();
    const { projectId, type, limit: lim } = req.query as { projectId?: string; type?: string; limit?: string };
    const limit = Math.min(parseInt(lim || '100', 10), 500);
    let sql = 'SELECT * FROM events WHERE 1=1';
    const params: (string | number)[] = [];
    if (projectId) { sql += ' AND project_id = ?'; params.push(projectId); }
    if (type) { sql += ' AND type = ?'; params.push(type); }
    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);
    const rows = db.prepare(sql).all(...params) as Array<Record<string, unknown>>;
    return rows.map(r => ({ ...r, payload: JSON.parse(r.payload as string) }));
  });
}
