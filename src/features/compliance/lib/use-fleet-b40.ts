import { useMemo } from 'react';
import { useDevicesQuery, type Device } from '@/entities/device';
import { useLiveStore } from '@/features/main/model/live-store';
import { computeB40Status, summarizeB40Fleet, type B40Snapshot, type FleetB40Summary } from './b40';

export interface B40Row {
  deviceId: number;
  deviceName: string;
  uniqueId: string | null;
  snapshot: B40Snapshot;
}

function numAttr(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function strAttr(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function lastChangeKmOf(device: Device): number | null {
  return numAttr(device.attributes?.b40FilterLastChangeKm);
}

function lastChangeDateOf(device: Device): string | null {
  return strAttr(device.attributes?.b40FilterLastChangeDate);
}

function intervalKmOf(device: Device): number | null {
  return numAttr(device.attributes?.b40FilterIntervalKm);
}

/**
 * Derives B40 filter status for every visible device. The km axis is fed
 * by the live position telemetry (`totalDistance`, in metres → km), the
 * time axis by the operator-logged last-change date. Devices without
 * either configured surface as `unknown` so the operator can address them.
 */
export function useFleetB40Query() {
  const devicesQ = useDevicesQuery();
  const positions = useLiveStore((state) => state.positions);
  const devices = useMemo(() => devicesQ.data ?? [], [devicesQ.data]);

  const rows = useMemo<B40Row[]>(
    () =>
      devices.map((device) => {
        const deviceId = device.id as number;
        const position = positions[deviceId];
        const totalDistanceMeters = numAttr(position?.attributes?.totalDistance);
        const currentKm =
          totalDistanceMeters !== null ? Math.round(totalDistanceMeters / 1000) : null;
        return {
          deviceId,
          deviceName: device.name ?? '—',
          uniqueId: (device as { uniqueId?: string }).uniqueId ?? null,
          snapshot: computeB40Status({
            lastChangeKm: lastChangeKmOf(device),
            lastChangeDate: lastChangeDateOf(device),
            intervalKm: intervalKmOf(device),
            currentKm,
          }),
        };
      }),
    [devices, positions],
  );

  const summary = useMemo<FleetB40Summary>(
    () => summarizeB40Fleet(rows.map((r) => r.snapshot)),
    [rows],
  );

  return {
    rows,
    summary,
    isLoading: devicesQ.isLoading,
    isFetching: devicesQ.isFetching,
    error: devicesQ.error,
  };
}
