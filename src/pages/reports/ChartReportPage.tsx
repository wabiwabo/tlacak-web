import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import dayjs from 'dayjs';
import { useRouteReport } from '@/entities/report';
import type { ReportParams } from '@/entities/report';
import type { Position } from '@/entities/position';
import { formatTime } from '@/shared/lib/format';
import { SelectField } from '@/features/settings';
import { ReportLayout, ReportFilter } from '@/features/reports';

// Cyber Ops chart palette — cyan primary then the alert/warn/purple accents.
const LINE_COLORS = ['#00ffc8', '#ff3864', '#ffaa00', '#b026ff', '#00d4ff'];

/** Flattens a position + its attributes and keeps only numeric, non-id keys. */
function numericKeys(positions: Position[]): string[] {
  const keys = new Set<string>();
  for (const position of positions) {
    const flat: Record<string, unknown> = { ...position, ...position.attributes };
    for (const [key, value] of Object.entries(flat)) {
      if (typeof value === 'number' && key !== 'id' && key !== 'deviceId') {
        keys.add(key);
      }
    }
  }
  return [...keys];
}

export default function ChartReportPage() {
  const { t } = useTranslation();
  const [params, setParams] = useState<ReportParams>();
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['speed']);
  const { data, isFetching } = useRouteReport(params);

  const positions = useMemo(() => data ?? [], [data]);
  const availableKeys = useMemo(() => numericKeys(positions), [positions]);

  const chartData = useMemo(
    () =>
      positions.map((position) => {
        const flat: Record<string, unknown> = { ...position, ...position.attributes };
        const point: Record<string, number> = { time: dayjs(position.fixTime).valueOf() };
        for (const key of selectedTypes) {
          if (typeof flat[key] === 'number') {
            point[key] = flat[key] as number;
          }
        }
        return point;
      }),
    [positions, selectedTypes],
  );

  return (
    <ReportLayout titleKey="reportChart">
      <ReportFilter deviceType="single" loading={isFetching} onShow={setParams}>
        <div className="min-w-48">
          <SelectField<Record<string, unknown>>
            label={t('reportChartType')}
            multiple
            data={availableKeys.map((key) => ({ id: key, name: key }) as Record<string, unknown>)}
            value={selectedTypes}
            onChange={(value) => setSelectedTypes((value as string[]) ?? [])}
          />
        </div>
      </ReportFilter>
      <div className="min-h-0 flex-1 p-3">
        {chartData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value: number) => formatTime(value, 'time')}
              />
              <YAxis type="number" />
              <Tooltip labelFormatter={(value) => formatTime(Number(value), 'seconds')} />
              {selectedTypes.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={LINE_COLORS[index % LINE_COLORS.length]}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="p-4 text-sm text-muted-foreground">{t('sharedNoData')}</p>
        )}
      </div>
    </ReportLayout>
  );
}
