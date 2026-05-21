import { describe, expect, it, beforeEach } from 'vitest';
import { useMotionStore } from '../motion-store';

beforeEach(() => useMotionStore.setState({ segments: {} }));

describe('useMotionStore', () => {
  it('stores and clears motion segments', () => {
    useMotionStore.getState().set({ 5: [{ type: 'moving', value: 10 }] });
    expect(useMotionStore.getState().segments[5]).toHaveLength(1);
    useMotionStore.getState().clear();
    expect(useMotionStore.getState().segments).toEqual({});
  });
});
