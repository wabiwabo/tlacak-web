import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/shared/lib/ErrorBoundary';
import { ThemeProvider } from '@/shared/lib/theme/ThemeProvider';
import { createQueryClient } from '@/shared/api/query-client';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { ErrorToaster } from '@/shared/ui';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <I18nProvider>
            {children}
            <ErrorToaster />
          </I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
