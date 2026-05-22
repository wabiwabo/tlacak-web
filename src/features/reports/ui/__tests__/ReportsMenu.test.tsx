import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useSessionStore } from '@/entities/session';
import { ReportsMenu } from '../ReportsMenu';

beforeEach(() => {
  useSessionStore.setState({ user: { id: 1, name: 'A', administrator: true } as never });
});

describe('ReportsMenu', () => {
  it('shows admin-only entries for an administrator', () => {
    render(
      <MemoryRouter>
        <ReportsMenu />
      </MemoryRouter>,
    );
    expect(screen.getByText('Statistics')).toBeInTheDocument();
  });

  it('hides admin-only entries for a non-admin', () => {
    useSessionStore.setState({ user: { id: 1, name: 'A' } as never });
    render(
      <MemoryRouter>
        <ReportsMenu />
      </MemoryRouter>,
    );
    expect(screen.queryByText('Statistics')).not.toBeInTheDocument();
  });
});
