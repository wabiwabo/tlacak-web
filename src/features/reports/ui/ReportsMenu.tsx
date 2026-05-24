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

  const visible = entries.filter((entry) => entry.visible);

  return (
    <nav className="flex flex-col py-4">
      <div className="cyber-label px-4 pb-3">// REPORTS</div>
      {visible.map((entry) => (
        <NavLink
          key={entry.path}
          to={entry.path}
          className={({ isActive }) =>
            cn(
              'relative px-4 py-2 text-[11px] font-mono font-semibold uppercase tracking-[0.16em] transition-colors',
              isActive ? 'text-primary cyber-glow' : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute inset-y-0 start-0 w-0.5 bg-primary cyber-box-glow" />
              )}
              {t(entry.labelKey)}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
