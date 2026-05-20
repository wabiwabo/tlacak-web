import { create } from 'zustand';

interface ErrorsState {
  errors: string[];
  push: (message: string) => void;
  pop: () => void;
}

export const useErrorsStore = create<ErrorsState>((set) => ({
  errors: [],
  push: (message) => set((state) => ({ errors: [...state.errors, message] })),
  pop: () => set((state) => ({ errors: state.errors.slice(1) })),
}));
