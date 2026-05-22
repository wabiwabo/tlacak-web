import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { useSessionStore } from '@/entities/session';
import PreferencesPage from '../PreferencesPage';

beforeEach(() => {
  useSessionStore.setState({ user: { id: 1, name: 'A', attributes: {} } as never });
});

describe('PreferencesPage', () => {
  it('renders the preferences form', () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <PreferencesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });
});
