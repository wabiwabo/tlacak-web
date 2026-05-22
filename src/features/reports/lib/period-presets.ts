import dayjs from 'dayjs';

export type PeriodKey =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'previousWeek'
  | 'thisMonth'
  | 'previousMonth'
  | 'custom';

export interface PeriodOption {
  key: PeriodKey;
  labelKey: string;
}

export const periodOptions: PeriodOption[] = [
  { key: 'today', labelKey: 'reportToday' },
  { key: 'yesterday', labelKey: 'reportYesterday' },
  { key: 'thisWeek', labelKey: 'reportThisWeek' },
  { key: 'previousWeek', labelKey: 'reportPreviousWeek' },
  { key: 'thisMonth', labelKey: 'reportThisMonth' },
  { key: 'previousMonth', labelKey: 'reportPreviousMonth' },
  { key: 'custom', labelKey: 'reportCustom' },
];

/** Resolves a preset key to an ISO `{from,to}` range. `custom` returns the last hour. */
export function periodRange(period: PeriodKey): { from: string; to: string } {
  const now = dayjs();
  switch (period) {
    case 'today':
      return { from: now.startOf('day').toISOString(), to: now.endOf('day').toISOString() };
    case 'yesterday':
      return {
        from: now.subtract(1, 'day').startOf('day').toISOString(),
        to: now.subtract(1, 'day').endOf('day').toISOString(),
      };
    case 'thisWeek':
      return { from: now.startOf('week').toISOString(), to: now.endOf('week').toISOString() };
    case 'previousWeek':
      return {
        from: now.subtract(1, 'week').startOf('week').toISOString(),
        to: now.subtract(1, 'week').endOf('week').toISOString(),
      };
    case 'thisMonth':
      return { from: now.startOf('month').toISOString(), to: now.endOf('month').toISOString() };
    case 'previousMonth':
      return {
        from: now.subtract(1, 'month').startOf('month').toISOString(),
        to: now.subtract(1, 'month').endOf('month').toISOString(),
      };
    case 'custom':
    default:
      return { from: now.subtract(1, 'hour').toISOString(), to: now.toISOString() };
  }
}
