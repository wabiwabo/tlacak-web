import type { components } from '@/shared/api/schema';

type SchemaUser = components['schemas']['User'];
type SchemaServer = components['schemas']['Server'];

/** Free-form attribute bag the backend returns on User/Server. */
export type Attributes = Record<string, unknown>;

/** Server config as returned by GET /api/server, including runtime-only fields. */
export interface Server extends Omit<SchemaServer, 'attributes'> {
  attributes: Attributes;
  /** True before any user exists — drives register-first onboarding. */
  newServer?: boolean;
  /** Whether outbound email is configured (reset-password availability). */
  emailEnabled?: boolean;
  /** Server-wide announcement banner text. */
  announcement?: string;
  /** Disables the Reports section for non-admin users. */
  disableReports?: boolean;
}

/** Authenticated user as returned by GET/POST /api/session. */
export interface User extends Omit<SchemaUser, 'attributes'> {
  attributes: Attributes;
}

/** Credentials posted to POST /api/session. */
export interface LoginCredentials {
  email: string;
  password: string;
  /** TOTP code, only sent after a 401 WWW-Authenticate: TOTP challenge. */
  code?: string;
}

/** Payload posted to POST /api/users during registration. */
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  totpKey?: string | null;
}

/** Thrown by session-api calls when a TOTP code is required. */
export class TotpRequiredError extends Error {
  constructor() {
    super('TOTP code required');
    this.name = 'TotpRequiredError';
  }
}
