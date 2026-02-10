'use client';
import { create } from 'zustand';
import { api } from '@/lib/api';

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
  status: string;
  current_task_id: string | null;
  current_task_title?: string;
  tasks_completed: number;
  projects: string[];
  created_at: string;
  updated_at: string;
}

interface AgentStore {
  agents: Agent[];
  loading: boolean;
  fetchAgents: () => Promise<void>;
  updateAgentLocal: (id: string, updates: Partial<Agent>) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  loading: false,

  fetchAgents: async () => {
    set({ loading: true });
    try {
      const agents = await api.get<Agent[]>('/agents');
      set({ agents, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  updateAgentLocal: (id, updates) => {
    set(state => ({
      agents: state.agents.map(a => a.id === id ? { ...a, ...updates } : a),
    }));
  },
}));
