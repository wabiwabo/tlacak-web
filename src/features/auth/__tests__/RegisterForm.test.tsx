import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { RegisterForm } from '../RegisterForm';
import { useSessionStore } from '@/entities/session';

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useSessionStore.setState({ server: { attributes: {} } as never, user: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RegisterForm', () => {
  it('posts a new user to /api/users', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ id: 9, attributes: {} }) });
    vi.stubGlobal('fetch', fetchSpy);
    renderForm();
    await userEvent.type(screen.getByLabelText(/name/i), 'Pat');
    await userEvent.type(screen.getByLabelText(/email/i), 'pat@host.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(fetchSpy.mock.calls[0]![0]).toBe('/api/users');
    expect(fetchSpy.mock.calls[0]![1].method).toBe('POST');
  });
});
