import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ComplianceLayout } from '@/features/compliance/ui/ComplianceLayout';
import {
  useFleetOdolQuery,
  useCargoMap,
  formatTonnage,
  formatRupiahCompact,
  type OdolRow,
  type OdolStatus,
} from '@/features/compliance';
import { Badge, Button, Input } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';

const STATUS_VARIANT: Record<OdolStatus, 'moving' | 'warning' | 'alert' | 'offline'> = {
  under: 'moving',
  'at-cap': 'warning',
  over: 'alert',
  unknown: 'offline',
};

const STATUS_LABEL_KEY: Record<OdolStatus, string> = {
  under: 'odolStatusUnder',
  'at-cap': 'odolStatusAtCap',
  over: 'odolStatusOver',
  unknown: 'odolStatusUnknown',
};

const STATUS_ORDER: Record<OdolStatus, number> = {
  over: 0,
  'at-cap': 1,
  unknown: 2,
  under: 3,
};

const BAR_TONE: Record<OdolStatus, string> = {
  under: 'bg-primary',
  'at-cap': 'bg-[var(--color-warning)]',
  over: 'bg-destructive',
  unknown: 'bg-muted-foreground/40',
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

function LoadBar({ percent, status }: { percent: number; status: OdolStatus }) {
  const fill = Math.min(100, Math.max(0, percent));
  return (
    <div className="relative h-1.5 w-full border border-border bg-background/40">
      <div className={cn('h-full transition-all', BAR_TONE[status])} style={{ width: `${fill}%` }} />
      {percent > 100 && (
        <span className="pointer-events-none absolute -top-px -bottom-px right-0 w-1 bg-destructive cyber-box-glow-alert" />
      )}
    </div>
  );
}

export default function OdolPage() {
  const { t } = useTranslation();
  const { cargo, setCargoFor, clearAll } = useCargoMap();
  const { rows, summary, isLoading } = useFleetOdolQuery(cargo);

  // Sort: over first (desc by overage), then at-cap (desc by %), unknown,
  // then under (desc by %) — the urgent stuff bubbles up.
  const sorted = useMemo<OdolRow[]>(
    () =>
      [...rows].sort((a, b) => {
        const ord = STATUS_ORDER[a.snapshot.status] - STATUS_ORDER[b.snapshot.status];
        if (ord !== 0) return ord;
        return b.snapshot.percent - a.snapshot.percent;
      }),
    [rows],
  );

  const avgUtil =
    summary.configured > 0
      ? rows
          .filter((r) => r.snapshot.status !== 'unknown')
          .reduce((s, r) => s + r.snapshot.percent, 0) / summary.configured
      : 0;

  const hasInputAny = Object.values(cargo).some((v) => v > 0);

  return (
    <ComplianceLayout titleKey="complianceOdol">
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <MetricTile
            label={t('odolFleetCargo')}
            value={formatTonnage(summary.totalCargoKg)}
            meta={`${summary.configured} ${t('odolConfigured')}/${summary.total}`}
            tone="primary"
            depth="tall"
          />
          <MetricTile
            label={t('odolAvgUtil')}
            value={`${avgUtil.toFixed(1)}%`}
            meta={t('odolOfBindingCap')}
            tone={avgUtil >= 100 ? 'alert' : avgUtil >= 95 ? 'warning' : 'primary'}
            depth="elevated"
          />
          <MetricTile
            label={t('odolStatusOver')}
            value={String(summary.counts.over)}
            meta={summary.counts.over > 0 ? t('odolOverMeta') : t('odolNoneOver')}
            tone={summary.counts.over > 0 ? 'alert' : 'dim'}
            depth={summary.counts.over > 0 ? 'elevated' : 'recessed'}
          />
          <MetricTile
            label={t('odolStatusAtCap')}
            value={String(summary.counts['at-cap'])}
            meta={t('odolAtCapMeta')}
            tone={summary.counts['at-cap'] > 0 ? 'warning' : 'dim'}
            depth={summary.counts['at-cap'] > 0 ? 'elevated' : 'flat'}
          />
          <MetricTile
            label={t('odolFineRisk')}
            value={summary.totalFineRiskIDR > 0 ? formatRupiahCompact(summary.totalFineRiskIDR) : '—'}
            meta={t('odolFineRiskMeta')}
            tone={summary.totalFineRiskIDR > 0 ? 'alert' : 'dim'}
            depth={summary.totalFineRiskIDR > 0 ? 'elevated' : 'recessed'}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-border bg-card/40 px-4 py-2">
          <div className="cyber-label flex items-center gap-2 text-[10px]">
            <span className="text-primary">●</span>
            {t('odolSourceLaw')}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
              {t('odolWarnLabel')} 95% · {t('odolOverLabel')} 100%
            </span>
            {hasInputAny && (
              <Button variant="ghost" size="xs" onClick={clearAll}>
                {t('odolClearAll')}
              </Button>
            )}
          </div>
        </div>

        {summary.counts.unknown > 0 && (
          <div className="mt-3 border border-[var(--color-warning)]/60 bg-[var(--color-warning)]/[0.08] depth-elevated-shallow p-3">
            <div className="flex items-center gap-2">
              <span className="cyber-label text-[10px] text-[var(--color-warning)]">
                ⚠ {t('odolMissingJbiTitle')}
              </span>
              <span className="font-mono text-[11px] text-foreground tracking-wide">
                {t('odolMissingJbiBody', { count: summary.counts.unknown })}
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
                <Th align="right">{t('odolColEmpty')}</Th>
                <Th align="right">{t('odolColJbi')}</Th>
                <Th className="w-44">{t('odolColCargo')}</Th>
                <Th align="right">{t('odolColTotal')}</Th>
                <Th className="w-40">{t('odolColUsage')}</Th>
                <Th align="right">{t('odolColOver')}</Th>
                <Th align="right">{t('odolColFine')}</Th>
                <Th>{t('quotaStatus')}</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center cyber-label">
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
                      <span className="font-mono text-muted-foreground tabular-nums">
                        {row.emptyKg > 0 ? formatTonnage(row.emptyKg) : '—'}
                      </span>
                    </Td>
                    <Td align="right">
                      <span className="font-mono text-muted-foreground tabular-nums">
                        {row.snapshot.capKg > 0 ? formatTonnage(row.snapshot.capKg) : '—'}
                      </span>
                      {row.jbkiKg && row.jbkiKg > 0 && (
                        <span className="ms-1 font-mono text-[9px] tracking-wider text-primary uppercase">
                          jbki
                        </span>
                      )}
                    </Td>
                    <Td>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        placeholder="kg"
                        value={row.cargoKg > 0 ? row.cargoKg : ''}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setCargoFor(row.deviceId, Number.isFinite(value) ? value : 0);
                        }}
                        className="h-7 w-32 px-2 text-right"
                        disabled={row.snapshot.status === 'unknown'}
                      />
                    </Td>
                    <Td align="right">
                      <span className="font-mono font-semibold tabular-nums">
                        {formatTonnage(row.snapshot.totalKg)}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <LoadBar percent={row.snapshot.percent} status={row.snapshot.status} />
                        <span
                          className={cn(
                            'font-mono text-[11px] tabular-nums w-12 text-right',
                            row.snapshot.status === 'over' && 'text-destructive cyber-glow-alert',
                            row.snapshot.status === 'at-cap' && 'text-[var(--color-warning)]',
                            row.snapshot.status === 'under' && 'text-muted-foreground',
                            row.snapshot.status === 'unknown' && 'text-muted-foreground/50',
                          )}
                        >
                          {row.snapshot.status === 'unknown'
                            ? '—'
                            : `${row.snapshot.percent.toFixed(0)}%`}
                        </span>
                      </div>
                    </Td>
                    <Td align="right">
                      <span
                        className={cn(
                          'font-mono tabular-nums',
                          row.snapshot.overKg > 0
                            ? 'text-destructive cyber-glow-alert'
                            : 'text-muted-foreground',
                        )}
                      >
                        {row.snapshot.overKg > 0 ? `+${formatTonnage(row.snapshot.overKg)}` : '—'}
                      </span>
                    </Td>
                    <Td align="right">
                      <span
                        className={cn(
                          'font-mono tabular-nums',
                          row.snapshot.fineEstimateIDR > 0
                            ? 'text-destructive cyber-glow-alert'
                            : 'text-muted-foreground',
                        )}
                      >
                        {row.snapshot.fineEstimateIDR > 0
                          ? formatRupiahCompact(row.snapshot.fineEstimateIDR)
                          : '—'}
                      </span>
                    </Td>
                    <Td>
                      <Badge variant={STATUS_VARIANT[row.snapshot.status]} size="sm" bracketed>
                        {t(STATUS_LABEL_KEY[row.snapshot.status])}
                      </Badge>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 font-mono text-[10px] text-muted-foreground tracking-wider leading-relaxed max-w-3xl">
          {t('odolFootnote')}
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
