import { useState } from 'react';
import { useStatistics } from '@/entities/report';
import type { StatisticsItem, ReportParams } from '@/entities/report';
import { formatTime } from '@/shared/lib/format';
import {
  ReportLayout,
  ReportFilter,
  ReportTable,
  ColumnSelect,
  useReportColumns,
} from '@/features/reports';
import type { ReportColumn, ReportColumnOption } from '@/features/reports';

export default function StatisticsPage() {
  const [range, setRange] = useState<{ from: string; to: string }>();
  const { data, isFetching } = useStatistics(range?.from, range?.to);

  const columns: ReportColumn<StatisticsItem>[] = [
    {
      key: 'captureTime',
      labelKey: 'statisticsCaptureTime',
      cell: (r) => formatTime(r.captureTime, 'date'),
    },
    {
      key: 'activeUsers',
      labelKey: 'statisticsActiveUsers',
      cell: (r) => String(r.activeUsers ?? 0),
    },
    {
      key: 'activeDevices',
      labelKey: 'statisticsActiveDevices',
      cell: (r) => String(r.activeDevices ?? 0),
    },
    { key: 'requests', labelKey: 'statisticsRequests', cell: (r) => String(r.requests ?? 0) },
    {
      key: 'messagesReceived',
      labelKey: 'statisticsMessagesReceived',
      cell: (r) => String(r.messagesReceived ?? 0),
    },
    {
      key: 'messagesStored',
      labelKey: 'statisticsMessagesStored',
      cell: (r) => String(r.messagesStored ?? 0),
    },
  ];
  const columnOptions: ReportColumnOption[] = columns.map((c) => ({
    key: c.key,
    labelKey: c.labelKey,
  }));
  const [visible, setVisible] = useReportColumns('statistics', [
    'captureTime',
    'activeUsers',
    'activeDevices',
    'messagesStored',
  ]);

  return (
    <ReportLayout titleKey="statisticsTitle">
      <ReportFilter
        deviceType="none"
        loading={isFetching}
        onShow={(params: ReportParams) => setRange({ from: params.from, to: params.to })}
      >
        <ColumnSelect options={columnOptions} visible={visible} setVisible={setVisible} />
      </ReportFilter>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <ReportTable columns={columns} visible={visible} data={data ?? []} loading={isFetching} />
      </div>
    </ReportLayout>
  );
}
