import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import CombinedReportPage from '../CombinedReportPage';

vi.mock('@/map', () => ({
  MapView: ({ children }: { children: unknown }) => children,
  MapRoutePath: () => null,
  MapDefaultCamera: () => null,
}));

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })),
  );
});

describe('CombinedReportPage', () => {
  it('renders the combined report filter', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <CombinedReportPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByRole('button', { name: /show/i })).toBeInTheDocument();
  });
});
