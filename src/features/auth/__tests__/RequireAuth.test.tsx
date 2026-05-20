import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { RequireAuth } from '../RequireAuth';
import { useSessionStore } from '@/entities/session';

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <RequireAuth>
            <div>protected body</div>
          </RequireAuth>
        ),
      },
      { path: '/login', element: <div>login screen</div> },
      { path: '/register', element: <div>register screen</div> },
    ],
    { initialEntries: [path] },
  );
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
  useSessionStore.setState({ server: null, user: null });
});

afterEach(() => {
  vi.restoreAllMocks();
  useSessionStore.setState({ server: null, user: null });
});

describe('RequireAuth', () => {
  it('renders children when a session exists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1, attributes: {} }) }),
    );
    renderAt('/');
    expect(await screen.findByText('protected body')).toBeInTheDocument();
  });

  it('redirects to /login and stores postLogin when unauthenticated', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    renderAt('/');
    expect(await screen.findByText('login screen')).toBeInTheDocument();
    expect(window.sessionStorage.getItem('postLogin')).toBe('/');
  });

  it('redirects to /register when unauthenticated and server.newServer is true', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    useSessionStore.setState({ server: { attributes: {}, newServer: true } as never, user: null });
    renderAt('/');
    expect(await screen.findByText('register screen')).toBeInTheDocument();
  });
});
