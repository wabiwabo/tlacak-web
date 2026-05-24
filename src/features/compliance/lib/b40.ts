/**
 * B40 fuel-filter replacement compliance.
 *
 * On 1 January 2025 Indonesia made B40 (40% palm-derived FAME) the mandatory
 * diesel blend (ESDM Reg. 341.K/EK.01/MEM.M/2024). FAME is a solvent — it
 * dissolves the varnish, asphaltenes and microbial film that years of B0/B30
 * fuel deposited inside tanks, lines and pumps. That sludge migrates straight
 * into the fuel filter, which clogs in a fraction of the legacy interval.
 *
 * Pertamina, GAIKINDO and most ATPM bulletins now specify a 10,000 km / 6
 * month service interval for B40-fuelled commercial diesel (down from
 * 20,000+ km on B0). An over-due filter on B40 means injector damage,
 * power loss, and a roadside breakdown — the exact event that loses an
 * operator the contract.
 *
 * No fleet tracking app in the Indonesian market — TransTRACK, McEasy,
 * Cartrack ID, GPSku — surfaces B40 filter status as a first-class signal.
 * This is the fourth module of OneFleet's Compliance Co-Pilot, after
 * MyPertamina fuel quota, KIR inspection countdown, and ODOL load advisor.
 *
 * We read the operator-logged service snapshot from
 * `device.attributes.b40FilterLastChangeKm` (odometer in km) and/or
 * `device.attributes.b40FilterLastChangeDate` (ISO 8601). An optional
 * `b40FilterIntervalKm` lets fleets running heavier filters override the
 * 10 000 km default. The current odometer comes from live position
 * telemetry; the calculation here stays pure and takes it as input.
 */

import dayjs from 'dayjs';

/** Pertamina + ATPM consensus interval for B40-fuelled diesel filters. */
export const B40_DEFAULT_INTERVAL_KM = 10_000;

/** Calendar fallback when km telemetry is missing or stationary. */
export const B40_DEFAULT_INTERVAL_MONTHS = 6;

/** Kilometres-remaining cutoff below which we flag due-soon. */
export const B40_WARN_KM = 1_500;

/** Days-remaining cutoff below which we flag due-soon (matches KIR). */
export const B40_WARN_DAYS = 30;

export type B40Status = 'valid' | 'due-soon' | 'overdue' | 'unknown';

/** Which axis is the binding (closer-to-expiry) constraint for this snapshot. */
export type B40Axis = 'km' | 'time' | 'none';

export interface B40Input {
  /** Odometer reading (km) at the last filter replacement. */
  lastChangeKm?: number | null;
  /** Live odometer reading (km) right now — usually from position telemetry. */
  currentKm?: number | null;
  /** ISO 8601 date string for the last filter replacement. */
  lastChangeDate?: string | null;
  /** Operator override for the km service interval. Falls back to the default. */
  intervalKm?: number | null;
}

export interface B40Thresholds {
  /** Kilometres remaining at which we flip to due-soon. */
  warnKm?: number;
  /** Days remaining at which we flip to due-soon. */
  warnDays?: number;
}

export interface B40Snapshot {
  /** Echo of the input last-change odometer, if known. */
  lastChangeKm: number | null;
  /** Echo of the input last-change date, normalised to YYYY-MM-DD. */
  lastChangeDate: string | null;
  /** Echo of the live odometer reading used for the km axis. */
  currentKm: number | null;
  /** lastChangeKm + interval, or null if km axis can't be computed. */
  nextDueKm: number | null;
  /** lastChangeDate + interval-months, or null if time axis can't be computed. */
  nextDueDate: string | null;
  /** Kilometres until due. Negative if overdue. null if km axis unavailable. */
  kmUntilDue: number | null;
  /** Days until due. Negative if overdue. null if time axis unavailable. */
  daysUntilDue: number | null;
  /** Which axis drove the status verdict. */
  axis: B40Axis;
  status: B40Status;
}

export interface FleetB40Summary {
  total: number;
  counts: Record<B40Status, number>;
}

function rankStatus(status: B40Status): number {
  // Higher number = more urgent — picks the worse of two axes.
  switch (status) {
    case 'overdue':
      return 3;
    case 'due-soon':
      return 2;
    case 'valid':
      return 1;
    case 'unknown':
      return 0;
  }
}

function classifyKm(kmUntilDue: number, warnKm: number): B40Status {
  if (kmUntilDue < 0) return 'overdue';
  if (kmUntilDue <= warnKm) return 'due-soon';
  return 'valid';
}

function classifyDays(daysUntilDue: number, warnDays: number): B40Status {
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= warnDays) return 'due-soon';
  return 'valid';
}

/**
 * Compute the B40 filter snapshot for a vehicle.
 *
 * Two-axis check: km (preferred — biodiesel filter wear is mileage-driven)
 * and time (fallback for stationary fleets and dual-axis logging).
 *
 * Status is the worse of the two axes when both are present, with the
 * binding axis recorded for UI hinting. `now` is injected to keep the
 * function pure and testable.
 */
export function computeB40Status(
  input: B40Input,
  thresholds: B40Thresholds = {},
  now: Date = new Date(),
): B40Snapshot {
  const warnKm = thresholds.warnKm ?? B40_WARN_KM;
  const warnDays = thresholds.warnDays ?? B40_WARN_DAYS;
  const intervalKm =
    input.intervalKm && input.intervalKm > 0 ? input.intervalKm : B40_DEFAULT_INTERVAL_KM;

  // ── km axis ──────────────────────────────────────────────────────────
  let kmAxis: { nextDueKm: number; kmUntilDue: number; status: B40Status } | null = null;
  if (
    typeof input.lastChangeKm === 'number' &&
    typeof input.currentKm === 'number' &&
    Number.isFinite(input.lastChangeKm) &&
    Number.isFinite(input.currentKm)
  ) {
    const nextDueKm = input.lastChangeKm + intervalKm;
    const kmUntilDue = nextDueKm - input.currentKm;
    kmAxis = { nextDueKm, kmUntilDue, status: classifyKm(kmUntilDue, warnKm) };
  }

  // ── time axis ────────────────────────────────────────────────────────
  let timeAxis: { nextDueDate: string; daysUntilDue: number; status: B40Status } | null = null;
  let normalisedLastDate: string | null = null;
  if (input.lastChangeDate) {
    const last = dayjs(input.lastChangeDate);
    if (last.isValid()) {
      const next = last.add(B40_DEFAULT_INTERVAL_MONTHS, 'month');
      const today = dayjs(now).startOf('day');
      const daysUntilDue = next.startOf('day').diff(today, 'day');
      normalisedLastDate = last.format('YYYY-MM-DD');
      timeAxis = {
        nextDueDate: next.format('YYYY-MM-DD'),
        daysUntilDue,
        status: classifyDays(daysUntilDue, warnDays),
      };
    }
  }

  // ── verdict ──────────────────────────────────────────────────────────
  let status: B40Status;
  let axis: B40Axis;
  if (kmAxis && timeAxis) {
    if (rankStatus(kmAxis.status) >= rankStatus(timeAxis.status)) {
      status = kmAxis.status;
      axis = 'km';
    } else {
      status = timeAxis.status;
      axis = 'time';
    }
  } else if (kmAxis) {
    status = kmAxis.status;
    axis = 'km';
  } else if (timeAxis) {
    status = timeAxis.status;
    axis = 'time';
  } else {
    status = 'unknown';
    axis = 'none';
  }

  return {
    lastChangeKm: kmAxis ? (input.lastChangeKm as number) : null,
    lastChangeDate: normalisedLastDate,
    currentKm: kmAxis ? (input.currentKm as number) : null,
    nextDueKm: kmAxis?.nextDueKm ?? null,
    nextDueDate: timeAxis?.nextDueDate ?? null,
    kmUntilDue: kmAxis?.kmUntilDue ?? null,
    daysUntilDue: timeAxis?.daysUntilDue ?? null,
    axis,
    status,
  };
}

export function summarizeB40Fleet(snapshots: B40Snapshot[]): FleetB40Summary {
  const counts: Record<B40Status, number> = {
    valid: 0,
    'due-soon': 0,
    overdue: 0,
    unknown: 0,
  };
  for (const snap of snapshots) {
    counts[snap.status] += 1;
  }
  return { total: snapshots.length, counts };
}

const KM_FORMATTER = new Intl.NumberFormat('en-US');

/**
 * Compact countdown formatter aware of the axis:
 *   km   → "2,500 km"  "−1,500 km"  "—"
 *   time → "12 d"      "6 mo"        "−12 d"   "—"
 *
 * The minus glyph is U+2212 (matches KIR for visual parity).
 */
export function formatB40Countdown(value: number | null, axis: 'km' | 'time'): string {
  if (value === null) return '—';
  if (axis === 'km') {
    const sign = value < 0 ? '−' : '';
    return `${sign}${KM_FORMATTER.format(Math.abs(value))} km`;
  }
  if (value < 0) return `−${Math.abs(value)} d`;
  if (value >= 60) return `${Math.floor(value / 30)} mo`;
  return `${value} d`;
}
