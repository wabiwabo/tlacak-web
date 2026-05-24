import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MapUiState {
  selectedMapStyle: string;
  devicesOpen: boolean;
  eventsOpen: boolean;
  setSelectedMapStyle: (id: string) => void;
  setDevicesOpen: (open: boolean) => void;
  setEventsOpen: (open: boolean) => void;
}

export const useMapUiStore = create<MapUiState>()(
  persist(
    (set) => ({
      selectedMapStyle: 'cyberOps',
      devicesOpen: true,
      eventsOpen: false,
      setSelectedMapStyle: (id) => set({ selectedMapStyle: id }),
      setDevicesOpen: (open) => set({ devicesOpen: open }),
      setEventsOpen: (open) => set({ eventsOpen: open }),
    }),
    {
      name: 'traccar-map-ui',
      partialize: (state) => ({ selectedMapStyle: state.selectedMapStyle }),
    },
  ),
);
