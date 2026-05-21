import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { map } from '../core/map-instance';
import { useSessionStore } from '@/entities/session';
import type { Position } from '@/entities/position';

export function MapDefaultCamera({ positions }: { positions: Position[] }) {
  const server = useSessionStore((state) => state.server);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      return;
    }
    const defaultLatitude = server?.attributes?.latitude as number | undefined;
    const defaultLongitude = server?.attributes?.longitude as number | undefined;
    const defaultZoom = (server?.attributes?.zoom as number | undefined) ?? 0;

    if (defaultLatitude && defaultLongitude) {
      map.jumpTo({ center: [defaultLongitude, defaultLatitude], zoom: defaultZoom });
      initialized.current = true;
      return;
    }
    const coordinates = positions.map(
      (item) => [item.longitude, item.latitude] as [number, number],
    );
    if (coordinates.length > 1) {
      const bounds = coordinates.reduce(
        (acc, item) => acc.extend(item),
        new maplibregl.LngLatBounds(coordinates[0], coordinates[1]),
      );
      const canvas = map.getCanvas();
      map.fitBounds(bounds, {
        duration: 0,
        padding: Math.min(canvas.width, canvas.height) * 0.1,
      });
      initialized.current = true;
    } else if (coordinates.length === 1) {
      map.jumpTo({ center: coordinates[0]!, zoom: Math.max(defaultZoom, 10) });
      initialized.current = true;
    }
  }, [server, positions]);

  return null;
}
