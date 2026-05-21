import type { StyleSpecification } from 'maplibre-gl';

export interface MapStyleKeys {
  locationIqKey?: string;
  mapTilerKey?: string;
  bingMapsKey?: string;
  tomTomKey?: string;
  hereKey?: string;
  mapboxAccessToken?: string;
  googleKey?: string;
}

export interface MapStyle {
  id: string;
  titleKey: string;
  style: string | StyleSpecification;
  available: boolean;
}

interface RasterOptions {
  tiles: string[];
  minZoom?: number;
  maxZoom?: number;
  attribution?: string;
}

const FONT_GLYPHS = 'https://cdn.traccar.com/map/fonts/{fontstack}/{range}.pbf';

function rasterStyle({ tiles, minZoom, maxZoom, attribution }: RasterOptions): StyleSpecification {
  return {
    version: 8,
    glyphs: FONT_GLYPHS,
    sources: {
      custom: {
        type: 'raster',
        tiles,
        tileSize: 256,
        ...(minZoom !== undefined ? { minzoom: minZoom } : {}),
        ...(maxZoom !== undefined ? { maxzoom: maxZoom } : {}),
        ...(attribution ? { attribution } : {}),
      },
    },
    layers: [{ id: 'custom', type: 'raster', source: 'custom' }],
  };
}

/** Builds the full map-style catalogue; `available` reflects key availability. */
export function buildMapStyles(keys: MapStyleKeys): MapStyle[] {
  const locationIqKey = keys.locationIqKey || 'pk.0f147952a41c555a5b70614039fd148b';
  const osmAttribution =
    '© <a target="_top" rel="noopener" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return [
    {
      id: 'openFreeMap',
      titleKey: 'mapOpenFreeMap',
      style: 'https://tiles.openfreemap.org/styles/liberty',
      available: true,
    },
    {
      id: 'locationIqStreets',
      titleKey: 'mapLocationIqStreets',
      style: `https://tiles.locationiq.com/v3/streets/vector.json?key=${locationIqKey}`,
      available: true,
    },
    {
      id: 'locationIqDark',
      titleKey: 'mapLocationIqDark',
      style: `https://tiles.locationiq.com/v3/dark/vector.json?key=${locationIqKey}`,
      available: true,
    },
    {
      id: 'osm',
      titleKey: 'mapOsm',
      style: rasterStyle({
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        maxZoom: 19,
        attribution: osmAttribution,
      }),
      available: true,
    },
    {
      id: 'openTopoMap',
      titleKey: 'mapOpenTopoMap',
      style: rasterStyle({
        tiles: ['a', 'b', 'c'].map((i) => `https://${i}.tile.opentopomap.org/{z}/{x}/{y}.png`),
        maxZoom: 17,
      }),
      available: true,
    },
    {
      id: 'carto',
      titleKey: 'mapCarto',
      style: rasterStyle({
        tiles: ['a', 'b', 'c', 'd'].map(
          (i) => `https://${i}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png`,
        ),
        maxZoom: 22,
        attribution: osmAttribution,
      }),
      available: true,
    },
    {
      id: 'mapTilerBasic',
      titleKey: 'mapMapTilerBasic',
      style: `https://api.maptiler.com/maps/basic/style.json?key=${keys.mapTilerKey ?? ''}`,
      available: Boolean(keys.mapTilerKey),
    },
    {
      id: 'mapTilerHybrid',
      titleKey: 'mapMapTilerHybrid',
      style: `https://api.maptiler.com/maps/hybrid/style.json?key=${keys.mapTilerKey ?? ''}`,
      available: Boolean(keys.mapTilerKey),
    },
    {
      id: 'tomTomBasic',
      titleKey: 'mapTomTomBasic',
      style: `https://api.tomtom.com/map/1/style/20.0.0-8/basic_main.json?key=${keys.tomTomKey ?? ''}`,
      available: Boolean(keys.tomTomKey),
    },
    {
      id: 'bingRoad',
      titleKey: 'mapBingRoad',
      style: rasterStyle({
        tiles: [0, 1, 2, 3].map(
          (i) =>
            `https://t${i}.ssl.ak.dynamic.tiles.virtualearth.net/comp/ch/{quadkey}?mkt=en-US&it=G,L&shading=hill&og=1885&n=z`,
        ),
        maxZoom: 21,
      }),
      available: Boolean(keys.bingMapsKey),
    },
    {
      id: 'bingAerial',
      titleKey: 'mapBingAerial',
      style: rasterStyle({
        tiles: [0, 1, 2, 3].map(
          (i) => `https://ecn.t${i}.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=12327`,
        ),
        maxZoom: 19,
      }),
      available: Boolean(keys.bingMapsKey),
    },
    {
      id: 'hereBasic',
      titleKey: 'mapHereBasic',
      style: rasterStyle({
        tiles: [
          `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png8?apiKey=${keys.hereKey ?? ''}&size=512`,
        ],
        maxZoom: 20,
        attribution: '© HERE',
      }),
      available: Boolean(keys.hereKey),
    },
    {
      id: 'hereHybrid',
      titleKey: 'mapHereHybrid',
      style: rasterStyle({
        tiles: [
          `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/jpeg?style=explore.satellite.day&apiKey=${keys.hereKey ?? ''}&size=512`,
        ],
        maxZoom: 20,
        attribution: '© HERE',
      }),
      available: Boolean(keys.hereKey),
    },
    {
      id: 'mapboxStreets',
      titleKey: 'mapMapboxStreets',
      style: rasterStyle({
        tiles: [
          `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${keys.mapboxAccessToken ?? ''}`,
        ],
        maxZoom: 22,
      }),
      available: Boolean(keys.mapboxAccessToken),
    },
    {
      id: 'mapboxSatelliteStreet',
      titleKey: 'mapMapboxSatellite',
      style: rasterStyle({
        tiles: [
          `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=${keys.mapboxAccessToken ?? ''}`,
        ],
        maxZoom: 22,
      }),
      available: Boolean(keys.mapboxAccessToken),
    },
  ];
}
