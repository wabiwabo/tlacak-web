import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ComplianceLayout } from '@/features/compliance/ui/ComplianceLayout';
import {
  useFleetKirQuery,
  formatKirCountdown,
  type KirRow,
  type KirStatus,
} from '@/features/compliance';
import { Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';

const STATUS_VARIANT: Record<KirStatus, 'moving' | 'warning' | 'alert' | 'offline'> = {
  valid: 'moving',
  'due-soon': 'warning',
  expired: 'alert',
  unknown: 'offline',
};

const STATUS_LABEL_KEY: Record<KirStatus, string> = {
  valid: 'kirStatusValid',
  'due-soon': 'kirStatusDueSoon',
  expired: 'kirStatusExpired',
  unknown: 'kirStatusUnknown',
};

const STATUS_TEXT_COLOR: Record<KirStatus, string> = {
  valid: 'text-primary',
  'due-soon': 'text-[var(--color-warning)]',
  expired: 'text-destructive cyber-glow-alert',
  unknown: 'text-muted-foreground',
};

const STATUS_ORDER: Record<KirStatus, number> = {
  expired: 0,
  'due-soon': 1,
  unknown: 2,
  valid: 3,
};

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

export default function KirPage() {
  const { t } = useTranslation();
  const { rows, summary, isLoading } = useFleetKirQuery();

  // Sort by urgency: expired first (descending overdue), then due-soon
  // (ascending days), then unknown, then valid (ascending days).
  const sorted = useMemo<KirRow[]>(
    () =>
      [...rows].sort((a, b) => {
        const stOrder = STATUS_ORDER[a.snapshot.status] - STATUS_ORDER[b.snapshot.status];
        if (stOrder !== 0) return stOrder;
        const ad = a.snapshot.daysUntilDue ?? Number.MAX_SAFE_INTEGER;
        const bd = b.snapshot.daysUntilDue ?? Number.MAX_SAFE_INTEGER;
        return ad - bd;
      }),
    [rows],
  );

  const expiredOrSoon = summary.counts.expired + summary.counts['due-soon'];

  return (
    <ComplianceLayout titleKey="complianceKir">
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricTile
            label={t('kirTotalTracked')}
            value={summary.total - summary.counts.unknown}
            meta={`/ ${summary.total} ${t('kirVehicles')}`}
            tone="primary"
            depth="tall"
          />
          <MetricTile
            label={t('kirStatusExpired')}
            value={summary.counts.expired}
            meta={t('kirExpiredMeta')}
            tone={summary.counts.expired > 0 ? 'alert' : 'dim'}
            depth={summary.counts.expired > 0 ? 'elevated' : 'recessed'}
          />
          <MetricTile
            label={t('kirStatusDueSoon')}
            value={summary.counts['due-soon']}
            meta={`${t('kirDueSoonMeta')} 30 ${t('kirDays')}`}
            tone={summary.counts['due-soon'] > 0 ? 'warning' : 'dim'}
            depth={summary.counts['due-soon'] > 0 ? 'elevated' : 'recessed'}
          />
          <MetricTile
            label={t('kirStatusUnknown')}
            value={summary.counts.unknown}
            meta={t('kirUnknownMeta')}
            tone={summary.counts.unknown > 0 ? 'warning' : 'dim'}
            depth="flat"
          />
        </div>

        <div className="mt-5 flex items-center justify-between border-y border-border bg-card/40 px-4 py-2">
          <div className="cyber-label flex items-center gap-2 text-[10px]">
            <span className="text-primary">●</span>
            {t('kirSourceLaw')}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground tracking-wider">
            {t('kirIntervalLabel')} 6 {t('kirMonths')} · {t('kirWarnLabel')} 30 {t('kirDays')}
          </div>
        </div>

        {expiredOrSoon > 0 && (
          <div className="mt-3 border border-destructive/60 bg-destructive/[0.08] depth-elevated-tall p-3">
            <div className="flex items-center gap-2">
              <span className="cyber-label text-[10px] text-destructive cyber-glow-alert">
                ⚠ {t('kirAlertTitle')}
              </span>
              <span className="font-mono text-[11px] text-foreground tracking-wide">
                {t('kirAlertBody', { count: expiredOrSoon })}
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
                <Th>{t('kirColLastInspection')}</Th>
                <Th>{t('kirColNextDue')}</Th>
                <Th align="right">{t('kirColCountdown')}</Th>
                <Th>{t('quotaStatus')}</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center cyber-label">
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
                    <Td>
                      <span className="font-mono text-muted-foreground">
                        {row.snapshot.lastInspection ?? '—'}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-mono text-foreground">
                        {row.snapshot.nextDue ?? '—'}
                      </span>
                    </Td>
                    <Td align="right">
                      <span
                        className={cn(
                          'font-mono font-semibold tabular-nums',
                          STATUS_TEXT_COLOR[row.snapshot.status],
                        )}
                      >
                        {formatKirCountdown(row.snapshot.daysUntilDue)}
                      </span>
                    </Td>
                    <Td>
                      <Badge
                        variant={STATUS_VARIANT[row.snapshot.status]}
                        size="sm"
                        bracketed
                      >
                        {t(STATUS_LABEL_KEY[row.snapshot.status])}
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
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={cn(
        'h-9 px-3 align-middle whitespace-nowrap',
        'font-mono font-semibold uppercase tracking-[0.16em] text-[10px] text-muted-foreground',
        align === 'right' ? 'text-right' : 'text-left',
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
