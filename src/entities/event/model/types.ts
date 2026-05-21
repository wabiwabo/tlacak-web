import type { components } from '@/shared/api/schema';

type SchemaEvent = components['schemas']['Event'];

export type EventAttributes = Record<string, unknown>;

/** A device event as delivered over the WebSocket feed. */
export interface DeviceEvent extends Omit<SchemaEvent, 'attributes'> {
  attributes: EventAttributes;
}
