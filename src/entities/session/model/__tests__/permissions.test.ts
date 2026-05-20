import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSessionStore } from '../session-store';
import { useAdministrator, useManager, useDeviceReadonly, useRestriction } from '../permissions';
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
