import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';

interface ComplianceLayoutProps {
  titleKey: string;
  children: ReactNode;
}

const ENTRIES = [
  { path: '/compliance', labelKey: 'complianceMorningBrief', end: true },
  { path: '/compliance/fuel-quota', labelKey: 'complianceFuelQuota' },
  { path: '/compliance/kir', labelKey: 'complianceKir' },
  { path: '/compliance/odol', labelKey: 'complianceOdol' },
  { path: '/compliance/b40', labelKey: 'complianceB40' },
];

export function ComplianceLayout({ titleKey, children }: ComplianceLayoutProps) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full min-h-0 bg-background">
      <aside className="hidden w-56 shrink-0 overflow-y-auto border-e border-border bg-card/60 cyber-grid md:block">
        <nav className="flex flex-col py-4">
          <div className="cyber-label px-4 pb-3">// COMPLIANCE</div>
          {ENTRIES.map((entry) => (
            <NavLink
              key={entry.path}
              to={entry.path}
              end={entry.end}
              className={({ isActive }) =>
                cn(
                  'relative px-4 py-2 text-[11px] font-mono font-semibold uppercase tracking-[0.16em] transition-colors',
                  isActive
                    ? 'text-primary cyber-glow'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-y-0 start-0 w-0.5 bg-primary cyber-box-glow" />
                  )}
                  {t(entry.labelKey)}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative flex items-center gap-3 border-b border-border bg-card/40 px-5 py-4">
          <span className="pointer-events-none absolute inset-0 depth-toplight" aria-hidden />
          <div className="relative flex flex-col gap-0.5">
            <span className="cyber-label flex items-center gap-1">
              <span className="text-primary">//</span> COMPLIANCE
            </span>
            <h1 className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-foreground">
              {t(titleKey)}
            </h1>
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</div>
      </div>
    </div>
  );
}
