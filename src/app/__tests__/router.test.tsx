import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routes } from '../router';

function renderRouter(initialEntries: string[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('router', () => {
  it('renders the main page at /', async () => {
    renderRouter(['/']);
    expect(await screen.findByText('Main page')).toBeInTheDocument();
  });

  it('renders the login page at /login', async () => {
    renderRouter(['/login']);
    expect(await screen.findByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('renders the not-found page for unknown routes', async () => {
    renderRouter(['/no-such-route']);
    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });
});
