import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useDevicesQuery, type Device } from '@/entities/device';
import { useSummaryReport, type ReportParams, type SummaryReport } from '@/entities/report';
import {
  computeQuota,
  summarizeFleet,
  DEFAULT_DAILY_CAP_L,
  type FleetQuotaSummary,
  type QuotaCapL,
  type QuotaSnapshot,
} from './fuel-quota';

export interface QuotaRow {
  deviceId: number;
  deviceName: string;
  uniqueId: string | null;
  capL: QuotaCapL;
  quota: QuotaSnapshot;
}

/**
 * Per-vehicle cap override stored on `device.attributes.fuelQuotaCap` (litres).
 * Operators set this on the device page; defaults to the Decree 024 cap.
 */
function capForDevice(device: Device): QuotaCapL {
  const override = device.attributes?.fuelQuotaCap;
  if (typeof override === 'number' && override > 0) {
    return override;
  }
  return DEFAULT_DAILY_CAP_L;
}

/**
 * Derives today's MyPertamina quota state for every device. Pulls the
 * SummaryReport for the window [start-of-today, now] across all devices the
 * operator can see, then joins to the device list to produce one QuotaRow
 * per vehicle. The hook stays disabled until the device list resolves so we
 * never fire an empty report query.
 */
export function useFleetQuotaQuery() {
  const devicesQ = useDevicesQuery();
  const devices = useMemo(() => devicesQ.data ?? [], [devicesQ.data]);

  const params = useMemo<ReportParams | undefined>(() => {
    if (devices.length === 0) {
      return undefined;
    }
    const now = dayjs();
    return {
      deviceIds: devices.map((d) => d.id as number),
      groupIds: [],
      from: now.startOf('day').toISOString(),
      to: now.toISOString(),
    };
  }, [devices]);

  const summaryQ = useSummaryReport(params, false);

  const rows = useMemo<QuotaRow[]>(() => {
    if (devices.length === 0) {
      return [];
    }
    const spentByDevice = new Map<number, number>();
    for (const row of (summaryQ.data as SummaryReport[] | undefined) ?? []) {
      if (typeof row.deviceId === 'number') {
        spentByDevice.set(row.deviceId, (spentByDevice.get(row.deviceId) ?? 0) + (row.spentFuel ?? 0));
      }
    }
    return devices.map((device) => {
      const capL = capForDevice(device);
      const usedL = spentByDevice.get(device.id as number) ?? 0;
      const quota = computeQuota(usedL, capL);
      return {
        deviceId: device.id as number,
        deviceName: device.name ?? '—',
        uniqueId: (device as { uniqueId?: string }).uniqueId ?? null,
        capL,
        quota,
      };
    });
  }, [devices, summaryQ.data]);

  const summary = useMemo<FleetQuotaSummary>(
    () => summarizeFleet(rows.map((r) => r.quota)),
    [rows],
  );

  return {
    rows,
    summary,
    isLoading: devicesQ.isLoading || summaryQ.isLoading,
    isFetching: devicesQ.isFetching || summaryQ.isFetching,
    error: devicesQ.error ?? summaryQ.error,
  };
}
