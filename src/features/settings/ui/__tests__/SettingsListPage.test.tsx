import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { SettingsListPage } from '../SettingsListPage';

interface Row {
  id?: number;
  name: string;
}

const rows: Row[] = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
];
const columns: ColumnDef<Row>[] = [{ accessorKey: 'name', header: 'Name' }];

function useListQuery() {
  return { data: rows, isLoading: false } as never;
}

describe('SettingsListPage', () => {
  it('filters rows by the keyword search', async () => {
    render(
      <MemoryRouter>
        <SettingsListPage
          titleKey="deviceTitle"
          columns={columns}
          useListQuery={useListQuery}
          searchAccessors={(item) => [item.name]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Beta')).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('Search'), 'alph');
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });
});
