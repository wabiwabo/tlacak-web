/**
 * ODOL (Over Dimension Over Load) compliance math.
 *
 * Indonesia is in the Zero ODOL trial-enforcement window that began June
 * 2026 (UU 22/2009, PP 55/2012, Permenhub 134/2015). Trucks exceeding their
 * JBI (Jumlah Berat yang Diijinkan — maximum permitted gross weight per the
 * vehicle's STNK/KIR) face Weigh-In-Motion (WIM) station detection, fines,
 * cargo unloading, and license revocation. Aptrindo's chairman publicly
 * said operators are "forced to overload or lose orders to those who do" —
 * dispatchers need real-time pre-trip checks to navigate this.
 *
 * No fleet tracking app in the Indonesian market — TransTRACK, McEasy,
 * Cartrack ID, GPSku — ships an ODOL pre-dispatch calculator. This is
 * the third module of OneFleet's Compliance Co-Pilot, after MyPertamina
 * fuel quota and KIR inspection countdown.
 *
 * We read empty weight from `device.attributes.emptyWeight` (kg), JBI
 * (single-truck) from `device.attributes.jbi` (kg), and JBKI (combination
 * with trailer) from `device.attributes.jbki` (kg, optional). Cargo for
 * today is entered by the dispatcher per trip; no persistence yet.
 */

export type OdolStatus = 'under' | 'at-cap' | 'over' | 'unknown';

export interface OdolThresholds {
  /** Fraction of JBI above which we flag at-cap. Default 0.95. */
  warnAt?: number;
  /** Fraction at/above which we flag over. Default 1.0. */
  overAt?: number;
}

export interface OdolInput {
  /** Empty (curb) weight of the vehicle in kilograms. */
  emptyKg: number;
  /** Planned cargo weight in kilograms. */
  cargoKg: number;
  /** Maximum permitted gross weight per the vehicle's STNK/KIR, in kg. */
  jbiKg: number;
  /** Optional combination (truck + trailer) limit, in kg. */
  jbkiKg?: number;
}

export interface OdolSnapshot {
  emptyKg: number;
  cargoKg: number;
  jbiKg: number;
  jbkiKg: number | null;
  /** Total laden weight (empty + cargo). */
  totalKg: number;
  /** 0–100+ percentage against the binding limit (JBKI if set, else JBI). */
  percent: number;
  /** Litres / kg over the limit; 0 if not over. */
  overKg: number;
  /** Operational state for badge / colour treatment. */
  status: OdolStatus;
  /** The cap used for status: the binding limit (JBKI if set, else JBI). */
  capKg: number;
  /** Indicative fine in IDR if dispatched at this overload (very rough). */
  fineEstimateIDR: number;
}

/** PP 30/2021 fine schedule is per category; we use a rough floor that
 *  scales with overage to make the operator feel the risk numerically. */
const FINE_BASE_IDR = 500_000;
const FINE_PER_KG_IDR = 250;

/**
 * Compute the ODOL compliance snapshot for a single planned trip.
 * Pure function — no I/O, no current-time reads.
 */
export function computeOdolStatus(input: OdolInput, thresholds: OdolThresholds = {}): OdolSnapshot {
  const warnAt = thresholds.warnAt ?? 0.95;
  const overAt = thresholds.overAt ?? 1.0;

  const empty = Math.max(0, input.emptyKg);
  const cargo = Math.max(0, input.cargoKg);
  const jbi = Math.max(0, input.jbiKg);
  const jbki = input.jbkiKg && input.jbkiKg > 0 ? input.jbkiKg : null;
  const totalKg = empty + cargo;

  // If we have no cap configured, we can't compute status — return unknown.
  if (jbi <= 0 && jbki === null) {
    return {
      emptyKg: empty,
      cargoKg: cargo,
      jbiKg: jbi,
      jbkiKg: jbki,
      totalKg,
      percent: 0,
      overKg: 0,
      status: 'unknown',
      capKg: 0,
      fineEstimateIDR: 0,
    };
  }

  // The binding limit is JBKI if set (operator runs a combination),
  // otherwise JBI (single rigid truck).
  const capKg = jbki ?? jbi;
  const percent = capKg > 0 ? (totalKg / capKg) * 100 : 0;
  const overKg = Math.max(0, totalKg - capKg);

  let status: OdolStatus = 'under';
  if (capKg > 0 && totalKg / capKg >= overAt) {
    status = 'over';
  } else if (capKg > 0 && totalKg / capKg >= warnAt) {
    status = 'at-cap';
  }

  const fineEstimateIDR = overKg > 0 ? FINE_BASE_IDR + Math.round(overKg * FINE_PER_KG_IDR) : 0;

  return {
    emptyKg: empty,
    cargoKg: cargo,
    jbiKg: jbi,
    jbkiKg: jbki,
    totalKg,
    percent,
    overKg,
    status,
    capKg,
    fineEstimateIDR,
  };
}

export interface FleetOdolSummary {
  total: number;
  configured: number;
  counts: Record<OdolStatus, number>;
  totalCargoKg: number;
  totalFineRiskIDR: number;
}

export function summarizeOdolFleet(snapshots: OdolSnapshot[]): FleetOdolSummary {
  const counts: Record<OdolStatus, number> = {
    under: 0,
    'at-cap': 0,
    over: 0,
    unknown: 0,
  };
  let totalCargoKg = 0;
  let totalFineRiskIDR = 0;
  let configured = 0;
  for (const s of snapshots) {
    counts[s.status] += 1;
    totalCargoKg += s.cargoKg;
    totalFineRiskIDR += s.fineEstimateIDR;
    if (s.status !== 'unknown') configured += 1;
  }
  return { total: snapshots.length, configured, counts, totalCargoKg, totalFineRiskIDR };
}

/** Compact tonnage formatter: 13_500 → "13.5 t", 950 → "950 kg". */
export function formatTonnage(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${kg.toFixed(0)} kg`;
}
