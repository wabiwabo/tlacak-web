import { create } from 'zustand';

interface SelectionState {
  selectedDeviceId: number | null;
  selectTime: number;
  select: (deviceId: number | null) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedDeviceId: null,
  selectTime: 0,
  select: (deviceId) => set({ selectedDeviceId: deviceId, selectTime: Date.now() }),
}));
