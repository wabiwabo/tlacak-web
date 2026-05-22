import { useMemo, useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import type { CrudEntity } from '@/shared/api/crud';
import { DataTable } from '@/shared/ui/data-table/DataTable';
import { Input } from '@/shared/ui/input';
import { SettingsLayout } from './SettingsLayout';
import { CollectionActions } from './CollectionActions';
import type { CustomAction } from './CollectionActions';
import { CollectionFab } from './CollectionFab';

interface SettingsListPageProps<T extends CrudEntity> {
  titleKey: string;
  columns: ColumnDef<T>[];
  /** The entity list-query hook. */
  useListQuery: () => UseQueryResult<T[]>;
  /** The entity remove-mutation hook. Omit for read-only lists. */
  useRemove?: () => { mutateAsync: (id: number) => Promise<unknown> };
  /** Edit/create route prefix, e.g. `/settings/device`. */
  editPath?: string;
  /** Builds the strings a row is matched against for the keyword filter. */
  searchAccessors?: (item: T) => Array<string | number | null | undefined>;
  customActions?: (item: T) => CustomAction[];
  readonly?: boolean;
  addDisabled?: boolean;
}

export function SettingsListPage<T extends CrudEntity>({
  titleKey,
  columns,
  useListQuery,
  useRemove,
  editPath,
  searchAccessors,
  customActions,
  readonly = false,
  addDisabled = false,
}: SettingsListPageProps<T>) {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const { data, isLoading } = useListQuery();
  const removeMutation = useRemove?.();

  const filtered = useMemo(() => {
    const items = data ?? [];
    if (!keyword || !searchAccessors) {
      return items;
    }
    const lower = keyword.toLowerCase();
    return items.filter((item) =>
      searchAccessors(item).some(
        (value) => value != null && String(value).toLowerCase().includes(lower),
      ),
    );
  }, [data, keyword, searchAccessors]);

  const allColumns = useMemo<ColumnDef<T>[]>(() => {
    const showActions = !readonly || Boolean(customActions);
    if (!showActions) {
      return columns;
    }
    return [
      ...columns,
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <CollectionActions
            itemId={row.original.id as number}
            editPath={editPath}
            remove={
              removeMutation
                ? async (id) => {
                    await removeMutation.mutateAsync(id);
                  }
                : undefined
            }
            customActions={customActions?.(row.original)}
            readonly={readonly}
          />
        ),
      },
    ];
  }, [columns, editPath, removeMutation, customActions, readonly]);

  return (
    <SettingsLayout titleKey={titleKey}>
      <div className="mb-3">
        <Input
          placeholder={t('sharedSearch')}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="max-w-xs"
        />
      </div>
      <DataTable
        columns={allColumns}
        data={filtered}
        emptyMessage={isLoading ? t('sharedLoading') : t('sharedNoData')}
      />
      {editPath ? <CollectionFab editPath={editPath} disabled={readonly || addDisabled} /> : null}
    </SettingsLayout>
  );
}
