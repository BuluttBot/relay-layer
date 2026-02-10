import { getDb } from '../db/client.js';
import { nanoid } from 'nanoid';
import type { Task, TaskDetail, TaskLog } from '@relay-layer/shared';

export function listTasks(projectId?: string, status?: string): Task[] {
  const db = getDb();
  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params: string[] = [];
  if (projectId) { sql += ' AND project_id = ?'; params.push(projectId); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY CASE priority WHEN \'urgent\' THEN 0 WHEN \'high\' THEN 1 WHEN \'medium\' THEN 2 ELSE 3 END, created_at DESC';
  const rows = db.prepare(sql).all(...params) as Task[];
  return rows.map(r => ({ ...r, tags: r.tags ? JSON.parse(r.tags as unknown as string) : null }));
}

export function getTask(id: string): TaskDetail | null {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
  if (!task) return null;
  const logs = db.prepare('SELECT * FROM task_logs WHERE task_id = ? ORDER BY created_at ASC').all(id) as TaskLog[];
  const subtasks = db.prepare('SELECT * FROM tasks WHERE parent_task_id = ? ORDER BY created_at ASC').all(id) as Task[];
  const agent = task.assigned_to ? db.prepare('SELECT name FROM agents WHERE id = ?').get(task.assigned_to) as { name: string } | undefined : undefined;
  return {
    ...task,
    tags: task.tags ? JSON.parse(task.tags as unknown as string) : null,
    logs: logs.map(l => ({ ...l, artifacts: l.artifacts ? JSON.parse(l.artifacts as unknown as string) : null })),
    subtasks: subtasks.map(s => ({ ...s, tags: s.tags ? JSON.parse(s.tags as unknown as string) : null })),
    agent_name: agent?.name,
  };
}

export function createTask(data: { project_id: string; title: string; description?: string; priority?: string; tags?: string[]; created_by: string; parent_task_id?: string; depth?: number }): Task {
  const db = getDb();
  const id = `task_${nanoid(12)}`;
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO tasks (id, project_id, parent_task_id, title, description, priority, tags, created_by, depth, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, data.project_id, data.parent_task_id || null, data.title, data.description || null, data.priority || 'medium', data.tags ? JSON.stringify(data.tags) : null, data.created_by, data.depth || 0, now, now);
  return getTask(id) as Task;
}

export function updateTask(id: string, updates: Record<string, unknown>): Task | null {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
  if (!existing) return null;

  const now = new Date().toISOString();
  const fields: string[] = ['updated_at = ?'];
  const values: unknown[] = [now];

  for (const [key, val] of Object.entries(updates)) {
    if (key === 'tags') {
      fields.push('tags = ?');
      values.push(JSON.stringify(val));
    } else if (['status', 'progress', 'assigned_to', 'assigned_by', 'title', 'description', 'priority'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }

  if (updates.status === 'in_progress' && !existing.started_at) {
    fields.push('started_at = ?');
    values.push(now);
  }
  if (updates.status === 'done' || updates.status === 'published') {
    fields.push('completed_at = ?');
    values.push(now);
  }
  if (updates.status === 'published') {
    fields.push('published_at = ?');
    values.push(now);
  }

  values.push(id);
  db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getTask(id) as Task;
}

export function addTaskLog(taskId: string, data: { stage?: string; message: string; progress?: number; artifacts?: unknown[] }): TaskLog {
  const db = getDb();
  const id = `log_${nanoid(12)}`;
  db.prepare(
    `INSERT INTO task_logs (id, task_id, stage, message, progress, artifacts) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, taskId, data.stage || null, data.message, data.progress ?? null, data.artifacts ? JSON.stringify(data.artifacts) : null);

  if (data.progress !== undefined) {
    db.prepare('UPDATE tasks SET progress = ?, updated_at = ? WHERE id = ?').run(data.progress, new Date().toISOString(), taskId);
  }

  return db.prepare('SELECT * FROM task_logs WHERE id = ?').get(id) as TaskLog;
}

export function getLiveTasks(): Task[] {
  const db = getDb();
  return (db.prepare("SELECT * FROM tasks WHERE status = 'in_progress' ORDER BY updated_at DESC").all() as Task[])
    .map(r => ({ ...r, tags: r.tags ? JSON.parse(r.tags as unknown as string) : null }));
}
