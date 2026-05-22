import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportsMenu } from './ReportsMenu';

interface ReportLayoutProps {
  /** Translation key for the page heading. */
  titleKey: string;
  children: ReactNode;
}

export function ReportLayout({ titleKey, children }: ReportLayoutProps) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full min-h-0">
      <aside className="hidden w-56 shrink-0 overflow-y-auto border-r md:block">
        <ReportsMenu />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b px-4 py-3">
          <h1 className="text-base font-semibold">{t(titleKey)}</h1>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
