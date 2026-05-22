import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdministrator } from '@/entities/session';
import { cn } from '@/shared/lib/cn';

interface MenuEntry {
  path: string;
  labelKey: string;
  visible: boolean;
}

export function ReportsMenu() {
  const { t } = useTranslation();
  const admin = useAdministrator();

  const entries: MenuEntry[] = [
    { path: '/reports/combined', labelKey: 'reportCombined', visible: true },
    { path: '/reports/events', labelKey: 'reportEvents', visible: true },
    { path: '/reports/geofences', labelKey: 'sharedGeofences', visible: true },
    { path: '/reports/trips', labelKey: 'reportTrips', visible: true },
    { path: '/reports/stops', labelKey: 'reportStops', visible: true },
    { path: '/reports/summary', labelKey: 'reportSummary', visible: true },
    { path: '/reports/chart', labelKey: 'reportChart', visible: true },
    { path: '/reports/route', labelKey: 'reportPositions', visible: true },
    { path: '/reports/scheduled', labelKey: 'reportScheduled', visible: true },
    { path: '/reports/logs', labelKey: 'sharedLogs', visible: true },
    { path: '/reports/statistics', labelKey: 'statisticsTitle', visible: admin },
    { path: '/reports/audit', labelKey: 'reportAudit', visible: admin },
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
