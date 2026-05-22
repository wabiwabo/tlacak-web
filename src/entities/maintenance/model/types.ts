import type { components } from '@/shared/api/schema';

type SchemaMaintenance = components['schemas']['Maintenance'];

/** Free-form attribute bag the backend returns on Maintenance. */
export type MaintenanceAttributes = Record<string, unknown>;

/** A maintenance record as returned by GET /api/maintenance. */
export interface Maintenance extends Omit<SchemaMaintenance, 'attributes'> {
  attributes: MaintenanceAttributes;
}
