import type { components } from '@/shared/api/schema';

type SchemaGroup = components['schemas']['Group'];

export type GroupAttributes = Record<string, unknown>;

/** A device group as returned by GET /api/groups. */
export interface Group extends Omit<SchemaGroup, 'attributes'> {
  attributes: GroupAttributes;
}
