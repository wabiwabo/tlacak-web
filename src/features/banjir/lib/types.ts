import type { Feature, FeatureCollection, Geometry, Point } from 'geojson';

export type FloodSeverity = 'minor' | 'moderate' | 'severe' | 'extreme';
export type FloodKind = 'report' | 'polygon' | 'warning';
export type FloodSource = 'petabencana' | 'bmkg';

export interface FloodFeature {
  /** Stable across refreshes — uses upstream PK when available. */
  id: string;
  kind: FloodKind;
  severity: FloodSeverity;
  geometry: Geometry;
  /** Reported water depth in centimetres. Only on `kind: 'report'`. */
  depthCm: number | null;
  /** ISO 8601. */
  reportedAt: string;
  source: FloodSource;
  /** Verbatim string rendered in the attribution footer. */
  attribution: string;
  /** Free-form upstream fields preserved for the hover tooltip. */
  meta?: Record<string, unknown>;
}

export interface FloodSnapshot {
  features: FloodFeature[];
  bySource: Record<FloodSource, FloodFeature[]>;
  bySeverity: Record<FloodSeverity, number>;
  /** ISO 8601 of the most recent successful fetch across the three sources. */
  updatedAt: string;
  /** True when no source has refreshed within 2× its expected interval. */
  stale: boolean;
}

/** Re-export the GeoJSON aliases the parsers need without forcing each
 *  consumer to import from 'geojson' directly. */
export type { Feature, FeatureCollection, Geometry, Point };
