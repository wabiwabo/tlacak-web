import { useEffect, useId } from 'react';
import turfCircle from '@turf/circle';
import type { GeoJSONSource } from 'maplibre-gl';
import { map } from '../core/map-instance';
import type { Position } from '@/entities/position';

const GEOMETRY_COLOR = '#3bb2d0';

export function MapAccuracy({ positions }: { positions: Position[] }) {
  const sourceId = useId().replace(/:/g, '_');

  useEffect(() => {
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: sourceId,
      source: sourceId,
      type: 'fill',
      filter: ['==', '$type', 'Polygon'],
      paint: {
        'fill-color': GEOMETRY_COLOR,
        'fill-outline-color': GEOMETRY_COLOR,
        'fill-opacity': 0.25,
      },
    });
    return () => {
      if (map.getLayer(sourceId)) {
        map.removeLayer(sourceId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [sourceId]);

  useEffect(() => {
    (map.getSource(sourceId) as GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features: positions
        .filter((position) => (position.accuracy ?? 0) > 0)
        .map((position) =>
          turfCircle(
            [position.longitude as number, position.latitude as number],
            (position.accuracy as number) * 0.001,
            { units: 'kilometers' },
          ),
        ),
    });
  }, [sourceId, positions]);

  return null;
}
