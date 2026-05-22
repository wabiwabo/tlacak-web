import type { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Link2, Send, Share2 } from 'lucide-react';
import { useGroupsQuery, useRemoveGroup } from '@/entities/group';
import type { Group } from '@/entities/group';
import { useRestriction, useSessionStore } from '@/entities/session';
import { SettingsListPage } from '@/features/settings';
import type { CustomAction } from '@/features/settings';

export default function GroupsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const limitCommands = useRestriction('limitCommands');
  const shareDisabled = useSessionStore((state) => Boolean(state.server?.attributes?.disableShare));

  const columns: ColumnDef<Group>[] = [{ accessorKey: 'name', header: t('sharedName') }];

  return (
    <SettingsListPage<Group>
      titleKey="settingsGroups"
      columns={columns}
      useListQuery={useGroupsQuery}
      useRemove={useRemoveGroup}
      editPath="/settings/group"
      searchAccessors={(group) => [group.name]}
      customActions={() => {
        const actions: CustomAction[] = [
          {
            key: 'connections',
            title: t('sharedConnections'),
            icon: <Link2 className="size-4" />,
            handler: (id) => navigate(`/settings/group/${id}/connections`),
          },
        ];
        if (!limitCommands) {
          actions.push({
            key: 'command',
            title: t('deviceCommand'),
            icon: <Send className="size-4" />,
            handler: (id) => navigate(`/settings/group/${id}/command`),
          });
        }
        if (!shareDisabled) {
          actions.push({
            key: 'share',
            title: t('sharedShare'),
            icon: <Share2 className="size-4" />,
            handler: (id) => navigate(`/settings/group/${id}/share`),
          });
        }
        return actions;
      }}
    />
  );
}
