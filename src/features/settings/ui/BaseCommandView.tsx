import { useTranslation } from 'react-i18next';
import { useCommandTypesQuery } from '@/entities/command';
import type { Command } from '@/entities/command';
import { useSessionStore } from '@/entities/session';
import { Input } from '@/shared/ui/input';
import { Checkbox } from '@/shared/ui/checkbox';
import { Field } from '@/shared/ui/Field';
import { SelectField } from './SelectField';

interface BaseCommandViewProps {
  item: Command;
  setItem: (item: Command) => void;
  /** Scopes the command-types query to a device's supported types. */
  deviceId?: number;
}

export function BaseCommandView({ item, setItem, deviceId }: BaseCommandViewProps) {
  const { t } = useTranslation();
  const { data: types } = useCommandTypesQuery(deviceId);
  const textEnabled = useSessionStore((state) => Boolean(state.server?.attributes?.textEnabled));

  const set = (patch: Partial<Command>) => setItem({ ...item, ...patch });
  const setAttr = (key: string, value: unknown) =>
    setItem({ ...item, attributes: { ...item.attributes, [key]: value } });

  const typeOptions = (types ?? []).map((type) => ({
    id: type.type,
    name: t(`command${type.type.charAt(0).toUpperCase()}${type.type.slice(1)}`),
  }));

  return (
    <>
      <SelectField
        label={t('sharedType')}
        data={typeOptions}
        value={item.type ?? undefined}
        onChange={(value) => set({ type: value as string | undefined })}
      />
      <Field label={t('commandData')}>
        {(id) => (
          <Input
            id={id}
            value={String(item.attributes?.data ?? '')}
            onChange={(e) => setAttr('data', e.target.value)}
          />
        )}
      </Field>
      {textEnabled ? (
        <Field label={t('commandSendSms')} inline>
          {(id) => (
            <Checkbox
              id={id}
              checked={Boolean(item.textChannel)}
              onCheckedChange={(checked) => set({ textChannel: Boolean(checked) })}
            />
          )}
        </Field>
      ) : null}
    </>
  );
}
