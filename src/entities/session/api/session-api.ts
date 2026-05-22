import type { LoginCredentials, RegisterPayload, Server, User } from '../model/types';
import { TotpRequiredError } from '../model/types';

/** fetch wrapper that throws the response body text on a non-ok status. */
async function fetchOrThrow(input: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error((await response.text()) || response.statusText);
  }
  return response;
}

/** GET /api/server — server configuration. Always required to succeed. */
export async function fetchServer(): Promise<Server> {
  const response = await fetchOrThrow('/api/server');
  return (await response.json()) as Server;
}

/** GET /api/session — current user, or null when unauthenticated. */
export async function fetchSession(): Promise<User | null> {
  const response = await fetch('/api/session');
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as User;
}

/** GET /api/session?token= — token-based login. */
export async function loginWithToken(token: string): Promise<User> {
  const response = await fetchOrThrow(`/api/session?token=${encodeURIComponent(token)}`);
  return (await response.json()) as User;
}

/** POST /api/session — email/password login. Throws TotpRequiredError on a TOTP challenge. */
export async function login(credentials: LoginCredentials): Promise<User> {
  const body = new URLSearchParams();
  body.set('email', credentials.email);
  body.set('password', credentials.password);
  if (credentials.code) {
    body.set('code', credentials.code);
  }
  const response = await fetch('/api/session', { method: 'POST', body });
  if (response.ok) {
    return (await response.json()) as User;
  }
  if (response.status === 401 && response.headers.get('WWW-Authenticate') === 'TOTP') {
    throw new TotpRequiredError();
  }
  throw new Error((await response.text()) || response.statusText);
}

/** DELETE /api/session — logout. Intentionally ignores errors; the caller redirects regardless. */
export async function logout(): Promise<void> {
  await fetch('/api/session', { method: 'DELETE' });
}

/** POST /api/session/token — issues a long-lived login token (used by the native bridge). */
export async function createSessionToken(expiration: string): Promise<string> {
  const response = await fetchOrThrow('/api/session/token', {
    method: 'POST',
    body: new URLSearchParams({ expiration }),
  });
  return await response.text();
}

/** POST /api/users — create a new user account. */
export async function registerUser(payload: RegisterPayload): Promise<User> {
  const response = await fetchOrThrow('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return (await response.json()) as User;
}

/** POST /api/users/totp — generate a TOTP secret for forced-2FA registration. */
export async function generateTotpKey(): Promise<string> {
  const response = await fetchOrThrow('/api/users/totp', { method: 'POST' });
  return await response.text();
}

/** PUT /api/server — persist server configuration changes. */
export async function updateServer(server: Server): Promise<Server> {
  const response = await fetchOrThrow('/api/server', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(server),
  });
  return (await response.json()) as Server;
}

/** PUT /api/users/{id} — update a user (terms acceptance, notification tokens). */
export async function updateUser(user: User): Promise<User> {
  const response = await fetchOrThrow(`/api/users/${user.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  return (await response.json()) as User;
}

/** POST /api/password/reset — request a reset email. */
export async function requestPasswordReset(email: string): Promise<void> {
  await fetchOrThrow('/api/password/reset', {
    method: 'POST',
    body: new URLSearchParams({ email }),
  });
}

/** POST /api/password/update — set a new password from a reset token. */
export async function updatePassword(token: string, password: string): Promise<void> {
  await fetchOrThrow('/api/password/update', {
    method: 'POST',
    body: new URLSearchParams({ token, password }),
  });
}
