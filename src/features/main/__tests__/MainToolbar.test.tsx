import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/shared/i18n';
import { MainToolbar } from '../MainToolbar';
import { useFilterStore } from '../model/filter-store';
import { useLiveStore } from '../model/live-store';

beforeEach(() => {
  useFilterStore.setState({ keyword: '', statuses: [], groups: [], sort: '', filterMap: false });
  useLiveStore.setState({
    devices: {
      1: { id: 1, name: 'Truck 1', status: 'online' },
      2: { id: 2, name: 'Truck 2', status: 'offline' },
    } as never,
    positions: { 1: { deviceId: 1, speed: 12 } as never },
  });
});

function renderToolbar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <MainToolbar />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('MainToolbar', () => {
  it('renders the status filter chips with counts', () => {
    renderToolbar();
    expect(screen.getByRole('button', { name: /ALL · 2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /MOVING · 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /OFFLINE · 1/i })).toBeInTheDocument();
  });

  it('toggles the offline status filter when its chip is clicked', async () => {
    renderToolbar();
    await userEvent.click(screen.getByRole('button', { name: /OFFLINE · 1/i }));
    expect(useFilterStore.getState().statuses).toEqual(['offline']);
  });
});
