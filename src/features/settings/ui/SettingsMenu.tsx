import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdministrator, useManager, useRestriction, useSessionStore } from '@/entities/session';
import { cn } from '@/shared/lib/cn';
import { useFeatures } from '../lib/features';

interface MenuEntry {
  path: string;
  labelKey: string;
  visible: boolean;
}

export function SettingsMenu() {
  const { t } = useTranslation();
  const admin = useAdministrator();
  const manager = useManager();
  const readonly = useRestriction('readonly');
  const features = useFeatures();
  const userId = useSessionStore((state) => state.user?.id);

  const entries: MenuEntry[] = [
    { path: '/settings/preferences', labelKey: 'sharedPreferences', visible: true },
    { path: '/settings/notifications', labelKey: 'sharedNotifications', visible: !readonly },
    { path: `/settings/user/${userId ?? ''}`, labelKey: 'settingsUser', visible: Boolean(userId) },
    { path: '/settings/devices', labelKey: 'deviceTitle', visible: true },
    {
      path: '/settings/groups',
      labelKey: 'settingsGroups',
      visible: !readonly && !features.disableGroups,
    },
    {
      path: '/settings/drivers',
      labelKey: 'sharedDrivers',
      visible: !readonly && !features.disableDrivers,
    },
    {
      path: '/settings/calendars',
      labelKey: 'sharedCalendars',
      visible: !readonly && !features.disableCalendars,
    },
    {
      path: '/settings/attributes',
      labelKey: 'sharedComputedAttributes',
      visible: !readonly && !features.disableComputedAttributes,
    },
    {
      path: '/settings/maintenances',
      labelKey: 'sharedMaintenance',
      visible: !readonly && !features.disableMaintenance,
    },
    {
      path: '/settings/commands',
      labelKey: 'sharedSavedCommands',
      visible: !readonly && !features.disableSavedCommands,
    },
    { path: '/settings/users', labelKey: 'settingsUsers', visible: manager },
    { path: '/settings/server', labelKey: 'settingsServer', visible: admin },
    { path: '/settings/announcement', labelKey: 'serverAnnouncement', visible: manager },
  ];

  return (
    <nav className="flex flex-col py-2">
      {entries
        .filter((entry) => entry.visible)
        .map((entry) => (
          <NavLink
            key={entry.path}
            to={entry.path}
            className={({ isActive }) =>
              cn(
                'px-4 py-2 text-sm transition-colors hover:bg-muted',
                isActive && 'bg-muted font-medium text-primary',
              )
            }
          >
            {t(entry.labelKey)}
          </NavLink>
        ))}
    </nav>
  );
}
