import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { useCommandsQuery, useRemoveCommand } from '@/entities/command';
import type { Command } from '@/entities/command';
import { useRestriction } from '@/entities/session';
import { SettingsListPage } from '@/features/settings';

/** Capitalises a command-type key into its `command<Type>` translation key. */
function commandTypeKey(type: string | undefined) {
  return type ? `command${type.charAt(0).toUpperCase()}${type.slice(1)}` : '';
}

export default function CommandsPage() {
  const { t } = useTranslation();
  const limitCommands = useRestriction('limitCommands');

  const columns: ColumnDef<Command>[] = [
    { accessorKey: 'description', header: t('sharedDescription') },
    {
      id: 'type',
      header: t('sharedType'),
      accessorFn: (command) => {
        const key = commandTypeKey(command.type);
        return key ? t(key) : '';
      },
    },
    {
      id: 'sms',
      header: t('commandSendSms'),
      accessorFn: (command) => (command.textChannel ? '✓' : ''),
    },
  ];

  return (
    <SettingsListPage<Command>
      titleKey="sharedSavedCommands"
      columns={columns}
      useListQuery={useCommandsQuery}
      useRemove={useRemoveCommand}
      editPath="/settings/command"
      searchAccessors={(command) => [command.description, command.type]}
      readonly={limitCommands}
    />
  );
}
