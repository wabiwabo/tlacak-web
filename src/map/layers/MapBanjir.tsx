import { useEffect, useId, useMemo } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import type { FeatureCollection, Feature, Geometry } from 'geojson';
import { map } from '../core/map-instance';
import { useFloodData } from '@/features/banjir/lib/use-flood-data';
import type { FloodFeature, FloodSeverity } from '@/features/banjir/lib/types';

const SEVERITY_COLOR: Record<FloodSeverity, string> = {
  minor: '#22d3ee',     // cyan (matches --color-primary tone)
  moderate: '#facc15',  // amber (matches --color-warning tone)
  severe: '#fb923c',    // orange
  extreme: '#ef4444',   // red (matches --color-destructive tone)
};

function severityWeight(s: FloodSeverity): number {
  return s === 'extreme' ? 4 : s === 'severe' ? 3 : s === 'moderate' ? 2 : 1;
}

function toMapFeature(f: FloodFeature): Feature<Geometry> {
  return {
    type: 'Feature',
    id: f.id,
    geometry: f.geometry,
    properties: {
      kind: f.kind,
      severity: f.severity,
      color: SEVERITY_COLOR[f.severity],
      weight: severityWeight(f.severity),
      depthCm: f.depthCm ?? 0,
      reportedAt: f.reportedAt,
      source: f.source,
    },
  };
}

/**
 * MapBanjir — overlays the flood snapshot on the MainPage MapLibre map.
 *
 * Four layers stacked on a single GeoJSON source:
 *   <id>-polygon-fill      filled flood polygons (PetaBencana floods)
 *   <id>-polygon-outline   solid outline for confirmed, dashed for warnings
 *   <id>-report-circle     graduated circles for PetaBencana reports
 *   <id>-report-outline    crisp outline on the circles
 *
 * Vehicles continue to render above this layer because MainMap mounts
 * <MapPositions /> after <MapBanjir />.
 */
export function MapBanjir() {
  const sourceId = useId().replace(/:/g, '_');
  const { snapshot } = useFloodData();

  const data: FeatureCollection = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: snapshot.features
        // BMKG nowcast points carry placeholder [0,0] coords — exclude
        // them from the map until the CAP polygon enrichment lands.
        .filter((f) => !(f.source === 'bmkg' && f.geometry.type === 'Point'))
        .map(toMapFeature),
    }),
    [snapshot.features],
  );

  useEffect(() => {
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: `${sourceId}-polygon-fill`,
      source: sourceId,
      type: 'fill',
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 0.35,
      },
    });
    map.addLayer({
      id: `${sourceId}-polygon-outline`,
      source: sourceId,
      type: 'line',
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 1.5,
        'line-dasharray': [
          'case',
          ['==', ['get', 'source'], 'bmkg'],
          ['literal', [2, 2]],
          ['literal', [1, 0]],
        ] as unknown as number[],
      },
    });
    map.addLayer({
      id: `${sourceId}-report-circle`,
      source: sourceId,
      type: 'circle',
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.75,
        'circle-radius': [
          'interpolate', ['linear'], ['get', 'depthCm'],
          0, 4,
          30, 5,
          70, 7,
          150, 9,
          400, 11,
        ],
      },
    });
    map.addLayer({
      id: `${sourceId}-report-outline`,
      source: sourceId,
      type: 'circle',
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-color': ['get', 'color'],
        'circle-stroke-width': 1,
        'circle-radius': [
          'interpolate', ['linear'], ['get', 'depthCm'],
          0, 5,
          30, 6,
          70, 8,
          150, 10,
          400, 12,
        ],
      },
    });

    return () => {
      ['polygon-fill', 'polygon-outline', 'report-circle', 'report-outline'].forEach((suffix) => {
        const id = `${sourceId}-${suffix}`;
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [sourceId]);

  useEffect(() => {
    (map.getSource(sourceId) as GeoJSONSource | undefined)?.setData(data);
  }, [sourceId, data]);

  return null;
}
