import { create } from 'zustand';
import type { Device } from '@/entities/device';
import type { Position } from '@/entities/position';
import type { DeviceEvent } from '@/entities/event';
import { appendHistory } from '../lib/socket-message';

type DeviceMap = Record<number, Device>;
type PositionMap = Record<number, Position>;
type HistoryMap = Record<number, [number, number][]>;

interface LiveState {
  devices: DeviceMap;
  positions: PositionMap;
  history: HistoryMap;
  events: DeviceEvent[];
  socketOpen: boolean;
  includeLogs: boolean;
  logs: unknown[];
  refreshDevices: (devices: Device[]) => void;
  updateDevices: (devices: Device[]) => void;
  refreshPositions: (positions: Position[]) => void;
  applyPositions: (positions: Position[], liveRoutes: string, limit: number) => void;
  addEvents: (events: DeviceEvent[]) => void;
  deleteEvent: (id: number) => void;
  clearEvents: () => void;
  setSocketOpen: (open: boolean) => void;
  setIncludeLogs: (value: boolean) => void;
  setLogs: (logs: unknown[]) => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  devices: {},
  positions: {},
  history: {},
  events: [],
  socketOpen: false,
  includeLogs: false,
  logs: [],

  refreshDevices: (devices) =>
    set({ devices: Object.fromEntries(devices.map((d) => [d.id as number, d])) }),

  updateDevices: (devices) =>
    set((state) => {
      const next = { ...state.devices };
      for (const device of devices) {
        next[device.id as number] = device;
      }
      return { devices: next };
    }),

  refreshPositions: (positions) =>
    set({ positions: Object.fromEntries(positions.map((p) => [p.deviceId as number, p])) }),

  applyPositions: (positions, liveRoutes, limit) =>
    set((state) => {
      const nextPositions = { ...state.positions };
      const nextHistory: HistoryMap = liveRoutes === 'none' ? {} : { ...state.history };
      for (const pos of positions) {
        const deviceId = pos.deviceId as number;
        nextPositions[deviceId] = pos;
        if (liveRoutes !== 'none') {
          nextHistory[deviceId] = appendHistory(
            nextHistory[deviceId] ?? [],
            pos.longitude as number,
            pos.latitude as number,
            limit,
          );
        }
      }
      return { positions: nextPositions, history: nextHistory };
    }),

  addEvents: (events) => set((state) => ({ events: [...events, ...state.events] })),
  deleteEvent: (id) => set((state) => ({ events: state.events.filter((e) => e.id !== id) })),
  clearEvents: () => set({ events: [] }),
  setSocketOpen: (open) => set({ socketOpen: open }),
  setIncludeLogs: (value) => set({ includeLogs: value }),
  setLogs: (logs) => set({ logs }),
}));
