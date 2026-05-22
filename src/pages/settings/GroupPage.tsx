import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Group } from '@/entities/group';
import { Input } from '@/shared/ui/input';
import { Field } from '@/shared/ui/Field';
import { EditItemView, SelectField, AttributesAccordion } from '@/features/settings';

export default function GroupPage() {
  const { t } = useTranslation();
  const [item, setItem] = useState<Group | undefined>(undefined);
  const set = (patch: Partial<Group>) => item && setItem({ ...item, ...patch });

  return (
    <EditItemView<Group>
      resource="groups"
      titleKey="groupDialog"
      item={item}
      setItem={setItem}
      defaultItem={{ attributes: {} } as Group}
      validate={() => Boolean(item?.name)}
    >
      <Field label={t('sharedName')}>
        {(id) => (
          <Input id={id} value={item?.name ?? ''} onChange={(e) => set({ name: e.target.value })} />
        )}
      </Field>
      <SelectField
        label={t('groupParent')}
        endpoint="/groups"
        value={item?.groupId ?? undefined}
        onChange={(value) => set({ groupId: value as number | undefined })}
      />
      <AttributesAccordion
        attributes={item?.attributes ?? {}}
        setAttributes={(attributes) => set({ attributes })}
      />
    </EditItemView>
  );
}
