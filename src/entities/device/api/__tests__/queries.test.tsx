import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDevicesQuery } from '../queries';
import { apiClient } from '@/shared/api/client';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => vi.restoreAllMocks());

describe('useDevicesQuery', () => {
  it('returns the device list from GET /devices', async () => {
    vi.spyOn(apiClient, 'GET').mockResolvedValue({
      data: [{ id: 1, name: 'Truck A', attributes: {} }],
    } as never);
    const { result } = renderHook(() => useDevicesQuery(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.name).toBe('Truck A');
  });
});
