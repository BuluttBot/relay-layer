export interface StatsOverview {
  total_tasks: number;
  completed_tasks: number;
  active_tasks: number;
  completion_rate: number;
  active_agents: number;
  total_cost: number;
}

export interface AgentStats {
  agent_id: string;
  agent_name: string;
  tasks_completed: number;
  tasks_in_progress: number;
  total_cost: number;
  avg_cost_per_task: number;
}

export interface CostBreakdown {
  agent_id: string;
  agent_name: string;
  project_id: string;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost: number;
  model: string;
}

export interface PipelineStats {
  status: string;
  avg_time_hours: number;
  task_count: number;
}
