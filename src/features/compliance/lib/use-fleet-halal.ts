import { useMemo } from 'react';
import { useDevicesQuery, type Device } from '@/entities/device';
import {
  computeHalalStatus,
  summarizeHalalFleet,
  type HalalSnapshot,
  type FleetHalalSummary,
} from './halal';

export interface HalalRow {
  deviceId: number;
  deviceName: string;
  uniqueId: string | null;
  /** Operator-logged last sanitization date (info only — no status impact). */
  lastSanitization: string | null;
  /** Operator-flagged cargo category (info only). */
  cargoCategory: string | null;
  snapshot: HalalSnapshot;
}

function strAttr(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function certNumberOf(device: Device): string | null {
  return strAttr(device.attributes?.halalCertNumber);
}

function certExpiryOf(device: Device): string | null {
  return strAttr(device.attributes?.halalCertExpiry);
}

function lastSanitizationOf(device: Device): string | null {
  return strAttr(device.attributes?.halalLastSanitization);
}

function cargoCategoryOf(device: Device): string | null {
  return strAttr(device.attributes?.halalCargoCategory);
}

/**
 * Derives BPJPH halal-certification readiness for every visible device
 * from operator-logged `device.attributes.halal*` fields. Devices with
 * no `halalCertNumber` surface as status `unknown` so the operator can
 * see and address them. No backend changes — reuses `useDevicesQuery`.
 */
export function useFleetHalalQuery() {
  const devicesQ = useDevicesQuery();
  const devices = useMemo(() => devicesQ.data ?? [], [devicesQ.data]);

  const rows = useMemo<HalalRow[]>(
    () =>
      devices.map((device) => ({
        deviceId: device.id as number,
        deviceName: device.name ?? '—',
        uniqueId: (device as { uniqueId?: string }).uniqueId ?? null,
        lastSanitization: lastSanitizationOf(device),
        cargoCategory: cargoCategoryOf(device),
        snapshot: computeHalalStatus(certNumberOf(device), certExpiryOf(device)),
      })),
    [devices],
  );

  const summary = useMemo<FleetHalalSummary>(
    () => summarizeHalalFleet(rows.map((r) => r.snapshot)),
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
