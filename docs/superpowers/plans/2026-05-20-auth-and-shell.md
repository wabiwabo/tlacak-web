# Auth & shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the authentication subsystem and the application shell for the rewritten Traccar web frontend — server-config bootstrap, session/auth domain model, the four auth pages (Login, Register, ResetPassword, ChangeServer), protected vs public routing, the responsive shell chrome (desktop sidebar + mobile bottom navigation), the versioned NativeInterface bridge, the terms-acceptance gate, and a global error surface. This replaces the legacy `ServerProvider`, `Navigation`, `App`, the Redux `session`/`errors` slices, the `NativeInterface` module, and the `login/*` pages at 1:1 behavioural parity.

**Architecture:** `entities/session/` owns the session+server domain model and its TanStack Query hooks (`useServer`, `useSession`, `useLogin`, `useLogout`, etc.) plus a Zustand UI store for the live `user`/`server` snapshot consumed by permission helpers. `features/auth/` holds the four auth-page components and their layout. `features/shell/` holds the app shell (sidebar, bottom nav, page chrome, terms gate, native bridge). `pages/` stays thin — route components delegate to features. `shared/` gains the error store, the `<ErrorToaster>`, and form primitives. The dependency rule `pages → features → entities → shared` is enforced by `import-x`.

**Tech Stack:** React 19, TypeScript (strict), Vite 8, Tailwind CSS v4, shadcn/ui, TanStack Query v5, Zustand v5, React Router v7 (data router), react-i18next, openapi-fetch, Vitest + Testing Library, Playwright.

**Branch:** `rewrite/modern-frontend`

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `src/entities/session/model/types.ts` | `Server`, `User` augmented domain types + `ServerAttributes`/`UserAttributes`. |
| `src/entities/session/model/session-store.ts` | Zustand store holding the current `user`/`server` snapshot. |
| `src/entities/session/model/permissions.ts` | `useAdministrator`, `useManager`, `useDeviceReadonly`, `useRestriction` hooks. |
| `src/entities/session/api/session-api.ts` | Raw typed/`fetch` calls to `/api/server`, `/api/session`, `/api/users`, `/api/password/*`. |
| `src/entities/session/api/queries.ts` | TanStack Query hooks: `useServerQuery`, `useSessionQuery`, mutations. |
| `src/entities/session/index.ts` | Public barrel for the session entity. |
| `src/shared/lib/errors/errors-store.ts` | Zustand error queue store (legacy `errors` slice). |
| `src/shared/ui/ErrorToaster.tsx` | Renders queued errors as a toast (legacy `ErrorHandler`). |
| `src/shared/ui/input.tsx`, `label.tsx`, `dialog.tsx`, `select.tsx`, `sonner.tsx` | shadcn primitives added for auth forms + toasts. |
| `src/shared/lib/use-document-loader.ts` | Shows/hides the `index.html` `.loader` element (legacy `Loader`). |
| `src/features/native-bridge/native-interface.ts` | TypeScript port of the versioned mobile-app bridge protocol. |
| `src/features/native-bridge/NativeBridge.tsx` | Component that syncs notification tokens (legacy `NativeInterface` component). |
| `src/features/auth/ServerGate.tsx` | Loads `/api/server` before the app renders (legacy `ServerProvider`). |
| `src/features/auth/RequireAuth.tsx` | Protected-route guard + session bootstrap (legacy `App` session logic). |
| `src/features/auth/QueryParamGate.tsx` | Handles `locale`/`token`/`uniqueId`/`openid` query params (legacy `Navigation`). |
| `src/features/auth/LoginLayout.tsx` | Two-pane auth page chrome (legacy `LoginLayout`). |
| `src/features/auth/LoginForm.tsx` | Email/password + TOTP login form. |
| `src/features/auth/RegisterForm.tsx` | Registration form. |
| `src/features/auth/ResetPasswordForm.tsx` | Password reset / update form. |
| `src/features/auth/ChangeServerForm.tsx` | Server-switch form. |
| `src/features/shell/AppShell.tsx` | Authenticated layout: page area + responsive nav (legacy `App`). |
| `src/features/shell/Sidebar.tsx` | Desktop side navigation. |
| `src/features/shell/BottomNav.tsx` | Mobile bottom navigation (legacy `BottomMenu`). |
| `src/features/shell/nav-items.ts` | Navigation item definitions + permission predicates. |
| `src/features/shell/TermsGate.tsx` | Terms-acceptance dialog gate (legacy `TermsDialog`). |
| `src/shared/lib/use-media-query.ts` | `useMediaQuery` hook for responsive breakpoints. |
| `src/pages/{LoginPage,RegisterPage,ResetPasswordPage,ChangeServerPage,MainPage}.tsx` | Thin route components. |
| `src/app/router.tsx` | Route tree wiring public + protected branches. |
| `src/app/App.tsx`, `src/app/providers.tsx` | Compose the gates and providers. |

---

## Task 1: Session domain types & error store

**Files:**
- Create: `src/entities/session/model/types.ts`, `src/shared/lib/errors/errors-store.ts`
- Test: `src/shared/lib/errors/__tests__/errors-store.test.ts`

- [ ] **Step 1: Create the session domain types — `src/entities/session/model/types.ts`**

The generated OpenAPI schema types `User.attributes`/`Server.attributes` as `Record<string, never>` and omit several runtime-only fields the backend actually returns (`emailEnabled`, `newServer`, `disableReports`, etc.). Define augmented domain types here — the single source of truth the rest of the plan imports.

```ts
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
```

- [ ] **Step 2: Write the failing test — `src/shared/lib/errors/__tests__/errors-store.test.ts`**

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import { useErrorsStore } from '../errors-store';

beforeEach(() => {
  useErrorsStore.setState({ errors: [] });
});

describe('useErrorsStore', () => {
  it('pushes an error onto the queue', () => {
    useErrorsStore.getState().push('boom');
    expect(useErrorsStore.getState().errors).toEqual(['boom']);
  });

  it('pops the oldest error first (FIFO)', () => {
    useErrorsStore.getState().push('first');
    useErrorsStore.getState().push('second');
    useErrorsStore.getState().pop();
    expect(useErrorsStore.getState().errors).toEqual(['second']);
  });

  it('pop is a no-op on an empty queue', () => {
    useErrorsStore.getState().pop();
    expect(useErrorsStore.getState().errors).toEqual([]);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/shared/lib/errors`
Expected: FAIL — cannot resolve `../errors-store`.

- [ ] **Step 4: Implement `src/shared/lib/errors/errors-store.ts`**

Ports the legacy Redux `errors` slice (`push` appends, `pop` shifts the head).

```ts
import { create } from 'zustand';

interface ErrorsState {
  errors: string[];
  push: (message: string) => void;
  pop: () => void;
}

export const useErrorsStore = create<ErrorsState>((set) => ({
  errors: [],
  push: (message) => set((state) => ({ errors: [...state.errors, message] })),
  pop: () => set((state) => ({ errors: state.errors.slice(1) })),
}));
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/shared/lib/errors`
Expected: PASS — all three tests pass.

- [ ] **Step 6: Verify typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add session domain types and errors store"
```

---

## Task 2: Session API layer

**Files:**
- Create: `src/entities/session/api/session-api.ts`
- Test: `src/entities/session/api/__tests__/session-api.test.ts`

- [ ] **Step 1: Write the failing test — `src/entities/session/api/__tests__/session-api.test.ts`**

The auth endpoints use form-encoded bodies, return non-JSON in places (`/api/users/totp` returns plain text), and signal TOTP via a `401` + `WWW-Authenticate: TOTP` header. The test stubs `fetch` to lock that behaviour down.

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchServer,
  fetchSession,
  login,
  logout,
  requestPasswordReset,
} from '../session-api';
import { TotpRequiredError } from '../../model/types';

function mockFetch(response: Partial<Response> & { ok: boolean }) {
  return vi.fn().mockResolvedValue({
    headers: new Headers(),
    json: async () => ({}),
    text: async () => '',
    ...response,
  } as Response);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('session-api', () => {
  it('fetchServer returns parsed server config', async () => {
    vi.stubGlobal('fetch', mockFetch({ ok: true, json: async () => ({ id: 1, attributes: {} }) }));
    await expect(fetchServer()).resolves.toEqual({ id: 1, attributes: {} });
  });

  it('fetchSession resolves null when unauthenticated (non-ok)', async () => {
    vi.stubGlobal('fetch', mockFetch({ ok: false, status: 404 }));
    await expect(fetchSession()).resolves.toBeNull();
  });

  it('login posts a form-encoded body and returns the user', async () => {
    const fetchSpy = mockFetch({ ok: true, json: async () => ({ id: 7, attributes: {} }) });
    vi.stubGlobal('fetch', fetchSpy);
    const user = await login({ email: 'a@b.co', password: 'pw' });
    expect(user).toEqual({ id: 7, attributes: {} });
    const [, init] = fetchSpy.mock.calls[0]!;
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(URLSearchParams);
    expect((init.body as URLSearchParams).get('email')).toBe('a@b.co');
  });

  it('login throws TotpRequiredError on a 401 TOTP challenge', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ ok: false, status: 401, headers: new Headers({ 'WWW-Authenticate': 'TOTP' }) }),
    );
    await expect(login({ email: 'a@b.co', password: 'pw' })).rejects.toBeInstanceOf(
      TotpRequiredError,
    );
  });

  it('login throws the response body text on other failures', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ ok: false, status: 400, text: async () => 'Invalid credentials' }),
    );
    await expect(login({ email: 'a@b.co', password: 'pw' })).rejects.toThrow('Invalid credentials');
  });

  it('login includes the code field when a TOTP code is supplied', async () => {
    const fetchSpy = mockFetch({ ok: true, json: async () => ({ id: 7, attributes: {} }) });
    vi.stubGlobal('fetch', fetchSpy);
    await login({ email: 'a@b.co', password: 'pw', code: '123456' });
    const [, init] = fetchSpy.mock.calls[0]!;
    expect((init.body as URLSearchParams).get('code')).toBe('123456');
  });

  it('logout issues a DELETE to /api/session', async () => {
    const fetchSpy = mockFetch({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);
    await logout();
    expect(fetchSpy.mock.calls[0]![0]).toBe('/api/session');
    expect(fetchSpy.mock.calls[0]![1].method).toBe('DELETE');
  });

  it('requestPasswordReset posts the email form-encoded', async () => {
    const fetchSpy = mockFetch({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);
    await requestPasswordReset('user@host.com');
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/api/password/reset');
    expect((init.body as URLSearchParams).get('email')).toBe('user@host.com');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/entities/session/api`
Expected: FAIL — cannot resolve `../session-api`.

- [ ] **Step 3: Implement `src/entities/session/api/session-api.ts`**

These are deliberately raw `fetch` calls, not `apiClient` calls: the endpoints use form-encoded bodies and custom-header semantics that `openapi-fetch` cannot express cleanly. The generated types are not lost — `Server`/`User` from `model/types.ts` are still the typed return values.

```ts
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

/** DELETE /api/session — logout. */
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/entities/session/api`
Expected: PASS — all eight tests pass.

- [ ] **Step 5: Verify lint and typecheck**

Run: `npm run lint && npm run typecheck`
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add session API layer for auth endpoints"
```

---

## Task 3: Session store, permissions & query hooks

**Files:**
- Create: `src/entities/session/model/session-store.ts`, `src/entities/session/model/permissions.ts`, `src/entities/session/api/queries.ts`, `src/entities/session/index.ts`
- Test: `src/entities/session/model/__tests__/permissions.test.ts`

- [ ] **Step 1: Create the session store — `src/entities/session/model/session-store.ts`**

A small Zustand store mirroring the legacy Redux `session` slice's `server`/`user` fields. TanStack Query owns fetching; this store is the synchronous snapshot the permission hooks read without subscribing to Query.

```ts
import { create } from 'zustand';
import type { Server, User } from './types';

interface SessionState {
  server: Server | null;
  user: User | null;
  setServer: (server: Server | null) => void;
  setUser: (user: User | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  server: null,
  user: null,
  setServer: (server) => set({ server }),
  setUser: (user) => set({ user }),
}));
```

- [ ] **Step 2: Write the failing test — `src/entities/session/model/__tests__/permissions.test.ts`**

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSessionStore } from '../session-store';
import {
  useAdministrator,
  useManager,
  useDeviceReadonly,
  useRestriction,
} from '../permissions';
import type { Server, User } from '../types';

function setSession(user: Partial<User>, server: Partial<Server> = {}) {
  useSessionStore.setState({
    user: { attributes: {}, ...user } as User,
    server: { attributes: {}, ...server } as Server,
  });
}

beforeEach(() => {
  useSessionStore.setState({ user: null, server: null });
});

describe('permission hooks', () => {
  it('useAdministrator reflects the administrator flag', () => {
    setSession({ administrator: true });
    expect(renderHook(() => useAdministrator()).result.current).toBe(true);
    setSession({ administrator: false });
    expect(renderHook(() => useAdministrator()).result.current).toBe(false);
  });

  it('useManager is true for admins or users with a non-zero userLimit', () => {
    setSession({ userLimit: 5 });
    expect(renderHook(() => useManager()).result.current).toBe(true);
    setSession({ administrator: true, userLimit: 0 });
    expect(renderHook(() => useManager()).result.current).toBe(true);
    setSession({ userLimit: 0 });
    expect(renderHook(() => useManager()).result.current).toBe(false);
  });

  it('useDeviceReadonly is false for admins regardless of readonly flags', () => {
    setSession({ administrator: true }, { deviceReadonly: true });
    expect(renderHook(() => useDeviceReadonly()).result.current).toBe(false);
  });

  it('useDeviceReadonly is true when any readonly flag is set for a non-admin', () => {
    setSession({}, { deviceReadonly: true });
    expect(renderHook(() => useDeviceReadonly()).result.current).toBe(true);
  });

  it('useRestriction reads a keyed flag off user or server, ignored for admins', () => {
    setSession({}, { disableReports: true } as Partial<Server>);
    expect(renderHook(() => useRestriction('disableReports')).result.current).toBe(true);
    setSession({ administrator: true }, { disableReports: true } as Partial<Server>);
    expect(renderHook(() => useRestriction('disableReports')).result.current).toBe(false);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/entities/session/model`
Expected: FAIL — cannot resolve `../permissions`.

- [ ] **Step 4: Implement `src/entities/session/model/permissions.ts`**

Direct ports of legacy `common/util/permissions.js`, reading the Zustand store instead of Redux.

```ts
import { useSessionStore } from './session-store';
import type { Server, User } from './types';

/** Keys readable as a boolean restriction off either user or server. */
type RestrictionKey = 'readonly' | 'disableReports' | 'limitCommands' | 'deviceReadonly';

export function useAdministrator(): boolean {
  return useSessionStore((state) => Boolean(state.user?.administrator));
}

export function useManager(): boolean {
  return useSessionStore((state) => {
    const admin = Boolean(state.user?.administrator);
    const manager = (state.user?.userLimit ?? 0) !== 0;
    return admin || manager;
  });
}

export function useDeviceReadonly(): boolean {
  return useSessionStore((state) => {
    const admin = Boolean(state.user?.administrator);
    const flags = [
      state.server?.readonly,
      state.user?.readonly,
      state.server?.deviceReadonly,
      state.user?.deviceReadonly,
    ];
    return !admin && flags.some(Boolean);
  });
}

export function useRestriction(key: RestrictionKey): boolean {
  return useSessionStore((state) => {
    const admin = Boolean(state.user?.administrator);
    const serverValue = (state.server as Server | null)?.[key as keyof Server];
    const userValue = (state.user as User | null)?.[key as keyof User];
    return !admin && Boolean(serverValue || userValue);
  });
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/entities/session/model`
Expected: PASS — all five permission tests pass.

- [ ] **Step 6: Implement the query hooks — `src/entities/session/api/queries.ts`**

`useServerQuery` and `useSessionQuery` mirror their stores into `useSessionStore` via the query `select`/`useEffect` pattern so permission hooks stay in sync. Mutations invalidate the session query.

```ts
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchServer,
  fetchSession,
  login,
  logout,
  registerUser,
  requestPasswordReset,
  updatePassword,
  updateUser,
} from './session-api';
import { useSessionStore } from '../model/session-store';
import type { LoginCredentials, RegisterPayload, Server, User } from '../model/types';

export const sessionKeys = {
  server: ['session', 'server'] as const,
  user: ['session', 'user'] as const,
};

/** Loads GET /api/server once and mirrors it into the session store. */
export function useServerQuery() {
  const setServer = useSessionStore((state) => state.setServer);
  const query = useQuery({
    queryKey: sessionKeys.server,
    queryFn: fetchServer,
    staleTime: Infinity,
    retry: false,
  });
  useEffect(() => {
    if (query.data) {
      setServer(query.data);
    }
  }, [query.data, setServer]);
  return query;
}

/** Loads GET /api/session and mirrors the user (or null) into the session store. */
export function useSessionQuery() {
  const setUser = useSessionStore((state) => state.setUser);
  const query = useQuery({
    queryKey: sessionKeys.user,
    queryFn: fetchSession,
    staleTime: Infinity,
    retry: false,
  });
  useEffect(() => {
    if (query.data !== undefined) {
      setUser(query.data);
    }
  }, [query.data, setUser]);
  return query;
}

/** Synchronously sets the session-query cache + store after a successful auth flow. */
function useApplyUser() {
  const queryClient = useQueryClient();
  const setUser = useSessionStore((state) => state.setUser);
  return (user: User) => {
    queryClient.setQueryData<User | null>(sessionKeys.user, user);
    setUser(user);
  };
}

export function useLogin() {
  const applyUser = useApplyUser();
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: applyUser,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const setUser = useSessionStore((state) => state.setUser);
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData<User | null>(sessionKeys.user, null);
      setUser(null);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerUser(payload),
  });
}

export function usePasswordReset() {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  });
}

export function usePasswordUpdate() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      updatePassword(token, password),
  });
}

/** Persists a user update (used by terms acceptance + native token sync). */
export function useUpdateUser() {
  const applyUser = useApplyUser();
  return useMutation({
    mutationFn: (user: User) => updateUser(user),
    onSuccess: applyUser,
  });
}

/** Patches the cached server config in place (e.g. clearing newServer after register). */
export function usePatchServer() {
  const queryClient = useQueryClient();
  const setServer = useSessionStore((state) => state.setServer);
  return (patch: Partial<Server>) => {
    const current = queryClient.getQueryData<Server>(sessionKeys.server);
    if (current) {
      const next = { ...current, ...patch };
      queryClient.setQueryData(sessionKeys.server, next);
      setServer(next);
    }
  };
}
```

- [ ] **Step 7: Create the entity barrel — `src/entities/session/index.ts`**

```ts
export type {
  Attributes,
  LoginCredentials,
  RegisterPayload,
  Server,
  User,
} from './model/types';
export { TotpRequiredError } from './model/types';
export { useSessionStore } from './model/session-store';
export {
  useAdministrator,
  useManager,
  useDeviceReadonly,
  useRestriction,
} from './model/permissions';
export {
  sessionKeys,
  useServerQuery,
  useSessionQuery,
  useLogin,
  useLogout,
  useRegister,
  usePasswordReset,
  usePasswordUpdate,
  useUpdateUser,
  usePatchServer,
} from './api/queries';
export { loginWithToken, createSessionToken, generateTotpKey } from './api/session-api';
```

- [ ] **Step 8: Verify lint, typecheck, tests**

Run: `npm run lint && npm run typecheck && npm test`
Expected: all exit 0.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Add session store, permission hooks, and query layer"
```

---

## Task 4: Form UI primitives & document loader

**Files:**
- Create: `src/shared/ui/input.tsx`, `src/shared/ui/label.tsx`, `src/shared/ui/dialog.tsx`, `src/shared/ui/select.tsx`, `src/shared/lib/use-document-loader.ts`, `src/shared/lib/use-media-query.ts`
- Test: `src/shared/lib/__tests__/use-media-query.test.ts`
- Modify: `src/shared/ui/index.ts`

- [ ] **Step 1: Add the shadcn form primitives**

```bash
npx shadcn@latest add input label dialog select --yes
```

Expected: creates `src/shared/ui/input.tsx`, `label.tsx`, `dialog.tsx`, `select.tsx` (shadcn installs `@radix-ui/*` deps).

- [ ] **Step 2: Export the new primitives from `src/shared/ui/index.ts`**

Replace the file contents with:

```ts
export * from './button';
export * from './card';
export * from './input';
export * from './label';
export * from './dialog';
export * from './select';
export * from './data-table/DataTable';
export { Loader } from './Loader';
```

- [ ] **Step 3: Create the document-loader hook — `src/shared/lib/use-document-loader.ts`**

Ports the legacy `Loader` component: shows the `.loader` spinner baked into `index.html` while a route/gate is pending, hides it on unmount.

```ts
import { useEffect } from 'react';

/** Reveals the index.html `.loader` spinner while mounted; hides it on unmount. */
export function useDocumentLoader(): void {
  useEffect(() => {
    const loader = document.querySelector<HTMLElement>('.loader');
    if (loader) {
      loader.style.display = '';
    }
    return () => {
      if (loader) {
        loader.style.display = 'none';
      }
    };
  }, []);
}
```

- [ ] **Step 4: Write the failing test — `src/shared/lib/__tests__/use-media-query.test.ts`**

```ts
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMediaQuery } from '../use-media-query';

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

describe('useMediaQuery', () => {
  it('returns true when the query matches', () => {
    stubMatchMedia(true);
    expect(renderHook(() => useMediaQuery('(min-width: 768px)')).result.current).toBe(true);
  });

  it('returns false when the query does not match', () => {
    stubMatchMedia(false);
    expect(renderHook(() => useMediaQuery('(min-width: 768px)')).result.current).toBe(false);
  });
});
```

- [ ] **Step 5: Run it to verify it fails**

Run: `npx vitest run src/shared/lib/__tests__/use-media-query.test.ts`
Expected: FAIL — cannot resolve `../use-media-query`.

- [ ] **Step 6: Implement `src/shared/lib/use-media-query.ts`**

```ts
import { useEffect, useState } from 'react';

/** Reactive media-query hook — replaces MUI's useMediaQuery. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx vitest run src/shared/lib/__tests__/use-media-query.test.ts`
Expected: PASS.

- [ ] **Step 8: Verify lint, typecheck, build**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: all exit 0.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Add form UI primitives, document loader, and media-query hook"
```

---

## Task 5: Error toaster

**Files:**
- Create: `src/shared/ui/sonner.tsx`, `src/shared/ui/ErrorToaster.tsx`
- Test: `src/shared/ui/__tests__/ErrorToaster.test.tsx`
- Modify: `src/shared/ui/index.ts`, `src/app/providers.tsx`

- [ ] **Step 1: Add the shadcn sonner (toast) primitive**

```bash
npx shadcn@latest add sonner --yes
```

Expected: creates `src/shared/ui/sonner.tsx` and installs the `sonner` package.

- [ ] **Step 2: Write the failing test — `src/shared/ui/__tests__/ErrorToaster.test.tsx`**

`ErrorToaster` watches `useErrorsStore`; each queued message is shown once then popped. The test asserts the message reaches the document and the queue drains.

```tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ErrorToaster } from '../ErrorToaster';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';

beforeEach(() => {
  useErrorsStore.setState({ errors: [] });
});

describe('ErrorToaster', () => {
  it('renders a queued error message and drains the queue', async () => {
    render(<ErrorToaster />);
    act(() => {
      useErrorsStore.getState().push('Server exploded');
    });
    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
    expect(useErrorsStore.getState().errors).toEqual([]);
  });

  it('shortens a Java-style exception message to its first line', async () => {
    render(<ErrorToaster />);
    act(() => {
      useErrorsStore.getState().push('java.lang.RuntimeException: Bad input\n  at line 1');
    });
    expect(await screen.findByText('Bad input')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/shared/ui/__tests__/ErrorToaster.test.tsx`
Expected: FAIL — cannot resolve `../ErrorToaster`.

- [ ] **Step 4: Implement `src/shared/ui/ErrorToaster.tsx`**

Ports legacy `ErrorHandler`: subscribes to the error queue, surfaces each message via `sonner.toast.error`, and pops it. The exception-prefix stripping mirrors the legacy regex.

```tsx
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Toaster } from './sonner';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';

/** Strips a leading Java exception class chain from a multi-line error message. */
function formatMessage(raw: string): string {
  const firstLine = raw.split('\n')[0] ?? raw;
  return firstLine.replace(/^(?:(?:[\w$]+\.)*[\w$]+(?:Exception|Error)?:\s*)+/i, '');
}

export function ErrorToaster() {
  const next = useErrorsStore((state) => state.errors[0]);
  const pop = useErrorsStore((state) => state.pop);

  useEffect(() => {
    if (next !== undefined) {
      toast.error(formatMessage(next));
      pop();
    }
  }, [next, pop]);

  return <Toaster position="bottom-center" richColors />;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/shared/ui/__tests__/ErrorToaster.test.tsx`
Expected: PASS — both tests pass.

- [ ] **Step 6: Export `ErrorToaster` from `src/shared/ui/index.ts`**

Append:

```ts
export { ErrorToaster } from './ErrorToaster';
```

- [ ] **Step 7: Mount `ErrorToaster` in `src/app/providers.tsx`**

Add the import and render it as a sibling of `children` inside `I18nProvider`. Replace the `I18nProvider` body:

```tsx
import { ErrorToaster } from '@/shared/ui';
```

```tsx
        <ThemeProvider>
          <I18nProvider>
            {children}
            <ErrorToaster />
          </I18nProvider>
        </ThemeProvider>
```

- [ ] **Step 8: Verify lint, typecheck, tests, build**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: all exit 0.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Add error toaster wired to the errors store"
```

---

## Task 6: NativeInterface bridge

**Files:**
- Create: `src/features/native-bridge/native-interface.ts`, `src/features/native-bridge/NativeBridge.tsx`, `src/features/native-bridge/index.ts`
- Test: `src/features/native-bridge/__tests__/native-interface.test.ts`

- [ ] **Step 1: Write the failing test — `src/features/native-bridge/__tests__/native-interface.test.ts`**

This locks the versioned protocol with the mobile apps: window globals, `appInterface` detection, exact message strings, and listener registries.

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  nativePostMessage,
  loginTokenListeners,
  notificationTokenListeners,
  nativeNotificationListeners,
  isNativeEnvironment,
} from '../native-interface';

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as Record<string, unknown>).appInterface;
  delete (window as Record<string, unknown>).webkit;
  loginTokenListeners.clear();
  notificationTokenListeners.clear();
  nativeNotificationListeners.clear();
});

describe('native-interface', () => {
  it('registers the three window globals on import', () => {
    expect(typeof window.handleLoginToken).toBe('function');
    expect(typeof window.updateNotificationToken).toBe('function');
    expect(typeof window.handleNativeNotification).toBe('function');
  });

  it('window.handleLoginToken dispatches to every registered listener', () => {
    const seen: string[] = [];
    loginTokenListeners.add((token) => seen.push(token));
    window.handleLoginToken('abc');
    expect(seen).toEqual(['abc']);
  });

  it('window.handleNativeNotification dispatches the message', () => {
    const seen: string[] = [];
    nativeNotificationListeners.add((message) => seen.push(message));
    window.handleNativeNotification('hello');
    expect(seen).toEqual(['hello']);
  });

  it('isNativeEnvironment is false with no bridge present', () => {
    expect(isNativeEnvironment()).toBe(false);
  });

  it('isNativeEnvironment is true when window.appInterface exists', () => {
    (window as Record<string, unknown>).appInterface = { postMessage: vi.fn() };
    expect(isNativeEnvironment()).toBe(true);
  });

  it('nativePostMessage routes to the Android appInterface', () => {
    const postMessage = vi.fn();
    (window as Record<string, unknown>).appInterface = { postMessage };
    nativePostMessage('logout');
    expect(postMessage).toHaveBeenCalledWith('logout');
  });

  it('nativePostMessage routes to the iOS webkit handler when present', () => {
    const postMessage = vi.fn();
    (window as Record<string, unknown>).webkit = {
      messageHandlers: { appInterface: { postMessage } },
    };
    nativePostMessage('server|https://x.test');
    expect(postMessage).toHaveBeenCalledWith('server|https://x.test');
  });

  it('nativePostMessage is a no-op outside a native environment', () => {
    expect(() => nativePostMessage('authentication')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/features/native-bridge`
Expected: FAIL — cannot resolve `../native-interface`.

- [ ] **Step 3: Implement `src/features/native-bridge/native-interface.ts`**

A faithful TypeScript port of legacy `NativeInterface.js`. The window globals, listener `Set`s, `appInterface` detection, and message strings (`authentication`, `authenticated`, `logout`, `login|<token>`, `server|<url>`) are the versioned protocol — signatures must not change.

```ts
import { createSessionToken } from '@/entities/session';

type TokenListener = (token: string) => void;
type MessageListener = (message: string) => void;

interface AppInterface {
  postMessage: (message: string) => void;
}

declare global {
  interface Window {
    appInterface?: AppInterface;
    webkit?: { messageHandlers?: { appInterface?: AppInterface } };
    handleLoginToken?: (token: string) => void;
    updateNotificationToken?: (token: string) => void;
    handleNativeNotification?: (message: string) => void;
  }
}

/** Listeners notified when the native app delivers a login token. */
export const loginTokenListeners = new Set<TokenListener>();
/** Listeners notified when the native app delivers a push-notification token. */
export const notificationTokenListeners = new Set<TokenListener>();
/** Listeners notified when the native app forwards a notification payload. */
export const nativeNotificationListeners = new Set<MessageListener>();

window.handleLoginToken = (token: string) => {
  loginTokenListeners.forEach((listener) => listener(token));
};
window.updateNotificationToken = (token: string) => {
  notificationTokenListeners.forEach((listener) => listener(token));
};
window.handleNativeNotification = (message: string) => {
  nativeNotificationListeners.forEach((listener) => listener(message));
};

/** Resolves the active native bridge handle, iOS (webkit) first then Android. */
function nativeHandle(): AppInterface | undefined {
  return window.webkit?.messageHandlers?.appInterface ?? window.appInterface;
}

/** True when running inside the iOS/Android wrapper app. */
export function isNativeEnvironment(): boolean {
  return nativeHandle() !== undefined;
}

/** Posts a protocol message to the native app; no-op in a plain browser. */
export function nativePostMessage(message: string): void {
  nativeHandle()?.postMessage(message);
}

/**
 * Mints a 6-month login token and hands it to the native app as `login|<token>`.
 * Sends `login|` (empty) on failure, matching the legacy contract.
 */
export async function generateLoginToken(): Promise<void> {
  if (!isNativeEnvironment()) {
    return;
  }
  let token = '';
  try {
    const expiration = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString();
    token = await createSessionToken(expiration);
  } catch {
    token = '';
  }
  nativePostMessage(`login|${token}`);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/native-bridge`
Expected: PASS — all eight tests pass.

- [ ] **Step 5: Implement the `NativeBridge` component — `src/features/native-bridge/NativeBridge.tsx`**

Ports the legacy `NativeInterface` React component: when a notification token arrives and a user is signed in, it merges the token into the user's `notificationTokens` attribute (keeping the last three) and persists it.

```tsx
import { useEffect, useState } from 'react';
import { notificationTokenListeners } from './native-interface';
import { useSessionStore, useUpdateUser } from '@/entities/session';

/** Headless component that syncs native push tokens onto the current user. */
export function NativeBridge() {
  const user = useSessionStore((state) => state.user);
  const updateUser = useUpdateUser();
  const [notificationToken, setNotificationToken] = useState<string | null>(null);

  useEffect(() => {
    const listener = (token: string) => setNotificationToken(token);
    notificationTokenListeners.add(listener);
    return () => {
      notificationTokenListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!user || !notificationToken) {
      return;
    }
    window.localStorage.setItem('notificationToken', notificationToken);
    const current = String(user.attributes.notificationTokens ?? '');
    const tokens = current ? current.split(',') : [];
    if (!tokens.includes(notificationToken)) {
      updateUser.mutate({
        ...user,
        attributes: {
          ...user.attributes,
          notificationTokens: [...tokens.slice(-2), notificationToken].join(','),
        },
      });
    }
    setNotificationToken(null);
  }, [user, notificationToken, updateUser]);

  return null;
}
```

- [ ] **Step 6: Create the barrel — `src/features/native-bridge/index.ts`**

```ts
export {
  nativePostMessage,
  isNativeEnvironment,
  generateLoginToken,
  loginTokenListeners,
  notificationTokenListeners,
  nativeNotificationListeners,
} from './native-interface';
export { NativeBridge } from './NativeBridge';
```

- [ ] **Step 7: Verify lint, typecheck, tests**

Run: `npm run lint && npm run typecheck && npm test`
Expected: all exit 0.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Add NativeInterface bridge with versioned protocol port"
```

---

## Task 7: Server gate

**Files:**
- Create: `src/features/auth/ServerGate.tsx`
- Test: `src/features/auth/__tests__/ServerGate.test.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Write the failing test — `src/features/auth/__tests__/ServerGate.test.tsx`**

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServerGate } from '../ServerGate';

function renderGate() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ServerGate>
        <div>app body</div>
      </ServerGate>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ServerGate', () => {
  it('renders children once the server config loads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1, attributes: {} }) }),
    );
    renderGate();
    expect(await screen.findByText('app body')).toBeInTheDocument();
  });

  it('renders an error with a retry button when the server config fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, text: async () => 'Server unreachable' }),
    );
    renderGate();
    expect(await screen.findByText('Server unreachable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/features/auth/__tests__/ServerGate.test.tsx`
Expected: FAIL — cannot resolve `../ServerGate`.

- [ ] **Step 3: Implement `src/features/auth/ServerGate.tsx`**

Ports legacy `ServerProvider`: blocks rendering until `/api/server` resolves; shows a retryable error on failure; shows the document loader while pending.

```tsx
import type { ReactNode } from 'react';
import { useServerQuery } from '@/entities/session';
import { useDocumentLoader } from '@/shared/lib/use-document-loader';
import { Button } from '@/shared/ui';
import { useTranslation } from 'react-i18next';

function ServerLoader() {
  useDocumentLoader();
  return null;
}

export function ServerGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { data, error, isPending, refetch } = useServerQuery();

  if (isPending) {
    return <ServerLoader />;
  }
  if (error || !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-row">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : t('errorGeneral')}
        </p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          {t('sharedRetry', 'Retry')}
        </Button>
      </div>
    );
  }
  return children;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/auth/__tests__/ServerGate.test.tsx`
Expected: PASS — both tests pass.

- [ ] **Step 5: Wrap the router in `ServerGate` — `src/app/App.tsx`**

```tsx
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './providers';
import { router } from './router';
import { ServerGate } from '@/features/auth/ServerGate';

export default function App() {
  return (
    <AppProviders>
      <ServerGate>
        <RouterProvider router={router} />
      </ServerGate>
    </AppProviders>
  );
}
```

- [ ] **Step 6: Verify lint, typecheck, tests, build**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: all exit 0.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add ServerGate to load server config before render"
```

---

## Task 8: Auth layout & login form

**Files:**
- Create: `src/features/auth/LoginLayout.tsx`, `src/features/auth/LoginForm.tsx`
- Test: `src/features/auth/__tests__/LoginForm.test.tsx`
- Modify: `src/pages/LoginPage.tsx`

- [ ] **Step 1: Create the auth layout — `src/features/auth/LoginLayout.tsx`**

Ports legacy `LoginLayout`: a branded primary-colour panel beside a centred form card. RTL-aware via logical properties; the brand panel collapses on small screens.

```tsx
import type { ReactNode } from 'react';

/** Two-pane auth chrome: brand panel + centred form card. */
export function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex h-full">
      <div className="hidden w-72 items-center justify-center bg-primary text-primary-foreground lg:flex">
        <span className="text-2xl font-semibold tracking-wide">Traccar</span>
      </div>
      <div className="flex flex-1 items-center justify-center bg-background p-row">
        <form className="flex w-full max-w-sm flex-col gap-4 p-6">{children}</form>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Write the failing test — `src/features/auth/__tests__/LoginForm.test.tsx`**

```tsx
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LoginForm } from '../LoginForm';
import { useSessionStore } from '@/entities/session';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  navigate.mockClear();
  useSessionStore.setState({
    server: { attributes: {}, registration: true, emailEnabled: true } as never,
    user: null,
  });
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LoginForm', () => {
  it('logs in and navigates to the postLogin target', async () => {
    window.sessionStorage.setItem('postLogin', '/reports/route');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1, attributes: {} }) }),
    );
    renderForm();
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.co');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(navigate).toHaveBeenCalledWith('/reports/route', { replace: true });
  });

  it('reveals the TOTP code field after a TOTP challenge', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ 'WWW-Authenticate': 'TOTP' }),
        text: async () => '',
      }),
    );
    renderForm();
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.co');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(await screen.findByLabelText(/code/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/features/auth/__tests__/LoginForm.test.tsx`
Expected: FAIL — cannot resolve `../LoginForm`.

- [ ] **Step 4: Implement `src/features/auth/LoginForm.tsx`**

Ports legacy `LoginPage` form logic: email persisted to `localStorage`, password-login with `postLogin` redirect, TOTP reveal on challenge, OpenID button, register/reset links gated by server flags, `generateLoginToken` on success, and `nativePostMessage('authentication')` + login-token listener registration on mount.

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLogin, useSessionStore, loginWithToken, TotpRequiredError } from '@/entities/session';
import { generateLoginToken, nativePostMessage, loginTokenListeners } from '@/features/native-bridge';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { Button, Input, Label } from '@/shared/ui';

const EMAIL_KEY = 'loginEmail';

export function LoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const setUser = useSessionStore((state) => state.setUser);
  const pushError = useErrorsStore((state) => state.push);

  const server = useSessionStore((state) => state.server);
  const registrationEnabled = Boolean(server?.registration);
  const emailEnabled = Boolean(server?.emailEnabled);
  const openIdEnabled = Boolean(server?.openIdEnabled);
  const openIdForced = Boolean(server?.openIdEnabled && server?.openIdForce);

  const [email, setEmail] = useState(() => window.localStorage.getItem(EMAIL_KEY) ?? '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeEnabled, setCodeEnabled] = useState(false);
  const [failed, setFailed] = useState(false);

  function finishLogin() {
    void generateLoginToken();
    const target = window.sessionStorage.getItem('postLogin') || '/';
    window.sessionStorage.removeItem('postLogin');
    navigate(target, { replace: true });
  }

  async function handlePasswordLogin(event: React.FormEvent) {
    event.preventDefault();
    setFailed(false);
    window.localStorage.setItem(EMAIL_KEY, email);
    try {
      await loginMutation.mutateAsync({ email, password, code: code || undefined });
      finishLogin();
    } catch (error) {
      if (error instanceof TotpRequiredError) {
        setCodeEnabled(true);
      } else {
        setFailed(true);
        setPassword('');
      }
    }
  }

  function handleOpenIdLogin() {
    document.location.assign('/api/session/openid/auth');
  }

  useEffect(() => {
    nativePostMessage('authentication');
  }, []);

  useEffect(() => {
    const listener = (token: string) => {
      loginWithToken(token)
        .then((user) => {
          setUser(user);
          navigate('/');
        })
        .catch((error: Error) => pushError(error.message));
    };
    loginTokenListeners.add(listener);
    return () => {
      loginTokenListeners.delete(listener);
    };
  }, [navigate, setUser, pushError]);

  return (
    <>
      {!openIdForced && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t('userEmail')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              aria-invalid={failed}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{t('userPassword')}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              aria-invalid={failed}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {codeEnabled && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">{t('loginTotpCode')}</Label>
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </div>
          )}
          {failed && <p className="text-sm text-destructive">{t('loginFailed')}</p>}
          <Button
            type="submit"
            onClick={handlePasswordLogin}
            disabled={!email || !password || (codeEnabled && !code) || loginMutation.isPending}
          >
            {t('loginLogin')}
          </Button>
        </>
      )}
      {openIdEnabled && (
        <Button type="button" variant="secondary" onClick={handleOpenIdLogin}>
          {t('loginOpenId')}
        </Button>
      )}
      {!openIdForced && (
        <div className="flex justify-center gap-6 text-xs">
          {registrationEnabled && (
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => navigate('/register')}
            >
              {t('loginRegister')}
            </button>
          )}
          {emailEnabled && (
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => navigate('/reset-password')}
            >
              {t('loginReset')}
            </button>
          )}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 5: Update `src/pages/LoginPage.tsx`**

```tsx
import { LoginLayout } from '@/features/auth/LoginLayout';
import { LoginForm } from '@/features/auth/LoginForm';

export default function LoginPage() {
  return (
    <LoginLayout>
      <LoginForm />
    </LoginLayout>
  );
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/features/auth/__tests__/LoginForm.test.tsx`
Expected: PASS — both tests pass.

- [ ] **Step 7: Verify lint, typecheck, build**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: all exit 0.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Add auth layout and login form with TOTP and OpenID"
```

---

## Task 9: Register, reset-password & change-server forms

**Files:**
- Create: `src/features/auth/RegisterForm.tsx`, `src/features/auth/ResetPasswordForm.tsx`, `src/features/auth/ChangeServerForm.tsx`, `src/pages/RegisterPage.tsx`, `src/pages/ResetPasswordPage.tsx`, `src/pages/ChangeServerPage.tsx`
- Test: `src/features/auth/__tests__/RegisterForm.test.tsx`, `src/features/auth/__tests__/ResetPasswordForm.test.tsx`

- [ ] **Step 1: Write the failing test — `src/features/auth/__tests__/RegisterForm.test.tsx`**

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { RegisterForm } from '../RegisterForm';
import { useSessionStore } from '@/entities/session';

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useSessionStore.setState({ server: { attributes: {} } as never, user: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RegisterForm', () => {
  it('posts a new user to /api/users', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ id: 9, attributes: {} }) });
    vi.stubGlobal('fetch', fetchSpy);
    renderForm();
    await userEvent.type(screen.getByLabelText(/name/i), 'Pat');
    await userEvent.type(screen.getByLabelText(/email/i), 'pat@host.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(fetchSpy.mock.calls[0]![0]).toBe('/api/users');
    expect(fetchSpy.mock.calls[0]![1].method).toBe('POST');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/features/auth/__tests__/RegisterForm.test.tsx`
Expected: FAIL — cannot resolve `../RegisterForm`.

- [ ] **Step 3: Implement `src/features/auth/RegisterForm.tsx`**

Ports legacy `RegisterPage`: when `server.attributes.totpForce` is set it pre-fetches a TOTP key; on submit it posts the user and (on success) clears `newServer` and returns to `/login`. The back button is hidden during first-server onboarding.

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useRegister,
  usePatchServer,
  useSessionStore,
  generateTotpKey,
} from '@/entities/session';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { Button, Input, Label } from '@/shared/ui';

const EMAIL_RE = /(.+)@(.+)\.(.{2,})/;

export function RegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const patchServer = usePatchServer();
  const pushError = useErrorsStore((state) => state.push);

  const server = useSessionStore((state) => state.server);
  const newServer = Boolean(server?.newServer);
  const totpForce = Boolean(server?.attributes.totpForce);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpKey, setTotpKey] = useState<string | null>(null);

  useEffect(() => {
    if (totpForce) {
      generateTotpKey()
        .then(setTotpKey)
        .catch((error: Error) => pushError(error.message));
    }
  }, [totpForce, pushError]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await registerMutation.mutateAsync({ name, email, password, totpKey });
      patchServer({ newServer: false });
      navigate('/login');
    } catch (error) {
      pushError(error instanceof Error ? error.message : String(error));
    }
  }

  const valid = Boolean(name) && Boolean(password) && (newServer || EMAIL_RE.test(email));

  return (
    <>
      <div className="flex items-center gap-2">
        {!newServer && (
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => navigate('/login')}
          >
            ←
          </button>
        )}
        <h1 className="text-xl font-medium uppercase text-primary">{t('loginRegister')}</h1>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">{t('sharedName')}</Label>
        <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t('userEmail')}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t('userPassword')}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {totpForce && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="totpKey">{t('loginTotpKey')}</Label>
          <Input id="totpKey" readOnly value={totpKey ?? ''} />
        </div>
      )}
      <Button
        type="submit"
        onClick={handleSubmit}
        disabled={!valid || registerMutation.isPending}
      >
        {t('loginRegister')}
      </Button>
    </>
  );
}
```

- [ ] **Step 4: Write the failing test — `src/features/auth/__tests__/ResetPasswordForm.test.tsx`**

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ResetPasswordForm } from '../ResetPasswordForm';

function renderForm(initialEntry: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <ResetPasswordForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ResetPasswordForm', () => {
  it('posts an email to /api/password/reset when no token is present', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, text: async () => '' });
    vi.stubGlobal('fetch', fetchSpy);
    renderForm('/reset-password');
    await userEvent.type(screen.getByLabelText(/email/i), 'pat@host.com');
    await userEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(fetchSpy.mock.calls[0]![0]).toBe('/api/password/reset');
  });

  it('posts a new password to /api/password/update when a token is present', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, text: async () => '' });
    vi.stubGlobal('fetch', fetchSpy);
    renderForm('/reset-password?passwordReset=tok123');
    await userEvent.type(screen.getByLabelText(/password/i), 'newpw');
    await userEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(fetchSpy.mock.calls[0]![0]).toBe('/api/password/update');
  });
});
```

- [ ] **Step 5: Run it to verify it fails**

Run: `npx vitest run src/features/auth/__tests__/ResetPasswordForm.test.tsx`
Expected: FAIL — cannot resolve `../ResetPasswordForm`.

- [ ] **Step 6: Implement `src/features/auth/ResetPasswordForm.tsx`**

Ports legacy `ResetPasswordPage`: the `passwordReset` query param toggles between request-reset (email) and apply-reset (new password); on success it returns to `/login`.

```tsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePasswordReset, usePasswordUpdate } from '@/entities/session';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { Button, Input, Label } from '@/shared/ui';

const EMAIL_RE = /(.+)@(.+)\.(.{2,})/;

export function ResetPasswordForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('passwordReset');

  const resetMutation = usePasswordReset();
  const updateMutation = usePasswordUpdate();
  const pushError = useErrorsStore((state) => state.push);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (token) {
        await updateMutation.mutateAsync({ token, password });
      } else {
        await resetMutation.mutateAsync(email);
      }
      navigate('/login');
    } catch (error) {
      pushError(error instanceof Error ? error.message : String(error));
    }
  }

  const valid = token ? Boolean(password) : EMAIL_RE.test(email);
  const pending = resetMutation.isPending || updateMutation.isPending;

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="text-primary hover:underline"
          onClick={() => navigate('/login')}
        >
          ←
        </button>
        <h1 className="text-xl font-medium uppercase text-primary">{t('loginReset')}</h1>
      </div>
      {token ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t('userPassword')}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t('userEmail')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      )}
      <Button type="submit" onClick={handleSubmit} disabled={!valid || pending}>
        {t('loginReset')}
      </Button>
    </>
  );
}
```

- [ ] **Step 7: Implement `src/features/auth/ChangeServerForm.tsx`**

Ports legacy `ChangeServerPage`: a server-URL field with a curated official-server list; submitting either posts `server|<url>` to the native bridge or replaces the browser location. The QR scanner is out of scope (later plan) — noted inline.

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { nativePostMessage, isNativeEnvironment } from '@/features/native-bridge';
import { Button, Input, Label } from '@/shared/ui';

const currentServer = `${window.location.protocol}//${window.location.host}`;

const officialServers = [
  currentServer,
  'https://demo.traccar.org',
  'https://demo2.traccar.org',
  'https://demo3.traccar.org',
  'https://demo4.traccar.org',
  'https://server.traccar.org',
].filter((value, index, self) => self.indexOf(value) === index);

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function ChangeServerForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [value, setValue] = useState(currentServer);
  const [invalid, setInvalid] = useState(false);

  // NOTE: QR-code scanning of a server URL is deferred to a later plan.
  function handleSubmit() {
    if (!isValidUrl(value)) {
      setInvalid(true);
      return;
    }
    if (isNativeEnvironment()) {
      nativePostMessage(`server|${value}`);
    } else {
      window.location.replace(value);
    }
  }

  return (
    <>
      <h1 className="text-xl font-medium uppercase text-primary">{t('settingsServer')}</h1>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="server">{t('settingsServer')}</Label>
        <Input
          id="server"
          list="official-servers"
          value={value}
          aria-invalid={invalid}
          onChange={(event) => {
            setValue(event.target.value);
            setInvalid(false);
          }}
        />
        <datalist id="official-servers">
          {officialServers.map((server) => (
            <option key={server} value={server} />
          ))}
        </datalist>
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          {t('sharedCancel')}
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={!value}>
          {t('sharedSave')}
        </Button>
      </div>
    </>
  );
}
```

- [ ] **Step 8: Create the three thin page components**

`src/pages/RegisterPage.tsx`:

```tsx
import { LoginLayout } from '@/features/auth/LoginLayout';
import { RegisterForm } from '@/features/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <LoginLayout>
      <RegisterForm />
    </LoginLayout>
  );
}
```

`src/pages/ResetPasswordPage.tsx`:

```tsx
import { LoginLayout } from '@/features/auth/LoginLayout';
import { ResetPasswordForm } from '@/features/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <LoginLayout>
      <ResetPasswordForm />
    </LoginLayout>
  );
}
```

`src/pages/ChangeServerPage.tsx`:

```tsx
import { LoginLayout } from '@/features/auth/LoginLayout';
import { ChangeServerForm } from '@/features/auth/ChangeServerForm';

export default function ChangeServerPage() {
  return (
    <LoginLayout>
      <ChangeServerForm />
    </LoginLayout>
  );
}
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npx vitest run src/features/auth`
Expected: PASS — RegisterForm and ResetPasswordForm tests pass.

- [ ] **Step 10: Verify lint, typecheck, build**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: all exit 0.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "Add register, reset-password, and change-server forms"
```

---

## Task 10: Auth guard & query-param gate

**Files:**
- Create: `src/features/auth/RequireAuth.tsx`, `src/features/auth/QueryParamGate.tsx`
- Test: `src/features/auth/__tests__/RequireAuth.test.tsx`

- [ ] **Step 1: Write the failing test — `src/features/auth/__tests__/RequireAuth.test.tsx`**

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { RequireAuth } from '../RequireAuth';

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <RequireAuth>
            <div>protected body</div>
          </RequireAuth>
        ),
      },
      { path: '/login', element: <div>login screen</div> },
      { path: '/register', element: <div>register screen</div> },
    ],
    { initialEntries: [path] },
  );
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RequireAuth', () => {
  it('renders children when a session exists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1, attributes: {} }) }),
    );
    renderAt('/');
    expect(await screen.findByText('protected body')).toBeInTheDocument();
  });

  it('redirects to /login and stores postLogin when unauthenticated', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    renderAt('/');
    expect(await screen.findByText('login screen')).toBeInTheDocument();
    expect(window.sessionStorage.getItem('postLogin')).toBe('/');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/features/auth/__tests__/RequireAuth.test.tsx`
Expected: FAIL — cannot resolve `../RequireAuth`.

- [ ] **Step 3: Implement `src/features/auth/RequireAuth.tsx`**

Ports the legacy `App` session-bootstrap logic: runs `useSessionQuery`, shows the loader while pending, stores `postLogin` and redirects to `/register` (new server) or `/login` when there is no user, and renders children when authenticated.

```tsx
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSessionQuery, useSessionStore } from '@/entities/session';
import { useDocumentLoader } from '@/shared/lib/use-document-loader';

function AuthLoader() {
  useDocumentLoader();
  return null;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation();
  const { isPending } = useSessionQuery();
  const user = useSessionStore((state) => state.user);
  const server = useSessionStore((state) => state.server);

  if (isPending) {
    return <AuthLoader />;
  }
  if (!user) {
    window.sessionStorage.setItem('postLogin', pathname + search);
    return <Navigate to={server?.newServer ? '/register' : '/login'} replace />;
  }
  return children;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/auth/__tests__/RequireAuth.test.tsx`
Expected: PASS — both tests pass.

- [ ] **Step 5: Implement `src/features/auth/QueryParamGate.tsx`**

Ports the legacy `Navigation` query-param handling: `locale` changes language, `token` performs a token login, `uniqueId` is recorded for later device selection, `openid=success` triggers `generateLoginToken`. Handled params are stripped from the URL. Shows the loader while processing.

```tsx
import { useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loginWithToken, useSessionStore } from '@/entities/session';
import { generateLoginToken } from '@/features/native-bridge';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { useDocumentLoader } from '@/shared/lib/use-document-loader';

const HANDLED = ['locale', 'token', 'uniqueId', 'openid'] as const;

function ParamLoader() {
  useDocumentLoader();
  return null;
}

export function QueryParamGate({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const setUser = useSessionStore((state) => state.setUser);
  const pushError = useErrorsStore((state) => state.push);
  const [searchParams, setSearchParams] = useSearchParams();
  const hasParams = HANDLED.some((key) => searchParams.has(key));
  const [processing, setProcessing] = useState(hasParams);

  useEffect(() => {
    if (!hasParams) {
      setProcessing(false);
      return;
    }
    setProcessing(true);
    const next = new URLSearchParams(searchParams);
    async function run() {
      try {
        const locale = searchParams.get('locale');
        if (locale) {
          await i18n.changeLanguage(locale);
          next.delete('locale');
        }
        const token = searchParams.get('token');
        if (token) {
          const user = await loginWithToken(token);
          setUser(user);
          next.delete('token');
        }
        if (searchParams.has('uniqueId')) {
          // uniqueId-based device pre-selection is handled by the Map subsystem;
          // the param is consumed here so it does not leak into the address bar.
          window.sessionStorage.setItem('pendingUniqueId', searchParams.get('uniqueId') ?? '');
          next.delete('uniqueId');
        }
        if (searchParams.get('openid') === 'success') {
          await generateLoginToken();
        }
        next.delete('openid');
      } catch (error) {
        pushError(error instanceof Error ? error.message : String(error));
      } finally {
        setSearchParams(next, { replace: true });
        setProcessing(false);
      }
    }
    void run();
    // searchParams identity changes after setSearchParams; run once per param set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasParams]);

  if (processing) {
    return <ParamLoader />;
  }
  return children;
}
```

- [ ] **Step 6: Verify lint, typecheck, tests, build**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: all exit 0.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add auth guard and query-parameter gate"
```

---

## Task 11: Navigation items & shell sidebar

**Files:**
- Create: `src/features/shell/nav-items.ts`, `src/features/shell/Sidebar.tsx`
- Test: `src/features/shell/__tests__/nav-items.test.ts`

- [ ] **Step 1: Write the failing test — `src/features/shell/__tests__/nav-items.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { primaryNavItems, visibleNavItems } from '../nav-items';
import type { Server, User } from '@/entities/session';

const baseUser = { attributes: {} } as User;
const baseServer = { attributes: {} } as Server;

describe('nav-items', () => {
  it('exposes the four primary destinations', () => {
    expect(primaryNavItems.map((item) => item.id)).toEqual([
      'map',
      'reports',
      'settings',
      'account',
    ]);
  });

  it('hides reports when the disableReports restriction is active', () => {
    const restricted = { ...baseServer, disableReports: true } as Server;
    const ids = visibleNavItems(baseUser, restricted).map((item) => item.id);
    expect(ids).not.toContain('reports');
  });

  it('shows account for non-readonly users', () => {
    const ids = visibleNavItems(baseUser, baseServer).map((item) => item.id);
    expect(ids).toContain('account');
  });

  it('replaces account with logout for readonly users', () => {
    const readonlyUser = { ...baseUser, readonly: true } as User;
    const ids = visibleNavItems(readonlyUser, baseServer).map((item) => item.id);
    expect(ids).toContain('logout');
    expect(ids).not.toContain('account');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/features/shell`
Expected: FAIL — cannot resolve `../nav-items`.

- [ ] **Step 3: Implement `src/features/shell/nav-items.ts`**

Defines the primary navigation destinations and a `visibleNavItems` filter that mirrors the legacy `BottomMenu` permission logic (`disableReports` restriction, readonly → logout-instead-of-account).

```ts
import type { Server, User } from '@/entities/session';

export type NavItemId = 'map' | 'reports' | 'settings' | 'account' | 'logout';

export interface NavItem {
  id: NavItemId;
  /** i18n key for the label. */
  labelKey: string;
  /** Target path, or undefined for action-only items (logout). */
  path?: string;
}

/** All primary destinations in display order. */
export const primaryNavItems: NavItem[] = [
  { id: 'map', labelKey: 'mapTitle', path: '/' },
  { id: 'reports', labelKey: 'reportTitle', path: '/reports/combined' },
  { id: 'settings', labelKey: 'settingsTitle', path: '/settings/preferences' },
  { id: 'account', labelKey: 'settingsUser' },
];

function isRestricted(user: User, server: Server, key: 'disableReports'): boolean {
  if (user.administrator) {
    return false;
  }
  return Boolean(
    (server as Record<string, unknown>)[key] || (user as Record<string, unknown>)[key],
  );
}

/** Filters the primary nav for the current user/server, applying parity rules. */
export function visibleNavItems(user: User, server: Server): NavItem[] {
  const items = primaryNavItems.filter((item) => {
    if (item.id === 'reports') {
      return !isRestricted(user, server, 'disableReports');
    }
    return true;
  });
  if (user.readonly) {
    return items
      .filter((item) => item.id !== 'account')
      .concat({ id: 'logout', labelKey: 'loginLogout' });
  }
  return items;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/shell`
Expected: PASS — all four tests pass.

- [ ] **Step 5: Implement `src/features/shell/Sidebar.tsx`**

Desktop navigation rail. Highlights the active destination by path prefix; `account` links to the per-user settings page; `logout` is wired by the parent through the `onLogout` callback.

```tsx
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { visibleNavItems } from './nav-items';
import { useSessionStore } from '@/entities/session';
import { cn } from '@/shared/lib/cn';

function isActive(pathname: string, item: { id: string; path?: string }): boolean {
  if (item.id === 'map') {
    return pathname === '/';
  }
  return Boolean(item.path && pathname.startsWith(item.path.split('?')[0] ?? item.path));
}

export function Sidebar({ onLogout }: { onLogout: () => void }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const user = useSessionStore((state) => state.user);
  const server = useSessionStore((state) => state.server);

  if (!user || !server) {
    return null;
  }

  const items = visibleNavItems(user, server);

  return (
    <nav className="flex w-48 flex-col border-e border-border bg-muted/40 py-2 print:hidden">
      {items.map((item) => {
        const label = t(item.labelKey);
        const className = cn(
          'px-row py-2 text-start text-sm hover:bg-muted',
          isActive(pathname, item) && 'bg-muted font-medium text-primary',
        );
        if (item.id === 'logout') {
          return (
            <button key={item.id} type="button" className={className} onClick={onLogout}>
              {label}
            </button>
          );
        }
        const to =
          item.id === 'account' ? `/settings/user/${user.id}` : (item.path ?? '/');
        return (
          <NavLink key={item.id} to={to} className={className}>
            {label}
          </NavLink>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 6: Verify lint, typecheck, tests**

Run: `npm run lint && npm run typecheck && npm test`
Expected: all exit 0.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add navigation item model and desktop sidebar"
```

---

## Task 12: Mobile bottom nav & terms gate

**Files:**
- Create: `src/features/shell/BottomNav.tsx`, `src/features/shell/TermsGate.tsx`
- Test: `src/features/shell/__tests__/BottomNav.test.tsx`

- [ ] **Step 1: Write the failing test — `src/features/shell/__tests__/BottomNav.test.tsx`**

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from '../BottomNav';
import { useSessionStore } from '@/entities/session';

const navigate = vi.fn();
const onLogout = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

beforeEach(() => {
  navigate.mockClear();
  onLogout.mockClear();
  useSessionStore.setState({
    user: { id: 3, attributes: {} } as never,
    server: { attributes: {} } as never,
  });
});

describe('BottomNav', () => {
  it('renders the map, reports, and settings destinations', () => {
    render(
      <MemoryRouter>
        <BottomNav onLogout={onLogout} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: /map/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /report/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('navigates to the map when the map item is clicked', async () => {
    render(
      <MemoryRouter>
        <BottomNav onLogout={onLogout} />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: /map/i }));
    expect(navigate).toHaveBeenCalledWith('/');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/features/shell/__tests__/BottomNav.test.tsx`
Expected: FAIL — cannot resolve `../BottomNav`.

- [ ] **Step 3: Implement `src/features/shell/BottomNav.tsx`**

Ports legacy `BottomMenu`: a fixed bottom bar driven by `visibleNavItems`. `account` routes to the per-user settings page; `logout` delegates to the parent callback.

```tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { visibleNavItems } from './nav-items';
import { useSessionStore } from '@/entities/session';
import { cn } from '@/shared/lib/cn';

export function BottomNav({ onLogout }: { onLogout: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useSessionStore((state) => state.user);
  const server = useSessionStore((state) => state.server);

  if (!user || !server) {
    return null;
  }

  const items = visibleNavItems(user, server);

  function handleSelect(id: string, path?: string) {
    if (id === 'logout') {
      onLogout();
    } else if (id === 'account') {
      navigate(`/settings/user/${user!.id}`);
    } else {
      navigate(path ?? '/');
    }
  }

  function isActive(id: string, path?: string): boolean {
    if (id === 'map') {
      return pathname === '/';
    }
    return Boolean(path && pathname.startsWith(path.split('?')[0] ?? path));
  }

  return (
    <nav className="flex border-t border-border bg-background print:hidden">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => handleSelect(item.id, item.path)}
          className={cn(
            'flex-1 py-2 text-xs',
            isActive(item.id, item.path) ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {t(item.labelKey)}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Implement `src/features/shell/TermsGate.tsx`**

Ports legacy `TermsDialog` + the `App` terms check: when the server defines `termsUrl` and the user has not accepted, it shows a blocking dialog. Accept persists `termsAccepted: true` on the user; cancel returns to `/login` (logout flow handled by the caller).

```tsx
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSessionStore, useUpdateUser } from '@/entities/session';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui';

export function TermsGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const server = useSessionStore((state) => state.server);
  const updateUser = useUpdateUser();
  const pushError = useErrorsStore((state) => state.push);

  const termsUrl = server?.attributes.termsUrl as string | undefined;
  const privacyUrl = server?.attributes.privacyUrl as string | undefined;
  const accepted = Boolean(user?.attributes.termsAccepted);

  if (!user || !termsUrl || accepted) {
    return children;
  }

  function handleAccept() {
    updateUser.mutate(
      { ...user!, attributes: { ...user!.attributes, termsAccepted: true } },
      { onError: (error) => pushError(error.message) },
    );
  }

  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('userTerms')}</DialogTitle>
          <DialogDescription>{t('userTermsPrompt')}</DialogDescription>
        </DialogHeader>
        <ul className="list-disc ps-6 text-sm">
          <li>
            <a className="text-primary hover:underline" href={termsUrl} target="_blank" rel="noreferrer">
              {t('userTerms')}
            </a>
          </li>
          {privacyUrl && (
            <li>
              <a
                className="text-primary hover:underline"
                href={privacyUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t('userPrivacy')}
              </a>
            </li>
          )}
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={() => navigate('/login')}>
            {t('sharedCancel')}
          </Button>
          <Button onClick={handleAccept} disabled={updateUser.isPending}>
            {t('sharedAccept')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/features/shell/__tests__/BottomNav.test.tsx`
Expected: PASS — both tests pass.

- [ ] **Step 6: Verify lint, typecheck, build**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: all exit 0.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add mobile bottom navigation and terms-acceptance gate"
```

---

## Task 13: App shell assembly

**Files:**
- Create: `src/features/shell/AppShell.tsx`, `src/features/shell/index.ts`
- Test: `src/features/shell/__tests__/AppShell.test.tsx`
- Modify: `src/pages/MainPage.tsx`

- [ ] **Step 1: Write the failing test — `src/features/shell/__tests__/AppShell.test.tsx`**

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from '../AppShell';
import { useSessionStore } from '@/entities/session';

function renderShell(matchesDesktop: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: matchesDesktop,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [{ path: '/', element: <AppShell />, children: [{ index: true, element: <div>map area</div> }] }],
    { initialEntries: ['/'] },
  );
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useSessionStore.setState({
    user: { id: 1, attributes: {} } as never,
    server: { attributes: {} } as never,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AppShell', () => {
  it('renders the routed outlet content', async () => {
    renderShell(true);
    expect(await screen.findByText('map area')).toBeInTheDocument();
  });

  it('shows the desktop sidebar on wide viewports', async () => {
    renderShell(true);
    expect(await screen.findByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /map/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/features/shell/__tests__/AppShell.test.tsx`
Expected: FAIL — cannot resolve `../AppShell`.

- [ ] **Step 3: Implement `src/features/shell/AppShell.tsx`**

Ports the legacy `App` chrome: a responsive layout with the desktop `Sidebar` or mobile `BottomNav`, the routed `<Outlet />`, the `TermsGate`, and the headless `NativeBridge`. Logout (`useLogout`) posts `logout` to the native bridge and routes to `/login`. `SocketController` / `CachingController` / `UpdateController` are out of scope — a comment marks where they re-attach.

```tsx
import { Outlet, useNavigate } from 'react-router-dom';
import { useLogout } from '@/entities/session';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TermsGate } from './TermsGate';
import { NativeBridge, nativePostMessage } from '@/features/native-bridge';

export function AppShell() {
  const navigate = useNavigate();
  const logout = useLogout();
  const desktop = useMediaQuery('(min-width: 768px)');

  async function handleLogout() {
    await logout.mutateAsync();
    nativePostMessage('logout');
    navigate('/login');
  }

  return (
    <TermsGate>
      {/* SocketController / CachingController / UpdateController attach here in later plans. */}
      <NativeBridge />
      <div className="flex h-full flex-col md:flex-row">
        {desktop && <Sidebar onLogout={handleLogout} />}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
        {!desktop && <BottomNav onLogout={handleLogout} />}
      </div>
    </TermsGate>
  );
}
```

- [ ] **Step 4: Create the shell barrel — `src/features/shell/index.ts`**

```ts
export { AppShell } from './AppShell';
export { Sidebar } from './Sidebar';
export { BottomNav } from './BottomNav';
export { TermsGate } from './TermsGate';
export { primaryNavItems, visibleNavItems } from './nav-items';
export type { NavItem, NavItemId } from './nav-items';
```

- [ ] **Step 5: Update `src/pages/MainPage.tsx`**

The map subsystem replaces this body later; for now it is a labelled placeholder so the shell is verifiable.

```tsx
export default function MainPage() {
  return <div className="p-row text-muted-foreground">Map placeholder</div>;
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/features/shell/__tests__/AppShell.test.tsx`
Expected: PASS — both tests pass.

- [ ] **Step 7: Verify lint, typecheck, build**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: all exit 0.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Assemble responsive app shell with nav, terms gate, and native bridge"
```

---

## Task 14: Router wiring & E2E

**Files:**
- Create: `e2e/auth.spec.ts`
- Modify: `src/app/router.tsx`, `src/app/App.tsx`
- Test: `src/app/__tests__/router.test.tsx` (extend)

- [ ] **Step 1: Rewrite `src/app/router.tsx` with public + protected branches**

Public routes (`/login`, `/register`, `/reset-password`, `/change-server`) render directly. The protected branch wraps `AppShell` in `QueryParamGate` then `RequireAuth`; `MainPage` is its index route. Later subsystems extend the protected `children`.

```tsx
import { lazy, Suspense, type ComponentType, type ReactElement } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { Loader } from '@/shared/ui';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { QueryParamGate } from '@/features/auth/QueryParamGate';
import { AppShell } from '@/features/shell';

function lazyRoute(loader: () => Promise<{ default: ComponentType }>): ReactElement {
  const Component = lazy(loader);
  return (
    <Suspense fallback={<Loader />}>
      <Component />
    </Suspense>
  );
}

export const routes: RouteObject[] = [
  { path: '/login', element: lazyRoute(() => import('@/pages/LoginPage')) },
  { path: '/register', element: lazyRoute(() => import('@/pages/RegisterPage')) },
  { path: '/reset-password', element: lazyRoute(() => import('@/pages/ResetPasswordPage')) },
  { path: '/change-server', element: lazyRoute(() => import('@/pages/ChangeServerPage')) },
  {
    path: '/',
    element: (
      <QueryParamGate>
        <RequireAuth>
          <AppShell />
        </RequireAuth>
      </QueryParamGate>
    ),
    children: [{ index: true, element: lazyRoute(() => import('@/pages/MainPage')) }],
  },
  { path: '*', element: lazyRoute(() => import('@/pages/NotFoundPage')) },
];

export const router = createBrowserRouter(routes);
```

- [ ] **Step 2: Confirm `src/app/App.tsx` is unchanged from Task 7**

`App.tsx` already wraps `<RouterProvider>` in `<ServerGate>` (Task 7); no edit needed. Verify by reading the file.

- [ ] **Step 3: Extend the router test — `src/app/__tests__/router.test.tsx`**

Replace the file with a version asserting the public login route and the protected-route redirect.

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '../router';

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('router', () => {
  it('renders the login page at /login', async () => {
    renderAt('/login');
    expect(await screen.findByText(/login/i)).toBeInTheDocument();
  });

  it('redirects an unauthenticated visit to / onto the login page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    renderAt('/');
    expect(await screen.findByText(/login/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run the unit suite**

Run: `npm test`
Expected: PASS — all tests pass.

- [ ] **Step 5: Write the E2E test — `e2e/auth.spec.ts`**

Playwright serves the built app with no backend; `/api/server` and `/api/session` are stubbed via routing so the auth flow is exercised end-to-end.

```ts
import { test, expect } from '@playwright/test';

test('unauthenticated visit redirects to the login page', async ({ page }) => {
  await page.route('**/api/server', (route) =>
    route.fulfill({ json: { id: 1, registration: true, attributes: {} } }),
  );
  await page.route('**/api/session', (route) => route.fulfill({ status: 404, body: '' }));
  await page.goto('/');
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
});

test('a successful login lands on the map shell', async ({ page }) => {
  await page.route('**/api/server', (route) =>
    route.fulfill({ json: { id: 1, registration: true, attributes: {} } }),
  );
  let authenticated = false;
  await page.route('**/api/session', (route) => {
    if (route.request().method() === 'POST') {
      authenticated = true;
      return route.fulfill({ json: { id: 5, name: 'Pat', attributes: {} } });
    }
    return authenticated
      ? route.fulfill({ json: { id: 5, name: 'Pat', attributes: {} } })
      : route.fulfill({ status: 404, body: '' });
  });
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('pat@host.com');
  await page.getByLabel(/password/i).fill('secret');
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page.getByText('Map placeholder')).toBeVisible();
});
```

- [ ] **Step 6: Run the E2E suite**

Run: `npm run e2e`
Expected: PASS — auth and Foundation smoke tests pass.

- [ ] **Step 7: Verify the full gate**

Run: `npm run lint && npm run typecheck && npm test && npm run build && npm run e2e`
Expected: every command exits 0.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Wire auth/protected routing and add auth E2E tests"
```

---

## Self-Review

**Spec coverage** (against the Plan 2 scope):

| Scope item | Task |
|------------|------|
| Server config loading (`ServerProvider` equivalent) | T7 (`ServerGate`), backed by `useServerQuery` (T3) |
| `GET /api/session` bootstrap + auth guard | T2 (`fetchSession`), T3 (`useSessionQuery`), T10 (`RequireAuth`) |
| `POST /api/session` login + TOTP on 401 `WWW-Authenticate: TOTP` | T2 (`login`, `TotpRequiredError`), T8 (`LoginForm`) |
| `DELETE /api/session` logout | T2 (`logout`), T3 (`useLogout`), T13 (`AppShell` handler) |
| Token login `GET /api/session?token=` | T2 (`loginWithToken`), used in T8 + T10 |
| `POST /api/session/token` | T2 (`createSessionToken`), T6 (`generateLoginToken`) |
| OpenID redirect | T8 (`handleOpenIdLogin` → `/api/session/openid/auth`) |
| Login page | T8 |
| Register page (`POST /api/users`, `POST /api/users/totp`) | T2 (`registerUser`, `generateTotpKey`), T9 (`RegisterForm`) |
| ResetPassword page (`POST /api/password/reset` + `/update`) | T2 (`requestPasswordReset`, `updatePassword`), T9 (`ResetPasswordForm`) |
| ChangeServer page | T9 (`ChangeServerForm`) |
| Protected vs public routes | T14 (`router.tsx`) |
| `postLogin` sessionStorage redirect | T8 (write target on login), T10 (`RequireAuth` stores it) |
| Query-param handling (`locale`, `token`, `uniqueId`, `openid`) | T10 (`QueryParamGate`) |
| App shell chrome — desktop sidebar + mobile bottom nav, responsive | T11 (`Sidebar`), T12 (`BottomNav`), T13 (`AppShell`) |
| Role/permission-based visibility (`permissions.js` equivalents) | T3 (`permissions.ts`), T11 (`nav-items.ts` `visibleNavItems`) |
| NativeInterface bridge — versioned protocol, window globals, message strings, `generateLoginToken` | T6 (`native-interface.ts`, `NativeBridge.tsx`) |
| TermsDialog + terms-acceptance gate | T12 (`TermsGate`) |
| ErrorHandler + errors store (Zustand) | T1 (`errors-store.ts`), T5 (`ErrorToaster`) |

Every in-scope item maps to at least one task. ✅

**Out of scope (correctly excluded, later plans):** `SocketController` / live WebSocket store, `CachingController` device/geofence/group prefetch, `UpdateController` / PWA, the MapLibre map, settings pages, report pages. `AppShell` (T13) leaves a marked comment where these controllers re-attach; `MainPage` is a labelled placeholder; `QueryParamGate` stashes `uniqueId` in sessionStorage for the Map subsystem to consume; the ChangeServer QR scanner is explicitly deferred with an inline note.

**Placeholder scan:** No `TODO`, no "similar to Task N", no "add error handling". Every code step contains complete, runnable code. The two `MainPage` placeholders and the `SocketController` comment are deliberate stubs for explicitly out-of-scope subsystems, each labelled as such. ✅

**Type consistency:** `Server`, `User`, `LoginCredentials`, `RegisterPayload`, `Attributes`, `TotpRequiredError` are defined once in T1 (`entities/session/model/types.ts`) and re-exported through `entities/session/index.ts` (T3); every later task imports them from `@/entities/session`. `useSessionStore`, `useServerQuery`, `useSessionQuery`, `useLogin`, `useLogout`, `useRegister`, `usePasswordReset`, `usePasswordUpdate`, `useUpdateUser`, `usePatchServer`, the permission hooks, `loginWithToken`, `createSessionToken`, `generateTotpKey` are all exported from the same barrel and consumed consistently. `NavItem`/`NavItemId`/`visibleNavItems`/`primaryNavItems` are defined in T11 and re-exported via `features/shell/index.ts` (T13). Native-bridge exports (`nativePostMessage`, `isNativeEnvironment`, `generateLoginToken`, the three listener sets, `NativeBridge`) come from `features/native-bridge/index.ts` (T6). `useErrorsStore` (T1), `useDocumentLoader`/`useMediaQuery` (T4), `ErrorToaster` (T5) are referenced by consistent names throughout. ✅

**Dependency-rule check:** Imports only ever go `pages → features → entities → shared`. No `entities/` file imports from `features/` or `pages/`; `features/native-bridge` imports `entities/session` (allowed); `features/auth` and `features/shell` import `entities/session`, `features/native-bridge`, and `shared/*` (allowed — `import-x/no-cycle` stays satisfied because native-bridge does not import auth/shell). ✅
