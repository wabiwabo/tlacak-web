import { create } from 'zustand';
import type { MotionSegment } from '@/features/main/lib/motion-segments';

interface MotionState {
  segments: Record<number, MotionSegment[]>;
  set: (segments: Record<number, MotionSegment[]>) => void;
  clear: () => void;
}

export const useMotionStore = create<MotionState>((set) => ({
  segments: {},
  set: (segments) => set({ segments }),
  clear: () => set({ segments: {} }),
}));
