import { parse } from 'wellknown';
import { circle as turfCircle } from '@turf/circle';
import type { GeoJSON, Geometry, Position as GeoPosition } from 'geojson';
import type maplibregl from 'maplibre-gl';
import type { Geofence } from '@/entities/geofence';

type Coordinates = GeoPosition | GeoPosition[] | GeoPosition[][] | GeoPosition[][][];

/** Recursively swaps [a,b] pairs (lat/lng <-> lng/lat) for WKT <-> GeoJSON. */
export function reverseCoordinates(input: Coordinates): Coordinates {
  if (Array.isArray(input)) {
    if (input.length === 2 && typeof input[0] === 'number' && typeof input[1] === 'number') {
      return [input[1] as number, input[0] as number];
    }
    return (input as GeoPosition[]).map((item) => reverseCoordinates(item)) as Coordinates;
  }
  return input;
}

export interface GeofenceFeature {
  id: number;
  type: 'Feature';
  geometry: Geometry;
  properties: {
    name: string;
    color: string;
    width: number;
    opacity: number;
  };
}

/** Converts a geofence (WKT `area`) into a styled GeoJSON feature. */
export function geofenceToFeature(geofence: Geofence, fallbackColor: string): GeofenceFeature {
  let geometry: Geometry;
  if (geofence.area && geofence.area.indexOf('CIRCLE') > -1) {
    const parts = geofence.area
      .replace(/CIRCLE|\(|\)|,/g, ' ')
      .trim()
      .split(/ +/);
    const polygon = turfCircle([Number(parts[1]), Number(parts[0])], Number(parts[2]), {
      steps: 32,
      units: 'meters',
    });
    geometry = polygon.geometry;
  } else {
    const parsed = parse(geofence.area ?? '') as Geometry;
    geometry = {
      ...parsed,
      coordinates: reverseCoordinates((parsed as { coordinates: Coordinates }).coordinates),
    } as Geometry;
  }
  const attributes = geofence.attributes;
  return {
    id: geofence.id as number,
    type: 'Feature',
    geometry,
    properties: {
      name: geofence.name ?? '',
      color: (attributes.color as string) || fallbackColor,
      width: (attributes.mapLineWidth as number) || 2,
      opacity: (attributes.mapLineOpacity as number) || 1,
    },
  };
}

/** Picks a font stack compatible with the active style's glyph endpoint. */
export function findFonts(map: maplibregl.Map): string[] {
  const glyphs = map.getStyle().glyphs ?? '';
  if (glyphs.startsWith('https://tiles.openfreemap.org')) {
    return ['Noto Sans Regular'];
  }
  return ['Open Sans Regular', 'Arial Unicode MS Regular'];
}

export type { GeoJSON };
