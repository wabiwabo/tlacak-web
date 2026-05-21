import type { components } from '@/shared/api/schema';

type SchemaPosition = components['schemas']['Position'];

/** Free-form attribute bag the backend returns on Position. */
export type PositionAttributes = Record<string, unknown>;

/** A device position as returned by GET /api/positions and the socket feed. */
export interface Position extends Omit<SchemaPosition, 'attributes'> {
  attributes: PositionAttributes;
  geofenceIds?: number[];
}
