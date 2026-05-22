import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { useDriversQuery, useRemoveDriver } from '@/entities/driver';
import type { Driver } from '@/entities/driver';
import { SettingsListPage } from '@/features/settings';

export default function DriversPage() {
  const { t } = useTranslation();
  const columns: ColumnDef<Driver>[] = [
    { accessorKey: 'name', header: t('sharedName') },
    { accessorKey: 'uniqueId', header: t('deviceIdentifier') },
  ];
  return (
    <SettingsListPage<Driver>
      titleKey="sharedDrivers"
      columns={columns}
      useListQuery={useDriversQuery}
      useRemove={useRemoveDriver}
      editPath="/settings/driver"
      searchAccessors={(driver) => [driver.name, driver.uniqueId]}
    />
  );
}
