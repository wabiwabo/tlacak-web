import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { request } from '@/shared/api/crud';
import type { CrudEntity } from '@/shared/api/crud';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { SettingsLayout } from './SettingsLayout';

interface EditItemViewProps<T extends CrudEntity> {
  /** REST resource path, e.g. `devices` or `attributes/computed`. */
  resource: string;
  /** Translation key for the page heading. */
  titleKey: string;
  item: T | undefined;
  setItem: (item: T) => void;
  /** Used as the initial item when creating (no `:id`). Defaults to `{}`. */
  defaultItem?: T;
  /** Save is disabled until this returns true. */
  validate: () => boolean;
  /** Called with the server response after a successful save. */
  onSaved?: (saved: T) => void;
  children: ReactNode;
}

export function EditItemView<T extends CrudEntity>({
  resource,
  titleKey,
  item,
  setItem,
  defaultItem,
  validate,
  onSaved,
  children,
}: EditItemViewProps<T>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const push = useErrorsStore((state) => state.push);
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item !== undefined) {
      return;
    }
    if (id) {
      request<T>(`/${resource}/${id}`)
        .then(setItem)
        .catch((error: Error) => push(error.message));
    } else {
      setItem((defaultItem ?? {}) as T);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    if (!item) {
      return;
    }
    setSaving(true);
    try {
      const saved = await request<T>(`/${resource}${id ? `/${id}` : ''}`, {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(item),
      });
      onSaved?.(saved);
      await queryClient.invalidateQueries({ queryKey: [resource] });
      navigate(-1);
    } catch (error) {
      push((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsLayout titleKey={titleKey}>
      <Card className="mx-auto flex max-w-xl flex-col gap-4 p-4">
        {item ? children : <p className="text-sm text-muted-foreground">{t('sharedLoading')}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={saving}>
            {t('sharedCancel')}
          </Button>
          <Button type="button" onClick={handleSave} disabled={!item || !validate() || saving}>
            {t('sharedSave')}
          </Button>
        </div>
      </Card>
    </SettingsLayout>
  );
}
