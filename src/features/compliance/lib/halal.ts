/**
 * Halal logistics readiness compliance math.
 *
 * Indonesia's Halal Product Assurance Law (UU 33/2014) + PP 39/2021
 * makes BPJPH halal certification mandatory across the supply chain.
 * For food & beverage the deadline was 17 Oct 2024 — already in force.
 * For non-food (pharma, cosmetics) the deadline is 17 Oct 2026. A truck
 * caught at a Bulog/distributor gate without a valid certificate loses
 * the contract on the spot.
 *
 * No fleet tracking app in the Indonesian market — TransTRACK, McEasy,
 * Cartrack ID, GPSku — surfaces BPJPH certificate state today. This is
 * the sixth and final module of OneFleet's Compliance Co-Pilot, after
 * MyPertamina fuel quota, KIR inspection, ODOL load advisor, B40 filter
 * schedule, and Banjir awareness.
 *
 * We read the operator-logged certificate identity + expiry from
 * `device.attributes.halalCertNumber` (string) and
 * `device.attributes.halalCertExpiry` (ISO 8601 date). Optional
 * `halalLastSanitization` and `halalCargoCategory` are surfaced in the
 * table as informational columns but do not drive status (PP 39/2021
 * does not fix a sanitation interval, only "between haram→halal hauls",
 * so any fixed-period warning would be a false positive).
 */

import dayjs from 'dayjs';

/** BPJPH halal certificates are issued for 4 years. Reference only —
 *  surfaced in the source-law ribbon. Status is driven by expiry, not
 *  by computing from issuance. */
export const HALAL_CERT_VALIDITY_YEARS = 4;

/** Days-until-expiry threshold below which we flip to due-soon.
 *  BPJPH renewal typically takes 30-45 days; 60 days gives operators
 *  enough runway to start the paperwork. */
export const HALAL_WARN_DAYS = 60;

export type HalalStatus = 'certified' | 'due-soon' | 'expired' | 'unknown';

export interface HalalSnapshot {
  /** Echo of the input cert number, or null if blank. */
  certNumber: string | null;
  /** Echo of the input expiry, normalised to YYYY-MM-DD, or null. */
  certExpiry: string | null;
  /** Days from today to expiry; negative if expired. null if unknown. */
  daysUntilExpiry: number | null;
  status: HalalStatus;
}

export interface HalalThresholds {
  /** Days-until-expiry cutoff for the "due-soon" warning state. Default 60. */
  warnDays?: number;
}

/**
 * Compute the Halal readiness snapshot for a vehicle.
 * Pure function — `now` injected to keep deterministic for tests.
 */
export function computeHalalStatus(
  certNumber: string | null | undefined,
  certExpiry: string | null | undefined,
  thresholds: HalalThresholds = {},
  now: Date = new Date(),
): HalalSnapshot {
  const warnDays = thresholds.warnDays ?? HALAL_WARN_DAYS;

  if (!certNumber) {
    return { certNumber: null, certExpiry: null, daysUntilExpiry: null, status: 'unknown' };
  }
  if (!certExpiry) {
    return { certNumber, certExpiry: null, daysUntilExpiry: null, status: 'unknown' };
  }

  const expiry = dayjs(certExpiry);
  if (!expiry.isValid()) {
    return { certNumber, certExpiry: null, daysUntilExpiry: null, status: 'unknown' };
  }

  const today = dayjs(now).startOf('day');
  const daysUntilExpiry = expiry.startOf('day').diff(today, 'day');

  let status: HalalStatus;
  if (daysUntilExpiry < 0) {
    status = 'expired';
  } else if (daysUntilExpiry <= warnDays) {
    status = 'due-soon';
  } else {
    status = 'certified';
  }

  return {
    certNumber,
    certExpiry: expiry.format('YYYY-MM-DD'),
    daysUntilExpiry,
    status,
  };
}

export interface FleetHalalSummary {
  total: number;
  counts: Record<HalalStatus, number>;
}

export function summarizeHalalFleet(snapshots: HalalSnapshot[]): FleetHalalSummary {
  const counts: Record<HalalStatus, number> = {
    certified: 0,
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
 * Human-readable countdown — matches `formatKirCountdown` for visual
 * parity across Compliance modules.
 * - expired:  "−12 d" (U+2212 minus)
 * - due-soon: "12 d"
 * - certified: "3 mo" (or "12 d" if under 60 days)
 */
export function formatHalalCountdown(daysUntilExpiry: number | null): string {
  if (daysUntilExpiry === null) return '—';
  if (daysUntilExpiry < 0) return `−${Math.abs(daysUntilExpiry)} d`;
  if (daysUntilExpiry >= 60) return `${Math.floor(daysUntilExpiry / 30)} mo`;
  return `${daysUntilExpiry} d`;
}
