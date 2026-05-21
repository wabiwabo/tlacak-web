import { describe, expect, it } from 'vitest';
import { mapIconKey, ICON_CATEGORIES } from '../preload-images';

describe('mapIconKey', () => {
  it('maps known categories to themselves', () => {
    expect(mapIconKey('truck')).toBe('truck');
    expect(mapIconKey('car')).toBe('car');
  });

  it('aliases unsupported categories', () => {
    expect(mapIconKey('offroad')).toBe('car');
    expect(mapIconKey('pickup')).toBe('car');
    expect(mapIconKey('trolleybus')).toBe('bus');
  });

  it('falls back to default for unknown categories', () => {
    expect(mapIconKey('spaceship')).toBe('default');
    expect(mapIconKey(undefined)).toBe('default');
  });

  it('exposes the icon category list', () => {
    expect(ICON_CATEGORIES).toContain('car');
    expect(ICON_CATEGORIES).toContain('default');
  });
});
