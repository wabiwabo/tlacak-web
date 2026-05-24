import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import maplibregl from 'maplibre-gl';
import { useTranslation } from 'react-i18next';
import { directionFor } from '@/shared/i18n/rtl';
import { useSessionStore } from '@/entities/session';
import { useMapUiStore } from '@/features/main/model/map-ui-store';
import { map, mapElement, addReadyListener, setReady } from './map-instance';
import { buildMapStyles, type MapStyleKeys } from './map-styles';
import { SwitcherControl } from './switcher';
import { preloadMapImages, addMapImages } from './preload-images';
import './MapView.css';

let imagesPromise: Promise<Record<string, ImageData>> | null = null;

function ensureImages(): Promise<Record<string, ImageData>> {
  if (!imagesPromise) {
    imagesPromise = preloadMapImages();
  }
  return imagesPromise;
}

export function MapView({ children }: { children?: ReactNode }) {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);

  const server = useSessionStore((state) => state.server);
  const selectedMapStyle = useMapUiStore((state) => state.selectedMapStyle);
  const setSelectedMapStyle = useMapUiStore((state) => state.setSelectedMapStyle);

  const styleKeys = useMemo<MapStyleKeys>(() => {
    const attributes = server?.attributes ?? {};
    return {
      locationIqKey: attributes.locationIqKey as string | undefined,
      mapTilerKey: attributes.mapTilerKey as string | undefined,
      bingMapsKey: attributes.bingMapsKey as string | undefined,
      tomTomKey: attributes.tomTomKey as string | undefined,
      hereKey: attributes.hereKey as string | undefined,
      mapboxAccessToken: attributes.mapboxAccessToken as string | undefined,
    };
  }, [server]);

  const mapStyles = useMemo(
    () =>
      buildMapStyles(styleKeys)
        .filter((style) => style.available)
        .map((style) => ({ ...style, title: t(style.titleKey) })),
    [styleKeys, t],
  );

  const switcher = useMemo(
    () =>
      new SwitcherControl(
        () => setReady(false),
        (styleId) => setSelectedMapStyle(styleId),
        () => {
          map.once('styledata', () => {
            const waitForLoad = () => {
              if (!map.loaded()) {
                setTimeout(waitForLoad, 33);
              } else {
                void ensureImages().then((images) => {
                  addMapImages(map, images);
                  setReady(true);
                });
              }
            };
            waitForLoad();
          });
        },
      ),
    [setSelectedMapStyle],
  );

  useEffect(() => {
    if (directionFor(i18n.language) === 'rtl') {
      void maplibregl.setRTLTextPlugin('/mapbox-gl-rtl-text.js', true);
    }
  }, [i18n.language]);

  useEffect(() => {
    const rtl = directionFor(i18n.language) === 'rtl';
    const attribution = new maplibregl.AttributionControl({ compact: true });
    const navigation = new maplibregl.NavigationControl();
    map.addControl(attribution, rtl ? 'bottom-left' : 'bottom-right');
    map.addControl(navigation, rtl ? 'top-left' : 'top-right');
    map.addControl(switcher, rtl ? 'top-left' : 'top-right');
    return () => {
      map.removeControl(switcher);
      map.removeControl(navigation);
      map.removeControl(attribution);
    };
  }, [i18n.language, switcher]);

  useEffect(() => {
    switcher.updateStyles(mapStyles, selectedMapStyle);
    const active = switcher.getActiveStyle();
    if (!active) {
      return;
    }
    const handler = () => {
      const waitForLoad = () => {
        if (!map.loaded()) {
          setTimeout(waitForLoad, 33);
        } else {
          void ensureImages().then((images) => {
            addMapImages(map, images);
            setReady(true);
          });
        }
      };
      waitForLoad();
    };
    let cancelled = false;
    const applyStyle = async () => {
      const raw = active.style;
      const resolved = typeof raw === 'function' ? await raw() : raw;
      if (cancelled) return;
      map.setStyle(resolved);
      map.once('styledata', handler);
    };
    void applyStyle();
    return () => {
      cancelled = true;
      map.off('styledata', handler);
    };
  }, [mapStyles, selectedMapStyle, switcher]);

  useEffect(() => addReadyListener(setMapReady), []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    container.appendChild(mapElement);
    map.resize();
    return () => {
      container.removeChild(mapElement);
    };
  }, []);

  const viewClass = `map-view${selectedMapStyle === 'cyberOps' ? ' map-view--cyber-ops' : ''}`;

  return (
    <div className={viewClass} ref={containerRef}>
      {mapReady && children}
    </div>
  );
}
