import { describe, expect, it } from 'vitest';
import { computeExposedVehicles } from '../use-exposed-vehicles';
import type { FloodFeature } from '../types';
import type { Position } from '@/entities/position';

function pos(deviceId: number, lng: number, lat: number): Position {
  return {
    id: deviceId,
    deviceId,
    longitude: lng,
    latitude: lat,
    attributes: {},
  } as unknown as Position;
}

const POLYGON: FloodFeature = {
  id: 'p-1',
  kind: 'polygon',
  severity: 'severe',
  source: 'petabencana',
  depthCm: null,
  reportedAt: '2026-05-24T11:00:00Z',
  attribution: 'PetaBencana.id (CC-BY)',
  geometry: {
    type: 'Polygon',
    coordinates: [[[106.82, -6.18], [106.83, -6.18], [106.83, -6.17], [106.82, -6.17], [106.82, -6.18]]],
  },
};

const REPORT: FloodFeature = {
  id: 'r-1',
  kind: 'report',
  severity: 'moderate',
  source: 'petabencana',
  depthCm: 60,
  reportedAt: '2026-05-24T11:30:00Z',
  attribution: 'PetaBencana.id (CC-BY)',
  geometry: { type: 'Point', coordinates: [106.85, -6.2] },
};

describe('computeExposedVehicles', () => {
  it('flags a vehicle whose live position is inside a polygon', () => {
    const out = computeExposedVehicles([pos(1, 106.825, -6.175)], [POLYGON]);
    expect(out.map((e) => e.deviceId)).toEqual([1]);
    expect(out[0]!.matched[0]!.id).toBe('p-1');
    expect(out[0]!.matched[0]!.withinBufferKm).toBe(0);
  });

  it('does not flag a vehicle that is outside every polygon and beyond 2 km of every point', () => {
    const out = computeExposedVehicles([pos(2, 107.0, -6.5)], [POLYGON, REPORT]);
    expect(out).toEqual([]);
  });

  it('flags a vehicle within 2 km of a flood report point', () => {
    // 0.01° latitude ≈ 1.11 km; offset ~0.015° → ~1.66 km from the report
    const out = computeExposedVehicles([pos(3, 106.85, -6.215)], [REPORT]);
    expect(out.map((e) => e.deviceId)).toEqual([3]);
    expect(out[0]!.matched[0]!.withinBufferKm).toBeGreaterThan(0);
    expect(out[0]!.matched[0]!.withinBufferKm).toBeLessThanOrEqual(2);
  });

  it('keeps the worst severity when a vehicle is inside multiple features', () => {
    const extreme: FloodFeature = { ...POLYGON, id: 'p-2', severity: 'extreme' };
    const out = computeExposedVehicles([pos(4, 106.825, -6.175)], [POLYGON, extreme]);
    expect(out[0]!.worstSeverity).toBe('extreme');
  });

  it('returns an empty array when there are no flood features', () => {
    expect(computeExposedVehicles([pos(5, 106.825, -6.175)], [])).toEqual([]);
  });

  it('returns an empty array when there are no positions', () => {
    expect(computeExposedVehicles([], [POLYGON])).toEqual([]);
  });
});
