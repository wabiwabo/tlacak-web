import type { components } from '@/shared/api/schema';

type SchemaDriver = components['schemas']['Driver'];

/** Free-form attribute bag the backend returns on Driver. */
export type DriverAttributes = Record<string, unknown>;

/** A driver as returned by GET /api/drivers. */
export interface Driver extends Omit<SchemaDriver, 'attributes'> {
  attributes: DriverAttributes;
}
