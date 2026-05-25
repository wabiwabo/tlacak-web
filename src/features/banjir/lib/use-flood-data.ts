/**
 * useFloodData — composes three independent flood feeds into a single
 * FloodSnapshot for the map and brief panel.
 *
 *   reportsQuery  — PetaBencana /reports (national, 3 h window) @ 3 min
 *   floodsQuery   — PetaBencana /floods (Jakarta polygons)      @ 5 min
 *   nowcastQuery  — BMKG nowcast RSS index                       @ 10 min
 *
 * Each query is independent — a failing source doesn't kill the others.
 * The composite snapshot exposes per-source slices and a `stale` flag.
 *
 * The hook deliberately keeps the BMKG path lightweight (RSS index only —
 * no per-item CAP fetch on every poll) so the cross-origin chatter stays
 * cheap. The first iteration treats every flood-related RSS item as a
 * single warning marker placed at the lat/lng nothing — the CAP polygon
 * fetch is the future enrichment.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { normalizeReports, normalizeFloods } from './petabencana';
import {
  parseNowcastIndex,
  BMKG_ATTRIBUTION,
  type NowcastIndexItem,
} from './bmkg-nowcast';
import type {
  FloodFeature,
  FloodSeverity,
  FloodSnapshot,
  FloodSource,
} from './types';

const REPORTS_URL =
  'https://api.petabencana.id/reports?disaster=flood&geoformat=geojson&timeperiod=10800';
const FLOODS_URL =
  'https://data.petabencana.id/floods?admin=ID-JK&minimum_state=2&geoformat=geojson';
const NOWCAST_URL = 'https://www.bmkg.go.id/alerts/nowcast/id';

const REPORTS_INTERVAL_MS = 3 * 60 * 1000;
const FLOODS_INTERVAL_MS = 5 * 60 * 1000;
const NOWCAST_INTERVAL_MS = 10 * 60 * 1000;
const STALE_MULTIPLIER = 2;

const EMPTY_SEVERITY: Record<FloodSeverity, number> = {
  minor: 0,
  moderate: 0,
  severe: 0,
  extreme: 0,
};

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

/** Render each flood-related RSS item as a marker. Polygons land on a
 *  future enrichment pass that fetches the CAP detail per item. */
function nowcastItemsToFeatures(items: NowcastIndexItem[]): FloodFeature[] {
  return items.map((item) => ({
    id: `b-${item.id}`,
    kind: 'warning' as const,
    severity: 'moderate' as const,
    // BMKG nowcast RSS does not include coordinates — the consumer
    // page surfaces these as a list, not on the map, until the CAP
    // enrichment lands.
    geometry: { type: 'Point', coordinates: [0, 0] },
    depthCm: null,
    reportedAt: item.publishedAt,
    source: 'bmkg' as const,
    attribution: BMKG_ATTRIBUTION,
    meta: { title: item.title, url: item.url },
  }));
}

export interface UseFloodDataReturn {
  snapshot: FloodSnapshot;
  reportsError: unknown;
  floodsError: unknown;
  nowcastError: unknown;
  isLoading: boolean;
  isFetching: boolean;
}

/** `now` is injectable for deterministic stale-flag tests. */
export function useFloodData(now: Date = new Date()): UseFloodDataReturn {
  const reportsQuery = useQuery({
    queryKey: ['banjir', 'reports'],
    queryFn: () => fetchJson(REPORTS_URL),
    staleTime: REPORTS_INTERVAL_MS,
    refetchInterval: REPORTS_INTERVAL_MS,
  });
  const floodsQuery = useQuery({
    queryKey: ['banjir', 'floods'],
    queryFn: () => fetchJson(FLOODS_URL),
    staleTime: FLOODS_INTERVAL_MS,
    refetchInterval: FLOODS_INTERVAL_MS,
  });
  const nowcastQuery = useQuery({
    queryKey: ['banjir', 'nowcast'],
    queryFn: () => fetchText(NOWCAST_URL),
    staleTime: NOWCAST_INTERVAL_MS,
    refetchInterval: NOWCAST_INTERVAL_MS,
  });

  const snapshot = useMemo<FloodSnapshot>(() => {
    const reports = reportsQuery.data
      ? normalizeReports(reportsQuery.data as Parameters<typeof normalizeReports>[0])
      : [];
    const floods = floodsQuery.data
      ? normalizeFloods(floodsQuery.data as Parameters<typeof normalizeFloods>[0])
      : [];
    const nowcast = nowcastQuery.data
      ? nowcastItemsToFeatures(parseNowcastIndex(nowcastQuery.data as string))
      : [];
    const features = [...reports, ...floods, ...nowcast];

    const bySource: Record<FloodSource, FloodFeature[]> = {
      petabencana: [...reports, ...floods],
      bmkg: nowcast,
    };

    const bySeverity = { ...EMPTY_SEVERITY };
    for (const f of features) bySeverity[f.severity] += 1;

    const updates = [
      reportsQuery.dataUpdatedAt,
      floodsQuery.dataUpdatedAt,
      nowcastQuery.dataUpdatedAt,
    ].filter((t) => t > 0);
    const newestMs = updates.length ? Math.max(...updates) : 0;
    const updatedAt = newestMs ? new Date(newestMs).toISOString() : '';

    const intervalMaxMs =
      Math.max(REPORTS_INTERVAL_MS, FLOODS_INTERVAL_MS, NOWCAST_INTERVAL_MS) *
      STALE_MULTIPLIER;
    const stale = newestMs > 0 && now.getTime() - newestMs > intervalMaxMs;

    return { features, bySource, bySeverity, updatedAt, stale };
  }, [
    reportsQuery.data,
    floodsQuery.data,
    nowcastQuery.data,
    reportsQuery.dataUpdatedAt,
    floodsQuery.dataUpdatedAt,
    nowcastQuery.dataUpdatedAt,
    now,
  ]);

  return {
    snapshot,
    reportsError: reportsQuery.error,
    floodsError: floodsQuery.error,
    nowcastError: nowcastQuery.error,
    isLoading: reportsQuery.isLoading || floodsQuery.isLoading || nowcastQuery.isLoading,
    isFetching:
      reportsQuery.isFetching || floodsQuery.isFetching || nowcastQuery.isFetching,
  };
}
