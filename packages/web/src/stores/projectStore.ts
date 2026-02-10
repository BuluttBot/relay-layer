'use client';
import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  agents: string[];
  task_count: number;
  created_at: string;
  updated_at: string;
}

interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;
  loading: boolean;
  fetchProjects: () => Promise<void>;
  setActiveProject: (id: string | null) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  activeProjectId: null,
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const projects = await api.get<Project[]>('/projects');
      set({ projects, loading: false });
      if (projects.length > 0) set({ activeProjectId: projects[0].id });
    } catch {
      set({ loading: false });
    }
  },

  setActiveProject: (id) => set({ activeProjectId: id }),
}));
