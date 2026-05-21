import type maplibregl from 'maplibre-gl';

import backgroundSvg from '@/shared/assets/map/background.svg?url';
import directionSvg from '@/shared/assets/map/direction.svg?url';
import animalSvg from '@/shared/assets/map/icon/animal.svg?url';
import bicycleSvg from '@/shared/assets/map/icon/bicycle.svg?url';
import boatSvg from '@/shared/assets/map/icon/boat.svg?url';
import busSvg from '@/shared/assets/map/icon/bus.svg?url';
import carSvg from '@/shared/assets/map/icon/car.svg?url';
import camperSvg from '@/shared/assets/map/icon/camper.svg?url';
import craneSvg from '@/shared/assets/map/icon/crane.svg?url';
import defaultSvg from '@/shared/assets/map/icon/default.svg?url';
import helicopterSvg from '@/shared/assets/map/icon/helicopter.svg?url';
import motorcycleSvg from '@/shared/assets/map/icon/motorcycle.svg?url';
import personSvg from '@/shared/assets/map/icon/person.svg?url';
import planeSvg from '@/shared/assets/map/icon/plane.svg?url';
import scooterSvg from '@/shared/assets/map/icon/scooter.svg?url';
import shipSvg from '@/shared/assets/map/icon/ship.svg?url';
import tractorSvg from '@/shared/assets/map/icon/tractor.svg?url';
import trailerSvg from '@/shared/assets/map/icon/trailer.svg?url';
import trainSvg from '@/shared/assets/map/icon/train.svg?url';
import tramSvg from '@/shared/assets/map/icon/tram.svg?url';
import truckSvg from '@/shared/assets/map/icon/truck.svg?url';
import vanSvg from '@/shared/assets/map/icon/van.svg?url';

export const mapIcons: Record<string, string> = {
  animal: animalSvg,
  bicycle: bicycleSvg,
  boat: boatSvg,
  bus: busSvg,
  car: carSvg,
  camper: camperSvg,
  crane: craneSvg,
  default: defaultSvg,
  helicopter: helicopterSvg,
  motorcycle: motorcycleSvg,
  person: personSvg,
  plane: planeSvg,
  scooter: scooterSvg,
  ship: shipSvg,
  tractor: tractorSvg,
  trailer: trailerSvg,
  train: trainSvg,
  tram: tramSvg,
  truck: truckSvg,
  van: vanSvg,
};

export const ICON_CATEGORIES = Object.keys(mapIcons);

/** Status sprite colours; values are CSS colours used for canvas tinting. */
const STATUS_COLORS: Record<string, string> = {
  success: '#4caf50',
  error: '#f44336',
  info: '#2196f3',
  neutral: '#9e9e9e',
};

/** Resolves a device category to a sprite icon key, with legacy aliases. */
export function mapIconKey(category: string | undefined): string {
  switch (category) {
    case 'offroad':
    case 'pickup':
      return 'car';
    case 'trolleybus':
      return 'bus';
    default:
      return category && mapIcons[category] ? category : 'default';
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.src = url;
  });
}

function tint(image: HTMLImageElement, color: string): HTMLCanvasElement {
  const ratio = window.devicePixelRatio;
  const canvas = document.createElement('canvas');
  canvas.width = image.width * ratio;
  canvas.height = image.height * ratio;
  const context = canvas.getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'destination-atop';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function compose(
  background: HTMLImageElement,
  icon: HTMLImageElement | null,
  color: string,
): ImageData {
  const ratio = window.devicePixelRatio;
  const canvas = document.createElement('canvas');
  canvas.width = background.width * ratio;
  canvas.height = background.height * ratio;
  const context = canvas.getContext('2d')!;
  context.drawImage(background, 0, 0, canvas.width, canvas.height);
  if (icon) {
    const w = canvas.width * 0.5;
    const h = canvas.height * 0.5;
    context.drawImage(tint(icon, color), (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

/** Composites every device icon × status colour into a sprite image map. */
export async function preloadMapImages(): Promise<Record<string, ImageData>> {
  const images: Record<string, ImageData> = {};
  const background = await loadImage(backgroundSvg);
  images.background = compose(background, null, '');
  images.direction = compose(await loadImage(directionSvg), null, '');
  await Promise.all(
    ICON_CATEGORIES.map(async (category) => {
      const icon = await loadImage(mapIcons[category]!);
      for (const [colorKey, color] of Object.entries(STATUS_COLORS)) {
        images[`${category}-${colorKey}`] = compose(background, icon, color);
      }
    }),
  );
  return images;
}

/** Registers a preloaded image map onto a MapLibre map (idempotent). */
export function addMapImages(map: maplibregl.Map, images: Record<string, ImageData>): void {
  if (map.hasImage('background')) {
    return;
  }
  for (const [key, value] of Object.entries(images)) {
    map.addImage(key, value, { pixelRatio: window.devicePixelRatio });
  }
}
