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
  /** RT-level identifier in the real API (e.g. "RT 013"). */
  area_name?: string;
  /** Kelurahan name (e.g. "LUBANG BUAYA"). */
  parent_name?: string;
  /** Kecamatan name (e.g. "CIPAYUNG"). */
  city_name?: string;
  state?: number;
  last_updated?: string;
  [key: string]: unknown;
}

/** Defensive feature-list extraction. The PetaBencana API sometimes
 *  wraps GeoJSON in a `{statusCode, result}` envelope (the fetch
 *  helper unwraps it), and other consumers may pass a raw
 *  FeatureCollection. Either way, this returns an array — empty if
 *  the shape is unexpected, so the caller never throws. */
function featuresOf(fc: unknown): Feature[] {
  if (!fc || typeof fc !== 'object') return [];
  const features = (fc as { features?: unknown }).features;
  return Array.isArray(features) ? (features as Feature[]) : [];
}

/** Map PetaBencana /reports → FloodFeature[]. `now` is reserved for
 *  future age-based filtering (e.g. dropping reports older than 6 h)
 *  and is currently unused. */
export function normalizeReports(
  fc: FeatureCollection | unknown,
  _now: Date = new Date(),
): FloodFeature[] {
  const out: FloodFeature[] = [];
  for (const feature of featuresOf(fc)) {
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

/** Map PetaBencana /floods (Jakarta polygons) → FloodFeature[].
 *  Real schema uses `area_name` for RT, `parent_name` for kelurahan,
 *  `city_name` for kecamatan — meta fields named accordingly. */
export function normalizeFloods(fc: FeatureCollection | unknown): FloodFeature[] {
  const out: FloodFeature[] = [];
  for (const feature of featuresOf(fc)) {
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
      meta: {
        rt: props.area_name,
        kelurahan: props.parent_name,
        kecamatan: props.city_name,
        state,
      },
    });
  }
  return out;
}
