import type { components } from '@/shared/api/schema';

type SchemaDevice = components['schemas']['Device'];

/** Free-form attribute bag the backend returns on Device. */
export type DeviceAttributes = Record<string, unknown>;

/** A tracked device as returned by GET /api/devices. */
export interface Device extends Omit<SchemaDevice, 'attributes'> {
  attributes: DeviceAttributes;
  /** Calendar id for scheduled access control (not in generated schema). */
  calendarId?: number;
  /** Account expiration time in ISO 8601 format (not in generated schema). */
  expirationTime?: string | null;
}

export type DeviceStatus = 'online' | 'offline' | 'unknown';
