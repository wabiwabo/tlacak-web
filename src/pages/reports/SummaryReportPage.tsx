import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSummaryReport, reportQuery } from '@/entities/report';
import type { SummaryReport, ReportParams } from '@/entities/report';
import { useUnitPreferences } from '@/shared/lib/use-attribute-preference';
import { formatDistance, formatSpeed, formatVolume, formatNumericHours } from '@/shared/lib/format';
import { downloadReport } from '@/shared/lib/download';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { Field } from '@/shared/ui/Field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  ReportLayout,
  ReportFilter,
  ReportTable,
  ColumnSelect,
  useReportColumns,
  scheduleReport,
} from '@/features/reports';
import type { ReportColumn, ReportColumnOption, ScheduleDraft } from '@/features/reports';

export default function SummaryReportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const units = useUnitPreferences();
  const pushError = useErrorsStore((state) => state.push);
  const [params, setParams] = useState<ReportParams>();
  const [daily, setDaily] = useState(false);
  const { data, isFetching } = useSummaryReport(params, daily);

  const columns: ReportColumn<SummaryReport>[] = [
    {
      key: 'distance',
      labelKey: 'sharedDistance',
      cell: (r) => formatDistance(r.distance ?? 0, units.distanceUnit),
    },
    {
      key: 'averageSpeed',
      labelKey: 'reportAverageSpeed',
      cell: (r) => formatSpeed(r.averageSpeed ?? 0, units.speedUnit),
    },
    {
      key: 'maxSpeed',
      labelKey: 'reportMaximumSpeed',
      cell: (r) => formatSpeed(r.maxSpeed ?? 0, units.speedUnit),
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
  ];
  const columnOptions: ReportColumnOption[] = columns.map((c) => ({
    key: c.key,
    labelKey: c.labelKey,
  }));
  const [visible, setVisible] = useReportColumns('summary', [
    'distance',
    'averageSpeed',
    'maxSpeed',
  ]);

  const handleExport = async (p: ReportParams) => {
    try {
      await downloadReport(
        `/reports/summary${reportQuery(p, { daily: [String(daily)] })}`,
        'summary.xlsx',
      );
    } catch (error) {
      pushError((error as Error).message);
    }
  };

  const handleSchedule = async (deviceIds: number[], groupIds: number[], draft: ScheduleDraft) => {
    try {
      await scheduleReport(deviceIds, groupIds, {
        type: 'summary',
        description: draft.description,
        calendarId: draft.calendarId,
        attributes: { daily },
      });
      navigate('/reports/scheduled');
    } catch (error) {
      pushError((error as Error).message);
    }
  };

  return (
    <ReportLayout titleKey={daily ? 'reportDaily' : 'reportSummary'}>
      <ReportFilter
        deviceType="multiple"
        loading={isFetching}
        onShow={setParams}
        onExport={handleExport}
        onSchedule={handleSchedule}
      >
        <div className="min-w-36">
          <Field label={t('sharedType')}>
            {(id) => (
              <Select
                value={daily ? 'daily' : 'summary'}
                onValueChange={(v) => setDaily(v === 'daily')}
              >
                <SelectTrigger id={id}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">{t('reportSummary')}</SelectItem>
                  <SelectItem value="daily">{t('reportDaily')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          </Field>
        </div>
        <ColumnSelect options={columnOptions} visible={visible} setVisible={setVisible} />
      </ReportFilter>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <ReportTable columns={columns} visible={visible} data={data ?? []} loading={isFetching} />
      </div>
    </ReportLayout>
  );
}
