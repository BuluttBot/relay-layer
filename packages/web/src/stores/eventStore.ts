'use client';
import { create } from 'zustand';
import { api } from '@/lib/api';

export interface RelayEvent {
  id: string;
  type: string;
  timestamp: string;
  source_agent_id: string;
  source_agent_name: string;
  project_id: string;
  payload: Record<string, any>;
}

interface EventStore {
  events: RelayEvent[];
  unreadCount: number;
  loading: boolean;
  fetchEvents: (projectId?: string) => Promise<void>;
  pushEvent: (event: RelayEvent) => void;
  markRead: () => void;
}

const MAX_EVENTS = 200;

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  unreadCount: 0,
  loading: false,

  fetchEvents: async (projectId) => {
    set({ loading: true });
    try {
      const params = projectId ? `?projectId=${projectId}&limit=100` : '?limit=100';
      const events = await api.get<RelayEvent[]>(`/events${params}`);
      set({ events, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  pushEvent: (event) => {
    set(state => ({
      events: [event, ...state.events].slice(0, MAX_EVENTS),
      unreadCount: state.unreadCount + 1,
    }));
  },

  markRead: () => set({ unreadCount: 0 }),
}));
