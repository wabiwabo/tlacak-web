import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ServerPage from '../ServerPage';

vi.mock('@/entities/session', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/session')>();
  return {
    ...actual,
    useServerQuery: () => ({ data: { id: 1, attributes: {}, zoom: 4 } }),
    useUpdateServer: () => ({ mutateAsync: vi.fn(), isPending: false }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ServerPage', () => {
  it('loads the server config into the form', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ServerPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByLabelText('Zoom')).toHaveValue(4));
  });
});
