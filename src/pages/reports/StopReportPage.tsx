import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStopsReport, reportQuery } from '@/entities/report';
import type { StopReport, ReportParams } from '@/entities/report';
import { useUnitPreferences } from '@/shared/lib/use-attribute-preference';
import { formatTime, formatVolume, formatNumericHours, formatAddress } from '@/shared/lib/format';
import { downloadReport } from '@/shared/lib/download';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import {
  ReportLayout,
  ReportFilter,
  ReportTable,
  ColumnSelect,
  useReportColumns,
  scheduleReport,
} from '@/features/reports';
import type { ReportColumn, ReportColumnOption, ScheduleDraft } from '@/features/reports';

export default function StopReportPage() {
  const navigate = useNavigate();
  const units = useUnitPreferences();
  const pushError = useErrorsStore((state) => state.push);
  const [params, setParams] = useState<ReportParams>();
  const { data, isFetching } = useStopsReport(params);

  const columns: ReportColumn<StopReport>[] = [
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
    {
      key: 'engineHours',
      labelKey: 'reportEngineHours',
      cell: (r) => formatNumericHours(r.engineHours ?? 0),
    },
    {
      key: 'spentFuel',
      labelKey: 'reportSpentFuel',
      cell: (r) => formatVolume(r.spentFuel ?? 0, units.volumeUnit),
    },
    {
      key: 'address',
      labelKey: 'positionAddress',
      cell: (r) => formatAddress(r.address, r.lat, r.lon),
    },
  ];
  const columnOptions: ReportColumnOption[] = columns.map((c) => ({
    key: c.key,
    labelKey: c.labelKey,
  }));
  const [visible, setVisible] = useReportColumns('stops', [
    'startTime',
    'endTime',
    'duration',
    'address',
  ]);

  const handleExport = async (p: ReportParams) => {
    try {
      await downloadReport(`/reports/stops${reportQuery(p)}`, 'stops.xlsx');
    } catch (error) {
      pushError((error as Error).message);
    }
  };

  const handleSchedule = async (deviceIds: number[], groupIds: number[], draft: ScheduleDraft) => {
    try {
      await scheduleReport(deviceIds, groupIds, {
        type: 'stops',
        description: draft.description,
        calendarId: draft.calendarId,
        attributes: {},
      });
      navigate('/reports/scheduled');
    } catch (error) {
      pushError((error as Error).message);
    }
  };

  return (
    <ReportLayout titleKey="reportStops">
      <ReportFilter
        deviceType="multiple"
        loading={isFetching}
        onShow={setParams}
        onExport={handleExport}
        onSchedule={handleSchedule}
      >
        <ColumnSelect options={columnOptions} visible={visible} setVisible={setVisible} />
      </ReportFilter>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <ReportTable columns={columns} visible={visible} data={data ?? []} loading={isFetching} />
      </div>
    </ReportLayout>
  );
}
