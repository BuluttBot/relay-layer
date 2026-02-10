'use client';
import { create } from 'zustand';
import { api } from '@/lib/api';

interface AuthStore {
  authenticated: boolean;
  loading: boolean;
  pinToken: string | null;
  checkAuth: () => Promise<boolean>;
  submitPin: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  requestCode: () => Promise<{ ok: boolean; error?: string }>;
  verifyCode: (code: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  authenticated: false,
  loading: true,
  pinToken: null,

  checkAuth: async () => {
    try {
      const res = await api.get<{ authenticated: boolean }>('/auth/check');
      set({ authenticated: res.authenticated, loading: false });
      return res.authenticated;
    } catch {
      set({ authenticated: false, loading: false });
      return false;
    }
  },

  submitPin: async (pin) => {
    try {
      const res = await api.post<{ success: boolean; pinToken?: string; error?: string }>('/auth/pin', { pin });
      if (res.success && res.pinToken) {
        set({ pinToken: res.pinToken });
        return { ok: true };
      }
      return { ok: false, error: res.error || 'Invalid PIN' };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  requestCode: async () => {
    const { pinToken } = get();
    if (!pinToken) return { ok: false, error: 'No PIN token' };
    try {
      const res = await api.post<{ success: boolean; error?: string }>('/auth/code', { pinToken });
      return res.success ? { ok: true } : { ok: false, error: res.error };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  verifyCode: async (code) => {
    const { pinToken } = get();
    if (!pinToken) return { ok: false, error: 'No PIN token' };
    try {
      const res = await api.post<{ success: boolean; error?: string }>('/auth/verify', { pinToken, code });
      if (res.success) {
        set({ authenticated: true });
        return { ok: true };
      }
      return { ok: false, error: res.error };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  logout: async () => {
    await api.post('/auth/logout', {}).catch(() => {});
    set({ authenticated: false, pinToken: null });
  },
}));
