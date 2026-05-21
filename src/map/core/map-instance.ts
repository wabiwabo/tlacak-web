import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/** Detached container the singleton map is attached to; re-parented by MapView. */
export const mapElement = document.createElement('div');
mapElement.style.width = '100%';
mapElement.style.height = '100%';
mapElement.style.boxSizing = 'initial';

/** The application-wide singleton MapLibre map. */
export const map = new maplibregl.Map({
  container: mapElement,
  attributionControl: false,
});

type ReadyListener = (ready: boolean) => void;

let ready = false;
const readyListeners = new Set<ReadyListener>();

/** Subscribes to map-ready changes; fires immediately with the current value. */
export function addReadyListener(listener: ReadyListener): () => void {
  readyListeners.add(listener);
  listener(ready);
  return () => readyListeners.delete(listener);
}

/** Updates the ready flag and notifies all subscribers. */
export function setReady(value: boolean): void {
  ready = value;
  readyListeners.forEach((listener) => listener(value));
}

/** Reads the current ready flag. */
export function isReady(): boolean {
  return ready;
}
