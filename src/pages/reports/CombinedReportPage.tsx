import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { request } from '@/shared/api/crud';
import { reportQuery } from '@/entities/report';
import type { CombinedReportItem, ReportParams } from '@/entities/report';
import { formatTime } from '@/shared/lib/format';
import { MapView, MapRoutePath, MapDefaultCamera } from '@/map';
import { ReportLayout, ReportFilter, ReportTable } from '@/features/reports';
import type { ReportColumn } from '@/features/reports';

interface CombinedRow {
  deviceId: number;
  eventTime: string;
  type: string;
}

/** Capitalises an event-type key into its `event<Type>` translation key. */
function eventTypeKey(type: string | undefined) {
  return type ? `event${type.charAt(0).toUpperCase()}${type.slice(1)}` : '';
}

export default function CombinedReportPage() {
  const { t } = useTranslation();
  const [params, setParams] = useState<ReportParams>();

  const { data, isFetching } = useQuery({
    queryKey: ['report-combined', params],
    queryFn: () =>
      request<CombinedReportItem[]>(`/reports/combined${reportQuery(params as ReportParams)}`),
    enabled: Boolean(params?.from && params?.to),
  });

  const items = data ?? [];
  const rows: CombinedRow[] = items.flatMap((item) =>
    item.events.map((event) => ({
      deviceId: item.deviceId,
      eventTime: event.eventTime ?? '',
      type: event.type ?? '',
    })),
  );
  const allPositions = items.flatMap((item) => item.positions);

  const columns: ReportColumn<CombinedRow>[] = [
    { key: 'deviceId', labelKey: 'sharedDevice', cell: (r) => String(r.deviceId) },
    {
      key: 'eventTime',
      labelKey: 'positionFixTime',
      cell: (r) => formatTime(r.eventTime, 'seconds'),
    },
    { key: 'type', labelKey: 'sharedType', cell: (r) => (r.type ? t(eventTypeKey(r.type)) : '') },
  ];

  return (
    <ReportLayout titleKey="reportCombined">
      <ReportFilter deviceType="multiple" loading={isFetching} onShow={setParams} />
      {items.length ? (
        <div className="h-72 shrink-0 border-b">
          <MapView>
            {items.map((item) => (
              <MapRoutePath
                key={item.deviceId}
                coordinates={item.route}
                id={String(item.deviceId)}
              />
            ))}
            <MapDefaultCamera key={rows.length} positions={allPositions as never} />
          </MapView>
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <ReportTable
          columns={columns}
          visible={['deviceId', 'eventTime', 'type']}
          data={rows}
          loading={isFetching}
        />
      </div>
    </ReportLayout>
  );
}
