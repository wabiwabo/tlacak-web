import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsMenu } from './SettingsMenu';

interface SettingsLayoutProps {
  /** Translation key for the page heading. */
  titleKey: string;
  /** Optional toolbar rendered to the right of the heading. */
  toolbar?: ReactNode;
  children: ReactNode;
}

export function SettingsLayout({ titleKey, toolbar, children }: SettingsLayoutProps) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full min-h-0 bg-background">
      <aside className="hidden w-60 shrink-0 overflow-y-auto border-e border-border bg-card/60 cyber-grid md:block">
        <SettingsMenu />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative flex items-center justify-between gap-3 border-b border-border bg-card/40 px-5 py-4">
          <span
            className="pointer-events-none absolute inset-0 depth-toplight"
            aria-hidden
          />
          <div className="relative flex flex-col gap-0.5">
            <span className="cyber-label flex items-center gap-1">
              <span className="text-primary">//</span> SETTINGS
            </span>
            <h1 className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-foreground">
              {t(titleKey)}
            </h1>
          </div>
          {toolbar && <div className="relative">{toolbar}</div>}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
