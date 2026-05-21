import { describe, expect, it } from 'vitest';
import { buildMotionSegments } from '../motion-segments';

describe('buildMotionSegments', () => {
  it('returns a single stopped segment when there are no events', () => {
    expect(buildMotionSegments([], 0, 100)).toEqual([{ type: 'stopped', value: 1 }]);
  });

  it('builds moving/stopped segments split at event timestamps', () => {
    const segments = buildMotionSegments(
      [
        { type: 'deviceMoving', eventTime: new Date(40).toISOString() },
        { type: 'deviceStopped', eventTime: new Date(70).toISOString() },
      ],
      0,
      100,
    );
    expect(segments).toEqual([
      { type: 'stopped', value: 40 },
      { type: 'moving', value: 30 },
      { type: 'stopped', value: 30 },
    ]);
  });

  it('clamps event timestamps into the window', () => {
    const segments = buildMotionSegments(
      [{ type: 'deviceStopped', eventTime: new Date(500).toISOString() }],
      0,
      100,
    );
    expect(segments).toEqual([{ type: 'moving', value: 100 }]);
  });
});
