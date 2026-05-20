import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/shared/lib/ErrorBoundary';
import { ThemeProvider } from '@/shared/lib/theme/ThemeProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>{children}</ThemeProvider>
    </ErrorBoundary>
  );
}
