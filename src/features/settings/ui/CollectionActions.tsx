import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { RemoveDialog } from './RemoveDialog';

export interface CustomAction {
  key: string;
  title: string;
  icon: ReactNode;
  handler: (itemId: number) => void;
}

interface CollectionActionsProps {
  itemId: number;
  /** Edit-route prefix, e.g. `/settings/device`. Omit to hide the edit button. */
  editPath?: string;
  /** Deletes the item; called when the user confirms removal. */
  remove?: (itemId: number) => Promise<void>;
  customActions?: CustomAction[];
  readonly?: boolean;
}

export function CollectionActions({
  itemId,
  editPath,
  remove,
  customActions,
  readonly = false,
}: CollectionActionsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pushError = useErrorsStore((state) => state.push);
  const [removing, setRemoving] = useState(false);

  return (
    <div className="flex justify-end gap-0.5">
      {customActions?.map((action) => (
        <Button
          key={action.key}
          size="sm"
          variant="ghost"
          title={action.title}
          aria-label={action.title}
          onClick={() => action.handler(itemId)}
        >
          {action.icon}
        </Button>
      ))}
      {!readonly && editPath ? (
        <Button
          size="sm"
          variant="ghost"
          title={t('sharedEdit')}
          aria-label={t('sharedEdit')}
          onClick={() => navigate(`${editPath}/${itemId}`)}
        >
          <Pencil className="size-4" />
        </Button>
      ) : null}
      {!readonly && remove ? (
        <Button
          size="sm"
          variant="ghost"
          title={t('sharedRemove')}
          aria-label={t('sharedRemove')}
          onClick={() => setRemoving(true)}
        >
          <Trash2 className="size-4" />
        </Button>
      ) : null}
      <RemoveDialog
        open={removing}
        onClose={() => setRemoving(false)}
        onConfirm={async () => {
          try {
            await remove?.(itemId);
          } catch (error) {
            pushError((error as Error).message);
          }
        }}
      />
    </div>
  );
}
