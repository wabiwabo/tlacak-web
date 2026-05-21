import { useEffect, useId } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import { map } from '../core/map-instance';
import { findFonts, geofenceToFeature } from '../core/map-util';
import { useGeofencesQuery } from '@/entities/geofence';

const GEOMETRY_COLOR = '#3bb2d0';

export function MapGeofence() {
  const sourceId = useId().replace(/:/g, '_');
  const { data: geofences = [] } = useGeofencesQuery();

  useEffect(() => {
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: `${sourceId}-fill`,
      source: sourceId,
      type: 'fill',
      filter: ['==', '$type', 'Polygon'],
      paint: {
        'fill-color': ['get', 'color'],
        'fill-outline-color': ['get', 'color'],
        'fill-opacity': 0.1,
      },
    });
    map.addLayer({
      id: `${sourceId}-line`,
      source: sourceId,
      type: 'line',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['get', 'width'],
        'line-opacity': ['get', 'opacity'],
      },
    });
    map.addLayer({
      id: `${sourceId}-title`,
      source: sourceId,
      type: 'symbol',
      layout: { 'text-field': '{name}', 'text-font': findFonts(map), 'text-size': 12 },
      paint: { 'text-halo-color': 'white', 'text-halo-width': 1 },
    });
    return () => {
      ['fill', 'line', 'title'].forEach((suffix) => {
        if (map.getLayer(`${sourceId}-${suffix}`)) {
          map.removeLayer(`${sourceId}-${suffix}`);
        }
      });
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [sourceId]);

  useEffect(() => {
    (map.getSource(sourceId) as GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features: geofences
        .filter((geofence) => !geofence.attributes.hide)
        .map((geofence) => geofenceToFeature(geofence, GEOMETRY_COLOR)),
    });
  }, [sourceId, geofences]);

  return null;
}
