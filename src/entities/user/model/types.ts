import type { components } from '@/shared/api/schema';

type SchemaUser = components['schemas']['User'];

/** Free-form attribute bag the backend returns on User. */
export type UserAttributes = Record<string, unknown>;

/** A user as returned by GET /api/users. */
export interface User extends Omit<SchemaUser, 'attributes'> {
  attributes: UserAttributes;
}
