import { useCallback, useMemo, useState } from 'react';
import { useDevicesQuery, type Device } from '@/entities/device';
import {
  computeOdolStatus,
  summarizeOdolFleet,
  type FleetOdolSummary,
  type OdolSnapshot,
} from './odol';

export interface OdolRow {
  deviceId: number;
  deviceName: string;
  uniqueId: string | null;
  emptyKg: number;
  jbiKg: number;
  jbkiKg: number | null;
  cargoKg: number;
  snapshot: OdolSnapshot;
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function jbkiOf(device: Device): number | null {
  const value = device.attributes?.jbki;
  return typeof value === 'number' && value > 0 ? value : null;
}

/**
 * Per-trip cargo input is operator-entered and held in component state — we
 * deliberately don't persist it across reloads. The dispatcher tool is
 * meant for live pre-dispatch planning, not a historical log.
 */
export type CargoMap = Record<number, number>;

export function useFleetOdolQuery(cargo: CargoMap = {}) {
  const devicesQ = useDevicesQuery();
  const devices = useMemo(() => devicesQ.data ?? [], [devicesQ.data]);

  const rows = useMemo<OdolRow[]>(
    () =>
      devices.map((device) => {
        const emptyKg = num(device.attributes?.emptyWeight);
        const jbiKg = num(device.attributes?.jbi);
        const jbkiKg = jbkiOf(device);
        const cargoKg = num(cargo[device.id as number]);
        return {
          deviceId: device.id as number,
          deviceName: device.name ?? '—',
          uniqueId: (device as { uniqueId?: string }).uniqueId ?? null,
          emptyKg,
          jbiKg,
          jbkiKg,
          cargoKg,
          snapshot: computeOdolStatus({ emptyKg, cargoKg, jbiKg, jbkiKg: jbkiKg ?? undefined }),
        };
      }),
    [devices, cargo],
  );

  const summary = useMemo<FleetOdolSummary>(
    () => summarizeOdolFleet(rows.map((r) => r.snapshot)),
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

/** Reusable cargo-input state, in kg. */
export function useCargoMap(initial: CargoMap = {}) {
  const [cargo, setCargo] = useState<CargoMap>(initial);
  const setCargoFor = useCallback((deviceId: number, kg: number) => {
    setCargo((prev) => ({ ...prev, [deviceId]: kg }));
  }, []);
  const clearAll = useCallback(() => setCargo({}), []);
  return { cargo, setCargoFor, clearAll, setCargo };
}
