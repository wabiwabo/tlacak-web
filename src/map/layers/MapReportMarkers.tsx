import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { map } from '../core/map-instance';

interface ReportMarker {
  id: number | string;
  longitude: number;
  latitude: number;
}

interface MapReportMarkersProps {
  markers: ReportMarker[];
  onMarkerClick?: (id: number | string) => void;
}

/** Plain HTML markers for static report data (no live-store coupling). */
export function MapReportMarkers({ markers, onMarkerClick }: MapReportMarkersProps) {
  useEffect(() => {
    const instances = markers.map((marker) => {
      const element = document.createElement('div');
      element.className = 'size-3 rounded-full border-2 border-white bg-sky-500 shadow';
      if (onMarkerClick) {
        element.style.cursor = 'pointer';
        element.addEventListener('click', () => onMarkerClick(marker.id));
      }
      return new maplibregl.Marker({ element })
        .setLngLat([marker.longitude, marker.latitude])
        .addTo(map);
    });
    return () => instances.forEach((instance) => instance.remove());
  }, [markers, onMarkerClick]);

  return null;
}
