import type { components } from '@/shared/api/schema';

type SchemaGeofence = components['schemas']['Geofence'];

export type GeofenceAttributes = Record<string, unknown>;

/** A geofence as returned by GET /api/geofences. `area` is a WKT string. */
export interface Geofence extends Omit<SchemaGeofence, 'attributes'> {
  attributes: GeofenceAttributes;
}
