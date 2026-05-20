import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { QueryParamGate } from '../QueryParamGate';

function renderWithToken(token: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/?token=${token}`]}>
        <QueryParamGate>
          <div>gated content</div>
        </QueryParamGate>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('QueryParamGate', () => {
  it('calls token login endpoint and renders children when token param is present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 5, attributes: {} }) }),
    );
    renderWithToken('tok123');
    expect(await screen.findByText('gated content')).toBeInTheDocument();
    const fetchMock = vi.mocked(fetch);
    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    expect(firstCall![0] as string).toContain('/api/session?token=tok123');
  });
});
