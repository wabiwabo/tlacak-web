import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LoginForm } from '../LoginForm';
import { useSessionStore } from '@/entities/session';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  navigate.mockClear();
  useSessionStore.setState({
    server: { attributes: {}, registration: true, emailEnabled: true } as never,
    user: null,
  });
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LoginForm', () => {
  it('logs in and navigates to the postLogin target', async () => {
    window.sessionStorage.setItem('postLogin', '/reports/route');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1, attributes: {} }) }),
    );
    renderForm();
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.co');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(navigate).toHaveBeenCalledWith('/reports/route', { replace: true });
  });

  it('reveals the TOTP code field after a TOTP challenge', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ 'WWW-Authenticate': 'TOTP' }),
        text: async () => '',
      }),
    );
    renderForm();
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.co');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(await screen.findByLabelText(/code/i)).toBeInTheDocument();
  });

  it('submits when Enter is pressed in the password field', async () => {
    window.sessionStorage.setItem('postLogin', '/dashboard');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1, attributes: {} }) }),
    );
    renderForm();
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.co');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret{Enter}');
    expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });
});
