'use client';
import { create } from 'zustand';
import { api } from '@/lib/api';
import { COLUMN_CONFIG } from '@/lib/constants';

export interface Task {
  id: string;
  project_id: string;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
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
  agent_name?: string;
  logs?: any[];
  reports?: any[];
  subtasks?: Task[];
}

interface TaskStore {
  tasks: Task[];
  selectedTask: Task | null;
  loading: boolean;
  fetchTasks: (projectId?: string) => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  selectTask: (task: Task | null) => void;
  updateTaskLocal: (task: Task) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  selectedTask: null,
  loading: false,

  fetchTasks: async (projectId) => {
    set({ loading: true });
    try {
      const params = projectId ? `?projectId=${projectId}` : '';
      const tasks = await api.get<Task[]>(`/tasks${params}`);
      set({ tasks, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchTask: async (id) => {
    try {
      const task = await api.get<Task>(`/tasks/${id}`);
      set({ selectedTask: task });
    } catch {}
  },

  selectTask: (task) => set({ selectedTask: task }),

  updateTaskLocal: (updated) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === updated.id ? { ...t, ...updated } : t),
      selectedTask: state.selectedTask?.id === updated.id ? { ...state.selectedTask, ...updated } : state.selectedTask,
    }));
  },
}));

export function getTasksByStatus(tasks: Task[]) {
  const grouped: Record<string, Task[]> = {};
  for (const col of COLUMN_CONFIG) grouped[col.key] = [];
  for (const task of tasks) {
    if (grouped[task.status]) grouped[task.status].push(task);
  }
  return grouped;
}
