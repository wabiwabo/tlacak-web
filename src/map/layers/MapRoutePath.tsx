import { useEffect } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import { map } from '../core/map-instance';

interface MapRoutePathProps {
  /** Ordered `[lng, lat]` coordinates of the route. */
  coordinates: [number, number][];
  /** Unique layer id suffix so multiple routes can coexist. */
  id?: string;
}

/** Draws a single static route polyline from plain coordinate data. */
export function MapRoutePath({ coordinates, id = 'report' }: MapRoutePathProps) {
  useEffect(() => {
    const sourceId = `route-${id}`;
    const layerId = `route-${id}-line`;
    const data = {
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates },
    };
    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as GeoJSONSource).setData(data);
    } else {
      map.addSource(sourceId, { type: 'geojson', data });
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: { 'line-color': '#0ea5e9', 'line-width': 3 },
      });
    }
    return () => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [coordinates, id]);

  return null;
}
