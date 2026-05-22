import type { Device } from '@/entities/device';
import type { Position } from '@/entities/position';
import type { DeviceEvent } from '@/entities/event';

/** Shape of a `/api/socket` message payload. All fields are optional. */
export interface SocketMessage {
  devices?: Device[];
  positions?: Position[];
  events?: DeviceEvent[];
  logs?: unknown[];
}

/** Parses a raw socket frame; returns an empty message on malformed JSON. */
export function parseSocketMessage(raw: string): SocketMessage {
  try {
    const data = JSON.parse(raw) as SocketMessage;
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

/**
 * Appends `[lng, lat]` to a live-route ring buffer, skipping duplicates and
 * capping the buffer at `limit` points. The port of the legacy `history` reducer.
 */
export function appendHistory(
  route: [number, number][],
  longitude: number,
  latitude: number,
  limit: number,
): [number, number][] {
  const last = route.at(-1);
  if (last && last[0] === longitude && last[1] === latitude) {
    return route;
  }
  const trimmed = route.slice(Math.max(0, route.length - (limit - 1)));
  return [...trimmed, [longitude, latitude]];
}
