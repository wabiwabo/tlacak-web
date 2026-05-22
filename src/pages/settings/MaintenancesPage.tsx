import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { useMaintenancesQuery, useRemoveMaintenance } from '@/entities/maintenance';
import type { Maintenance } from '@/entities/maintenance';
import { SettingsListPage } from '@/features/settings';

export default function MaintenancesPage() {
  const { t } = useTranslation();
  const columns: ColumnDef<Maintenance>[] = [
    { accessorKey: 'name', header: t('sharedName') },
    { accessorKey: 'type', header: t('sharedType') },
    { accessorKey: 'start', header: t('maintenanceStart') },
    { accessorKey: 'period', header: t('maintenancePeriod') },
  ];
  return (
    <SettingsListPage<Maintenance>
      titleKey="sharedMaintenance"
      columns={columns}
      useListQuery={useMaintenancesQuery}
      useRemove={useRemoveMaintenance}
      editPath="/settings/maintenance"
      searchAccessors={(item) => [item.name, item.type]}
    />
  );
}
