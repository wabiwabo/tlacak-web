import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ResetPasswordForm } from '../ResetPasswordForm';

function renderForm(initialEntry: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <ResetPasswordForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ResetPasswordForm', () => {
  it('posts an email to /api/password/reset when no token is present', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, text: async () => '' });
    vi.stubGlobal('fetch', fetchSpy);
    renderForm('/reset-password');
    await userEvent.type(screen.getByLabelText(/email/i), 'pat@host.com');
    await userEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(fetchSpy.mock.calls[0]![0]).toBe('/api/password/reset');
  });

  it('posts a new password to /api/password/update when a token is present', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, text: async () => '' });
    vi.stubGlobal('fetch', fetchSpy);
    renderForm('/reset-password?passwordReset=tok123');
    await userEvent.type(screen.getByLabelText(/password/i), 'newpw');
    await userEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(fetchSpy.mock.calls[0]![0]).toBe('/api/password/update');
  });
});
