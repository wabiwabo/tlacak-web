import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { useCalendarsQuery, useRemoveCalendar } from '@/entities/calendar';
import type { Calendar } from '@/entities/calendar';
import { SettingsListPage } from '@/features/settings';

export default function CalendarsPage() {
  const { t } = useTranslation();
  const columns: ColumnDef<Calendar>[] = [{ accessorKey: 'name', header: t('sharedName') }];
  return (
    <SettingsListPage<Calendar>
      titleKey="sharedCalendars"
      columns={columns}
      useListQuery={useCalendarsQuery}
      useRemove={useRemoveCalendar}
      editPath="/settings/calendar"
      searchAccessors={(calendar) => [calendar.name]}
    />
  );
}
