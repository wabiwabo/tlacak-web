import { describe, expect, it } from 'vitest';
import { appendHistory } from '../socket-message';

describe('appendHistory', () => {
  it('appends a new coordinate to an empty route', () => {
    expect(appendHistory([], 10, 20, 5)).toEqual([[10, 20]]);
  });

  it('does not append a duplicate coordinate', () => {
    expect(appendHistory([[10, 20]], 10, 20, 5)).toEqual([[10, 20]]);
  });

  it('caps the route at the live-route limit', () => {
    const route: [number, number][] = [
      [1, 1],
      [2, 2],
      [3, 3],
    ];
    expect(appendHistory(route, 4, 4, 3)).toEqual([
      [2, 2],
      [3, 3],
      [4, 4],
    ]);
  });
});
