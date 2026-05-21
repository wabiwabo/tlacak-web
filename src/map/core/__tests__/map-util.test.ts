import { describe, expect, it } from 'vitest';
import { geofenceToFeature, reverseCoordinates } from '../map-util';
import type { Geofence } from '@/entities/geofence';

describe('reverseCoordinates', () => {
  it('swaps a single lat/lng pair', () => {
    expect(reverseCoordinates([10, 20])).toEqual([20, 10]);
  });

  it('recurses into nested coordinate arrays', () => {
    expect(
      reverseCoordinates([
        [10, 20],
        [30, 40],
      ]),
    ).toEqual([
      [20, 10],
      [40, 30],
    ]);
  });
});

describe('geofenceToFeature', () => {
  it('converts a WKT polygon to a GeoJSON feature', () => {
    const geofence = {
      id: 1,
      name: 'Zone',
      area: 'POLYGON ((20 10, 40 30, 50 10, 20 10))',
      attributes: {},
    } as Geofence;
    const feature = geofenceToFeature(geofence, '#00ff00');
    expect(feature.type).toBe('Feature');
    expect(feature.geometry.type).toBe('Polygon');
    expect(feature.properties.name).toBe('Zone');
    expect(feature.properties.color).toBe('#00ff00');
  });

  it('converts a WKT circle to a polygon feature', () => {
    const geofence = {
      id: 2,
      name: 'Circle',
      area: 'CIRCLE (10 20, 500)',
      attributes: {},
    } as Geofence;
    const feature = geofenceToFeature(geofence, '#00ff00');
    expect(feature.geometry.type).toBe('Polygon');
  });
});
