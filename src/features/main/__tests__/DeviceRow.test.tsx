import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/shared/i18n';

// @/map's barrel pulls in the MapLibre singleton, which needs WebGL; stub it.
vi.mock('maplibre-gl', () => ({
  default: { Map: vi.fn(function () {}) },
}));
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

import { DeviceRow } from '../DeviceRow';
import { useSelectionStore } from '../model/selection-store';
import { useLiveStore } from '../model/live-store';
import type { Device } from '@/entities/device';

const devices: Device[] = [
  { id: 9, name: 'Truck Nine', category: 'truck', status: 'online', attributes: {} } as Device,
];

beforeEach(() => {
  useSelectionStore.setState({ selectedDeviceId: null, selectTime: 0 });
  useLiveStore.setState({ positions: {} });
});

function renderRow() {
  return render(
    <I18nextProvider i18n={i18n}>
      <DeviceRow index={0} style={{}} devices={devices} />
    </I18nextProvider>,
  );
}

describe('DeviceRow', () => {
  it('renders the device name', () => {
    renderRow();
    expect(screen.getByText('Truck Nine')).toBeInTheDocument();
  });

  it('selects the device when clicked', async () => {
    renderRow();
    await userEvent.click(screen.getByRole('button'));
    expect(useSelectionStore.getState().selectedDeviceId).toBe(9);
  });
});
