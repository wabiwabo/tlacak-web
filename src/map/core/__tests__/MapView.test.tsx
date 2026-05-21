import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const fakeMap = {
  addControl: vi.fn(),
  removeControl: vi.fn(),
  setStyle: vi.fn(),
  once: vi.fn(),
  loaded: vi.fn(() => true),
  resize: vi.fn(),
  hasImage: vi.fn(() => true),
  addImage: vi.fn(),
  getStyle: vi.fn(() => ({ glyphs: '' })),
};

vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn(function () {
      return fakeMap;
    }),
    AttributionControl: vi.fn(),
    NavigationControl: vi.fn(),
    setRTLTextPlugin: vi.fn(),
  },
}));
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

describe('MapView', () => {
  it('renders its container', async () => {
    const { MapView } = await import('../MapView');
    render(<MapView />);
    expect(document.querySelector('.map-view')).not.toBeNull();
    expect(screen.queryByTestId('layer')).toBeNull();
  });
});
