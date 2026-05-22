import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui/card';
import { SettingsLayout, LinkField } from '@/features/settings';

interface LinkSpec {
  labelKey: string;
  resource: string;
  keyLink: string;
}

const deviceLinks: LinkSpec[] = [
  { labelKey: 'sharedGeofences', resource: 'geofences', keyLink: 'geofenceId' },
  { labelKey: 'sharedNotifications', resource: 'notifications', keyLink: 'notificationId' },
  { labelKey: 'sharedDrivers', resource: 'drivers', keyLink: 'driverId' },
  { labelKey: 'sharedComputedAttributes', resource: 'attributes/computed', keyLink: 'attributeId' },
  { labelKey: 'sharedSavedCommands', resource: 'commands', keyLink: 'commandId' },
  { labelKey: 'sharedMaintenance', resource: 'maintenance', keyLink: 'maintenanceId' },
];

export default function DeviceConnectionsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const baseId = Number(id);

  return (
    <SettingsLayout titleKey="sharedConnections">
      <Card className="mx-auto flex max-w-xl flex-col gap-4 p-4">
        {deviceLinks.map((spec) => (
          <LinkField
            key={spec.resource}
            label={t(spec.labelKey)}
            endpointAll={`/${spec.resource}`}
            endpointLinked={`/${spec.resource}?deviceId=${baseId}`}
            baseId={baseId}
            keyBase="deviceId"
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
