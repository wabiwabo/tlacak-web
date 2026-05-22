import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Link2 } from 'lucide-react';
import { useDevicesQuery, useRemoveDevice } from '@/entities/device';
import type { Device } from '@/entities/device';
import { useGroupsQuery } from '@/entities/group';
import { useDeviceReadonly } from '@/entities/session';
import { SettingsListPage } from '@/features/settings';

export default function DevicesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const readonly = useDeviceReadonly();
  const { data: groups } = useGroupsQuery();

  const groupName = useMemo(() => {
    const map = new Map<number, string>();
    (groups ?? []).forEach((group) => map.set(group.id as number, group.name ?? ''));
    return map;
  }, [groups]);

  const columns: ColumnDef<Device>[] = [
    { accessorKey: 'name', header: t('sharedName') },
    { accessorKey: 'uniqueId', header: t('deviceIdentifier') },
    {
      id: 'group',
      header: t('groupParent'),
      accessorFn: (device) => (device.groupId ? (groupName.get(device.groupId) ?? '') : ''),
    },
    { accessorKey: 'phone', header: t('sharedPhone') },
    { accessorKey: 'model', header: t('deviceModel') },
    { accessorKey: 'contact', header: t('deviceContact') },
  ];

  return (
    <SettingsListPage<Device>
      titleKey="deviceTitle"
      columns={columns}
      useListQuery={useDevicesQuery}
      useRemove={useRemoveDevice}
      editPath="/settings/device"
      searchAccessors={(device) => [device.name, device.uniqueId, device.phone, device.model]}
      readonly={readonly}
      customActions={() => [
        {
          key: 'connections',
          title: t('sharedConnections'),
          icon: <Link2 className="size-4" />,
          handler: (id) => navigate(`/settings/device/${id}/connections`),
        },
      ]}
    />
  );
}
