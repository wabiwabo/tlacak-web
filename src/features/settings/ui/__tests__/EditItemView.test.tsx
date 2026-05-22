import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { EditItemView } from '../EditItemView';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => navigate,
}));

interface Widget {
  id?: number;
  name?: string;
}

function Harness() {
  const [item, setItem] = useState<Widget | undefined>(undefined);
  return (
    <EditItemView<Widget>
      resource="widgets"
      titleKey="sharedName"
      item={item}
      setItem={setItem}
      defaultItem={{}}
      validate={() => Boolean(item?.name)}
    >
      <input
        aria-label="name"
        value={item?.name ?? ''}
        onChange={(e) => setItem({ ...item, name: e.target.value })}
      />
    </EditItemView>
  );
}

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/settings/widget']}>
        <Routes>
          <Route path="/settings/widget" element={<Harness />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  navigate.mockClear();
  vi.unstubAllGlobals();
});

describe('EditItemView', () => {
  it('disables Save until validate() passes', async () => {
    renderView();
    const save = screen.getByRole('button', { name: /save/i });
    expect(save).toBeDisabled();
    await userEvent.type(screen.getByLabelText('name'), 'Hello');
    expect(save).toBeEnabled();
  });

  it('POSTs the item and navigates back on save', async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ id: 1, name: 'Hello' }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    renderView();
    await userEvent.type(screen.getByLabelText('name'), 'Hello');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(-1));
    expect((fetchMock.mock.calls[0] as unknown[])[1]).toMatchObject({ method: 'POST' });
  });
});
