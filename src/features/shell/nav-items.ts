import type { Server, User } from '@/entities/session';

export type NavItemId = 'map' | 'reports' | 'compliance' | 'settings' | 'account' | 'logout';

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
  { id: 'compliance', labelKey: 'complianceTitle', path: '/compliance/fuel-quota' },
  { id: 'settings', labelKey: 'settingsTitle', path: '/settings/preferences' },
  { id: 'account', labelKey: 'settingsUser' },
];

function isRestricted(user: User, server: Server, key: 'disableReports'): boolean {
  if (user.administrator) {
    return false;
  }
  return Boolean(server[key]);
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
