export {
  BIOSOLAR_PRICE_IDR,
  DEXLITE_PRICE_IDR,
  PENALTY_PER_LITER_IDR,
  DEFAULT_DAILY_CAP_L,
  computeQuota,
  summarizeFleet,
  formatRupiahCompact,
  formatRupiahFull,
  type QuotaSnapshot,
  type QuotaStatus,
  type FleetQuotaSummary,
} from './lib/fuel-quota';
export { useFleetQuotaQuery, type QuotaRow } from './lib/use-fleet-quota';

export {
  KIR_INTERVAL_MONTHS,
  KIR_WARN_DAYS,
  computeKirStatus,
  summarizeKirFleet,
  formatKirCountdown,
  type KirSnapshot,
  type KirStatus,
  type FleetKirSummary,
} from './lib/kir';
export { useFleetKirQuery, type KirRow } from './lib/use-fleet-kir';

export {
  computeOdolStatus,
  summarizeOdolFleet,
  formatTonnage,
  type OdolSnapshot,
  type OdolStatus,
  type FleetOdolSummary,
  type OdolInput,
} from './lib/odol';
export {
  useFleetOdolQuery,
  useCargoMap,
  type OdolRow,
  type CargoMap,
} from './lib/use-fleet-odol';

export {
  B40_DEFAULT_INTERVAL_KM,
  B40_DEFAULT_INTERVAL_MONTHS,
  B40_WARN_KM,
  B40_WARN_DAYS,
  computeB40Status,
  summarizeB40Fleet,
  formatB40Countdown,
  type B40Snapshot,
  type B40Status,
  type B40Axis,
  type B40Input,
  type B40Thresholds,
  type FleetB40Summary,
} from './lib/b40';
export { useFleetB40Query, type B40Row } from './lib/use-fleet-b40';
