import { describe, expect, it, vi } from 'vitest';

vi.mock('maplibre-gl', () => ({
  default: { Map: vi.fn(function () {}) },
}));
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

describe('map-instance ready registry', () => {
  it('notifies subscribers of ready changes', async () => {
    const { addReadyListener, setReady, isReady } = await import('../map-instance');
    const seen: boolean[] = [];
    const unsubscribe = addReadyListener((ready) => seen.push(ready));
    expect(seen).toEqual([false]);
    setReady(true);
    expect(seen).toEqual([false, true]);
    expect(isReady()).toBe(true);
    unsubscribe();
    setReady(false);
    expect(seen).toEqual([false, true]);
  });
});
