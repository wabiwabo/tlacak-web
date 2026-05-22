import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ScheduledPage from '../ScheduledPage';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input) => {
      const url = String(input);
      if (url.includes('/reports')) {
        return new Response(
          JSON.stringify([{ id: 1, type: 'trips', description: 'Weekly', attributes: {} }]),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify([]), { status: 200 });
    }),
  );
});

describe('ScheduledPage', () => {
  it('lists scheduled reports', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ScheduledPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByText('Weekly')).toBeInTheDocument());
  });
});
