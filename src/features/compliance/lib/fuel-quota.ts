/**
 * MyPertamina fuel quota math.
 *
 * Indonesia's Decree 024/2026 caps subsidised Biosolar at 200L/day for trucks
 * with 6+ wheels. Vehicles exceeding the cap must purchase non-subsidised
 * Dexlite at a substantial premium. We help operators see — per vehicle, per
 * day — where each unit sits relative to its cap, what they're saving by
 * staying under, and what they would pay if they cross.
 *
 * No fleet tracking app in the Indonesian market exposes this metric today
 * (Cartrack ID, McEasy, TransTRACK all show generic fuel consumption only).
 */

/** Subsidised Biosolar price (Rupiah per litre) per MyPertamina. */
export const BIOSOLAR_PRICE_IDR = 6800;

/** Non-subsidised Dexlite price (Rupiah per litre) the operator pays over cap. */
export const DEXLITE_PRICE_IDR = 23600;

/** Per-litre penalty paid above the cap (DEXLITE - BIOSOLAR). */
export const PENALTY_PER_LITER_IDR = DEXLITE_PRICE_IDR - BIOSOLAR_PRICE_IDR;

/** Default Decree-024/2026 cap for 6+ wheel trucks (litres / day). */
export const DEFAULT_DAILY_CAP_L = 200;

/** Higher-than-default cap operator may have negotiated; just for typing. */
export type QuotaCapL = number;

export type QuotaStatus = 'nominal' | 'warning' | 'over';

export interface QuotaSnapshot {
  /** Litres of subsidised Biosolar consumed in the window (typically today). */
  usedL: number;
  /** Daily cap in litres for this vehicle. */
  capL: QuotaCapL;
  /** 0–100+ percentage; can exceed 100 when over cap. */
  percentUsed: number;
  /** Litres still available under the cap (0 if over). */
  remainingL: number;
  /** Cumulative subsidy saving so far this window vs paying Dexlite. */
  savingsIDR: number;
  /** Cumulative penalty already incurred for litres over the cap. */
  penaltyIDR: number;
  /** Operational state for badge/colour treatment. */
  status: QuotaStatus;
}

export interface QuotaThresholds {
  /** Cap fraction above which we surface a warning state. Default 0.80. */
  warningAt?: number;
  /** Cap fraction above which we surface an over-cap state. Default 1.00. */
  overAt?: number;
}

/**
 * Compute the quota snapshot for a single vehicle given how much fuel it
 * already burned in the window.
 */
export function computeQuota(
  usedL: number,
  capL: QuotaCapL = DEFAULT_DAILY_CAP_L,
  thresholds: QuotaThresholds = {},
): QuotaSnapshot {
  const warningAt = thresholds.warningAt ?? 0.8;
  const overAt = thresholds.overAt ?? 1;

  const safeUsed = Math.max(0, usedL);
  const safeCap = Math.max(0, capL);

  // Percentage is open-ended above 100 — that's the point; we want to show
  // operators how far they've crossed.
  const percentUsed = safeCap > 0 ? (safeUsed / safeCap) * 100 : 0;

  const remainingL = Math.max(0, safeCap - safeUsed);
  const litresUnderCap = Math.min(safeUsed, safeCap);
  const litresOverCap = Math.max(0, safeUsed - safeCap);

  const savingsIDR = Math.round(litresUnderCap * PENALTY_PER_LITER_IDR);
  const penaltyIDR = Math.round(litresOverCap * PENALTY_PER_LITER_IDR);

  let status: QuotaStatus = 'nominal';
  if (safeCap > 0 && safeUsed / safeCap >= overAt) {
    status = 'over';
  } else if (safeCap > 0 && safeUsed / safeCap >= warningAt) {
    status = 'warning';
  }

  return { usedL: safeUsed, capL: safeCap, percentUsed, remainingL, savingsIDR, penaltyIDR, status };
}

/** Aggregate of a fleet's quota state for a window. */
export interface FleetQuotaSummary {
  totalUsedL: number;
  totalCapL: number;
  totalSavingsIDR: number;
  totalPenaltyIDR: number;
  counts: Record<QuotaStatus, number>;
}

/** Roll up per-vehicle snapshots into a fleet-level summary. */
export function summarizeFleet(snapshots: QuotaSnapshot[]): FleetQuotaSummary {
  let totalUsedL = 0;
  let totalCapL = 0;
  let totalSavingsIDR = 0;
  let totalPenaltyIDR = 0;
  const counts: Record<QuotaStatus, number> = { nominal: 0, warning: 0, over: 0 };
  for (const s of snapshots) {
    totalUsedL += s.usedL;
    totalCapL += s.capL;
    totalSavingsIDR += s.savingsIDR;
    totalPenaltyIDR += s.penaltyIDR;
    counts[s.status] += 1;
  }
  return { totalUsedL, totalCapL, totalSavingsIDR, totalPenaltyIDR, counts };
}

/** Format a Rupiah number as compact display, e.g. 3_360_000 → "Rp 3.36 jt". */
export function formatRupiahCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}Rp ${(abs / 1_000_000_000).toFixed(2)} M`;
  if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toFixed(2)} jt`;
  if (abs >= 1_000) return `${sign}Rp ${(abs / 1_000).toFixed(0)} rb`;
  return `${sign}Rp ${abs.toFixed(0)}`;
}

/** Format a Rupiah number with full digits + thin-space groups (id-ID). */
export function formatRupiahFull(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}
