import type { AgentStatus } from '../constants.js';

export interface Agent {
  id: string;
  name: string;
  title: string | null;
  tag: string | null;
  description: string | null;
  avatar: string | null;
  skills: string[] | null;
  model: string | null;
  thinking_level: string | null;
  status: AgentStatus;
  current_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentWithStats extends Agent {
  tasks_completed: number;
  current_task_title?: string;
  projects: string[];
}

export interface CreateAgentInput {
  id: string;
  name: string;
  title?: string;
  tag?: string;
  description?: string;
  avatar?: string;
  skills?: string[];
  model?: string;
  thinking_level?: string;
}

export interface UpdateAgentInput {
  name?: string;
  title?: string;
  tag?: string;
  description?: string;
  avatar?: string;
  skills?: string[];
  model?: string;
  thinking_level?: string;
  status?: AgentStatus;
  current_task_id?: string | null;
}
