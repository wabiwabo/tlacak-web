import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/shared/lib/ErrorBoundary';
import { ThemeProvider } from '@/shared/lib/theme/ThemeProvider';
import { createQueryClient } from '@/shared/api/query-client';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
