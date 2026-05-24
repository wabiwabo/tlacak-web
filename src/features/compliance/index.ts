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
