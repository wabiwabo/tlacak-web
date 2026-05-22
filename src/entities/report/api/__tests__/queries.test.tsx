import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { reportQuery, useTripsReport } from '../queries';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => vi.unstubAllGlobals());

describe('reportQuery', () => {
  it('builds repeated deviceId params', () => {
    const q = reportQuery({ deviceIds: [1, 2], groupIds: [], from: 'A', to: 'B' });
    expect(q).toBe('?from=A&to=B&deviceId=1&deviceId=2');
  });
});

describe('useTripsReport', () => {
  it('is disabled until a from/to pair is supplied', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useTripsReport(undefined), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches /reports/trips once params are provided', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => new Response(JSON.stringify([{ deviceId: 1, distance: 100 }]), { status: 200 }),
      ),
    );
    const { result } = renderHook(
      () => useTripsReport({ deviceIds: [1], groupIds: [], from: 'A', to: 'B' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});
