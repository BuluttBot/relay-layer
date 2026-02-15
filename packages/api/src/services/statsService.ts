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

// ========== ENHANCED REPORTING ==========

export interface ProjectHealthReport {
  project_id: string;
  project_name: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  blocked_tasks: number;
  completion_rate: number;
  avg_task_duration_hours: number;
  velocity_per_week: number; // tasks completed per week
  bottleneck_status?: string; // status with highest avg time
  active_agents: number;
  total_cost: number;
}

export function getProjectHealthReports(): ProjectHealthReport[] {
  const db = getDb();
  
  // Get basic project stats
  const projects = db.prepare(`
    SELECT 
      p.id as project_id,
      p.name as project_name,
      COUNT(t.id) as total_tasks,
      SUM(CASE WHEN t.status IN ('done','burak','published') THEN 1 ELSE 0 END) as completed_tasks,
      SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
      SUM(CASE WHEN t.status = 'blocked' THEN 1 ELSE 0 END) as blocked_tasks,
      COALESCE(AVG(CASE 
        WHEN t.completed_at IS NOT NULL 
        THEN (julianday(t.completed_at) - julianday(t.created_at)) * 24 
        ELSE NULL 
      END), 0) as avg_task_duration_hours,
      COALESCE(SUM(tu.estimated_cost), 0) as total_cost
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id
    LEFT JOIN token_usage tu ON tu.project_id = p.id
    GROUP BY p.id
  `).all() as any[];

  // Calculate velocity and bottlenecks for each project
  const reports: ProjectHealthReport[] = projects.map(p => {
    // Calculate velocity (completed tasks in last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const recentCompleted = (db.prepare(`
      SELECT COUNT(*) as c FROM tasks 
      WHERE project_id = ? AND status IN ('done','burak','published') 
      AND completed_at > ?
    `).get(p.project_id, weekAgo) as { c: number }).c;

    // Find bottleneck (status with highest avg time)
    const bottleneck = db.prepare(`
      SELECT status, AVG((julianday(updated_at) - julianday(created_at)) * 24) as avg_hours
      FROM tasks 
      WHERE project_id = ? AND status NOT IN ('done','burak','published')
      GROUP BY status 
      ORDER BY avg_hours DESC 
      LIMIT 1
    `).get(p.project_id) as { status: string; avg_hours: number } | undefined;

    // Count active agents in project
    const activeAgents = (db.prepare(`
      SELECT COUNT(DISTINCT ap.agent_id) as c
      FROM agent_projects ap
      JOIN agents a ON a.id = ap.agent_id
      WHERE ap.project_id = ? AND a.status = 'active'
    `).get(p.project_id) as { c: number }).c;

    return {
      project_id: p.project_id,
      project_name: p.project_name,
      total_tasks: p.total_tasks || 0,
      completed_tasks: p.completed_tasks || 0,
      in_progress_tasks: p.in_progress_tasks || 0,
      blocked_tasks: p.blocked_tasks || 0,
      completion_rate: p.total_tasks > 0 ? Math.round((p.completed_tasks / p.total_tasks) * 100) : 0,
      avg_task_duration_hours: Math.round(p.avg_task_duration_hours * 10) / 10,
      velocity_per_week: recentCompleted,
      bottleneck_status: bottleneck?.status,
      active_agents: activeAgents,
      total_cost: Math.round(p.total_cost * 100) / 100,
    };
  });

  return reports;
}

export interface AgentPerformanceReport {
  agent_id: string;
  agent_name: string;
  status: string;
  tasks_completed: number;
  tasks_in_progress: number;
  tasks_blocked: number;
  avg_completion_time_hours: number;
  avg_response_time_hours: number; // time from assignment to first action
  workload_score: number; // 0-100, based on active tasks
  total_cost: number;
  avg_cost_per_task: number;
  token_efficiency: number; // output/input ratio
  recent_activity: string; // timestamp of last event
}

export function getAgentPerformanceReports(): AgentPerformanceReport[] {
  const db = getDb();
  
  const reports = db.prepare(`
    SELECT 
      a.id as agent_id,
      a.name as agent_name,
      a.status,
      COALESCE(SUM(CASE WHEN t.status IN ('done','burak','published') THEN 1 ELSE 0 END), 0) as tasks_completed,
      COALESCE(SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END), 0) as tasks_in_progress,
      COALESCE(SUM(CASE WHEN t.status = 'blocked' THEN 1 ELSE 0 END), 0) as tasks_blocked,
      COALESCE(AVG(CASE 
        WHEN t.completed_at IS NOT NULL 
        THEN (julianday(t.completed_at) - julianday(t.started_at)) * 24 
        ELSE NULL 
      END), 0) as avg_completion_time_hours,
      COALESCE(AVG(CASE 
        WHEN t.started_at IS NOT NULL 
        THEN (julianday(t.started_at) - julianday(t.created_at)) * 24 
        ELSE NULL 
      END), 0) as avg_response_time_hours,
      COALESCE((SELECT SUM(estimated_cost) FROM token_usage WHERE agent_id = a.id), 0) as total_cost,
      COALESCE((SELECT MAX(timestamp) FROM events WHERE source_agent_id = a.id), a.updated_at) as recent_activity
    FROM agents a
    LEFT JOIN tasks t ON t.assigned_to = a.id
    GROUP BY a.id
  `).all() as any[];

  return reports.map((r: any) => {
    // Calculate workload score (0-100)
    const workload_score = Math.min(100, r.tasks_in_progress * 20);

    // Calculate avg cost per task
    const avg_cost_per_task = r.tasks_completed > 0 ? r.total_cost / r.tasks_completed : 0;

    // Calculate token efficiency
    const tokenStats = db.prepare(`
      SELECT 
        SUM(input_tokens) as total_input,
        SUM(output_tokens) as total_output
      FROM token_usage WHERE agent_id = ?
    `).get(r.agent_id) as { total_input: number; total_output: number } | undefined;

    const token_efficiency = tokenStats && tokenStats.total_input > 0 
      ? Math.round((tokenStats.total_output / tokenStats.total_input) * 100) / 100 
      : 0;

    return {
      agent_id: r.agent_id,
      agent_name: r.agent_name,
      status: r.status,
      tasks_completed: r.tasks_completed,
      tasks_in_progress: r.tasks_in_progress,
      tasks_blocked: r.tasks_blocked,
      avg_completion_time_hours: Math.round(r.avg_completion_time_hours * 10) / 10,
      avg_response_time_hours: Math.round(r.avg_response_time_hours * 10) / 10,
      workload_score,
      total_cost: Math.round(r.total_cost * 100) / 100,
      avg_cost_per_task: Math.round(avg_cost_per_task * 100) / 100,
      token_efficiency,
      recent_activity: r.recent_activity,
    };
  });
}

export interface TokenAnalytics {
  by_project: Array<{
    project_id: string;
    project_name: string;
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    total_cost: number;
    avg_cost_per_task: number;
  }>;
  by_agent: Array<{
    agent_id: string;
    agent_name: string;
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    total_cost: number;
    efficiency: number;
  }>;
  by_model: Array<{
    model: string;
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    total_cost: number;
    usage_count: number;
  }>;
  timeline: Array<{
    date: string;
    total_tokens: number;
    total_cost: number;
  }>;
}

export function getTokenAnalytics(range?: string): TokenAnalytics {
  const db = getDb();
  
  let whereClause = '';
  const params: string[] = [];
  if (range) {
    whereClause = ' WHERE tu.created_at > ?';
    params.push(new Date(Date.now() - parseInt(range) * 86400000).toISOString());
  }

  // By Project
  const by_project = db.prepare(`
    SELECT 
      p.id as project_id,
      p.name as project_name,
      SUM(tu.input_tokens + tu.output_tokens) as total_tokens,
      SUM(tu.input_tokens) as input_tokens,
      SUM(tu.output_tokens) as output_tokens,
      SUM(tu.estimated_cost) as total_cost,
      COALESCE(SUM(tu.estimated_cost) / NULLIF(COUNT(DISTINCT tu.task_id), 0), 0) as avg_cost_per_task
    FROM token_usage tu
    JOIN projects p ON p.id = tu.project_id
    ${whereClause}
    GROUP BY p.id
    ORDER BY total_cost DESC
  `).all(...params) as any[];

  // By Agent
  const by_agent = db.prepare(`
    SELECT 
      a.id as agent_id,
      a.name as agent_name,
      SUM(tu.input_tokens + tu.output_tokens) as total_tokens,
      SUM(tu.input_tokens) as input_tokens,
      SUM(tu.output_tokens) as output_tokens,
      SUM(tu.estimated_cost) as total_cost,
      CASE WHEN SUM(tu.input_tokens) > 0 
        THEN CAST(SUM(tu.output_tokens) AS REAL) / SUM(tu.input_tokens) 
        ELSE 0 END as efficiency
    FROM token_usage tu
    JOIN agents a ON a.id = tu.agent_id
    ${whereClause}
    GROUP BY a.id
    ORDER BY total_cost DESC
  `).all(...params) as any[];

  // By Model
  const by_model = db.prepare(`
    SELECT 
      tu.model,
      SUM(tu.input_tokens + tu.output_tokens) as total_tokens,
      SUM(tu.input_tokens) as input_tokens,
      SUM(tu.output_tokens) as output_tokens,
      SUM(tu.estimated_cost) as total_cost,
      COUNT(*) as usage_count
    FROM token_usage tu
    ${whereClause}
    GROUP BY tu.model
    ORDER BY total_cost DESC
  `).all(...params) as any[];

  // Timeline (daily aggregation)
  const timeline = db.prepare(`
    SELECT 
      DATE(tu.created_at) as date,
      SUM(tu.input_tokens + tu.output_tokens) as total_tokens,
      SUM(tu.estimated_cost) as total_cost
    FROM token_usage tu
    ${whereClause}
    GROUP BY DATE(tu.created_at)
    ORDER BY date ASC
  `).all(...params) as any[];

  return {
    by_project: by_project.map((p: any) => ({
      ...p,
      total_cost: Math.round(p.total_cost * 100) / 100,
      avg_cost_per_task: Math.round(p.avg_cost_per_task * 100) / 100,
    })),
    by_agent: by_agent.map((a: any) => ({
      ...a,
      total_cost: Math.round(a.total_cost * 100) / 100,
      efficiency: Math.round(a.efficiency * 100) / 100,
    })),
    by_model: by_model.map((m: any) => ({
      ...m,
      total_cost: Math.round(m.total_cost * 100) / 100,
    })),
    timeline: timeline.map((t: any) => ({
      ...t,
      total_cost: Math.round(t.total_cost * 100) / 100,
    })),
  };
}
