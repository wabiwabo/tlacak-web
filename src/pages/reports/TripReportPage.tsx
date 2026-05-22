import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTripsReport, reportQuery } from '@/entities/report';
import type { TripReport, ReportParams } from '@/entities/report';
import { usePositionsRangeQuery } from '@/entities/position';
import { useUnitPreferences } from '@/shared/lib/use-attribute-preference';
import {
  formatTime,
  formatDistance,
  formatSpeed,
  formatVolume,
  formatNumericHours,
  formatAddress,
} from '@/shared/lib/format';
import { downloadReport } from '@/shared/lib/download';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { Button } from '@/shared/ui/button';
import { MapView, MapRoutePath, MapDefaultCamera } from '@/map';
import {
  ReportLayout,
  ReportFilter,
  ReportTable,
  ColumnSelect,
  useReportColumns,
  scheduleReport,
} from '@/features/reports';
import type { ReportColumn, ReportColumnOption, ScheduleDraft } from '@/features/reports';

export default function TripReportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const units = useUnitPreferences();
  const pushError = useErrorsStore((state) => state.push);
  const [params, setParams] = useState<ReportParams>();
  const [selected, setSelected] = useState<TripReport>();
  const { data, isFetching } = useTripsReport(params);

  const selectedTrip = selected as
    | (TripReport & { deviceId?: number; startTime?: string; endTime?: string })
    | undefined;
  const { data: routePositions } = usePositionsRangeQuery(
    selectedTrip?.deviceId,
    selectedTrip?.startTime ?? '',
    selectedTrip?.endTime ?? '',
  );
  const routeCoords: [number, number][] = (routePositions ?? []).map((p) => [
    p.longitude as number,
    p.latitude as number,
  ]);

  const columns: ReportColumn<TripReport>[] = [
    {
      key: 'startTime',
      labelKey: 'reportStartTime',
      cell: (r) => formatTime(r.startTime, 'minutes'),
    },
    { key: 'endTime', labelKey: 'reportEndTime', cell: (r) => formatTime(r.endTime, 'minutes') },
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
      key: 'duration',
      labelKey: 'reportDuration',
      cell: (r) => formatNumericHours(Date.parse(r.endTime ?? '') - Date.parse(r.startTime ?? '')),
    },
    {
      key: 'spentFuel',
      labelKey: 'reportSpentFuel',
      cell: (r) => formatVolume(r.spentFuel ?? 0, units.volumeUnit),
    },
    {
      key: 'startAddress',
      labelKey: 'reportStartAddress',
      cell: (r) => formatAddress(r.startAddress),
    },
    { key: 'endAddress', labelKey: 'reportEndAddress', cell: (r) => formatAddress(r.endAddress) },
  ];
  const columnOptions: ReportColumnOption[] = columns.map((c) => ({
    key: c.key,
    labelKey: c.labelKey,
  }));
  const [visible, setVisible] = useReportColumns('trips', [
    'startTime',
    'endTime',
    'distance',
    'averageSpeed',
  ]);

  const handleExport = async (p: ReportParams) => {
    try {
      await downloadReport(`/reports/trips${reportQuery(p)}`, 'trips.xlsx');
    } catch (error) {
      pushError((error as Error).message);
    }
  };

  const handleSchedule = async (deviceIds: number[], groupIds: number[], draft: ScheduleDraft) => {
    try {
      await scheduleReport(deviceIds, groupIds, {
        type: 'trips',
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
    <ReportLayout titleKey="reportTrips">
      <ReportFilter
        deviceType="multiple"
        loading={isFetching}
        onShow={setParams}
        onExport={handleExport}
        onSchedule={handleSchedule}
      >
        <ColumnSelect options={columnOptions} visible={visible} setVisible={setVisible} />
      </ReportFilter>
      {selectedTrip && routeCoords.length ? (
        <div className="h-64 shrink-0 border-b">
          <MapView>
            <MapRoutePath coordinates={routeCoords} id="trip" />
            <MapDefaultCamera
              key={`${selectedTrip.startTime}`}
              positions={(routePositions ?? []) as never}
            />
          </MapView>
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <ReportTable
          columns={columns}
          visible={visible}
          data={data ?? []}
          loading={isFetching}
          onRowClick={setSelected}
          selectedRow={selected}
        />
        {selectedTrip ? (
          <div className="mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                navigate(
                  `/replay?deviceId=${selectedTrip.deviceId}&from=${selectedTrip.startTime}&to=${selectedTrip.endTime}`,
                )
              }
            >
              {t('reportReplay')}
            </Button>
          </div>
        ) : null}
      </div>
    </ReportLayout>
  );
}
