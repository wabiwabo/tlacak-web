import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ChartReportPage from '../ChartReportPage';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })),
  );
});

describe('ChartReportPage', () => {
  it('shows the no-data message before a report is run', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ChartReportPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});
