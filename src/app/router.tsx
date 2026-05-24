import { lazy, Suspense, type ComponentType, type ReactElement } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
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
    children: [
      { index: true, element: lazyRoute(() => import('@/pages/MainPage')) },

      { path: 'settings', element: <Navigate to="/settings/preferences" replace /> },

      {
        path: 'settings/preferences',
        element: lazyRoute(() => import('@/pages/settings/PreferencesPage')),
      },
      { path: 'settings/server', element: lazyRoute(() => import('@/pages/settings/ServerPage')) },
      {
        path: 'settings/announcement',
        element: lazyRoute(() => import('@/pages/settings/AnnouncementPage')),
      },

      {
        path: 'settings/devices',
        element: lazyRoute(() => import('@/pages/settings/DevicesPage')),
      },
      { path: 'settings/device', element: lazyRoute(() => import('@/pages/settings/DevicePage')) },
      {
        path: 'settings/device/:id',
        element: lazyRoute(() => import('@/pages/settings/DevicePage')),
      },
      {
        path: 'settings/device/:id/connections',
        element: lazyRoute(() => import('@/pages/settings/DeviceConnectionsPage')),
      },
      {
        path: 'settings/device/:id/command',
        element: lazyRoute(() => import('@/pages/settings/CommandDevicePage')),
      },

      { path: 'settings/groups', element: lazyRoute(() => import('@/pages/settings/GroupsPage')) },
      { path: 'settings/group', element: lazyRoute(() => import('@/pages/settings/GroupPage')) },
      {
        path: 'settings/group/:id',
        element: lazyRoute(() => import('@/pages/settings/GroupPage')),
      },
      {
        path: 'settings/group/:id/connections',
        element: lazyRoute(() => import('@/pages/settings/GroupConnectionsPage')),
      },
      {
        path: 'settings/group/:id/command',
        element: lazyRoute(() => import('@/pages/settings/CommandGroupPage')),
      },

      { path: 'settings/users', element: lazyRoute(() => import('@/pages/settings/UsersPage')) },
      { path: 'settings/user', element: lazyRoute(() => import('@/pages/settings/UserPage')) },
      { path: 'settings/user/:id', element: lazyRoute(() => import('@/pages/settings/UserPage')) },
      {
        path: 'settings/user/:id/connections',
        element: lazyRoute(() => import('@/pages/settings/UserConnectionsPage')),
      },

      {
        path: 'settings/drivers',
        element: lazyRoute(() => import('@/pages/settings/DriversPage')),
      },
      { path: 'settings/driver', element: lazyRoute(() => import('@/pages/settings/DriverPage')) },
      {
        path: 'settings/driver/:id',
        element: lazyRoute(() => import('@/pages/settings/DriverPage')),
      },

      {
        path: 'settings/geofence',
        element: lazyRoute(() => import('@/pages/settings/GeofencePage')),
      },
      {
        path: 'settings/geofence/:id',
        element: lazyRoute(() => import('@/pages/settings/GeofencePage')),
      },

      {
        path: 'settings/calendars',
        element: lazyRoute(() => import('@/pages/settings/CalendarsPage')),
      },
      {
        path: 'settings/calendar',
        element: lazyRoute(() => import('@/pages/settings/CalendarPage')),
      },
      {
        path: 'settings/calendar/:id',
        element: lazyRoute(() => import('@/pages/settings/CalendarPage')),
      },

      {
        path: 'settings/attributes',
        element: lazyRoute(() => import('@/pages/settings/ComputedAttributesPage')),
      },
      {
        path: 'settings/attribute',
        element: lazyRoute(() => import('@/pages/settings/ComputedAttributePage')),
      },
      {
        path: 'settings/attribute/:id',
        element: lazyRoute(() => import('@/pages/settings/ComputedAttributePage')),
      },

      {
        path: 'settings/maintenances',
        element: lazyRoute(() => import('@/pages/settings/MaintenancesPage')),
      },
      {
        path: 'settings/maintenance',
        element: lazyRoute(() => import('@/pages/settings/MaintenancePage')),
      },
      {
        path: 'settings/maintenance/:id',
        element: lazyRoute(() => import('@/pages/settings/MaintenancePage')),
      },

      {
        path: 'settings/commands',
        element: lazyRoute(() => import('@/pages/settings/CommandsPage')),
      },
      {
        path: 'settings/command',
        element: lazyRoute(() => import('@/pages/settings/CommandPage')),
      },
      {
        path: 'settings/command/:id',
        element: lazyRoute(() => import('@/pages/settings/CommandPage')),
      },

      {
        path: 'settings/notifications',
        element: lazyRoute(() => import('@/pages/settings/NotificationsPage')),
      },
      {
        path: 'settings/notification',
        element: lazyRoute(() => import('@/pages/settings/NotificationPage')),
      },
      {
        path: 'settings/notification/:id',
        element: lazyRoute(() => import('@/pages/settings/NotificationPage')),
      },

      {
        path: 'settings/accumulators/:deviceId',
        element: lazyRoute(() => import('@/pages/settings/AccumulatorsPage')),
      },
      {
        path: 'settings/:type/:id/share',
        element: lazyRoute(() => import('@/pages/settings/SharePage')),
      },

      { path: 'reports', element: <Navigate to="/reports/combined" replace /> },
      {
        path: 'reports/combined',
        element: lazyRoute(() => import('@/pages/reports/CombinedReportPage')),
      },
      {
        path: 'reports/events',
        element: lazyRoute(() => import('@/pages/reports/EventReportPage')),
      },
      {
        path: 'reports/geofences',
        element: lazyRoute(() => import('@/pages/reports/GeofenceReportPage')),
      },
      {
        path: 'reports/trips',
        element: lazyRoute(() => import('@/pages/reports/TripReportPage')),
      },
      {
        path: 'reports/stops',
        element: lazyRoute(() => import('@/pages/reports/StopReportPage')),
      },
      {
        path: 'reports/summary',
        element: lazyRoute(() => import('@/pages/reports/SummaryReportPage')),
      },
      {
        path: 'reports/chart',
        element: lazyRoute(() => import('@/pages/reports/ChartReportPage')),
      },
      {
        path: 'reports/route',
        element: lazyRoute(() => import('@/pages/reports/PositionsReportPage')),
      },
      {
        path: 'reports/statistics',
        element: lazyRoute(() => import('@/pages/reports/StatisticsPage')),
      },
      {
        path: 'reports/audit',
        element: lazyRoute(() => import('@/pages/reports/AuditPage')),
      },
      { path: 'reports/logs', element: lazyRoute(() => import('@/pages/reports/LogsPage')) },
      {
        path: 'reports/scheduled',
        element: lazyRoute(() => import('@/pages/reports/ScheduledPage')),
      },

      // Compliance — Indonesia-specific regulatory features.
      // The index is the dispatcher's morning-brief landing page.
      {
        path: 'compliance',
        element: lazyRoute(() => import('@/pages/compliance/ComplianceBriefPage')),
      },
      {
        path: 'compliance/fuel-quota',
        element: lazyRoute(() => import('@/pages/compliance/FuelQuotaPage')),
      },
      {
        path: 'compliance/kir',
        element: lazyRoute(() => import('@/pages/compliance/KirPage')),
      },
      {
        path: 'compliance/odol',
        element: lazyRoute(() => import('@/pages/compliance/OdolPage')),
      },
      {
        path: 'compliance/b40',
        element: lazyRoute(() => import('@/pages/compliance/B40Page')),
      },
    ],
  },
  { path: '*', element: lazyRoute(() => import('@/pages/NotFoundPage')) },
];

export const router = createBrowserRouter(routes);
