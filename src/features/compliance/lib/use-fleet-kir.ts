import { useMemo } from 'react';
import { useDevicesQuery, type Device } from '@/entities/device';
import { computeKirStatus, summarizeKirFleet, type KirSnapshot, type FleetKirSummary } from './kir';

export interface KirRow {
  deviceId: number;
  deviceName: string;
  uniqueId: string | null;
  snapshot: KirSnapshot;
}

function kirDateFor(device: Device): string | null {
  const value = device.attributes?.kirLastInspection;
  return typeof value === 'string' ? value : null;
}

/**
 * Derives KIR compliance state for every visible device from the date stored
 * on `device.attributes.kirLastInspection`. Devices with no recorded date
 * surface as status `unknown` so the operator can see and address them.
 */
export function useFleetKirQuery() {
  const devicesQ = useDevicesQuery();
  const devices = useMemo(() => devicesQ.data ?? [], [devicesQ.data]);

  const rows = useMemo<KirRow[]>(
    () =>
      devices.map((device) => ({
        deviceId: device.id as number,
        deviceName: device.name ?? '—',
        uniqueId: (device as { uniqueId?: string }).uniqueId ?? null,
        snapshot: computeKirStatus(kirDateFor(device)),
      })),
    [devices],
  );

  const summary = useMemo<FleetKirSummary>(
    () => summarizeKirFleet(rows.map((r) => r.snapshot)),
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
