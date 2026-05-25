import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { useFloodData } from '../lib/use-flood-data';
import { useExposedVehicles } from '../lib/use-exposed-vehicles';
import type { FloodSeverity } from '../lib/types';

const SEVERITY_TONE: Record<FloodSeverity, string> = {
  minor: 'text-muted-foreground',
  moderate: 'text-[var(--color-warning)]',
  severe: 'text-destructive cyber-glow-alert',
  extreme: 'text-destructive cyber-glow-alert',
};

export function BanjirPanel() {
  const { t } = useTranslation();
  const { snapshot, isLoading } = useFloodData();
  const exposed = useExposedVehicles(snapshot.features);

  const headline = useMemo(() => {
    const worst = exposed.length;
    if (worst > 0) {
      return {
        text: `${worst} ${t('briefBanjirExposed')}`,
        tone: 'alert' as const,
      };
    }
    const counts = snapshot.bySeverity;
    if (counts.extreme + counts.severe > 0) {
      return {
        text: `${counts.extreme + counts.severe} ${t('briefBanjirSevere')}`,
        tone: 'warning' as const,
      };
    }
    if (snapshot.features.length === 0 && !isLoading) {
      return { text: t('briefBanjirClear'), tone: 'primary' as const };
    }
    return { text: `${snapshot.features.length} ${t('briefBanjirActive')}`, tone: 'primary' as const };
  }, [exposed.length, snapshot, isLoading, t]);

  const tonal =
    headline.tone === 'alert'
      ? 'text-destructive cyber-glow-alert'
      : headline.tone === 'warning'
        ? 'text-[var(--color-warning)]'
        : 'text-primary';

  return (
    <div className="depth-elevated-shallow relative flex flex-col gap-3 p-4">
      <span className="pointer-events-none absolute inset-0 depth-toplight" aria-hidden />
      <div className="relative flex items-baseline justify-between border-b border-border pb-2">
        <span className="cyber-label flex items-center gap-2">
          <span className="text-primary">//</span> {t('complianceBanjir')}
          <span className={cn('font-mono text-[10px] tracking-wider', tonal)}>· {headline.text}</span>
        </span>
        <Link
          to="/compliance/banjir"
          className="cyber-label text-[10px] text-primary cyber-glow hover:underline"
        >
          open module →
        </Link>
      </div>

      <div className="relative grid grid-cols-3 gap-2">
        <div>
          <div className="cyber-label text-[9px]">{t('banjirActiveReports')}</div>
          <div className="font-mono text-lg font-bold tabular-nums text-foreground">
            {snapshot.bySource.petabencana.length}
          </div>
        </div>
        <div>
          <div className="cyber-label text-[9px]">{t('banjirSeveritySevere')}</div>
          <div
            className={cn(
              'font-mono text-lg font-bold tabular-nums',
              snapshot.bySeverity.severe + snapshot.bySeverity.extreme > 0
                ? 'text-destructive cyber-glow-alert'
                : 'text-muted-foreground',
            )}
          >
            {snapshot.bySeverity.severe + snapshot.bySeverity.extreme}
          </div>
        </div>
        <div>
          <div className="cyber-label text-[9px]">{t('banjirExposedVehicles')}</div>
          <div
            className={cn(
              'font-mono text-lg font-bold tabular-nums',
              exposed.length > 0
                ? 'text-destructive cyber-glow-alert'
                : 'text-muted-foreground',
            )}
          >
            {exposed.length}
          </div>
        </div>
      </div>

      {exposed.length > 0 && (
        <div className="relative border-t border-border pt-3">
          <div className="cyber-label text-[9px] mb-2">{t('briefAttention')}</div>
          <ul className="flex flex-col gap-1.5 font-mono text-xs">
            {exposed.slice(0, 5).map((e) => (
              <li
                key={e.deviceId}
                className="flex items-center justify-between border-b border-border/40 pb-1.5 last:border-0"
              >
                <span className="text-foreground tracking-wide truncate max-w-[16rem]">
                  #{e.deviceId} · {e.matched.length} {t('banjirMatchedFeatures')}
                </span>
                <span className={cn('tabular-nums tracking-wider', SEVERITY_TONE[e.worstSeverity])}>
                  {t(`banjirSeverity${e.worstSeverity[0]!.toUpperCase()}${e.worstSeverity.slice(1)}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {snapshot.stale && (
        <div className="relative cyber-label text-[9px] text-[var(--color-warning)]">
          [STALE] {t('banjirStaleNotice')}
        </div>
      )}

      {isLoading && snapshot.features.length === 0 && (
        <div className="relative cyber-label">{t('sharedLoading')}</div>
      )}
    </div>
  );
}
