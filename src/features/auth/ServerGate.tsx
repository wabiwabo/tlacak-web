import type { ReactNode } from 'react';
import { useServerQuery } from '@/entities/session';
import { useDocumentLoader } from '@/shared/lib/use-document-loader';
import { Button } from '@/shared/ui';
import { useTranslation } from 'react-i18next';

function ServerLoader() {
  useDocumentLoader();
  return null;
}

export function ServerGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { data, error, isPending, refetch } = useServerQuery();

  if (isPending) {
    return <ServerLoader />;
  }
  if (error || !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-row">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : t('errorGeneral')}
        </p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          {t('sharedRetry', 'Retry')}
        </Button>
      </div>
    );
  }
  return children;
}
