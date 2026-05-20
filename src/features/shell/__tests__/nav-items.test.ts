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

  it('handles an administrator who is also readonly', () => {
    const adminReadonly = { ...baseUser, administrator: true, readonly: true } as User;
    const ids = visibleNavItems(adminReadonly, baseServer).map((item) => item.id);
    // readonly swap is NOT admin-exempt in the current code, so logout replaces account:
    expect(ids).toContain('logout');
    expect(ids).not.toContain('account');
  });
});
