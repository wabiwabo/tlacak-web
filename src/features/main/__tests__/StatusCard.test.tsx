import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/shared/i18n';
import { StatusCard } from '../StatusCard';
import { useLiveStore } from '../model/live-store';
import { useSelectionStore } from '../model/selection-store';

beforeEach(() => {
  useSelectionStore.setState({ selectedDeviceId: 4, selectTime: 1 });
  useLiveStore.setState({
    devices: { 4: { id: 4, name: 'Card Device', attributes: {} } as never },
    positions: {},
  });
});

describe('StatusCard', () => {
  it('shows the device name and deselects on close', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <StatusCard deviceId={4} />
      </I18nextProvider>,
    );
    expect(screen.getByText('Card Device')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(useSelectionStore.getState().selectedDeviceId).toBeNull();
  });
});
