import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { ComplianceLayout } from '@/features/compliance/ui/ComplianceLayout';
import {
  useFleetQuotaQuery,
  formatRupiahCompact,
  PENALTY_PER_LITER_IDR,
  type QuotaRow,
  type QuotaStatus,
} from '@/features/compliance';
import { Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';

const STATUS_VARIANT: Record<QuotaStatus, 'moving' | 'warning' | 'alert'> = {
  nominal: 'moving',
  warning: 'warning',
  over: 'alert',
};

const STATUS_LABEL_KEY: Record<QuotaStatus, string> = {
  nominal: 'quotaStatusNominal',
  warning: 'quotaStatusWarning',
  over: 'quotaStatusOver',
};

const BAR_TONE: Record<QuotaStatus, string> = {
  nominal: 'bg-primary',
  warning: 'bg-[var(--color-warning)]',
  over: 'bg-destructive',
};

function MetricTile({
  label,
  value,
  meta,
  tone,
  depth,
}: {
  label: string;
  value: string;
  meta?: string;
  tone?: 'primary' | 'warning' | 'alert' | 'dim';
  depth: 'flat' | 'elevated' | 'recessed' | 'tall';
}) {
  const depthClass =
    depth === 'flat'
      ? 'depth-flat'
      : depth === 'elevated'
        ? 'depth-elevated-shallow'
        : depth === 'tall'
          ? 'depth-elevated-tall -translate-y-0.5'
          : 'depth-recessed-shallow';
  const valueColor =
    tone === 'primary'
      ? 'text-primary cyber-glow'
      : tone === 'warning'
        ? 'text-[var(--color-warning)]'
        : tone === 'alert'
          ? 'text-destructive cyber-glow-alert'
          : 'text-foreground';
  return (
    <div className={cn('relative flex flex-col gap-2 p-4 transition-all', depthClass)}>
      <span className="pointer-events-none absolute inset-0 depth-toplight" aria-hidden />
      <span className="relative cyber-label text-[10px]">{label}</span>
      <span className={cn('relative font-mono text-2xl font-bold tracking-tight tabular-nums', valueColor)}>
        {value}
      </span>
      {meta && (
        <span className="relative font-mono text-[10px] text-muted-foreground tracking-wider">
          {meta}
        </span>
      )}
    </div>
  );
}

function QuotaBar({ percent, tone }: { percent: number; tone: QuotaStatus }) {
  // Clamp visual fill at 100; surface overage via the +N% label beside the bar.
  const fill = Math.min(100, Math.max(0, percent));
  return (
    <div className="relative h-1.5 w-full border border-border bg-background/40">
      <div
        className={cn('h-full transition-all', BAR_TONE[tone])}
        style={{ width: `${fill}%` }}
      />
      {percent > 100 && (
        <span className="pointer-events-none absolute -top-px -bottom-px right-0 w-1 bg-destructive cyber-box-glow-alert" />
      )}
    </div>
  );
}

export default function FuelQuotaPage() {
  const { t } = useTranslation();
  const { rows, summary, isLoading } = useFleetQuotaQuery();

  const sorted = useMemo<QuotaRow[]>(
    () => [...rows].sort((a, b) => b.quota.percentUsed - a.quota.percentUsed),
    [rows],
  );

  const fleetPercent =
    summary.totalCapL > 0 ? (summary.totalUsedL / summary.totalCapL) * 100 : 0;
  const projectedDailyPenalty = summary.totalPenaltyIDR;
  const projectedFullDayPenalty = (() => {
    // If the day were to play out at the current burn rate, how much penalty
    // would accrue? Mostly a sales/awareness metric for the dispatcher.
    const now = dayjs();
    const startOfDay = now.startOf('day');
    const elapsedHours = Math.max(0.25, now.diff(startOfDay, 'hour', true));
    const projectionRatio = 24 / elapsedHours;
    const projectedUsedL = summary.totalUsedL * projectionRatio;
    const projectedOverL = Math.max(0, projectedUsedL - summary.totalCapL);
    return Math.round(projectedOverL * PENALTY_PER_LITER_IDR);
  })();

  return (
    <ComplianceLayout titleKey="complianceFuelQuota">
      <div className="p-5">
        {/* Hero metric row — physical mixing board */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <MetricTile
            label={t('quotaFleetUsed')}
            value={`${summary.totalUsedL.toFixed(0)} L`}
            meta={`/ ${summary.totalCapL.toFixed(0)} L`}
            tone="primary"
            depth="tall"
          />
          <MetricTile
            label={t('quotaFleetPercent')}
            value={`${fleetPercent.toFixed(1)}%`}
            meta={t('quotaOfDailyCap')}
            tone={fleetPercent >= 100 ? 'alert' : fleetPercent >= 80 ? 'warning' : 'primary'}
            depth="elevated"
          />
          <MetricTile
            label={t('quotaSubsidySavings')}
            value={formatRupiahCompact(summary.totalSavingsIDR)}
            meta={t('quotaVsDexlite')}
            tone="primary"
            depth="flat"
          />
          <MetricTile
            label={t('quotaPenaltyToday')}
            value={formatRupiahCompact(projectedDailyPenalty)}
            meta={
              projectedFullDayPenalty > projectedDailyPenalty
                ? `${t('quotaProjected')} ${formatRupiahCompact(projectedFullDayPenalty)}`
                : t('quotaNoOverage')
            }
            tone={projectedDailyPenalty > 0 ? 'alert' : 'dim'}
            depth={projectedDailyPenalty > 0 ? 'elevated' : 'recessed'}
          />
          <div className="depth-recessed-shallow translate-y-[1.5px] flex flex-col justify-center gap-1 p-4">
            <span className="cyber-label text-[10px]">{t('quotaStatusBreakdown')}</span>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-primary">
                ● {summary.counts.nominal} {t('quotaStatusNominalShort')}
              </span>
              <span className="text-[var(--color-warning)]">
                ● {summary.counts.warning} {t('quotaStatusWarningShort')}
              </span>
              <span className="text-destructive cyber-glow-alert">
                ● {summary.counts.over} {t('quotaStatusOverShort')}
              </span>
            </div>
          </div>
        </div>

        {/* Compliance source */}
        <div className="mt-5 flex items-center justify-between border-y border-border bg-card/40 px-4 py-2">
          <div className="cyber-label flex items-center gap-2 text-[10px]">
            <span className="text-primary">●</span>
            {t('quotaSourceDecree')}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground tracking-wider">
            {t('quotaPriceBiosolar')} Rp 6.800 · {t('quotaPriceDexlite')} Rp 23.600 ·
            {' '}
            {t('quotaPenaltyPerL')} Rp 16.800/L
          </div>
        </div>

        {/* Per-vehicle table */}
        <div className="mt-4 depth-flat border border-border overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b border-border bg-card/40">
              <tr>
                <Th>{t('sharedName')}</Th>
                <Th>{t('sharedPlate')}</Th>
                <Th align="right">{t('quotaColUsed')}</Th>
                <Th align="right">{t('quotaColCap')}</Th>
                <Th className="w-40">{t('quotaColUsage')}</Th>
                <Th align="right">{t('quotaColRemaining')}</Th>
                <Th align="right">{t('quotaColSavings')}</Th>
                <Th align="right">{t('quotaColPenalty')}</Th>
                <Th>{t('quotaStatus')}</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center cyber-label">
                    {isLoading ? t('sharedLoading') : t('sharedNoData')}
                  </td>
                </tr>
              ) : (
                sorted.map((row) => (
                  <tr
                    key={row.deviceId}
                    className="border-b border-border/60 transition-colors hover:bg-primary/[0.04]"
                  >
                    <Td>
                      <span className="font-mono text-[13px] font-bold uppercase tracking-wider text-foreground">
                        {row.deviceName}
                      </span>
                    </Td>
                    <Td>
                      {row.uniqueId && (
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                          {row.uniqueId}
                        </span>
                      )}
                    </Td>
                    <Td align="right">
                      <span className="font-mono font-semibold tabular-nums">
                        {row.quota.usedL.toFixed(1)} L
                      </span>
                    </Td>
                    <Td align="right">
                      <span className="font-mono text-muted-foreground tabular-nums">
                        {row.capL} L
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <QuotaBar percent={row.quota.percentUsed} tone={row.quota.status} />
                        <span
                          className={cn(
                            'font-mono text-[11px] tabular-nums w-12 text-right',
                            row.quota.status === 'over' && 'text-destructive cyber-glow-alert',
                            row.quota.status === 'warning' && 'text-[var(--color-warning)]',
                            row.quota.status === 'nominal' && 'text-muted-foreground',
                          )}
                        >
                          {row.quota.percentUsed.toFixed(0)}%
                        </span>
                      </div>
                    </Td>
                    <Td align="right">
                      <span className="font-mono text-muted-foreground tabular-nums">
                        {row.quota.remainingL.toFixed(1)} L
                      </span>
                    </Td>
                    <Td align="right">
                      <span className="font-mono text-primary tabular-nums">
                        {formatRupiahCompact(row.quota.savingsIDR)}
                      </span>
                    </Td>
                    <Td align="right">
                      <span
                        className={cn(
                          'font-mono tabular-nums',
                          row.quota.penaltyIDR > 0
                            ? 'text-destructive cyber-glow-alert'
                            : 'text-muted-foreground',
                        )}
                      >
                        {row.quota.penaltyIDR > 0
                          ? formatRupiahCompact(row.quota.penaltyIDR)
                          : '—'}
                      </span>
                    </Td>
                    <Td>
                      <Badge variant={STATUS_VARIANT[row.quota.status]} size="sm" bracketed>
                        {t(STATUS_LABEL_KEY[row.quota.status])}
                      </Badge>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ComplianceLayout>
  );
}

function Th({
  children,
  align = 'left',
  className,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <th
      className={cn(
        'h-9 px-3 align-middle whitespace-nowrap',
        'font-mono font-semibold uppercase tracking-[0.16em] text-[10px] text-muted-foreground',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <td
      className={cn(
        'px-3 py-2 align-middle font-mono text-sm tracking-wide',
        align === 'right' && 'text-right',
      )}
    >
      {children}
    </td>
  );
}
