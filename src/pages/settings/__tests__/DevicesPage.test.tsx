import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import DevicesPage from '../DevicesPage';

// Mock entity hooks to avoid URL-parsing issues in jsdom with openapi-fetch.
vi.mock('@/entities/device', () => ({
  useDevicesQuery: () => ({
    data: [{ id: 1, name: 'Truck', uniqueId: 'T1' }],
    isLoading: false,
    isSuccess: true,
    isError: false,
  }),
  useRemoveDevice: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/entities/group', () => ({
  useGroupsQuery: () => ({ data: [] }),
}));

describe('DevicesPage', () => {
  it('renders the device rows', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <DevicesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByText('Truck')).toBeInTheDocument());
  });
});
