import type { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Link2, LogIn } from 'lucide-react';
import { useUsersQuery, useRemoveUser } from '@/entities/user';
import type { User } from '@/entities/user';
import { useManager } from '@/entities/session';
import { request } from '@/shared/api/crud';
import { SettingsListPage } from '@/features/settings';
import type { CustomAction } from '@/features/settings';

function boolCell(value: unknown) {
  return value ? '✓' : '';
}

export default function UsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const manager = useManager();

  const columns: ColumnDef<User>[] = [
    { accessorKey: 'name', header: t('sharedName') },
    { accessorKey: 'email', header: t('userEmail') },
    { id: 'admin', header: t('userAdmin'), accessorFn: (user) => boolCell(user.administrator) },
    { id: 'disabled', header: t('sharedDisabled'), accessorFn: (user) => boolCell(user.disabled) },
  ];

  return (
    <SettingsListPage<User>
      titleKey="settingsUsers"
      columns={columns}
      useListQuery={useUsersQuery}
      useRemove={useRemoveUser}
      editPath="/settings/user"
      searchAccessors={(user) => [user.name, user.email]}
      customActions={() => {
        const actions: CustomAction[] = [
          {
            key: 'connections',
            title: t('sharedConnections'),
            icon: <Link2 className="size-4" />,
            handler: (id) => navigate(`/settings/user/${id}/connections`),
          },
        ];
        if (manager) {
          actions.unshift({
            key: 'login',
            title: t('loginLogin'),
            icon: <LogIn className="size-4" />,
            handler: async (id) => {
              await request(`/session/${id}`);
              window.location.replace('/');
            },
          });
        }
        return actions;
      }}
    />
  );
}
