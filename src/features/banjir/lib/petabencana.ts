/**
 * PetaBencana.id GeoJSON normalizers.
 *
 * /reports?disaster=flood&geoformat=geojson — national point reports
 *   with operator-supplied flood_depth (cm). 3-hour default window.
 * /floods?admin=ID-JK&minimum_state=2&geoformat=geojson — Jakarta
 *   kelurahan polygons with a 1-4 severity state.
 *
 * Both feeds collapse into the shared FloodFeature shape. Pure functions
 * — no fetch, no time reads except via the injected `now` parameter.
 *
 * Verified live 2026-05-24 with CORS open (access-control-allow-origin: *).
 * License: CC-BY-style attribution — render PETABENCANA_ATTRIBUTION verbatim.
 */

import type { Feature, FeatureCollection, FloodFeature, FloodSeverity } from './types';

export const PETABENCANA_ATTRIBUTION = 'PetaBencana.id (CC-BY)';

const REPORT_SEVERITY_THRESHOLDS: [number, FloodSeverity][] = [
  [30, 'minor'],
  [70, 'moderate'],
  [150, 'severe'],
];

const STATE_SEVERITY: Record<number, FloodSeverity> = {
  1: 'minor',
  2: 'moderate',
  3: 'severe',
  4: 'extreme',
};

function classifyDepth(depthCm: number | null): FloodSeverity {
  if (depthCm === null) return 'minor';
  for (const [cap, severity] of REPORT_SEVERITY_THRESHOLDS) {
    if (depthCm <= cap) return severity;
  }
  return 'extreme';
}

function isFeature(value: unknown): value is Feature {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === 'Feature'
  );
}

interface ReportProps {
  pkey?: string | number;
  disaster_type?: string;
  created_at?: string;
  report_data?: { flood_depth?: number };
  text?: string;
  [key: string]: unknown;
}

interface FloodPolygonProps {
  area_id?: string | number;
  area_name?: string;
  parent_name?: string;
  state?: number;
  last_updated?: string;
  [key: string]: unknown;
}

/** Map PetaBencana /reports → FloodFeature[]. `now` is reserved for
 *  future age-based filtering (e.g. dropping reports older than 6 h)
 *  and is currently unused. */
export function normalizeReports(
  fc: FeatureCollection,
  _now: Date = new Date(),
): FloodFeature[] {
  const out: FloodFeature[] = [];
  for (const feature of fc.features) {
    if (!isFeature(feature) || !feature.geometry) continue;
    const props = (feature.properties ?? {}) as ReportProps;
    if (props.disaster_type !== 'flood') continue;
    const id = props.pkey !== undefined ? `r-${String(props.pkey)}` : `r-${out.length}`;
    const depthRaw = props.report_data?.flood_depth;
    const depthCm =
      typeof depthRaw === 'number' && Number.isFinite(depthRaw) ? depthRaw : null;
    out.push({
      id,
      kind: 'report',
      severity: classifyDepth(depthCm),
      geometry: feature.geometry,
      depthCm,
      reportedAt: props.created_at ?? new Date(0).toISOString(),
      source: 'petabencana',
      attribution: PETABENCANA_ATTRIBUTION,
      meta: { text: props.text },
    });
  }
  return out;
}

/** Map PetaBencana /floods (Jakarta polygons) → FloodFeature[]. */
export function normalizeFloods(fc: FeatureCollection): FloodFeature[] {
  const out: FloodFeature[] = [];
  for (const feature of fc.features) {
    if (!isFeature(feature) || !feature.geometry) continue;
    const props = (feature.properties ?? {}) as FloodPolygonProps;
    const state = typeof props.state === 'number' ? props.state : 0;
    const severity = STATE_SEVERITY[state];
    if (!severity) continue;
    out.push({
      id: `p-${String(props.area_id ?? out.length)}`,
      kind: 'polygon',
      severity,
      geometry: feature.geometry,
      depthCm: null,
      reportedAt: props.last_updated ?? new Date(0).toISOString(),
      source: 'petabencana',
      attribution: PETABENCANA_ATTRIBUTION,
      meta: { kelurahan: props.area_name, kota: props.parent_name, state },
    });
  }
  return out;
}
