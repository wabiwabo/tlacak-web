import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '../router';

describe('router', () => {
  it('renders the main page at /', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/'] });
    render(<RouterProvider router={router} />);
    expect(await screen.findByText('Main page')).toBeInTheDocument();
  });

  it('renders the login page at /login', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/login'] });
    render(<RouterProvider router={router} />);
    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  it('renders the not-found page for unknown routes', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/no-such-route'] });
    render(<RouterProvider router={router} />);
    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });
});
