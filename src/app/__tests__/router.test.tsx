import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom';
import { routes } from '../router';

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

/** Flattens nested route objects into a flat path list. */
function collectPaths(input: RouteObject[], prefix = ''): string[] {
  const result: string[] = [];
  for (const route of input) {
    const segment = route.path ?? '';
    // Join parent and child with '/', then normalise double-slashes
    const full = `${prefix}/${segment}`.replace(/\/+/g, '/');
    if (segment) {
      result.push(full);
    }
    if (route.children) {
      result.push(...collectPaths(route.children as RouteObject[], full));
    }
  }
  return result;
}

describe('settings routes', () => {
  it('registers the core settings routes', () => {
    const paths = collectPaths(routes);
    expect(paths).toEqual(
      expect.arrayContaining([
        '/settings/preferences',
        '/settings/devices',
        '/settings/device/:id',
        '/settings/user/:id/connections',
      ]),
    );
  });
});

describe('router', () => {
  it('renders the login page at /login', async () => {
    renderAt('/login');
    expect(await screen.findByText(/login/i)).toBeInTheDocument();
  });

  it('redirects an unauthenticated visit to / onto the login page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    renderAt('/');
    expect(await screen.findByText(/login/i)).toBeInTheDocument();
  });
});
