import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Maintenance } from '@/entities/maintenance';
import { Input } from '@/shared/ui/input';
import { Field } from '@/shared/ui/Field';
import { EditItemView, AttributesAccordion } from '@/features/settings';

export default function MaintenancePage() {
  const { t } = useTranslation();
  const [item, setItem] = useState<Maintenance | undefined>(undefined);
  const set = (patch: Partial<Maintenance>) => item && setItem({ ...item, ...patch });

  return (
    <EditItemView<Maintenance>
      resource="maintenance"
      titleKey="sharedMaintenance"
      item={item}
      setItem={setItem}
      defaultItem={{ attributes: {} } as Maintenance}
      validate={() => Boolean(item?.name && item?.type && item?.start && item?.period)}
    >
      <Field label={t('sharedName')}>
        {(id) => (
          <Input id={id} value={item?.name ?? ''} onChange={(e) => set({ name: e.target.value })} />
        )}
      </Field>
      <Field label={t('sharedType')}>
        {(id) => (
          <Input id={id} value={item?.type ?? ''} onChange={(e) => set({ type: e.target.value })} />
        )}
      </Field>
      <Field label={t('maintenanceStart')}>
        {(id) => (
          <Input
            id={id}
            type="number"
            value={item?.start ?? 0}
            onChange={(e) => set({ start: Number(e.target.value) })}
          />
        )}
      </Field>
      <Field label={t('maintenancePeriod')}>
        {(id) => (
          <Input
            id={id}
            type="number"
            value={item?.period ?? 0}
            onChange={(e) => set({ period: Number(e.target.value) })}
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
