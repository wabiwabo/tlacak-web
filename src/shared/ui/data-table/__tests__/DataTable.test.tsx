import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../DataTable';

interface Row {
  name: string;
  status: string;
}

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status' },
];

const data: Row[] = [
  { name: 'Truck B', status: 'online' },
  { name: 'Truck A', status: 'offline' },
];

describe('DataTable', () => {
  it('renders headers and every row', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Truck A')).toBeInTheDocument();
    expect(screen.getByText('Truck B')).toBeInTheDocument();
  });

  it('sorts by a column when its header is clicked', async () => {
    render(<DataTable columns={columns} data={data} />);
    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    const cells = screen.getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('Truck A');
  });

  it('renders an empty state when there are no rows', () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });
});
