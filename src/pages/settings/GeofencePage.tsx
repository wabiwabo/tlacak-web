import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Geofence } from '@/entities/geofence';
import { Input } from '@/shared/ui/input';
import { Checkbox } from '@/shared/ui/checkbox';
import { Field } from '@/shared/ui/Field';
import { EditItemView, SelectField, AttributesAccordion } from '@/features/settings';

export default function GeofencePage() {
  const { t } = useTranslation();
  const [item, setItem] = useState<Geofence | undefined>(undefined);
  const set = (patch: Partial<Geofence>) => item && setItem({ ...item, ...patch });
  const setAttr = (key: string, value: unknown) =>
    item && setItem({ ...item, attributes: { ...item.attributes, [key]: value } });

  return (
    <EditItemView<Geofence>
      resource="geofences"
      titleKey="sharedGeofence"
      item={item}
      setItem={setItem}
      defaultItem={{ attributes: {} } as Geofence}
      validate={() => Boolean(item?.name)}
    >
      <Field label={t('sharedName')}>
        {(id) => (
          <Input id={id} value={item?.name ?? ''} onChange={(e) => set({ name: e.target.value })} />
        )}
      </Field>
      <Field label={t('sharedDescription')}>
        {(id) => (
          <Input
            id={id}
            value={item?.description ?? ''}
            onChange={(e) => set({ description: e.target.value })}
          />
        )}
      </Field>
      <SelectField
        label={t('sharedCalendar')}
        endpoint="/calendars"
        value={item?.calendarId ?? undefined}
        onChange={(value) => set({ calendarId: value as number | undefined })}
      />
      <Field label={t('sharedFilterMap')} inline>
        {(id) => (
          <Checkbox
            id={id}
            checked={Boolean(item?.attributes?.hide)}
            onCheckedChange={(checked) => setAttr('hide', Boolean(checked))}
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
