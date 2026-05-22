import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportTable } from '../ReportTable';
import type { ReportColumn } from '../ReportTable';

interface Row {
  name: string;
  distance: number;
}

const columns: ReportColumn<Row>[] = [
  { key: 'name', labelKey: 'sharedName', cell: (row) => row.name },
  { key: 'distance', labelKey: 'sharedDistance', cell: (row) => String(row.distance) },
];

describe('ReportTable', () => {
  it('renders only the visible columns', () => {
    render(
      <ReportTable
        columns={columns}
        visible={['name']}
        data={[{ name: 'Trip A', distance: 100 }]}
      />,
    );
    expect(screen.getByText('Trip A')).toBeInTheDocument();
    expect(screen.queryByText('100')).not.toBeInTheDocument();
  });
});
