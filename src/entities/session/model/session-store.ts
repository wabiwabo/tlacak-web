import { create } from 'zustand';
import type { Server, User } from './types';

interface SessionState {
  server: Server | null;
  user: User | null;
  setServer: (server: Server | null) => void;
  setUser: (user: User | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  server: null,
  user: null,
  setServer: (server) => set({ server }),
  setUser: (user) => set({ user }),
}));
