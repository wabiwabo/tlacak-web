import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { useNotificationsQuery, useRemoveNotification } from '@/entities/notification';
import type { Notification } from '@/entities/notification';
import { SettingsListPage } from '@/features/settings';

function eventTypeKey(type: string | undefined) {
  return type ? `event${type.charAt(0).toUpperCase()}${type.slice(1)}` : '';
}

export default function NotificationsPage() {
  const { t } = useTranslation();

  const columns: ColumnDef<Notification>[] = [
    { accessorKey: 'description', header: t('sharedDescription') },
    {
      id: 'type',
      header: t('notificationType'),
      accessorFn: (item) => {
        const key = eventTypeKey(item.type);
        return key ? t(key) : '';
      },
    },
    {
      id: 'always',
      header: t('notificationAlways'),
      accessorFn: (item) => (item.always ? '✓' : ''),
    },
  ];

  return (
    <SettingsListPage<Notification>
      titleKey="sharedNotifications"
      columns={columns}
      useListQuery={useNotificationsQuery}
      useRemove={useRemoveNotification}
      editPath="/settings/notification"
      searchAccessors={(item) => [item.description, item.type]}
    />
  );
}
