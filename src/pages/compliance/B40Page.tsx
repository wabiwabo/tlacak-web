import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ComplianceLayout } from '@/features/compliance/ui/ComplianceLayout';
import {
  useFleetB40Query,
  formatB40Countdown,
  B40_DEFAULT_INTERVAL_KM,
  B40_DEFAULT_INTERVAL_MONTHS,
  type B40Row,
  type B40Status,
  type B40Snapshot,
} from '@/features/compliance';
import { Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';

const STATUS_VARIANT: Record<B40Status, 'moving' | 'warning' | 'alert' | 'offline'> = {
  valid: 'moving',
  'due-soon': 'warning',
  overdue: 'alert',
  unknown: 'offline',
};

const STATUS_LABEL_KEY: Record<B40Status, string> = {
  valid: 'b40StatusValid',
  'due-soon': 'b40StatusDueSoon',
  overdue: 'b40StatusOverdue',
  unknown: 'b40StatusUnknown',
};

const STATUS_TEXT_COLOR: Record<B40Status, string> = {
  valid: 'text-primary',
  'due-soon': 'text-[var(--color-warning)]',
  overdue: 'text-destructive cyber-glow-alert',
  unknown: 'text-muted-foreground',
};

const STATUS_BAR_TONE: Record<B40Status, string> = {
  valid: 'bg-primary',
  'due-soon': 'bg-[var(--color-warning)]',
  overdue: 'bg-destructive',
  unknown: 'bg-muted-foreground/40',
};

const STATUS_ORDER: Record<B40Status, number> = {
  overdue: 0,
  'due-soon': 1,
  unknown: 2,
  valid: 3,
};

const KM_FORMAT = new Intl.NumberFormat('en-US');

function urgencyMetric(snap: B40Snapshot): number {
  // Lower number = more urgent — used as the second sort key after status.
  // For km axis we use kmUntilDue; for time axis daysUntilDue. Unknown gets
  // pushed to the end via MAX_SAFE_INTEGER.
  if (snap.axis === 'km' && snap.kmUntilDue !== null) return snap.kmUntilDue;
  if (snap.axis === 'time' && snap.daysUntilDue !== null) return snap.daysUntilDue;
  return Number.MAX_SAFE_INTEGER;
}

function usagePercent(snap: B40Snapshot, intervalKm = B40_DEFAULT_INTERVAL_KM): number {
  if (snap.axis === 'time' && snap.daysUntilDue !== null) {
    const totalDays = B40_DEFAULT_INTERVAL_MONTHS * 30;
    return Math.max(0, Math.min(110, ((totalDays - snap.daysUntilDue) / totalDays) * 100));
  }
  if (snap.kmUntilDue === null) return 0;
  const used = intervalKm - snap.kmUntilDue;
  return Math.max(0, Math.min(110, (used / intervalKm) * 100));
}

function MetricTile({
  label,
  value,
  meta,
  tone,
  depth,
}: {
  label: string;
  value: string | number;
  meta?: string;
  tone: 'primary' | 'warning' | 'alert' | 'dim';
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
          : 'text-muted-foreground';
  return (
    <div className={cn('relative flex flex-col gap-2 p-4 transition-all', depthClass)}>
      <span className="pointer-events-none absolute inset-0 depth-toplight" aria-hidden />
      <span className="relative cyber-label text-[10px]">{label}</span>
      <span
        className={cn(
          'relative font-mono text-2xl font-bold tracking-tight tabular-nums',
          valueColor,
        )}
      >
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

function UsageBar({ percent, status }: { percent: number; status: B40Status }) {
  const fill = Math.min(100, Math.max(0, percent));
  return (
    <div className="relative h-1.5 w-full border border-border bg-background/40">
      <div className={cn('h-full transition-all', STATUS_BAR_TONE[status])} style={{ width: `${fill}%` }} />
      {percent > 100 && (
        <span className="pointer-events-none absolute -top-px -bottom-px right-0 w-1 bg-destructive cyber-box-glow-alert" />
      )}
    </div>
  );
}

export default function B40Page() {
  const { t } = useTranslation();
  const { rows, summary, isLoading } = useFleetB40Query();

  const sorted = useMemo<B40Row[]>(
    () =>
      [...rows].sort((a, b) => {
        const ord = STATUS_ORDER[a.snapshot.status] - STATUS_ORDER[b.snapshot.status];
        if (ord !== 0) return ord;
        return urgencyMetric(a.snapshot) - urgencyMetric(b.snapshot);
      }),
    [rows],
  );

  const expiredOrSoon = summary.counts.overdue + summary.counts['due-soon'];
  const tracked = summary.total - summary.counts.unknown;

  return (
    <ComplianceLayout titleKey="complianceB40">
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricTile
            label={t('b40TotalTracked')}
            value={tracked}
            meta={`/ ${summary.total} ${t('b40Vehicles')}`}
            tone="primary"
            depth="tall"
          />
          <MetricTile
            label={t('b40StatusOverdue')}
            value={summary.counts.overdue}
            meta={t('b40OverdueMeta')}
            tone={summary.counts.overdue > 0 ? 'alert' : 'dim'}
            depth={summary.counts.overdue > 0 ? 'elevated' : 'recessed'}
          />
          <MetricTile
            label={t('b40StatusDueSoon')}
            value={summary.counts['due-soon']}
            meta={`${t('b40DueSoonMeta')} ${KM_FORMAT.format(1500)} km / 30 ${t('b40Days')}`}
            tone={summary.counts['due-soon'] > 0 ? 'warning' : 'dim'}
            depth={summary.counts['due-soon'] > 0 ? 'elevated' : 'recessed'}
          />
          <MetricTile
            label={t('b40StatusUnknown')}
            value={summary.counts.unknown}
            meta={t('b40UnknownMeta')}
            tone={summary.counts.unknown > 0 ? 'warning' : 'dim'}
            depth="flat"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-border bg-card/40 px-4 py-2">
          <div className="cyber-label flex items-center gap-2 text-[10px]">
            <span className="text-primary">●</span>
            {t('b40SourceLaw')}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground tracking-wider">
            {t('b40IntervalLabel')} {KM_FORMAT.format(B40_DEFAULT_INTERVAL_KM)} km / {B40_DEFAULT_INTERVAL_MONTHS} {t('b40Months')}
            <span className="mx-2">·</span>
            {t('b40WarnLabel')} {KM_FORMAT.format(1500)} km / 30 {t('b40Days')}
          </div>
        </div>

        {expiredOrSoon > 0 && (
          <div className="mt-3 border border-destructive/60 bg-destructive/[0.08] depth-elevated-tall p-3">
            <div className="flex items-center gap-2">
              <span className="cyber-label text-[10px] text-destructive cyber-glow-alert">
                ⚠ {t('b40AlertTitle')}
              </span>
              <span className="font-mono text-[11px] text-foreground tracking-wide">
                {t('b40AlertBody', { count: expiredOrSoon })}
              </span>
            </div>
          </div>
        )}

        <div className="mt-4 depth-flat border border-border overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b border-border bg-card/40">
              <tr>
                <Th>{t('sharedName')}</Th>
                <Th>{t('sharedPlate')}</Th>
                <Th>{t('b40ColLastChange')}</Th>
                <Th>{t('b40ColNextDue')}</Th>
                <Th className="w-40">{t('b40ColUsage')}</Th>
                <Th align="right">{t('b40ColCountdown')}</Th>
                <Th>{t('quotaStatus')}</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center cyber-label">
                    {isLoading ? t('sharedLoading') : t('sharedNoData')}
                  </td>
                </tr>
              ) : (
                sorted.map((row) => {
                  const snap = row.snapshot;
                  const percent = usagePercent(snap);
                  const countdownValue =
                    snap.axis === 'km' ? snap.kmUntilDue : snap.daysUntilDue;
                  const countdownAxis = snap.axis === 'time' ? 'time' : 'km';
                  return (
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
                      <Td>
                        <div className="flex flex-col leading-tight">
                          <span className="font-mono text-muted-foreground tabular-nums">
                            {snap.lastChangeKm !== null
                              ? `${KM_FORMAT.format(snap.lastChangeKm)} km`
                              : '—'}
                          </span>
                          {snap.lastChangeDate && (
                            <span className="font-mono text-[10px] text-muted-foreground/70 tracking-wider">
                              {snap.lastChangeDate}
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <div className="flex flex-col leading-tight">
                          <span className="font-mono text-foreground tabular-nums">
                            {snap.nextDueKm !== null
                              ? `${KM_FORMAT.format(snap.nextDueKm)} km`
                              : '—'}
                          </span>
                          {snap.nextDueDate && (
                            <span className="font-mono text-[10px] text-muted-foreground/70 tracking-wider">
                              {snap.nextDueDate}
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <UsageBar percent={percent} status={snap.status} />
                          <span
                            className={cn(
                              'font-mono text-[11px] tabular-nums w-10 text-right',
                              STATUS_TEXT_COLOR[snap.status],
                            )}
                          >
                            {snap.status === 'unknown' ? '—' : `${percent.toFixed(0)}%`}
                          </span>
                        </div>
                      </Td>
                      <Td align="right">
                        <div className="flex flex-col items-end leading-tight">
                          <span
                            className={cn(
                              'font-mono font-semibold tabular-nums',
                              STATUS_TEXT_COLOR[snap.status],
                            )}
                          >
                            {formatB40Countdown(countdownValue, countdownAxis)}
                          </span>
                          {snap.axis !== 'none' && snap.status !== 'unknown' && (
                            <span className="font-mono text-[9px] text-muted-foreground/70 uppercase tracking-[0.14em]">
                              {snap.axis === 'km' ? t('b40AxisKm') : t('b40AxisTime')}
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <Badge variant={STATUS_VARIANT[snap.status]} size="sm" bracketed>
                          {t(STATUS_LABEL_KEY[snap.status])}
                        </Badge>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 font-mono text-[10px] text-muted-foreground tracking-wider leading-relaxed max-w-3xl">
          {t('b40Footnote')}
        </p>
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
