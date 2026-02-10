import { z } from 'zod';
import { TASK_STATUSES, TASK_PRIORITIES } from '../constants.js';

export const createTaskSchema = z.object({
  project_id: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  priority: z.enum(TASK_PRIORITIES).default('medium'),
  tags: z.array(z.string()).optional(),
  pin: z.string().length(4),
});

export const updateTaskSchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  assigned_to: z.string().optional(),
  assigned_by: z.string().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateTaskSchemaInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskSchemaInput = z.infer<typeof updateTaskSchema>;
