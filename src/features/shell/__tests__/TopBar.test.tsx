import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/shared/i18n';
import { TopBar } from '../TopBar';
import { useSessionStore } from '@/entities/session';
import { useFilterStore } from '@/features/main/model/filter-store';

beforeEach(() => {
  useFilterStore.setState({ keyword: '', statuses: [], groups: [], sort: '', filterMap: false });
  useSessionStore.setState({
    user: { id: 1, name: 'Ahmad R.', email: 'a@x.test', administrator: true, readonly: false } as never,
    server: { id: 1, version: '6.0' } as never,
  });
});

function renderTopBar() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <TopBar onLogout={() => undefined} />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('TopBar', () => {
  it('writes the search keyword to the filter store', async () => {
    renderTopBar();
    await userEvent.type(screen.getByPlaceholderText(/search/i), 'truck');
    expect(useFilterStore.getState().keyword).toBe('truck');
  });

  it('renders the ONEFLEET brand', () => {
    renderTopBar();
    expect(screen.getByText(/ONEFLEET/)).toBeInTheDocument();
  });
});
