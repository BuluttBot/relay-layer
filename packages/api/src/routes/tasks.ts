import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import * as taskService from '../services/taskService.js';
import { broadcast } from '../ws/server.js';
import { createTaskSchema, updateTaskSchema } from '@relay-layer/shared';

export async function taskRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/api/tasks', async (req) => {
    const { projectId, status } = req.query as { projectId?: string; status?: string };
    return taskService.listTasks(projectId, status);
  });

  app.get('/api/tasks/live', async () => {
    return taskService.getLiveTasks();
  });

  app.get('/api/tasks/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const task = taskService.getTask(id);
    if (!task) return reply.code(404).send({ error: 'Task not found' });
    return task;
  });

  app.post('/api/tasks', async (req, reply) => {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues });
    const { pin, ...data } = parsed.data;
    if (pin !== (process.env.AUTH_PIN || '1881')) {
      return reply.code(401).send({ error: 'Invalid PIN' });
    }
    const task = taskService.createTask({ ...data, created_by: 'burak' });
    broadcast('task_update', task);
    return reply.code(201).send(task);
  });

  app.patch('/api/tasks/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues });
    const task = taskService.updateTask(id, parsed.data);
    if (!task) return reply.code(404).send({ error: 'Task not found' });
    broadcast('task_update', task);
    return task;
  });
}
