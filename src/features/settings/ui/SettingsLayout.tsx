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
    <div className="flex h-full min-h-0">
      <aside className="hidden w-60 shrink-0 overflow-y-auto border-r md:block">
        <SettingsMenu />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <h1 className="text-base font-semibold">{t(titleKey)}</h1>
          {toolbar}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
