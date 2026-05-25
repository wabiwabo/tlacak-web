/**
 * useExposedVehicles — joins live vehicle positions against the active
 * flood snapshot and surfaces every vehicle either inside a polygon or
 * within EXPOSURE_BUFFER_KM kilometres of a flood report point.
 *
 * `computeExposedVehicles` is pure (testable without React); the hook
 * wraps it with the live position store from the main feature.
 */

import { useMemo } from 'react';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point as turfPoint } from '@turf/helpers';
import turfDistance from '@turf/distance';
import type { Polygon, MultiPolygon } from 'geojson';
import { useLiveStore } from '@/features/main/model/live-store';
import type { Position } from '@/entities/position';
import type { FloodFeature, FloodSeverity } from './types';

/** Vehicles within this many kilometres of a flood point report are
 *  surfaced even if they are technically outside any polygon — the
 *  point reports are sparse, so a buffer keeps the signal honest. */
export const EXPOSURE_BUFFER_KM = 2;

const SEVERITY_RANK: Record<FloodSeverity, number> = {
  minor: 1,
  moderate: 2,
  severe: 3,
  extreme: 4,
};

export interface ExposureMatch {
  /** id of the matched FloodFeature. */
  id: string;
  severity: FloodSeverity;
  /** 0 when the vehicle is inside a polygon, > 0 when it matched a
   *  point report by buffer distance. */
  withinBufferKm: number;
}

export interface ExposedVehicle {
  deviceId: number;
  matched: ExposureMatch[];
  worstSeverity: FloodSeverity;
}

function isPolygonish(geom: FloodFeature['geometry']): geom is Polygon | MultiPolygon {
  return geom.type === 'Polygon' || geom.type === 'MultiPolygon';
}

function isPoint(geom: FloodFeature['geometry']): boolean {
  return geom.type === 'Point';
}

/** Pure join — exposed for direct testing. */
export function computeExposedVehicles(
  positions: Position[],
  features: FloodFeature[],
): ExposedVehicle[] {
  if (features.length === 0 || positions.length === 0) return [];
  const exposed: ExposedVehicle[] = [];

  for (const position of positions) {
    const lng = position.longitude as number | undefined;
    const lat = position.latitude as number | undefined;
    if (typeof lng !== 'number' || typeof lat !== 'number') continue;
    const here = turfPoint([lng, lat]);

    const matched: ExposureMatch[] = [];
    let worstRank = 0;
    let worstSeverity: FloodSeverity = 'minor';

    for (const feature of features) {
      let hit = false;
      let withinKm = 0;
      if (isPolygonish(feature.geometry)) {
        hit = booleanPointInPolygon(here, feature.geometry);
      } else if (isPoint(feature.geometry)) {
        const reportPoint = turfPoint(
          (feature.geometry as { coordinates: number[] }).coordinates as [number, number],
        );
        const km = turfDistance(here, reportPoint, { units: 'kilometers' });
        if (km <= EXPOSURE_BUFFER_KM) {
          hit = true;
          withinKm = km;
        }
      }
      if (!hit) continue;
      matched.push({ id: feature.id, severity: feature.severity, withinBufferKm: withinKm });
      if (SEVERITY_RANK[feature.severity] > worstRank) {
        worstRank = SEVERITY_RANK[feature.severity];
        worstSeverity = feature.severity;
      }
    }

    if (matched.length > 0) {
      exposed.push({
        deviceId: position.deviceId as number,
        matched,
        worstSeverity,
      });
    }
  }

  return exposed;
}

export function useExposedVehicles(features: FloodFeature[]): ExposedVehicle[] {
  const positions = useLiveStore((state) => state.positions);
  return useMemo(
    () => computeExposedVehicles(Object.values(positions), features),
    [positions, features],
  );
}
