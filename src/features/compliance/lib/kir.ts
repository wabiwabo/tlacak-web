/**
 * KIR (Kendaraan Inspection Reguler) compliance math.
 *
 * KIR is the Indonesian mandatory periodic motor-vehicle inspection (PP
 * 55/2012 + Permenhub 19/2021). Trucks must be re-inspected every 6 months;
 * driving an over-due KIR risks fines, vehicle impoundment, and insurance
 * void. Every Indonesian commercial fleet operator tracks this — usually
 * with a spreadsheet, manually, and gets surprised.
 *
 * No fleet tracking app on the Indonesian market — TransTRACK, McEasy,
 * Cartrack ID, GPSku — surfaces KIR expiry as a first-class signal.
 *
 * We read the last-inspection date from `device.attributes.kirLastInspection`
 * (ISO 8601) and project the next due date by adding KIR_INTERVAL_MONTHS.
 */

import dayjs from 'dayjs';

/** KIR re-inspection interval per Permenhub 19/2021. */
export const KIR_INTERVAL_MONTHS = 6;

/** Days-until-due threshold below which we shift from valid to due-soon. */
export const KIR_WARN_DAYS = 30;

export type KirStatus = 'valid' | 'due-soon' | 'expired' | 'unknown';

export interface KirSnapshot {
  /** ISO date of the last completed inspection, or null if never recorded. */
  lastInspection: string | null;
  /** ISO date of the next required inspection, or null if unknown. */
  nextDue: string | null;
  /** Days from today to next due; negative if overdue. null if unknown. */
  daysUntilDue: number | null;
  status: KirStatus;
}

export interface KirThresholds {
  /** Days-until-due cutoff for the "due-soon" warning state. Default 30. */
  warnDays?: number;
}

/**
 * Compute the KIR snapshot for a vehicle given the last-inspection date.
 * `now` is injected to keep the function pure and testable.
 */
export function computeKirStatus(
  lastInspection: string | null | undefined,
  thresholds: KirThresholds = {},
  now: Date = new Date(),
): KirSnapshot {
  const warnDays = thresholds.warnDays ?? KIR_WARN_DAYS;

  if (!lastInspection) {
    return { lastInspection: null, nextDue: null, daysUntilDue: null, status: 'unknown' };
  }

  const last = dayjs(lastInspection);
  if (!last.isValid()) {
    return { lastInspection: null, nextDue: null, daysUntilDue: null, status: 'unknown' };
  }

  const next = last.add(KIR_INTERVAL_MONTHS, 'month');
  const today = dayjs(now).startOf('day');
  const daysUntilDue = next.startOf('day').diff(today, 'day');

  let status: KirStatus;
  if (daysUntilDue < 0) {
    status = 'expired';
  } else if (daysUntilDue <= warnDays) {
    status = 'due-soon';
  } else {
    status = 'valid';
  }

  return {
    lastInspection: last.format('YYYY-MM-DD'),
    nextDue: next.format('YYYY-MM-DD'),
    daysUntilDue,
    status,
  };
}

export interface FleetKirSummary {
  total: number;
  counts: Record<KirStatus, number>;
}

export function summarizeKirFleet(snapshots: KirSnapshot[]): FleetKirSummary {
  const counts: Record<KirStatus, number> = {
    valid: 0,
    'due-soon': 0,
    expired: 0,
    unknown: 0,
  };
  for (const snap of snapshots) {
    counts[snap.status] += 1;
  }
  return { total: snapshots.length, counts };
}

/**
 * Human-readable countdown string in Indonesian-aware short form.
 * - expired:  "−12 hari" (negative days, leading minus)
 * - due-soon: "12 hari"
 * - valid:    "3 bulan"  (or "12 hari" if under 60 days)
 */
export function formatKirCountdown(daysUntilDue: number | null): string {
  if (daysUntilDue === null) return '—';
  if (daysUntilDue < 0) return `−${Math.abs(daysUntilDue)} d`;
  if (daysUntilDue >= 60) return `${Math.floor(daysUntilDue / 30)} mo`;
  return `${daysUntilDue} d`;
}
