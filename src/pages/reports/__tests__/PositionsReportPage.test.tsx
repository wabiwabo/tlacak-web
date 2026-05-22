import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import PositionsReportPage from '../PositionsReportPage';

vi.mock('@/map', () => ({
  MapView: ({ children }: { children: unknown }) => children,
  MapRoutePath: () => null,
  MapDefaultCamera: () => null,
}));

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })),
  );
});

describe('PositionsReportPage', () => {
  it('disables Show until a single device is chosen', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <PositionsReportPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByRole('button', { name: /show/i })).toBeDisabled();
  });
});
