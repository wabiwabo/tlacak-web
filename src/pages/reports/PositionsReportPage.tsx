import { useState } from 'react';
import { usePositionsRangeQuery } from '@/entities/position';
import type { Position } from '@/entities/position';
import type { ReportParams } from '@/entities/report';
import { useUnitPreferences } from '@/shared/lib/use-attribute-preference';
import { formatTime, formatSpeed, formatDistance, formatAddress } from '@/shared/lib/format';
import {
  ReportLayout,
  ReportFilter,
  ReportTable,
  ColumnSelect,
  useReportColumns,
} from '@/features/reports';
import type { ReportColumn, ReportColumnOption } from '@/features/reports';
import { MapView, MapRoutePath, MapDefaultCamera } from '@/map';

export default function PositionsReportPage() {
  const units = useUnitPreferences();
  const [filter, setFilter] = useState<{ deviceId?: number; from: string; to: string }>();
  const { data, isFetching } = usePositionsRangeQuery(
    filter?.deviceId,
    filter?.from ?? '',
    filter?.to ?? '',
  );
  const positions = data ?? [];
  const routeCoords: [number, number][] = positions.map((p) => [
    p.longitude as number,
    p.latitude as number,
  ]);

  const columns: ReportColumn<Position>[] = [
    { key: 'fixTime', labelKey: 'positionFixTime', cell: (p) => formatTime(p.fixTime, 'seconds') },
    { key: 'latitude', labelKey: 'positionLatitude', cell: (p) => String(p.latitude ?? '') },
    { key: 'longitude', labelKey: 'positionLongitude', cell: (p) => String(p.longitude ?? '') },
    {
      key: 'speed',
      labelKey: 'positionSpeed',
      cell: (p) => formatSpeed(p.speed ?? 0, units.speedUnit),
    },
    { key: 'course', labelKey: 'positionCourse', cell: (p) => String(p.course ?? '') },
    {
      key: 'altitude',
      labelKey: 'positionAltitude',
      cell: (p) => formatDistance(p.altitude ?? 0, 'm'),
    },
    {
      key: 'address',
      labelKey: 'positionAddress',
      cell: (p) => formatAddress(p.address, p.latitude, p.longitude),
    },
  ];
  const columnOptions: ReportColumnOption[] = columns.map((c) => ({
    key: c.key,
    labelKey: c.labelKey,
  }));
  const [visible, setVisible] = useReportColumns('route', [
    'fixTime',
    'latitude',
    'longitude',
    'speed',
    'address',
  ]);

  const handleShow = (params: ReportParams) => {
    setFilter({ deviceId: params.deviceIds[0], from: params.from, to: params.to });
  };

  const handleExport = (params: ReportParams) => {
    const deviceId = params.deviceIds[0];
    window.location.assign(
      `/api/positions/csv?deviceId=${deviceId}&from=${encodeURIComponent(params.from)}&to=${encodeURIComponent(params.to)}`,
    );
  };

  return (
    <ReportLayout titleKey="reportPositions">
      <ReportFilter
        deviceType="single"
        loading={isFetching}
        onShow={handleShow}
        onExport={handleExport}
      >
        <ColumnSelect options={columnOptions} visible={visible} setVisible={setVisible} />
      </ReportFilter>
      {positions.length ? (
        <div className="h-64 shrink-0 border-b">
          <MapView>
            <MapRoutePath coordinates={routeCoords} id="route" />
            <MapDefaultCamera key={positions.length} positions={positions} />
          </MapView>
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <ReportTable
          columns={columns}
          visible={visible}
          data={positions.slice(0, 4000)}
          loading={isFetching}
        />
      </div>
    </ReportLayout>
  );
}
