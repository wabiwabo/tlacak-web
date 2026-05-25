import { describe, expect, it } from 'vitest';
import { normalizeReports, normalizeFloods, PETABENCANA_ATTRIBUTION } from '../petabencana';

const NOW = new Date('2026-05-24T12:00:00Z');

const REPORT_FEATURE = {
  type: 'Feature' as const,
  properties: {
    pkey: 'r-123',
    disaster_type: 'flood',
    created_at: '2026-05-24T11:30:00Z',
    report_data: { flood_depth: 80 },
    text: 'Air sebetis di depan kantor',
  },
  geometry: { type: 'Point' as const, coordinates: [106.8456, -6.2088] },
};

const NON_FLOOD_FEATURE = {
  ...REPORT_FEATURE,
  properties: { ...REPORT_FEATURE.properties, pkey: 'r-124', disaster_type: 'haze' },
};

const POLYGON_FEATURE = {
  type: 'Feature' as const,
  properties: {
    area_id: 3171010001,
    parent_name: 'Jakarta Pusat',
    area_name: 'Gambir',
    state: 3,
    last_updated: '2026-05-24T11:45:00Z',
  },
  geometry: {
    type: 'Polygon' as const,
    coordinates: [[[106.82, -6.18], [106.83, -6.18], [106.83, -6.17], [106.82, -6.17], [106.82, -6.18]]],
  },
};

describe('normalizeReports', () => {
  it('returns an empty array for an empty FeatureCollection', () => {
    expect(normalizeReports({ type: 'FeatureCollection', features: [] })).toEqual([]);
  });

  it('drops non-flood disaster types', () => {
    const out = normalizeReports({ type: 'FeatureCollection', features: [NON_FLOOD_FEATURE] });
    expect(out).toEqual([]);
  });

  it('maps a flood point report to a FloodFeature', () => {
    const [feature] = normalizeReports({ type: 'FeatureCollection', features: [REPORT_FEATURE] });
    expect(feature).toMatchObject({
      id: 'r-r-123',
      kind: 'report',
      source: 'petabencana',
      depthCm: 80,
      reportedAt: '2026-05-24T11:30:00Z',
      attribution: PETABENCANA_ATTRIBUTION,
    });
    expect(feature!.geometry).toEqual(REPORT_FEATURE.geometry);
  });

  it('classifies depth-based severity (≤30 minor, ≤70 moderate, ≤150 severe, >150 extreme)', () => {
    const at = (depth: number) =>
      normalizeReports({
        type: 'FeatureCollection',
        features: [{ ...REPORT_FEATURE, properties: { ...REPORT_FEATURE.properties, pkey: `r-${depth}`, report_data: { flood_depth: depth } } }],
      })[0]!.severity;
    expect(at(10)).toBe('minor');
    expect(at(30)).toBe('minor');
    expect(at(31)).toBe('moderate');
    expect(at(70)).toBe('moderate');
    expect(at(71)).toBe('severe');
    expect(at(150)).toBe('severe');
    expect(at(151)).toBe('extreme');
    expect(at(400)).toBe('extreme');
  });

  it('returns null depthCm + minor severity when flood_depth is missing', () => {
    const [feature] = normalizeReports({
      type: 'FeatureCollection',
      features: [{ ...REPORT_FEATURE, properties: { ...REPORT_FEATURE.properties, report_data: {} } }],
    });
    expect(feature!.depthCm).toBeNull();
    expect(feature!.severity).toBe('minor');
  });

  it('skips features whose geometry is missing or malformed', () => {
    const malformed = { ...REPORT_FEATURE, geometry: null as unknown as typeof REPORT_FEATURE.geometry };
    const out = normalizeReports({ type: 'FeatureCollection', features: [malformed, REPORT_FEATURE] });
    expect(out).toHaveLength(1);
    expect(out[0]!.id).toBe('r-r-123');
  });

  it('preserves the raw report text in meta for the hover tooltip', () => {
    const [feature] = normalizeReports({ type: 'FeatureCollection', features: [REPORT_FEATURE] });
    expect(feature!.meta?.text).toBe('Air sebetis di depan kantor');
  });

  it('treats `now` as injectable so we can compute age-based filters later', () => {
    // Sanity: function takes a `now` parameter; we don't filter on it yet
    // but the signature must accept it so future "drop stale" logic doesn't
    // require an API break.
    expect(normalizeReports({ type: 'FeatureCollection', features: [REPORT_FEATURE] }, NOW)).toHaveLength(1);
  });
});

describe('normalizeFloods', () => {
  it('maps a Jakarta kelurahan polygon to a FloodFeature', () => {
    const [feature] = normalizeFloods({ type: 'FeatureCollection', features: [POLYGON_FEATURE] });
    expect(feature).toMatchObject({
      id: 'p-3171010001',
      kind: 'polygon',
      severity: 'severe',
      source: 'petabencana',
      depthCm: null,
      reportedAt: '2026-05-24T11:45:00Z',
    });
    expect(feature!.geometry).toEqual(POLYGON_FEATURE.geometry);
    expect(feature!.meta?.kelurahan).toBe('Gambir');
  });

  it('classifies state 1-4 → minor/moderate/severe/extreme', () => {
    const stateOf = (state: number) =>
      normalizeFloods({
        type: 'FeatureCollection',
        features: [{ ...POLYGON_FEATURE, properties: { ...POLYGON_FEATURE.properties, area_id: state, state } }],
      })[0]!.severity;
    expect(stateOf(1)).toBe('minor');
    expect(stateOf(2)).toBe('moderate');
    expect(stateOf(3)).toBe('severe');
    expect(stateOf(4)).toBe('extreme');
  });

  it('skips polygons with unknown state', () => {
    const [feature] = normalizeFloods({
      type: 'FeatureCollection',
      features: [{ ...POLYGON_FEATURE, properties: { ...POLYGON_FEATURE.properties, state: 99 } }],
    });
    expect(feature).toBeUndefined();
  });
});
