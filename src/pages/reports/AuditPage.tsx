import { useState } from 'react';
import { useAudit } from '@/entities/report';
import type { AuditItem, ReportParams } from '@/entities/report';
import { formatTime } from '@/shared/lib/format';
import {
  ReportLayout,
  ReportFilter,
  ReportTable,
  ColumnSelect,
  useReportColumns,
} from '@/features/reports';
import type { ReportColumn, ReportColumnOption } from '@/features/reports';

export default function AuditPage() {
  const [range, setRange] = useState<{ from: string; to: string }>();
  const { data, isFetching } = useAudit(range?.from, range?.to);

  const columns: ReportColumn<AuditItem>[] = [
    {
      key: 'actionTime',
      labelKey: 'positionServerTime',
      cell: (r) => formatTime(r.actionTime, 'minutes'),
    },
    { key: 'userId', labelKey: 'settingsUser', cell: (r) => String(r.userId) },
    { key: 'actionType', labelKey: 'sharedActionType', cell: (r) => r.actionType },
    { key: 'objectType', labelKey: 'sharedObjectType', cell: (r) => r.objectType },
    { key: 'objectId', labelKey: 'deviceIdentifier', cell: (r) => String(r.objectId) },
  ];
  const columnOptions: ReportColumnOption[] = columns.map((c) => ({
    key: c.key,
    labelKey: c.labelKey,
  }));
  const [visible, setVisible] = useReportColumns('audit', [
    'actionTime',
    'userId',
    'actionType',
    'objectType',
  ]);

  return (
    <ReportLayout titleKey="reportAudit">
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
