import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Calendar } from '@/entities/calendar';
import { Input } from '@/shared/ui/input';
import { Field } from '@/shared/ui/Field';
import { EditItemView, AttributesAccordion } from '@/features/settings';

/** Reads a File into a base64 string (without the data-URL prefix). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function CalendarPage() {
  const { t } = useTranslation();
  const [item, setItem] = useState<Calendar | undefined>(undefined);
  const set = (patch: Partial<Calendar>) => item && setItem({ ...item, ...patch });

  return (
    <EditItemView<Calendar>
      resource="calendars"
      titleKey="sharedCalendar"
      item={item}
      setItem={setItem}
      defaultItem={{ attributes: {} } as Calendar}
      validate={() => Boolean(item?.name && item?.data)}
    >
      <Field label={t('sharedName')}>
        {(id) => (
          <Input id={id} value={item?.name ?? ''} onChange={(e) => set({ name: e.target.value })} />
        )}
      </Field>
      <Field label={t('sharedSelectFile')}>
        {(id) => (
          <Input
            id={id}
            type="file"
            accept=".ics,text/calendar"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                set({ data: await fileToBase64(file) });
              }
            }}
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
