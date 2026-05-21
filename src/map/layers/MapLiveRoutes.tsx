import { useEffect, useId } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import { map } from '../core/map-instance';
import { useLiveStore } from '@/features/main/model/live-store';

const GEOMETRY_COLOR = '#3bb2d0';

export function MapLiveRoutes({ deviceIds }: { deviceIds: number[] }) {
  const sourceId = useId().replace(/:/g, '_');
  const history = useLiveStore((state) => state.history);
  const devices = useLiveStore((state) => state.devices);

  useEffect(() => {
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: sourceId,
      source: sourceId,
      type: 'line',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['get', 'width'],
        'line-opacity': ['get', 'opacity'],
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
    const features = deviceIds
      .filter((id) => history[id] && devices[id])
      .map((id) => ({
        type: 'Feature' as const,
        geometry: { type: 'LineString' as const, coordinates: history[id]! },
        properties: {
          color: (devices[id]?.attributes?.['web.reportColor'] as string) || GEOMETRY_COLOR,
          width: 2,
          opacity: 1,
        },
      }));
    (map.getSource(sourceId) as GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features,
    });
  }, [sourceId, deviceIds, history, devices]);

  return null;
}
