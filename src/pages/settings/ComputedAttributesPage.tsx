import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import {
  useComputedAttributesQuery,
  useRemoveComputedAttribute,
} from '@/entities/computed-attribute';
import type { ComputedAttribute } from '@/entities/computed-attribute';
import { useAdministrator } from '@/entities/session';
import { SettingsListPage } from '@/features/settings';

export default function ComputedAttributesPage() {
  const { t } = useTranslation();
  const admin = useAdministrator();

  const columns: ColumnDef<ComputedAttribute>[] = [
    { accessorKey: 'description', header: t('sharedDescription') },
    { accessorKey: 'attribute', header: t('sharedAttribute') },
    { accessorKey: 'expression', header: t('sharedExpression') },
    { accessorKey: 'type', header: t('sharedType') },
  ];

  return (
    <SettingsListPage<ComputedAttribute>
      titleKey="sharedComputedAttributes"
      columns={columns}
      useListQuery={useComputedAttributesQuery}
      useRemove={useRemoveComputedAttribute}
      editPath="/settings/attribute"
      searchAccessors={(item) => [item.description, item.attribute, item.expression]}
      readonly={!admin}
    />
  );
}
