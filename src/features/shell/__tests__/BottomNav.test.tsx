import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from '../BottomNav';
import { useSessionStore } from '@/entities/session';

const navigate = vi.fn();
const onLogout = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

beforeEach(() => {
  navigate.mockClear();
  onLogout.mockClear();
  useSessionStore.setState({
    user: { id: 3, attributes: {} } as never,
    server: { attributes: {} } as never,
  });
});

describe('BottomNav', () => {
  it('renders the map, reports, and settings destinations', () => {
    render(
      <MemoryRouter>
        <BottomNav onLogout={onLogout} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: /map/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /report/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('navigates to the map when the map item is clicked', async () => {
    render(
      <MemoryRouter>
        <BottomNav onLogout={onLogout} />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: /map/i }));
    expect(navigate).toHaveBeenCalledWith('/');
  });
});
