import { useMemo, useState } from 'react';
import { useGeofenceReport, reportQuery } from '@/entities/report';
import type { GeofenceReport, ReportParams } from '@/entities/report';
import { useGeofencesQuery } from '@/entities/geofence';
import { formatTime, formatNumericHours } from '@/shared/lib/format';
import { downloadReport } from '@/shared/lib/download';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { useTranslation } from 'react-i18next';
import { SelectField } from '@/features/settings';
import {
  ReportLayout,
  ReportFilter,
  ReportTable,
  ColumnSelect,
  useReportColumns,
} from '@/features/reports';
import type { ReportColumn, ReportColumnOption } from '@/features/reports';

export default function GeofenceReportPage() {
  const { t } = useTranslation();
  const pushError = useErrorsStore((state) => state.push);
  const { data: geofences } = useGeofencesQuery();
  const [params, setParams] = useState<ReportParams>();
  const [geofenceIds, setGeofenceIds] = useState<number[]>([]);
  const { data, isFetching } = useGeofenceReport(params, geofenceIds);

  const geofenceName = useMemo(() => {
    const map = new Map<number, string>();
    (geofences ?? []).forEach((g) => map.set(g.id as number, g.name ?? ''));
    return map;
  }, [geofences]);

  const columns: ReportColumn<GeofenceReport>[] = [
    {
      key: 'geofenceId',
      labelKey: 'sharedGeofence',
      cell: (r) => geofenceName.get(r.geofenceId ?? 0) ?? String(r.geofenceId),
    },
    {
      key: 'startTime',
      labelKey: 'reportStartTime',
      cell: (r) => formatTime(r.startTime, 'minutes'),
    },
    { key: 'endTime', labelKey: 'reportEndTime', cell: (r) => formatTime(r.endTime, 'minutes') },
    {
      key: 'duration',
      labelKey: 'reportDuration',
      cell: (r) => formatNumericHours(Date.parse(r.endTime ?? '') - Date.parse(r.startTime ?? '')),
    },
  ];
  const columnOptions: ReportColumnOption[] = columns.map((c) => ({
    key: c.key,
    labelKey: c.labelKey,
  }));
  const [visible, setVisible] = useReportColumns('geofences', [
    'geofenceId',
    'startTime',
    'endTime',
  ]);

  const handleExport = async (p: ReportParams) => {
    try {
      await downloadReport(
        `/reports/geofences${reportQuery(p, { geofenceId: geofenceIds.map(String) })}`,
        'geofences.xlsx',
      );
    } catch (error) {
      pushError((error as Error).message);
    }
  };

  return (
    <ReportLayout titleKey="sharedGeofences">
      <ReportFilter
        deviceType="multiple"
        loading={isFetching}
        onShow={setParams}
        onExport={handleExport}
      >
        <div className="min-w-48">
          <SelectField
            label={t('sharedGeofences')}
            endpoint="/geofences"
            multiple
            value={geofenceIds}
            onChange={(value) => setGeofenceIds((value as number[]) ?? [])}
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
