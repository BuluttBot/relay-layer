'use client';
import { create } from 'zustand';

interface UIStore {
  activitySidebarOpen: boolean;
  agentsSidebarOpen: boolean;
  chatViewerOpen: boolean;
  statsOpen: boolean;
  reportsOpen: boolean;
  broadcastModalOpen: boolean;
  taskDetailOpen: boolean;
  toggle: (key: keyof Omit<UIStore, 'toggle' | 'close'>) => void;
  close: (key: keyof Omit<UIStore, 'toggle' | 'close'>) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activitySidebarOpen: false,
  agentsSidebarOpen: true,
  chatViewerOpen: false,
  statsOpen: false,
  reportsOpen: false,
  broadcastModalOpen: false,
  taskDetailOpen: false,

  toggle: (key) => set(state => ({ [key]: !state[key] })),
  close: (key) => set({ [key]: false }),
}));
