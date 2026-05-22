import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEventsReport, reportQuery } from '@/entities/report';
import type { ReportParams } from '@/entities/report';
import type { DeviceEvent } from '@/entities/event';
import { useGeofencesQuery } from '@/entities/geofence';
import { useNotificationTypesQuery } from '@/entities/notification';
import { formatTime } from '@/shared/lib/format';
import { downloadReport } from '@/shared/lib/download';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { SelectField } from '@/features/settings';
import {
  ReportLayout,
  ReportFilter,
  ReportTable,
  ColumnSelect,
  useReportColumns,
  scheduleReport,
} from '@/features/reports';
import type { ReportColumn, ReportColumnOption, ScheduleDraft } from '@/features/reports';

/** Capitalises an event-type key into its `event<Type>` translation key. */
function eventTypeKey(type: string | undefined) {
  return type ? `event${type.charAt(0).toUpperCase()}${type.slice(1)}` : '';
}

export default function EventReportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pushError = useErrorsStore((state) => state.push);
  const { data: geofences } = useGeofencesQuery();
  const { data: eventTypes } = useNotificationTypesQuery();
  const [params, setParams] = useState<ReportParams>();
  const [types, setTypes] = useState<string[]>([]);
  const { data, isFetching } = useEventsReport(params, types.length ? types : ['allEvents']);

  const geofenceName = useMemo(() => {
    const map = new Map<number, string>();
    (geofences ?? []).forEach((g) => map.set(g.id as number, g.name ?? ''));
    return map;
  }, [geofences]);

  const columns: ReportColumn<DeviceEvent>[] = [
    {
      key: 'eventTime',
      labelKey: 'positionFixTime',
      cell: (r) => formatTime(r.eventTime, 'seconds'),
    },
    { key: 'type', labelKey: 'sharedType', cell: (r) => (r.type ? t(eventTypeKey(r.type)) : '') },
    {
      key: 'geofenceId',
      labelKey: 'sharedGeofence',
      cell: (r) => (r.geofenceId ? (geofenceName.get(r.geofenceId) ?? String(r.geofenceId)) : ''),
    },
    { key: 'attributes', labelKey: 'commandData', cell: (r) => JSON.stringify(r.attributes ?? {}) },
  ];
  const columnOptions: ReportColumnOption[] = columns.map((c) => ({
    key: c.key,
    labelKey: c.labelKey,
  }));
  const [visible, setVisible] = useReportColumns('events', ['eventTime', 'type', 'attributes']);

  const handleExport = async (p: ReportParams) => {
    try {
      await downloadReport(
        `/reports/events${reportQuery(p, { type: types.length ? types : ['allEvents'] })}`,
        'events.xlsx',
      );
    } catch (error) {
      pushError((error as Error).message);
    }
  };

  const handleSchedule = async (deviceIds: number[], groupIds: number[], draft: ScheduleDraft) => {
    try {
      await scheduleReport(deviceIds, groupIds, {
        type: 'events',
        description: draft.description,
        calendarId: draft.calendarId,
        attributes: { types: types.join(',') },
      });
      navigate('/reports/scheduled');
    } catch (error) {
      pushError((error as Error).message);
    }
  };

  return (
    <ReportLayout titleKey="reportEvents">
      <ReportFilter
        deviceType="multiple"
        loading={isFetching}
        onShow={setParams}
        onExport={handleExport}
        onSchedule={handleSchedule}
      >
        <div className="min-w-48">
          <SelectField
            label={t('reportEventTypes')}
            multiple
            data={(eventTypes ?? []) as unknown as Record<string, unknown>[]}
            value={types}
            onChange={(value) => setTypes((value as string[]) ?? [])}
            optionKey={(option) => (option as { type: string }).type}
            optionLabel={(option) => {
              const type = (option as { type: string }).type;
              return t(eventTypeKey(type));
            }}
          />
        </div>
        <ColumnSelect options={columnOptions} visible={visible} setVisible={setVisible} />
      </ReportFilter>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <ReportTable columns={columns} visible={visible} data={data ?? []} loading={isFetching} />
      </div>
    </ReportLayout>
  );
}
