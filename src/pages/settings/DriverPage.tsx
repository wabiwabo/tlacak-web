import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Driver } from '@/entities/driver';
import { Input } from '@/shared/ui/input';
import { Field } from '@/shared/ui/Field';
import { EditItemView, AttributesAccordion } from '@/features/settings';

export default function DriverPage() {
  const { t } = useTranslation();
  const [item, setItem] = useState<Driver | undefined>(undefined);
  const set = (patch: Partial<Driver>) => item && setItem({ ...item, ...patch });

  return (
    <EditItemView<Driver>
      resource="drivers"
      titleKey="sharedDriver"
      item={item}
      setItem={setItem}
      defaultItem={{ attributes: {} } as Driver}
      validate={() => Boolean(item?.name && item?.uniqueId)}
    >
      <Field label={t('sharedName')}>
        {(id) => (
          <Input id={id} value={item?.name ?? ''} onChange={(e) => set({ name: e.target.value })} />
        )}
      </Field>
      <Field label={t('deviceIdentifier')}>
        {(id) => (
          <Input
            id={id}
            value={item?.uniqueId ?? ''}
            onChange={(e) => set({ uniqueId: e.target.value })}
          />
        )}
      </Field>
      <AttributesAccordion
        attributes={item?.attributes ?? {}}
        setAttributes={(attributes) => set({ attributes })}
      />
    </EditItemView>
  );
}
