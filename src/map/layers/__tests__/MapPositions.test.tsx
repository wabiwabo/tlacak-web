import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const setData = vi.fn();
const fakeMap = {
  addSource: vi.fn(),
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  removeSource: vi.fn(),
  getLayer: vi.fn(() => true),
  getSource: vi.fn(() => ({ setData })),
  getStyle: vi.fn(() => ({ glyphs: '' })),
  on: vi.fn(),
  off: vi.fn(),
  getCanvas: vi.fn(() => ({ style: {} })),
};

vi.mock('../../core/map-instance', () => ({ map: fakeMap }));

beforeEach(() => {
  setData.mockClear();
});

describe('MapPositions', () => {
  it('publishes position features to the geojson source', async () => {
    const { MapPositions } = await import('../MapPositions');
    const { useLiveStore } = await import('@/features/main/model/live-store');
    useLiveStore.setState({
      devices: { 7: { id: 7, name: 'Truck', category: 'truck', status: 'online' } as never },
    });
    render(
      <MapPositions
        positions={[{ id: 1, deviceId: 7, longitude: 10, latitude: 20, attributes: {} } as never]}
      />,
    );
    expect(setData).toHaveBeenCalled();
  });
});
