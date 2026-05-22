import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createCrudHooks, request } from '../crud';

interface Widget {
  id?: number;
  name: string;
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const widgets = createCrudHooks<Widget>('widgets');

function mockFetch(impl: typeof fetch) {
  vi.stubGlobal('fetch', vi.fn(impl));
}

beforeEach(() => vi.unstubAllGlobals());

describe('request', () => {
  it('throws the response body text on a non-ok response', async () => {
    mockFetch(async () => new Response('Boom', { status: 400 }));
    await expect(request('/widgets')).rejects.toThrow('Boom');
  });

  it('returns undefined for a 204 response', async () => {
    mockFetch(async () => new Response(null, { status: 204 }));
    await expect(request('/widgets/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});

describe('createCrudHooks', () => {
  it('useList fetches the collection', async () => {
    mockFetch(async () => new Response(JSON.stringify([{ id: 1, name: 'A' }]), { status: 200 }));
    const { result } = renderHook(() => widgets.useList(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.name).toBe('A');
  });

  it('useSave POSTs a new item and PUTs an existing one', async () => {
    const calls: { url: string; method: string }[] = [];
    mockFetch(async (input, init) => {
      calls.push({ url: String(input), method: init?.method ?? 'GET' });
      return new Response(JSON.stringify({ id: 1, name: 'A' }), { status: 200 });
    });
    const { result } = renderHook(() => widgets.useSave(), { wrapper });
    await result.current.mutateAsync({ name: 'A' });
    await result.current.mutateAsync({ id: 1, name: 'A' });
    expect(calls[0]).toEqual({ url: '/api/widgets', method: 'POST' });
    expect(calls[1]).toEqual({ url: '/api/widgets/1', method: 'PUT' });
  });
});
