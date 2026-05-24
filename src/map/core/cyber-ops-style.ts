import type { StyleSpecification } from 'maplibre-gl';

/**
 * Cyber Ops basemap — the OneFleet custom dark map style.
 *
 * Strategy: load Carto's battle-tested Dark Matter style as the source of
 * truth for layer structure (vector source + filters that cover every
 * OpenMapTiles edge case), then rewrite each layer's paint properties to
 * apply the Cyber Ops palette — deep void background, cyan-mint roads,
 * magenta rail, glowing major arteries. Glyphs go through Traccar's CDN
 * (the one font file it serves, Roboto Regular, is used for every label).
 *
 * No fleet tracking app in the world ships a custom dark basemap — Samsara,
 * Geotab, Motive, Verizon Connect, TransTRACK, McEasy, Cartrack all default
 * to Google Maps / Mapbox beige tiles. This is the competitive moat.
 */

const CARTO_DARK_MATTER_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const TRACCAR_GLYPHS = 'https://cdn.traccar.com/map/fonts/{fontstack}/{range}.pbf';

/** Cyber Ops palette — single source of truth so we can tune in one place. */
const CY = {
  void: '#000814',
  voidDeep: '#02060f',
  landPark: '#0a1a14',
  landResidential: '#10173a',
  building: '#1a2148',
  buildingOutline: '#26305c',
  roadCasing: 'rgba(0, 255, 200, 0.18)',
  roadInner: 'rgba(0, 255, 200, 0.55)',
  roadMotorway: 'rgba(0, 255, 200, 0.85)',
  roadMinor: 'rgba(0, 255, 200, 0.22)',
  roadPath: 'rgba(214, 230, 255, 0.12)',
  rail: 'rgba(176, 38, 255, 0.5)',
  boundary: 'rgba(214, 230, 255, 0.18)',
  boundaryCountry: 'rgba(0, 255, 200, 0.42)',
  textCity: '#d6e6ff',
  textWater: 'rgba(0, 212, 255, 0.65)',
  textRoad: 'rgba(0, 255, 200, 0.75)',
  textPlace: 'rgba(214, 230, 255, 0.7)',
  textDim: 'rgba(214, 230, 255, 0.5)',
  textHalo: '#000814',
} as const;

let cached: Promise<StyleSpecification> | null = null;

export function loadCyberOpsMapStyle(): Promise<StyleSpecification> {
  if (!cached) {
    cached = fetch(CARTO_DARK_MATTER_URL)
      .then((response) => response.json() as Promise<StyleSpecification>)
      .then((style) => {
        // Carto's font CDN blocks CORS; Traccar's serves Roboto Regular with
        // open CORS — that's the single font we render every label in.
        style.glyphs = TRACCAR_GLYPHS;

        for (const layer of style.layers) {
          repaintLayer(layer);
        }

        return style;
      });
  }
  return cached;
}

type AnyLayer = StyleSpecification['layers'][number];

function repaintLayer(layer: AnyLayer) {
  const id = layer.id;
  const type = layer.type;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paint: Record<string, unknown> = (layer as any).paint ?? ((layer as any).paint = {});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layout: Record<string, unknown> = (layer as any).layout ?? {};

  // All symbol layers: collapse text-font to Roboto Regular (Traccar's only).
  if (type === 'symbol' && Array.isArray(layout['text-font'])) {
    layout['text-font'] = ['Roboto Regular'];
  }

  if (type === 'background') {
    paint['background-color'] = CY.void;
    return;
  }

  if (id === 'water' || id.startsWith('water_')) {
    if (type === 'fill') {
      paint['fill-color'] = CY.voidDeep;
      paint['fill-opacity'] = 1;
      delete paint['fill-outline-color'];
    }
    return;
  }

  if (id === 'waterway') {
    paint['line-color'] = 'rgba(0, 212, 255, 0.4)';
    return;
  }

  if (id.includes('park') || id.includes('landcover') || id.includes('wood') || id.includes('grass')) {
    if (type === 'fill') {
      paint['fill-color'] = CY.landPark;
      paint['fill-opacity'] = 0.7;
    }
    return;
  }

  if (id.includes('landuse_residential') || id === 'landuse' || id === 'urban_area') {
    if (type === 'fill') {
      paint['fill-color'] = CY.landResidential;
      paint['fill-opacity'] = 0.6;
    }
    return;
  }

  if (id.includes('building')) {
    if (type === 'fill') {
      paint['fill-color'] = CY.building;
      paint['fill-outline-color'] = CY.buildingOutline;
    }
    if (type === 'fill-extrusion') {
      paint['fill-extrusion-color'] = CY.building;
    }
    return;
  }

  // Roads — case (background stroke) gets dim cyan; inner (foreground)
  // gets brighter cyan; motorway brightest.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (type === 'line' && (layer as any)['source-layer'] === 'transportation') {
    const isCasing =
      id.endsWith('_case') || id.endsWith('-case') || id.includes('casing');
    if (id.includes('motorway') || id.includes('trunk')) {
      paint['line-color'] = isCasing ? CY.roadCasing : CY.roadMotorway;
    } else if (
      id.includes('primary') ||
      id.includes('secondary') ||
      id.includes('tertiary') ||
      id.includes('road_pri') ||
      id.includes('road_sec') ||
      id.includes('road_ter')
    ) {
      paint['line-color'] = isCasing ? CY.roadCasing : CY.roadInner;
    } else if (id.includes('rail') || id.includes('transit')) {
      paint['line-color'] = CY.rail;
    } else if (id.includes('path') || id.includes('pedestrian')) {
      paint['line-color'] = CY.roadPath;
    } else {
      paint['line-color'] = CY.roadMinor;
    }
    return;
  }

  if (id.startsWith('boundary')) {
    if (type === 'line') {
      paint['line-color'] = id.includes('country') ? CY.boundaryCountry : CY.boundary;
    }
    return;
  }

  if (type === 'symbol') {
    if (id.includes('water') || id.includes('ocean') || id.includes('sea')) {
      paint['text-color'] = CY.textWater;
    } else if (
      id.includes('road') ||
      id.includes('roadname') ||
      id.includes('highway')
    ) {
      paint['text-color'] = CY.textRoad;
    } else if (
      id.includes('city') ||
      id.includes('capital') ||
      id.includes('country')
    ) {
      paint['text-color'] = CY.textCity;
    } else if (id.includes('state') || id.includes('province')) {
      paint['text-color'] = CY.textDim;
    } else {
      paint['text-color'] = CY.textPlace;
    }
    paint['text-halo-color'] = CY.textHalo;
    paint['text-halo-width'] = 1.4;
    paint['text-halo-blur'] = 0;
    if (layout['icon-image']) {
      delete layout['icon-image'];
    }
  }
}
