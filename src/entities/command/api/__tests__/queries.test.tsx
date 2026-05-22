import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCommandTypesQuery } from '../queries';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => vi.unstubAllGlobals());

describe('useCommandTypesQuery', () => {
  it('requests device-scoped types when a deviceId is supplied', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify([{ type: 'engineStop' }]), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useCommandTypesQuery(7), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(String(fetchMock.mock.calls[0]![0])).toBe('/api/commands/types?deviceId=7');
  });
});
