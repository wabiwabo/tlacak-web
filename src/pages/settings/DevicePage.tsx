import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useManager } from '@/entities/session';
import type { Device } from '@/entities/device';
import { Input } from '@/shared/ui/input';
import { Checkbox } from '@/shared/ui/checkbox';
import { Field } from '@/shared/ui/Field';
import { EditItemView, SelectField, AttributesAccordion } from '@/features/settings';
import { deviceCategoryKeys } from '@/features/settings/lib/options';
import { deviceAttributeDefinitions } from '@/features/settings/lib/attribute-definitions';

export default function DevicePage() {
  const { t } = useTranslation();
  const manager = useManager();
  const [item, setItem] = useState<Device | undefined>(undefined);

  const set = (patch: Partial<Device>) => {
    if (item) {
      setItem({ ...item, ...patch });
    }
  };

  const categoryOptions = deviceCategoryKeys.map((key) => ({
    id: key,
    name: t(`category${key.charAt(0).toUpperCase()}${key.slice(1)}`),
  }));

  return (
    <EditItemView<Device>
      resource="devices"
      titleKey="sharedDevice"
      item={item}
      setItem={setItem}
      defaultItem={{ attributes: {} } as Device}
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
      <SelectField
        label={t('groupParent')}
        endpoint="/groups"
        value={item?.groupId ?? undefined}
        onChange={(value) => set({ groupId: value as number | undefined })}
      />
      <Field label={t('sharedPhone')}>
        {(id) => (
          <Input
            id={id}
            value={item?.phone ?? ''}
            onChange={(e) => set({ phone: e.target.value })}
          />
        )}
      </Field>
      <Field label={t('deviceModel')}>
        {(id) => (
          <Input
            id={id}
            value={item?.model ?? ''}
            onChange={(e) => set({ model: e.target.value })}
          />
        )}
      </Field>
      <Field label={t('deviceContact')}>
        {(id) => (
          <Input
            id={id}
            value={item?.contact ?? ''}
            onChange={(e) => set({ contact: e.target.value })}
          />
        )}
      </Field>
      <SelectField
        label={t('deviceCategory')}
        data={categoryOptions}
        value={item?.category ?? undefined}
        onChange={(value) => set({ category: value as string | undefined })}
      />
      <SelectField
        label={t('sharedCalendar')}
        endpoint="/calendars"
        value={item?.calendarId ?? undefined}
        onChange={(value) => set({ calendarId: value as number | undefined })}
      />
      <Field label={t('userExpirationTime')}>
        {(id) => (
          <Input
            id={id}
            type="date"
            disabled={!manager}
            value={(item?.expirationTime ?? '').slice(0, 10)}
            onChange={(e) =>
              set({
                expirationTime: e.target.value ? new Date(e.target.value).toISOString() : null,
              })
            }
          />
        )}
      </Field>
      <Field label={t('sharedDisabled')} inline>
        {(id) => (
          <Checkbox
            id={id}
            disabled={!manager}
            checked={Boolean(item?.disabled)}
            onCheckedChange={(checked) => set({ disabled: Boolean(checked) })}
          />
        )}
      </Field>
      <AttributesAccordion
        attributes={item?.attributes ?? {}}
        setAttributes={(attributes) => set({ attributes })}
        definitions={deviceAttributeDefinitions}
      />
    </EditItemView>
  );
}
