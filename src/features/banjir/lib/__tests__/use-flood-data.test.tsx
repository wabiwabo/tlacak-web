import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useFloodData } from '../use-flood-data';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const SAMPLE_REPORT = {
  type: 'Feature',
  properties: {
    pkey: 1,
    disaster_type: 'flood',
    created_at: '2026-05-24T11:30:00Z',
    report_data: { flood_depth: 80 },
  },
  geometry: { type: 'Point', coordinates: [106.8, -6.2] },
};

const SAMPLE_POLYGON = {
  type: 'Feature',
  properties: { area_id: 1, state: 2, last_updated: '2026-05-24T11:00:00Z' },
  geometry: {
    type: 'Polygon',
    coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
  },
};

const SAMPLE_RSS = `<?xml version="1.0"?><rss><channel></channel></rss>`;

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

function textResponse(body: string): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => body,
  } as Response;
}

afterEach(() => vi.restoreAllMocks());

describe('useFloodData', () => {
  it('composes reports + floods + nowcast into a single FloodSnapshot', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/reports')) {
        return jsonResponse({ type: 'FeatureCollection', features: [SAMPLE_REPORT] });
      }
      if (url.includes('/floods')) {
        return jsonResponse({ type: 'FeatureCollection', features: [SAMPLE_POLYGON] });
      }
      if (url.includes('nowcast')) {
        return textResponse(SAMPLE_RSS);
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const { result } = renderHook(() => useFloodData(), { wrapper });
    await waitFor(() => expect(result.current.snapshot.features.length).toBeGreaterThan(0));

    expect(fetchSpy).toHaveBeenCalled();
    expect(result.current.snapshot.bySource.petabencana).toHaveLength(2);
    expect(result.current.snapshot.bySource.bmkg).toHaveLength(0);
    expect(result.current.snapshot.bySeverity.moderate).toBe(1);
    expect(result.current.snapshot.bySeverity.severe).toBe(1);
  });

  it('keeps data from healthy sources when one source fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/reports')) {
        throw new Error('petabencana down');
      }
      if (url.includes('/floods')) {
        return jsonResponse({ type: 'FeatureCollection', features: [SAMPLE_POLYGON] });
      }
      return textResponse(SAMPLE_RSS);
    });

    const { result } = renderHook(() => useFloodData(), { wrapper });
    await waitFor(() =>
      expect(result.current.snapshot.bySource.petabencana.length).toBeGreaterThan(0),
    );
    expect(result.current.snapshot.bySource.petabencana).toHaveLength(1);
    expect(result.current.reportsError).toBeTruthy();
    expect(result.current.floodsError).toBeFalsy();
  });

  it('marks the snapshot stale when no source has refreshed in 2× its interval', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      jsonResponse({ type: 'FeatureCollection', features: [] }),
    );
    const fixedNow = new Date('2030-01-01T00:00:00Z'); // arbitrary far-future timestamp
    const { result } = renderHook(() => useFloodData(fixedNow), { wrapper });
    await waitFor(() => expect(result.current.snapshot.updatedAt).not.toBe(''));
    expect(result.current.snapshot.stale).toBe(true);
  });
});
