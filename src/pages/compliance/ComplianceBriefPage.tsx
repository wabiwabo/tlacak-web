import { useMemo } from 'react';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ComplianceLayout } from '@/features/compliance/ui/ComplianceLayout';
import {
  useFleetQuotaQuery,
  useFleetKirQuery,
  useFleetOdolQuery,
  useFleetB40Query,
  formatRupiahCompact,
  formatKirCountdown,
  formatB40Countdown,
  type QuotaRow,
  type KirRow,
  type B40Row,
} from '@/features/compliance';
import { Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';

/**
 * Morning Brief — the dispatcher's daily landing page.
 *
 * Aggregates every Compliance Co-Pilot signal so the operator can read
 * status, urgency and Rupiah impact in one screen, then drill into the
 * specific module that needs action.
 */

function BriefHeader({
  label,
  badge,
  badgeTone,
  to,
}: {
  label: string;
  badge?: string;
  badgeTone?: 'primary' | 'warning' | 'alert' | 'dim';
  to: string;
}) {
  const tonal =
    badgeTone === 'alert'
      ? 'text-destructive cyber-glow-alert'
      : badgeTone === 'warning'
        ? 'text-[var(--color-warning)]'
        : badgeTone === 'primary'
          ? 'text-primary'
          : 'text-muted-foreground';
  return (
    <div className="flex items-baseline justify-between border-b border-border pb-2">
      <span className="cyber-label flex items-center gap-2">
        <span className="text-primary">//</span> {label}
        {badge && <span className={cn('font-mono text-[10px] tracking-wider', tonal)}>· {badge}</span>}
      </span>
      <Link
        to={to}
        className="cyber-label text-[10px] text-primary cyber-glow hover:underline"
      >
        open module →
      </Link>
    </div>
  );
}

function FuelQuotaPanel() {
  const { t } = useTranslation();
  const { rows, summary, isLoading } = useFleetQuotaQuery();

  // top 3 closest-to-cap (highest percentUsed) — that's where today's
  // dispatcher attention should go.
  const top = useMemo<QuotaRow[]>(
    () => [...rows].sort((a, b) => b.quota.percentUsed - a.quota.percentUsed).slice(0, 3),
    [rows],
  );

  const fleetPercent =
    summary.totalCapL > 0 ? (summary.totalUsedL / summary.totalCapL) * 100 : 0;

  let badge = '';
  let badgeTone: 'primary' | 'warning' | 'alert' = 'primary';
  if (summary.counts.over > 0) {
    badge = `${summary.counts.over} ${t('briefOverCap')}`;
    badgeTone = 'alert';
  } else if (summary.counts.warning > 0) {
    badge = `${summary.counts.warning} ${t('briefNearCap')}`;
    badgeTone = 'warning';
  } else {
    badge = t('briefAllNominal');
  }

  return (
    <div className="depth-elevated-shallow relative flex flex-col gap-3 p-4">
      <span className="pointer-events-none absolute inset-0 depth-toplight" aria-hidden />
      <div className="relative">
        <BriefHeader
          label={t('complianceFuelQuota')}
          badge={badge}
          badgeTone={badgeTone}
          to="/compliance/fuel-quota"
        />
      </div>

      <div className="relative grid grid-cols-3 gap-2">
        <div>
          <div className="cyber-label text-[9px]">{t('quotaFleetUsed')}</div>
          <div className="font-mono text-lg font-bold tabular-nums text-foreground">
            {summary.totalUsedL.toFixed(0)}
            <span className="text-muted-foreground"> / {summary.totalCapL.toFixed(0)} L</span>
          </div>
          <div className="font-mono text-[10px] text-muted-foreground tracking-wider">
            {fleetPercent.toFixed(0)}% · {t('quotaOfDailyCap')}
          </div>
        </div>
        <div>
          <div className="cyber-label text-[9px]">{t('quotaSubsidySavings')}</div>
          <div className="font-mono text-lg font-bold tabular-nums text-primary">
            {formatRupiahCompact(summary.totalSavingsIDR)}
          </div>
        </div>
        <div>
          <div className="cyber-label text-[9px]">{t('quotaPenaltyToday')}</div>
          <div
            className={cn(
              'font-mono text-lg font-bold tabular-nums',
              summary.totalPenaltyIDR > 0
                ? 'text-destructive cyber-glow-alert'
                : 'text-muted-foreground',
            )}
          >
            {summary.totalPenaltyIDR > 0
              ? formatRupiahCompact(summary.totalPenaltyIDR)
              : '—'}
          </div>
        </div>
      </div>

      {top.length > 0 && (
        <div className="relative border-t border-border pt-3">
          <div className="cyber-label text-[9px] mb-2">{t('briefAttention')}</div>
          <ul className="flex flex-col gap-1.5 font-mono text-xs">
            {top.map((r) => (
              <li
                key={r.deviceId}
                className="flex items-center justify-between border-b border-border/40 pb-1.5 last:border-0"
              >
                <span className="text-foreground tracking-wide truncate max-w-[18rem]">
                  {r.deviceName}
                </span>
                <span
                  className={cn(
                    'tabular-nums tracking-wider',
                    r.quota.status === 'over'
                      ? 'text-destructive cyber-glow-alert'
                      : r.quota.status === 'warning'
                        ? 'text-[var(--color-warning)]'
                        : 'text-muted-foreground',
                  )}
                >
                  {r.quota.percentUsed.toFixed(0)}% · {r.quota.usedL.toFixed(0)}/{r.capL} L
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLoading && top.length === 0 && (
        <div className="relative cyber-label">{t('sharedLoading')}</div>
      )}
    </div>
  );
}

function KirPanel() {
  const { t } = useTranslation();
  const { rows, summary, isLoading } = useFleetKirQuery();

  const expiredOrSoon = useMemo<KirRow[]>(
    () =>
      rows
        .filter((r) => r.snapshot.status === 'expired' || r.snapshot.status === 'due-soon')
        .sort((a, b) => (a.snapshot.daysUntilDue ?? 0) - (b.snapshot.daysUntilDue ?? 0))
        .slice(0, 5),
    [rows],
  );

  let badge = '';
  let badgeTone: 'primary' | 'warning' | 'alert' = 'primary';
  if (summary.counts.expired > 0) {
    badge = `${summary.counts.expired} ${t('briefExpired')}`;
    badgeTone = 'alert';
  } else if (summary.counts['due-soon'] > 0) {
    badge = `${summary.counts['due-soon']} ${t('briefDueSoon')}`;
    badgeTone = 'warning';
  } else {
    badge = t('briefAllValid');
  }

  return (
    <div className="depth-elevated-shallow relative flex flex-col gap-3 p-4">
      <span className="pointer-events-none absolute inset-0 depth-toplight" aria-hidden />
      <div className="relative">
        <BriefHeader
          label={t('complianceKir')}
          badge={badge}
          badgeTone={badgeTone}
          to="/compliance/kir"
        />
      </div>

      <div className="relative grid grid-cols-3 gap-2">
        <div>
          <div className="cyber-label text-[9px]">{t('kirStatusValid')}</div>
          <div className="font-mono text-lg font-bold tabular-nums text-primary">
            {summary.counts.valid}
          </div>
        </div>
        <div>
          <div className="cyber-label text-[9px]">{t('kirStatusDueSoon')}</div>
          <div
            className={cn(
              'font-mono text-lg font-bold tabular-nums',
              summary.counts['due-soon'] > 0 ? 'text-[var(--color-warning)]' : 'text-muted-foreground',
            )}
          >
            {summary.counts['due-soon']}
          </div>
        </div>
        <div>
          <div className="cyber-label text-[9px]">{t('kirStatusExpired')}</div>
          <div
            className={cn(
              'font-mono text-lg font-bold tabular-nums',
              summary.counts.expired > 0
                ? 'text-destructive cyber-glow-alert'
                : 'text-muted-foreground',
            )}
          >
            {summary.counts.expired}
          </div>
        </div>
      </div>

      {expiredOrSoon.length > 0 && (
        <div className="relative border-t border-border pt-3">
          <div className="cyber-label text-[9px] mb-2">{t('briefAttention')}</div>
          <ul className="flex flex-col gap-1.5 font-mono text-xs">
            {expiredOrSoon.map((r) => (
              <li
                key={r.deviceId}
                className="flex items-center justify-between border-b border-border/40 pb-1.5 last:border-0"
              >
                <span className="text-foreground tracking-wide truncate max-w-[16rem]">
                  {r.deviceName}
                  {r.uniqueId && (
                    <span className="text-muted-foreground tracking-[0.14em] ms-2 text-[10px] uppercase">
                      {r.uniqueId}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    'tabular-nums tracking-wider font-semibold',
                    r.snapshot.status === 'expired'
                      ? 'text-destructive cyber-glow-alert'
                      : 'text-[var(--color-warning)]',
                  )}
                >
                  {formatKirCountdown(r.snapshot.daysUntilDue)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLoading && expiredOrSoon.length === 0 && (
        <div className="relative cyber-label">{t('sharedLoading')}</div>
      )}
    </div>
  );
}

function OdolPanel() {
  const { t } = useTranslation();
  // Brief view doesn't drive cargo input — we surface the *configuration*
  // state (how many vehicles have JBI set) and link out to the dispatcher
  // tool. Real per-trip cargo lives on the OdolPage.
  const { summary, isLoading } = useFleetOdolQuery();

  const unconfigured = summary.counts.unknown;
  const badge = unconfigured > 0 ? `${unconfigured} ${t('briefMissingJbi')}` : t('briefAllConfigured');
  const badgeTone: 'primary' | 'warning' = unconfigured > 0 ? 'warning' : 'primary';

  return (
    <div className="depth-elevated-shallow relative flex flex-col gap-3 p-4">
      <span className="pointer-events-none absolute inset-0 depth-toplight" aria-hidden />
      <div className="relative">
        <BriefHeader
          label={t('complianceOdol')}
          badge={badge}
          badgeTone={badgeTone}
          to="/compliance/odol"
        />
      </div>

      <div className="relative grid grid-cols-3 gap-2">
        <div>
          <div className="cyber-label text-[9px]">{t('odolConfigured')}</div>
          <div className="font-mono text-lg font-bold tabular-nums text-primary">
            {summary.configured}
            <span className="text-muted-foreground"> / {summary.total}</span>
          </div>
          <div className="font-mono text-[10px] text-muted-foreground tracking-wider">
            {t('odolHaveJbi')}
          </div>
        </div>
        <div>
          <div className="cyber-label text-[9px]">{t('briefOdolTitle')}</div>
          <div className="font-mono text-[11px] text-foreground tracking-wide leading-snug">
            {t('briefOdolReady')}
          </div>
        </div>
        <div>
          <div className="cyber-label text-[9px]">{t('briefOdolEnforcement')}</div>
          <div className="font-mono text-[11px] text-[var(--color-warning)] tracking-wide">
            {t('briefOdolWindow')}
          </div>
        </div>
      </div>

      {unconfigured > 0 && (
        <div className="relative border-t border-border pt-3">
          <div className="cyber-label text-[9px] mb-2">{t('briefAttention')}</div>
          <div className="font-mono text-[11px] text-foreground tracking-wide leading-snug">
            {t('briefOdolMissing', { count: unconfigured })}
            <Link
              to="/settings/devices"
              className="ms-2 text-primary cyber-glow hover:underline"
            >
              {t('briefOpenDevices')} →
            </Link>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="relative cyber-label">{t('sharedLoading')}</div>
      )}
    </div>
  );
}

function B40Panel() {
  const { t } = useTranslation();
  const { rows, summary, isLoading } = useFleetB40Query();

  // Worst-first: overdue then due-soon, sorted by the binding axis.
  const attention = useMemo<B40Row[]>(
    () =>
      rows
        .filter((r) => r.snapshot.status === 'overdue' || r.snapshot.status === 'due-soon')
        .sort((a, b) => {
          const aOrder = a.snapshot.status === 'overdue' ? 0 : 1;
          const bOrder = b.snapshot.status === 'overdue' ? 0 : 1;
          if (aOrder !== bOrder) return aOrder - bOrder;
          const ak =
            a.snapshot.axis === 'km'
              ? (a.snapshot.kmUntilDue ?? 0)
              : (a.snapshot.daysUntilDue ?? 0);
          const bk =
            b.snapshot.axis === 'km'
              ? (b.snapshot.kmUntilDue ?? 0)
              : (b.snapshot.daysUntilDue ?? 0);
          return ak - bk;
        })
        .slice(0, 5),
    [rows],
  );

  let badge = '';
  let badgeTone: 'primary' | 'warning' | 'alert' = 'primary';
  if (summary.counts.overdue > 0) {
    badge = `${summary.counts.overdue} ${t('briefOverdue')}`;
    badgeTone = 'alert';
  } else if (summary.counts['due-soon'] > 0) {
    badge = `${summary.counts['due-soon']} ${t('briefDueSoon')}`;
    badgeTone = 'warning';
  } else if (summary.counts.unknown === summary.total && summary.total > 0) {
    badge = t('briefUnconfigured');
    badgeTone = 'warning';
  } else {
    badge = t('briefAllValid');
  }

  return (
    <div className="depth-elevated-shallow relative flex flex-col gap-3 p-4">
      <span className="pointer-events-none absolute inset-0 depth-toplight" aria-hidden />
      <div className="relative">
        <BriefHeader
          label={t('complianceB40')}
          badge={badge}
          badgeTone={badgeTone}
          to="/compliance/b40"
        />
      </div>

      <div className="relative grid grid-cols-3 gap-2">
        <div>
          <div className="cyber-label text-[9px]">{t('b40StatusValid')}</div>
          <div className="font-mono text-lg font-bold tabular-nums text-primary">
            {summary.counts.valid}
          </div>
        </div>
        <div>
          <div className="cyber-label text-[9px]">{t('b40StatusDueSoon')}</div>
          <div
            className={cn(
              'font-mono text-lg font-bold tabular-nums',
              summary.counts['due-soon'] > 0
                ? 'text-[var(--color-warning)]'
                : 'text-muted-foreground',
            )}
          >
            {summary.counts['due-soon']}
          </div>
        </div>
        <div>
          <div className="cyber-label text-[9px]">{t('b40StatusOverdue')}</div>
          <div
            className={cn(
              'font-mono text-lg font-bold tabular-nums',
              summary.counts.overdue > 0
                ? 'text-destructive cyber-glow-alert'
                : 'text-muted-foreground',
            )}
          >
            {summary.counts.overdue}
          </div>
        </div>
      </div>

      {attention.length > 0 && (
        <div className="relative border-t border-border pt-3">
          <div className="cyber-label text-[9px] mb-2">{t('briefAttention')}</div>
          <ul className="flex flex-col gap-1.5 font-mono text-xs">
            {attention.map((r) => {
              const value =
                r.snapshot.axis === 'km' ? r.snapshot.kmUntilDue : r.snapshot.daysUntilDue;
              const axis = r.snapshot.axis === 'time' ? 'time' : 'km';
              return (
                <li
                  key={r.deviceId}
                  className="flex items-center justify-between border-b border-border/40 pb-1.5 last:border-0"
                >
                  <span className="text-foreground tracking-wide truncate max-w-[16rem]">
                    {r.deviceName}
                    {r.uniqueId && (
                      <span className="text-muted-foreground tracking-[0.14em] ms-2 text-[10px] uppercase">
                        {r.uniqueId}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      'tabular-nums tracking-wider font-semibold',
                      r.snapshot.status === 'overdue'
                        ? 'text-destructive cyber-glow-alert'
                        : 'text-[var(--color-warning)]',
                    )}
                  >
                    {formatB40Countdown(value, axis)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {isLoading && attention.length === 0 && (
        <div className="relative cyber-label">{t('sharedLoading')}</div>
      )}
    </div>
  );
}

function UpcomingPanel() {
  const { t } = useTranslation();
  // Roadmap items still queued — render as recessed tiles. Each item is
  // a real Indonesia regulation surfaced by the May 2026 research.
  const upcoming: { key: string; titleKey: string; descKey: string }[] = [
    { key: 'halal', titleKey: 'briefHalalTitle', descKey: 'briefHalalDesc' },
    { key: 'banjir', titleKey: 'briefBanjirTitle', descKey: 'briefBanjirDesc' },
  ];
  return (
    <div className="depth-recessed-shallow relative flex flex-col gap-3 p-4">
      <div className="cyber-label flex items-center gap-2 border-b border-border pb-2">
        <span className="text-primary">//</span> {t('briefUpcomingTitle')}
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {upcoming.map((u) => (
          <div
            key={u.key}
            className="border border-border bg-background/40 p-3 flex flex-col gap-1"
          >
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80">
              {t(u.titleKey)}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground tracking-wider leading-snug">
              {t(u.descKey)}
            </span>
            <span className="cyber-label text-[9px] text-primary/70 mt-1">
              · roadmap
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ComplianceBriefPage() {
  const { t } = useTranslation();
  const now = dayjs();

  return (
    <ComplianceLayout titleKey="complianceMorningBrief">
      <div className="p-5">
        {/* Brief masthead */}
        <div className="relative border-y border-border bg-card/40 p-4 mb-5">
          <span className="pointer-events-none absolute inset-0 depth-toplight" aria-hidden />
          <div className="relative flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="cyber-label cyber-text-bright text-[10px]">
                // DISPATCHER MORNING BRIEF · INDONESIA
              </span>
              <span className="font-mono text-[11px] text-muted-foreground tracking-wider">
                <Badge variant="moving" size="sm" bracketed>
                  LIVE
                </Badge>
                <span className="ms-3">
                  {now.format('dddd · D MMMM YYYY').toUpperCase()} · {now.format('HH:mm')} WIB
                </span>
              </span>
            </div>
            <div className="font-mono text-[10px] text-muted-foreground tracking-wider max-w-md text-right">
              {t('briefSubtitle')}
            </div>
          </div>
        </div>

        {/* Active modules: Fuel Quota · KIR · ODOL · B40 */}
        <div className="grid gap-4 lg:grid-cols-2">
          <FuelQuotaPanel />
          <KirPanel />
          <OdolPanel />
          <B40Panel />
        </div>

        {/* Upcoming compliance modules */}
        <div className="mt-4">
          <UpcomingPanel />
        </div>
      </div>
    </ComplianceLayout>
  );
}
