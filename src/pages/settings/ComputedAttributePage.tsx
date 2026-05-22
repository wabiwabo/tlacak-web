import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ComputedAttribute } from '@/entities/computed-attribute';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Field } from '@/shared/ui/Field';
import { EditItemView } from '@/features/settings';
import { attributeTypeOptions } from '@/features/settings/lib/options';

export default function ComputedAttributePage() {
  const { t } = useTranslation();
  const [item, setItem] = useState<ComputedAttribute | undefined>(undefined);
  const set = (patch: Partial<ComputedAttribute>) => item && setItem({ ...item, ...patch });

  return (
    <EditItemView<ComputedAttribute>
      resource="attributes/computed"
      titleKey="sharedComputedAttribute"
      item={item}
      setItem={setItem}
      defaultItem={{} as ComputedAttribute}
      validate={() => Boolean(item?.description && item?.expression)}
    >
      <Field label={t('sharedDescription')}>
        {(id) => (
          <Input
            id={id}
            value={item?.description ?? ''}
            onChange={(e) => set({ description: e.target.value })}
          />
        )}
      </Field>
      <Field label={t('sharedAttribute')}>
        {(id) => (
          <Input
            id={id}
            value={item?.attribute ?? ''}
            onChange={(e) => set({ attribute: e.target.value })}
          />
        )}
      </Field>
      <Field label={t('sharedExpression')}>
        {(id) => (
          <Textarea
            id={id}
            rows={4}
            value={item?.expression ?? ''}
            onChange={(e) => set({ expression: e.target.value })}
          />
        )}
      </Field>
      <Field label={t('sharedType')}>
        {(id) => (
          <Select
            value={item?.type ?? 'string'}
            onValueChange={(value) => set({ type: value as ComputedAttribute['type'] })}
          >
            <SelectTrigger id={id}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {attributeTypeOptions.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>
    </EditItemView>
  );
}
