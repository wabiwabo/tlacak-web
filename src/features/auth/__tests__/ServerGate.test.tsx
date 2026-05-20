import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServerGate } from '../ServerGate';

function renderGate() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ServerGate>
        <div>app body</div>
      </ServerGate>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ServerGate', () => {
  it('renders children once the server config loads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1, attributes: {} }) }),
    );
    renderGate();
    expect(await screen.findByText('app body')).toBeInTheDocument();
  });

  it('renders an error with a retry button when the server config fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, text: async () => 'Server unreachable' }),
    );
    renderGate();
    expect(await screen.findByText('Server unreachable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
