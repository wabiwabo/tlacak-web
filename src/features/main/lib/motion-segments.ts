import dayjs from 'dayjs';

export type MotionState = 'moving' | 'stopped';

export interface MotionSegment {
  type: MotionState;
  value: number;
}

export interface MotionEvent {
  type: string;
  eventTime: string;
}

/** Builds motion bar segments from sorted 24h deviceMoving/deviceStopped events. */
export function buildMotionSegments(
  events: MotionEvent[],
  fromTimestamp: number,
  toTimestamp: number,
): MotionSegment[] {
  if (!events.length) {
    return [{ type: 'stopped', value: 1 }];
  }

  const segments: MotionSegment[] = [];
  let cursor = fromTimestamp;
  let state: MotionState = 'stopped';
  if (events[0]?.type === 'deviceStopped') {
    state = 'moving';
  }

  for (const event of events) {
    const timestamp = dayjs(event.eventTime).valueOf();
    const clamped = Math.max(fromTimestamp, Math.min(toTimestamp, timestamp));
    if (clamped > cursor) {
      segments.push({ type: state, value: clamped - cursor });
    }
    state = event.type === 'deviceMoving' ? 'moving' : 'stopped';
    cursor = clamped;
  }

  if (toTimestamp > cursor) {
    segments.push({ type: state, value: toTimestamp - cursor });
  }

  return segments;
}
