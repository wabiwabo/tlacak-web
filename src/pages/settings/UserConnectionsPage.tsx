import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui/card';
import { SettingsLayout, LinkField } from '@/features/settings';

const userLinks = [
  { labelKey: 'deviceTitle', resource: 'devices', keyLink: 'deviceId' },
  { labelKey: 'settingsGroups', resource: 'groups', keyLink: 'groupId' },
  { labelKey: 'sharedGeofences', resource: 'geofences', keyLink: 'geofenceId' },
  { labelKey: 'sharedNotifications', resource: 'notifications', keyLink: 'notificationId' },
  { labelKey: 'sharedCalendars', resource: 'calendars', keyLink: 'calendarId' },
  { labelKey: 'settingsUsers', resource: 'users', keyLink: 'managedUserId' },
  { labelKey: 'sharedComputedAttributes', resource: 'attributes/computed', keyLink: 'attributeId' },
  { labelKey: 'sharedDrivers', resource: 'drivers', keyLink: 'driverId' },
  { labelKey: 'sharedSavedCommands', resource: 'commands', keyLink: 'commandId' },
  { labelKey: 'sharedMaintenance', resource: 'maintenance', keyLink: 'maintenanceId' },
];

export default function UserConnectionsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const baseId = Number(id);

  return (
    <SettingsLayout titleKey="sharedConnections">
      <Card className="mx-auto flex max-w-xl flex-col gap-4 p-4">
        {userLinks.map((spec) => (
          <LinkField
            key={spec.resource}
            label={t(spec.labelKey)}
            endpointAll={`/${spec.resource}`}
            endpointLinked={`/${spec.resource}?userId=${baseId}`}
            baseId={baseId}
            keyBase="userId"
            keyLink={spec.keyLink}
            optionLabel={(item) =>
              String(item.name ?? item.description ?? item.uniqueId ?? item.id)
            }
          />
        ))}
      </Card>
    </SettingsLayout>
  );
}
