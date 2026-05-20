import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchServer, fetchSession, login, logout, requestPasswordReset } from '../session-api';
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

  it('fetchServer throws the body text on a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ ok: false, status: 503, text: async () => 'Service Unavailable' }),
    );
    await expect(fetchServer()).rejects.toThrow('Service Unavailable');
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
