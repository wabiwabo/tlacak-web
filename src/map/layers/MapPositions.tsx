import { useEffect, useId, useRef } from 'react';
import type { GeoJSONSource, MapMouseEvent } from 'maplibre-gl';
import { map } from '../core/map-instance';
import { findFonts } from '../core/map-util';
import { mapIconKey } from '../core/preload-images';
import { getStatusColor } from '../lib/status-color';
import { useLiveStore } from '@/features/main/model/live-store';
import { useSelectionStore } from '@/features/main/model/selection-store';
import type { Position } from '@/entities/position';

interface MapPositionsProps {
  positions: Position[];
  onMarkerClick?: (deviceId: number) => void;
}

export function MapPositions({ positions, onMarkerClick }: MapPositionsProps) {
  const baseId = useId().replace(/:/g, '_');
  const clustersId = `${baseId}-clusters`;
  const selectedId = `${baseId}-selected`;

  const devices = useLiveStore((state) => state.devices);
  const selectedDeviceId = useSelectionStore((state) => state.selectedDeviceId);

  const onMarkerClickRef = useRef(onMarkerClick);
  const mountedRef = useRef(true);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    map.addSource(baseId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });
    map.addSource(selectedId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    const onMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const onMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };
    const onMarker = (event: MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
      event.preventDefault();
      const feature = event.features?.[0];
      if (feature) {
        onMarkerClickRef.current?.(feature.properties?.deviceId as number);
      }
    };
    const onCluster = async (event: MapMouseEvent) => {
      event.preventDefault();
      const features = map.queryRenderedFeatures(event.point, { layers: [clustersId] });
      const feature = features[0];
      if (!feature) {
        return;
      }
      const clusterId = feature.properties?.cluster_id as number;
      const source = map.getSource(baseId) as GeoJSONSource;
      const zoom = await source.getClusterExpansionZoom(clusterId);
      if (!mountedRef.current) {
        return;
      }
      const geometry = feature.geometry;
      if (geometry?.type === 'Point') {
        map.easeTo({ center: geometry.coordinates as [number, number], zoom });
      }
    };

    [baseId, selectedId].forEach((sourceId) => {
      map.addLayer({
        id: sourceId,
        type: 'symbol',
        source: sourceId,
        filter: ['!has', 'point_count'],
        layout: {
          'icon-image': '{category}-{color}',
          'icon-size': 0.75,
          'icon-allow-overlap': true,
          'text-field': '{name}',
          'text-allow-overlap': true,
          'text-anchor': 'bottom',
          'text-offset': [0, -1.5],
          'text-font': findFonts(map),
          'text-size': 12,
        },
        paint: { 'text-halo-color': 'white', 'text-halo-width': 2 },
      });
      map.addLayer({
        id: `direction-${sourceId}`,
        type: 'symbol',
        source: sourceId,
        filter: ['all', ['!has', 'point_count'], ['==', 'direction', true]],
        layout: {
          'icon-image': 'direction',
          'icon-size': 0.75,
          'icon-allow-overlap': true,
          'icon-rotate': ['get', 'rotation'],
          'icon-rotation-alignment': 'map',
        },
      });
      map.on('mouseenter', sourceId, onMouseEnter);
      map.on('mouseleave', sourceId, onMouseLeave);
      map.on('click', sourceId, onMarker);
    });

    map.addLayer({
      id: clustersId,
      type: 'symbol',
      source: baseId,
      filter: ['has', 'point_count'],
      layout: {
        'icon-image': 'background',
        'icon-size': 0.75,
        'text-field': '{point_count_abbreviated}',
        'text-font': findFonts(map),
        'text-size': 14,
      },
    });
    map.on('mouseenter', clustersId, onMouseEnter);
    map.on('mouseleave', clustersId, onMouseLeave);
    map.on('click', clustersId, onCluster);

    return () => {
      map.off('mouseenter', clustersId, onMouseEnter);
      map.off('mouseleave', clustersId, onMouseLeave);
      map.off('click', clustersId, onCluster);
      if (map.getLayer(clustersId)) {
        map.removeLayer(clustersId);
      }
      [baseId, selectedId].forEach((sourceId) => {
        map.off('mouseenter', sourceId, onMouseEnter);
        map.off('mouseleave', sourceId, onMouseLeave);
        map.off('click', sourceId, onMarker);
        if (map.getLayer(`direction-${sourceId}`)) {
          map.removeLayer(`direction-${sourceId}`);
        }
        if (map.getLayer(sourceId)) {
          map.removeLayer(sourceId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      });
    };
  }, [baseId, clustersId, selectedId]);

  useEffect(() => {
    [baseId, selectedId].forEach((sourceId) => {
      const features = positions
        .filter((position) => devices[position.deviceId as number])
        .filter((position) =>
          sourceId === baseId
            ? position.deviceId !== selectedDeviceId
            : position.deviceId === selectedDeviceId,
        )
        .map((position) => {
          const device = devices[position.deviceId as number]!;
          return {
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [position.longitude, position.latitude] as [number, number],
            },
            properties: {
              id: position.id,
              deviceId: position.deviceId,
              name: device.name,
              category: mapIconKey(device.category ?? undefined),
              color: getStatusColor(device.status),
              rotation: position.course ?? 0,
              direction: position.deviceId === selectedDeviceId && (position.course ?? 0) > 0,
            },
          };
        });
      (map.getSource(sourceId) as GeoJSONSource | undefined)?.setData({
        type: 'FeatureCollection',
        features,
      });
    });
  }, [baseId, selectedId, positions, devices, selectedDeviceId]);

  return null;
}
