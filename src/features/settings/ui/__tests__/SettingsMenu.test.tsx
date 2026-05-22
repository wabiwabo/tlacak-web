import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useSessionStore } from '@/entities/session';
import { SettingsMenu } from '../SettingsMenu';

beforeEach(() => {
  useSessionStore.setState({
    user: { id: 5, name: 'A', administrator: true } as never,
    server: {} as never,
  });
});

describe('SettingsMenu', () => {
  it('shows admin-only entries when the user is an administrator', () => {
    render(
      <MemoryRouter>
        <SettingsMenu />
      </MemoryRouter>,
    );
    expect(screen.getByText('Server')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  it('hides Server for a non-admin non-manager user', () => {
    useSessionStore.setState({ user: { id: 5, name: 'A' } as never });
    render(
      <MemoryRouter>
        <SettingsMenu />
      </MemoryRouter>,
    );
    expect(screen.queryByText('Server')).not.toBeInTheDocument();
  });
});
