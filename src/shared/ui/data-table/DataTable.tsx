import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';

import { cn } from '@/shared/lib/cn';

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
  /** Called when a body row is clicked. */
  onRowClick?: (row: T) => void;
  /** Marks a row visually selected; compared by reference identity. */
  selectedRow?: T;
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage,
  className,
  onRowClick,
  selectedRow,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <table className={cn('w-full border-collapse text-sm', className)}>
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id} className="border-b border-border">
            {group.headers.map((header) => (
              <th
                key={header.id}
                className="px-row py-row text-left font-medium"
                aria-sort={
                  header.column.getIsSorted() === 'asc'
                    ? 'ascending'
                    : header.column.getIsSorted() === 'desc'
                      ? 'descending'
                      : 'none'
                }
              >
                <button
                  type="button"
                  className="cursor-pointer"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </button>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="p-row text-muted-foreground">
              {emptyMessage ?? 'No data'}
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                'border-b border-border',
                onRowClick && 'cursor-pointer',
                row.original === selectedRow && 'bg-muted',
              )}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-row py-row">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
