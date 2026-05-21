import { describe, expect, it, beforeEach } from 'vitest';
import { useLiveStore } from '../live-store';
import type { Position } from '@/entities/position';

const initial = useLiveStore.getState();

beforeEach(() => {
  useLiveStore.setState({ ...initial, devices: {}, positions: {}, history: {}, events: [] });
});

function position(id: number, deviceId: number, lng: number, lat: number): Position {
  return { id, deviceId, longitude: lng, latitude: lat, attributes: {} } as Position;
}

describe('useLiveStore', () => {
  it('upserts positions keyed by deviceId', () => {
    useLiveStore.getState().applyPositions([position(1, 7, 10, 20)], 'none', 10);
    expect(useLiveStore.getState().positions[7]?.id).toBe(1);
  });

  it('accumulates the live route history when live routes are enabled', () => {
    const apply = useLiveStore.getState().applyPositions;
    apply([position(1, 7, 10, 20)], 'all', 10);
    apply([position(2, 7, 11, 21)], 'all', 10);
    expect(useLiveStore.getState().history[7]).toEqual([
      [10, 20],
      [11, 21],
    ]);
  });

  it('clears history when live routes are disabled', () => {
    const apply = useLiveStore.getState().applyPositions;
    apply([position(1, 7, 10, 20)], 'all', 10);
    apply([position(2, 7, 11, 21)], 'none', 10);
    expect(useLiveStore.getState().history).toEqual({});
  });

  it('replaces the device map on refresh', () => {
    useLiveStore.getState().refreshDevices([{ id: 3, name: 'X', attributes: {} } as never]);
    expect(Object.keys(useLiveStore.getState().devices)).toEqual(['3']);
  });
});
