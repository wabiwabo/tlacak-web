import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/shared/ui/data-table/DataTable';

/** A report column: the field key, its header translation key, and a cell renderer. */
export interface ReportColumn<T> {
  key: string;
  labelKey: string;
  cell: (item: T) => string;
}

interface ReportTableProps<T> {
  columns: ReportColumn<T>[];
  /** Subset of `columns[].key` currently visible, in display order. */
  visible: string[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  selectedRow?: T;
}

export function ReportTable<T>({
  columns,
  visible,
  data,
  loading = false,
  onRowClick,
  selectedRow,
}: ReportTableProps<T>) {
  const { t } = useTranslation();

  const tableColumns = useMemo<ColumnDef<T>[]>(
    () =>
      visible
        .map((key) => columns.find((column) => column.key === key))
        .filter((column): column is ReportColumn<T> => Boolean(column))
        .map((column) => ({
          id: column.key,
          header: t(column.labelKey),
          accessorFn: (row: T) => column.cell(row),
        })),
    [columns, visible, t],
  );

  return (
    <DataTable
      columns={tableColumns}
      data={data}
      emptyMessage={loading ? t('sharedLoading') : t('sharedNoData')}
      onRowClick={onRowClick}
      selectedRow={selectedRow}
    />
  );
}
