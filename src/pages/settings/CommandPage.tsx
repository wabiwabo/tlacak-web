import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Command } from '@/entities/command';
import { Input } from '@/shared/ui/input';
import { Field } from '@/shared/ui/Field';
import { EditItemView, BaseCommandView } from '@/features/settings';

export default function CommandPage() {
  const { t } = useTranslation();
  const [item, setItem] = useState<Command | undefined>(undefined);

  return (
    <EditItemView<Command>
      resource="commands"
      titleKey="sharedSavedCommand"
      item={item}
      setItem={setItem}
      defaultItem={{ attributes: {} } as Command}
      validate={() => Boolean(item?.type)}
    >
      <Field label={t('sharedDescription')}>
        {(id) => (
          <Input
            id={id}
            value={item?.description ?? ''}
            onChange={(e) => item && setItem({ ...item, description: e.target.value })}
          />
        )}
      </Field>
      {item ? <BaseCommandView item={item} setItem={setItem} /> : null}
    </EditItemView>
  );
}
