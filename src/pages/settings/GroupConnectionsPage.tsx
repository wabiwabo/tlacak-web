import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui/card';
import { SettingsLayout, LinkField } from '@/features/settings';

const groupLinks = [
  { labelKey: 'sharedGeofences', resource: 'geofences', keyLink: 'geofenceId' },
  { labelKey: 'sharedNotifications', resource: 'notifications', keyLink: 'notificationId' },
  { labelKey: 'sharedDrivers', resource: 'drivers', keyLink: 'driverId' },
  { labelKey: 'sharedComputedAttributes', resource: 'attributes/computed', keyLink: 'attributeId' },
  { labelKey: 'sharedSavedCommands', resource: 'commands', keyLink: 'commandId' },
  { labelKey: 'sharedMaintenance', resource: 'maintenance', keyLink: 'maintenanceId' },
];

export default function GroupConnectionsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const baseId = Number(id);

  return (
    <SettingsLayout titleKey="sharedConnections">
      <Card className="mx-auto flex max-w-xl flex-col gap-4 p-4">
        {groupLinks.map((spec) => (
          <LinkField
            key={spec.resource}
            label={t(spec.labelKey)}
            endpointAll={`/${spec.resource}`}
            endpointLinked={`/${spec.resource}?groupId=${baseId}`}
            baseId={baseId}
            keyBase="groupId"
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
