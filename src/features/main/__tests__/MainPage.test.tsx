import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/shared/i18n';

vi.mock('@/map', () => ({
  MapView: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  MapPositions: () => null,
  MapGeofence: () => null,
  MapAccuracy: () => null,
  MapLiveRoutes: () => null,
  MapSelectedDevice: () => null,
  MapDefaultCamera: () => null,
  mapIconKey: () => 'default',
  mapIcons: { default: 'x' },
  getStatusColor: () => 'neutral',
}));

beforeEach(async () => {
  const { useLiveStore } = await import('../model/live-store');
  useLiveStore.setState({ devices: {}, positions: {}, history: {}, events: [] });
});

describe('MainPage', () => {
  it('renders the FLEET header and the filter chip row', async () => {
    const { MainPage } = await import('../MainPage');
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>
            <MainPage />
          </MemoryRouter>
        </I18nextProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByText(/FLEET/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ALL · 0/i })).toBeInTheDocument();
  });
});
