export const TASK_STATUSES = ['inbox', 'assigned', 'in_progress', 'review', 'done', 'burak', 'published'] as const;
export type TaskStatus = typeof TASK_STATUSES[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TaskPriority = typeof TASK_PRIORITIES[number];

export const PROGRESS_STAGES = ['research', 'planning', 'implementation', 'testing', 'documentation', 'cleanup'] as const;
export type ProgressStage = typeof PROGRESS_STAGES[number];

export const AGENT_STATUSES = ['active', 'idle', 'offline'] as const;
export type AgentStatus = typeof AGENT_STATUSES[number];

export const EVENT_TYPES = [
  'task.created', 'task.assigned', 'task.started', 'task.progress',
  'task.completed', 'task.review_passed', 'task.review_failed',
  'task.awaiting_approval', 'task.approved', 'task.rejected',
  'task.subtask_requested', 'task.subtask_created', 'task.comment',
  'agent.online', 'agent.offline', 'agent.idle', 'agent.status_changed',
  'system.broadcast', 'system.error', 'system.auth',
  'system.project_created', 'system.agent_assigned',
  'comms.message', 'comms.request', 'comms.response',
] as const;
export type EventType = typeof EVENT_TYPES[number];

export const COLUMN_LABELS: Record<TaskStatus, string> = {
  inbox: 'INBOX',
  assigned: 'ASSIGNED',
  in_progress: 'IN PROGRESS',
  review: 'REVIEW',
  done: 'DONE',
  burak: 'BURAK',
  published: 'PUBLISHED',
};

export const COLUMN_COLORS: Record<TaskStatus, string> = {
  inbox: '#7C5CFC',
  assigned: '#3B82F6',
  in_progress: '#2DD4BF',
  review: '#F59E0B',
  done: '#10B981',
  burak: '#EC4899',
  published: '#8B5CF6',
};

export const MAX_SUBTASK_DEPTH = 3;
