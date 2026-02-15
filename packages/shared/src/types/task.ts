import type { TaskStatus, TaskPriority, ProgressStage } from '../constants.js';

export interface Task {
  id: string;
  project_id: string;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  assigned_by: string | null;
  progress: number;
  depth: number;
  tags: string[] | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  published_at: string | null;
}

export interface TaskLog {
  id: string;
  task_id: string;
  stage: ProgressStage | null;
  message: string;
  progress: number | null;
  artifacts: TaskArtifact[] | null;
  created_at: string;
}

export interface TaskArtifact {
  type: string;
  path?: string;
  ref?: string;
  action?: string;
}

export interface TaskReport {
  id: string;
  task_id: string;
  agent_id: string;
  agent_name: string;
  content: string;
  artifacts: TaskArtifact[] | null;
  created_at: string;
}

export interface TaskDetail extends Task {
  logs: TaskLog[];
  reports: TaskReport[];
  subtasks: Task[];
  agent_name?: string;
}

export interface CreateTaskInput {
  project_id: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  tags?: string[];
  pin: string;
}

export interface UpdateTaskInput {
  status?: TaskStatus;
  progress?: number;
  assigned_to?: string;
  assigned_by?: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  tags?: string[];
}
