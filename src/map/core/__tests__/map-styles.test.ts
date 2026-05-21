import { describe, expect, it } from 'vitest';
import { buildMapStyles } from '../map-styles';

describe('buildMapStyles', () => {
  it('marks key-free styles available with no keys provided', () => {
    const styles = buildMapStyles({});
    const openFreeMap = styles.find((s) => s.id === 'openFreeMap');
    expect(openFreeMap?.available).toBe(true);
  });

  it('marks key-gated styles unavailable without their key', () => {
    const styles = buildMapStyles({});
    expect(styles.find((s) => s.id === 'mapTilerBasic')?.available).toBe(false);
  });

  it('enables a key-gated style when its key is supplied', () => {
    const styles = buildMapStyles({ mapTilerKey: 'abc' });
    expect(styles.find((s) => s.id === 'mapTilerBasic')?.available).toBe(true);
  });

  it('always includes openFreeMap, locationIq and osm', () => {
    const ids = buildMapStyles({}).map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(['openFreeMap', 'locationIqStreets', 'osm']));
  });

  it('credits both OpenStreetMap and CARTO on the carto style', () => {
    const carto = buildMapStyles({}).find((s) => s.id === 'carto');
    const spec = carto?.style as import('maplibre-gl').StyleSpecification;
    const source = spec.sources['custom'] as import('maplibre-gl').RasterSourceSpecification;
    expect(source?.attribution).toContain('carto.com');
  });
});
