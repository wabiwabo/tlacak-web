import { describe, expect, it, beforeEach } from 'vitest';
import { useSelectionStore } from '../selection-store';

beforeEach(() => {
  useSelectionStore.setState({ selectedDeviceId: null, selectTime: 0 });
});

describe('useSelectionStore', () => {
  it('selects a device id and bumps the select time', () => {
    const before = useSelectionStore.getState().selectTime;
    useSelectionStore.getState().select(42);
    expect(useSelectionStore.getState().selectedDeviceId).toBe(42);
    expect(useSelectionStore.getState().selectTime).toBeGreaterThanOrEqual(before);
  });

  it('clears the selection', () => {
    useSelectionStore.getState().select(42);
    useSelectionStore.getState().select(null);
    expect(useSelectionStore.getState().selectedDeviceId).toBeNull();
  });
});
