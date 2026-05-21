import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from '../AppShell';
import { useSessionStore } from '@/entities/session';

// The live controllers run real socket/fetch side-effects — out of scope for shell layout tests.
vi.mock('@/features/live', () => ({
  SocketController: () => null,
  CachingController: () => null,
  MotionController: () => null,
}));

function renderShell(matchesDesktop: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: matchesDesktop,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppShell />,
        children: [{ index: true, element: <div>map area</div> }],
      },
    ],
    { initialEntries: ['/'] },
  );
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useSessionStore.setState({
    user: { id: 1, attributes: {} } as never,
    server: { attributes: {} } as never,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AppShell', () => {
  it('renders the routed outlet content', async () => {
    renderShell(true);
    expect(await screen.findByText('map area')).toBeInTheDocument();
  });

  it('shows the desktop sidebar on wide viewports', async () => {
    renderShell(true);
    expect(await screen.findByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /map/i })).toBeInTheDocument();
  });

  it('shows the bottom nav on mobile viewports', async () => {
    renderShell(false);
    expect(await screen.findByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /map/i })).toBeInTheDocument();
  });
});
