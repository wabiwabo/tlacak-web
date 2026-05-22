import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SharePage from '../SharePage';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('SHARE_TOKEN', { status: 200 })),
  );
});

describe('SharePage', () => {
  it('generates a share link from the returned token', async () => {
    render(
      <MemoryRouter initialEntries={['/settings/device/3/share']}>
        <Routes>
          <Route path="/settings/:type/:id/share" element={<SharePage />} />
        </Routes>
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: /show/i }));
    expect(await screen.findByDisplayValue(/token=SHARE_TOKEN/)).toBeInTheDocument();
  });
});
