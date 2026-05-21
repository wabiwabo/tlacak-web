import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/shared/i18n';
import { MainToolbar } from '../MainToolbar';
import { useFilterStore } from '../model/filter-store';

beforeEach(() => {
  useFilterStore.setState({ keyword: '', statuses: [], groups: [], sort: '', filterMap: false });
});

function renderToolbar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <MainToolbar />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('MainToolbar', () => {
  it('writes the search keyword to the filter store', async () => {
    renderToolbar();
    await userEvent.type(screen.getByPlaceholderText(/search/i), 'truck');
    expect(useFilterStore.getState().keyword).toBe('truck');
  });
});
