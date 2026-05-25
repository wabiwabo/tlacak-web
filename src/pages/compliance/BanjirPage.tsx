import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { ComplianceLayout } from '@/features/compliance/ui/ComplianceLayout';
import {
  useFloodData,
  useExposedVehicles,
  PETABENCANA_ATTRIBUTION,
  BMKG_ATTRIBUTION,
  type FloodFeature,
  type FloodSeverity,
} from '@/features/banjir';
import { Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';

const SEVERITY_LABEL_KEY: Record<FloodSeverity, string> = {
  minor: 'banjirSeverityMinor',
  moderate: 'banjirSeverityModerate',
  severe: 'banjirSeveritySevere',
  extreme: 'banjirSeverityExtreme',
};

const SEVERITY_VARIANT: Record<FloodSeverity, 'moving' | 'warning' | 'alert' | 'offline'> = {
  minor: 'offline',
  moderate: 'warning',
  severe: 'alert',
  extreme: 'alert',
};

const SEVERITY_ORDER: Record<FloodSeverity, number> = {
  extreme: 0,
  severe: 1,
  moderate: 2,
  minor: 3,
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

export default function BanjirPage() {
  const { t } = useTranslation();
  const { snapshot, isLoading, reportsError, floodsError, nowcastError } = useFloodData();
  const exposed = useExposedVehicles(snapshot.features);

  const reports = useMemo<FloodFeature[]>(
    () =>
      snapshot.features
        .filter((f) => f.kind === 'report')
        .sort((a, b) => {
          const ord = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
          if (ord !== 0) return ord;
          return b.reportedAt.localeCompare(a.reportedAt);
        }),
    [snapshot.features],
  );

  const jakartaPolygons = useMemo<FloodFeature[]>(
    () =>
      snapshot.features.filter(
        (f) => f.kind === 'polygon' && (f.severity === 'severe' || f.severity === 'extreme'),
      ),
    [snapshot.features],
  );

  const warnings = useMemo<FloodFeature[]>(
    () => snapshot.features.filter((f) => f.kind === 'warning'),
    [snapshot.features],
  );

  const someError = !!(reportsError || floodsError || nowcastError);

  return (
    <ComplianceLayout titleKey="complianceBanjir">
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricTile
            label={t('banjirActiveReports')}
            value={reports.length}
            meta={t('banjirReportsMeta')}
            tone="primary"
            depth="tall"
          />
          <MetricTile
            label={t('banjirJakartaPolygons')}
            value={jakartaPolygons.length}
            meta={t('banjirJakartaPolygonsMeta')}
            tone={jakartaPolygons.length > 0 ? 'alert' : 'dim'}
            depth={jakartaPolygons.length > 0 ? 'elevated' : 'recessed'}
          />
          <MetricTile
            label={t('banjirExposedVehicles')}
            value={exposed.length}
            meta={t('banjirExposedMeta')}
            tone={exposed.length > 0 ? 'alert' : 'dim'}
            depth={exposed.length > 0 ? 'elevated' : 'recessed'}
          />
          <MetricTile
            label={t('banjirNowcastWarnings')}
            value={warnings.length}
            meta={t('banjirNowcastMeta')}
            tone={warnings.length > 0 ? 'warning' : 'dim'}
            depth="flat"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-border bg-card/40 px-4 py-2">
          <div className="cyber-label flex items-center gap-2 text-[10px]">
            <span className="text-primary">●</span>
            {t('banjirSourceAttribution', {
              petabencana: PETABENCANA_ATTRIBUTION,
              bmkg: BMKG_ATTRIBUTION,
            })}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground tracking-wider">
            {snapshot.updatedAt
              ? `${t('banjirRefreshLabel')} ${dayjs(snapshot.updatedAt).fromNow()}`
              : t('sharedLoading')}
            {snapshot.stale && (
              <span className="ms-2 text-[var(--color-warning)]">[STALE]</span>
            )}
            {someError && (
              <span className="ms-2 text-destructive">[PARTIAL]</span>
            )}
          </div>
        </div>

        {exposed.length > 0 && (
          <div className="mt-3 border border-destructive/60 bg-destructive/[0.08] depth-elevated-tall p-3">
            <div className="flex items-center gap-2">
              <span className="cyber-label text-[10px] text-destructive cyber-glow-alert">
                ⚠ {t('banjirAlertTitle')}
              </span>
              <span className="font-mono text-[11px] text-foreground tracking-wide">
                {t('banjirAlertBody', { count: exposed.length })}
              </span>
            </div>
          </div>
        )}

        <div className="mt-4 depth-flat border border-border overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b border-border bg-card/40">
              <tr>
                <Th>{t('banjirColLocation')}</Th>
                <Th align="right">{t('banjirColDepth')}</Th>
                <Th>{t('banjirColSeverity')}</Th>
                <Th align="right">{t('banjirColTime')}</Th>
                <Th>{t('banjirColSource')}</Th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center cyber-label">
                    {isLoading ? t('sharedLoading') : t('banjirEmpty')}
                  </td>
                </tr>
              ) : (
                reports.map((r) => {
                  const coord = (r.geometry as { coordinates?: number[] }).coordinates;
                  const locText =
                    (r.meta?.text as string | undefined) ??
                    (coord ? `${coord[1]!.toFixed(4)}, ${coord[0]!.toFixed(4)}` : '—');
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-border/60 transition-colors hover:bg-primary/[0.04]"
                    >
                      <Td>
                        <span className="font-mono text-[13px] tracking-wider text-foreground">
                          {locText}
                        </span>
                      </Td>
                      <Td align="right">
                        <span className="font-mono text-muted-foreground tabular-nums">
                          {r.depthCm !== null ? `${r.depthCm} cm` : '—'}
                        </span>
                      </Td>
                      <Td>
                        <Badge variant={SEVERITY_VARIANT[r.severity]} size="sm" bracketed>
                          {t(SEVERITY_LABEL_KEY[r.severity])}
                        </Badge>
                      </Td>
                      <Td align="right">
                        <span className="font-mono text-muted-foreground tabular-nums">
                          {dayjs(r.reportedAt).fromNow()}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary/80">
                          {r.source}
                        </span>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 font-mono text-[10px] text-muted-foreground tracking-wider leading-relaxed max-w-3xl">
          {t('banjirFootnote')}
        </p>
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
