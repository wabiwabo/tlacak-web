import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Notification } from '@/entities/notification';
import { Input } from '@/shared/ui/input';
import { Checkbox } from '@/shared/ui/checkbox';
import { Field } from '@/shared/ui/Field';
import { EditItemView, SelectField } from '@/features/settings';

/** Splits a comma string into keys; `''` -> `[]`. */
function toList(value: string | undefined): string[] {
  return value ? value.split(/[, ]+/).filter(Boolean) : [];
}

export default function NotificationPage() {
  const { t } = useTranslation();
  const [item, setItem] = useState<Notification | undefined>(undefined);
  const set = (patch: Partial<Notification>) => item && setItem({ ...item, ...patch });

  return (
    <EditItemView<Notification>
      resource="notifications"
      titleKey="sharedNotification"
      item={item}
      setItem={setItem}
      defaultItem={{ attributes: {} } as Notification}
      validate={() => Boolean(item?.type && item?.notificators)}
    >
      <SelectField
        label={t('sharedType')}
        endpoint="/notifications/types"
        value={item?.type ?? undefined}
        onChange={(value) => set({ type: value as string | undefined })}
        optionKey={(option) => (option as { type: string }).type}
        optionLabel={(option) => {
          const type = (option as { type: string }).type;
          return t(`event${type.charAt(0).toUpperCase()}${type.slice(1)}`);
        }}
      />
      <SelectField
        label={t('notificationNotificators')}
        endpoint="/notifications/notificators"
        multiple
        value={toList(item?.notificators)}
        onChange={(value) => set({ notificators: (value as string[]).join(',') })}
        optionKey={(option) => (option as { type: string }).type}
        optionLabel={(option) => {
          const type = (option as { type: string }).type;
          return t(`notificator${type.charAt(0).toUpperCase()}${type.slice(1)}`);
        }}
      />
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
      <Field label={t('notificationAlways')} inline>
        {(id) => (
          <Checkbox
            id={id}
            checked={Boolean(item?.always)}
            onCheckedChange={(checked) => set({ always: Boolean(checked) })}
          />
        )}
      </Field>
    </EditItemView>
  );
}
