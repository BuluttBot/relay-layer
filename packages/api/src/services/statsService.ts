import { getDb } from '../db/client.js';
import type { StatsOverview, AgentStats, CostBreakdown, PipelineStats } from '@relay-layer/shared';

export function getOverview(): StatsOverview {
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as c FROM tasks').get() as { c: number }).c;
  const completed = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status IN ('done','burak','published')").get() as { c: number }).c;
  const active = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'in_progress'").get() as { c: number }).c;
  const activeAgents = (db.prepare("SELECT COUNT(*) as c FROM agents WHERE status = 'active'").get() as { c: number }).c;
  const cost = (db.prepare('SELECT COALESCE(SUM(estimated_cost), 0) as c FROM token_usage').get() as { c: number }).c;
  return {
    total_tasks: total,
    completed_tasks: completed,
    active_tasks: active,
    completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    active_agents: activeAgents,
    total_cost: cost,
  };
}

export function getAgentStats(): AgentStats[] {
  const db = getDb();
  return db.prepare(`
    SELECT a.id as agent_id, a.name as agent_name,
      COALESCE(SUM(CASE WHEN t.status IN ('done','burak','published') THEN 1 ELSE 0 END), 0) as tasks_completed,
      COALESCE(SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END), 0) as tasks_in_progress,
      COALESCE((SELECT SUM(estimated_cost) FROM token_usage WHERE agent_id = a.id), 0) as total_cost,
      CASE WHEN COALESCE(SUM(CASE WHEN t.status IN ('done','burak','published') THEN 1 ELSE 0 END), 0) > 0
        THEN COALESCE((SELECT SUM(estimated_cost) FROM token_usage WHERE agent_id = a.id), 0) / SUM(CASE WHEN t.status IN ('done','burak','published') THEN 1 ELSE 0 END)
        ELSE 0 END as avg_cost_per_task
    FROM agents a LEFT JOIN tasks t ON t.assigned_to = a.id
    GROUP BY a.id
  `).all() as AgentStats[];
}

export function getCosts(range?: string): CostBreakdown[] {
  const db = getDb();
  let sql = `
    SELECT tu.agent_id, a.name as agent_name, tu.project_id,
      SUM(tu.input_tokens) as total_input_tokens, SUM(tu.output_tokens) as total_output_tokens,
      SUM(tu.estimated_cost) as total_cost, tu.model
    FROM token_usage tu
    LEFT JOIN agents a ON a.id = tu.agent_id
  `;
  const params: string[] = [];
  if (range) {
    sql += ' WHERE tu.created_at > ?';
    params.push(new Date(Date.now() - parseInt(range) * 86400000).toISOString());
  }
  sql += ' GROUP BY tu.agent_id, tu.project_id, tu.model';
  return db.prepare(sql).all(...params) as CostBreakdown[];
}

export function getPipelineStats(): PipelineStats[] {
  const db = getDb();
  return db.prepare(`
    SELECT status, COUNT(*) as task_count,
      COALESCE(AVG((julianday(updated_at) - julianday(created_at)) * 24), 0) as avg_time_hours
    FROM tasks GROUP BY status
  `).all() as PipelineStats[];
}
