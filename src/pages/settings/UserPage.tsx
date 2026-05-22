import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdministrator, useManager, useSessionStore } from '@/entities/session';
import type { User } from '@/entities/user';
import { Input } from '@/shared/ui/input';
import { Checkbox } from '@/shared/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Field } from '@/shared/ui/Field';
import { EditItemView, SelectField, AttributesAccordion } from '@/features/settings';
import {
  coordinateFormatOptions,
  speedUnitOptions,
  distanceUnitOptions,
  altitudeUnitOptions,
  volumeUnitOptions,
} from '@/features/settings/lib/options';
import type { StaticOption } from '@/features/settings/lib/options';
import { userAttributeDefinitions } from '@/features/settings/lib/attribute-definitions';

export default function UserPage() {
  const { t } = useTranslation();
  const admin = useAdministrator();
  const manager = useManager();
  const updateSessionUser = useSessionStore((state) => state.setUser);
  const currentUserId = useSessionStore((state) => state.user?.id);
  const [item, setItem] = useState<User | undefined>(undefined);

  const set = (patch: Partial<User>) => item && setItem({ ...item, ...patch });
  const setAttr = (key: string, value: unknown) =>
    item && setItem({ ...item, attributes: { ...item.attributes, [key]: value } });

  const renderUnitSelect = (label: string, attrKey: string, options: StaticOption[]) => (
    <Field label={label}>
      {(id) => (
        <Select
          value={String(item?.attributes?.[attrKey] ?? '')}
          onValueChange={(value) => setAttr(attrKey, value)}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.key} value={option.key}>
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </Field>
  );

  return (
    <EditItemView<User>
      resource="users"
      titleKey="settingsUser"
      item={item}
      setItem={setItem}
      defaultItem={{ attributes: {}, deviceLimit: admin ? -1 : 0 } as User}
      validate={() => Boolean(item?.name && item?.email && (item?.id || item?.password))}
      onSaved={(saved) => {
        if (saved.id === currentUserId) {
          updateSessionUser(saved);
        }
      }}
    >
      <Field label={t('sharedName')}>
        {(id) => (
          <Input id={id} value={item?.name ?? ''} onChange={(e) => set({ name: e.target.value })} />
        )}
      </Field>
      <Field label={t('userEmail')}>
        {(id) => (
          <Input
            id={id}
            type="email"
            value={item?.email ?? ''}
            onChange={(e) => set({ email: e.target.value })}
          />
        )}
      </Field>
      <Field label={t('userPassword')}>
        {(id) => (
          <Input
            id={id}
            type="password"
            value={item?.password ?? ''}
            onChange={(e) => set({ password: e.target.value })}
          />
        )}
      </Field>
      <Field label={t('sharedPhone')}>
        {(id) => (
          <Input
            id={id}
            value={item?.phone ?? ''}
            onChange={(e) => set({ phone: e.target.value })}
          />
        )}
      </Field>
      <Field label={t('settingsCoordinateFormat')}>
        {(id) => (
          <Select
            value={item?.coordinateFormat ?? ''}
            onValueChange={(value) => set({ coordinateFormat: value })}
          >
            <SelectTrigger id={id}>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {coordinateFormatOptions.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>
      {renderUnitSelect(t('settingsSpeedUnit'), 'speedUnit', speedUnitOptions)}
      {renderUnitSelect(t('settingsDistanceUnit'), 'distanceUnit', distanceUnitOptions)}
      {renderUnitSelect(t('settingsAltitudeUnit'), 'altitudeUnit', altitudeUnitOptions)}
      {renderUnitSelect(t('settingsVolumeUnit'), 'volumeUnit', volumeUnitOptions)}
      <SelectField
        label={t('sharedTimezone')}
        endpoint="/server/timezones"
        value={(item?.attributes?.timezone as string) ?? undefined}
        onChange={(value) => setAttr('timezone', value)}
        optionKey={(zone) => zone as unknown as string}
        optionLabel={(zone) => zone as unknown as string}
      />
      <Field label={t('positionLatitude')}>
        {(id) => (
          <Input
            id={id}
            type="number"
            value={item?.latitude ?? 0}
            onChange={(e) => set({ latitude: Number(e.target.value) })}
          />
        )}
      </Field>
      <Field label={t('positionLongitude')}>
        {(id) => (
          <Input
            id={id}
            type="number"
            value={item?.longitude ?? 0}
            onChange={(e) => set({ longitude: Number(e.target.value) })}
          />
        )}
      </Field>
      <Field label={t('serverZoom')}>
        {(id) => (
          <Input
            id={id}
            type="number"
            value={item?.zoom ?? 0}
            onChange={(e) => set({ zoom: Number(e.target.value) })}
          />
        )}
      </Field>
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
      <Field label={t('userDeviceLimit')}>
        {(id) => (
          <Input
            id={id}
            type="number"
            disabled={!admin}
            value={item?.deviceLimit ?? 0}
            onChange={(e) => set({ deviceLimit: Number(e.target.value) })}
          />
        )}
      </Field>
      <Field label={t('userUserLimit')}>
        {(id) => (
          <Input
            id={id}
            type="number"
            disabled={!admin}
            value={item?.userLimit ?? 0}
            onChange={(e) => set({ userLimit: Number(e.target.value) })}
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
      <Field label={t('userAdmin')} inline>
        {(id) => (
          <Checkbox
            id={id}
            disabled={!admin}
            checked={Boolean(item?.administrator)}
            onCheckedChange={(checked) => set({ administrator: Boolean(checked) })}
          />
        )}
      </Field>
      <Field label={t('serverReadonly')} inline>
        {(id) => (
          <Checkbox
            id={id}
            disabled={!manager}
            checked={Boolean(item?.readonly)}
            onCheckedChange={(checked) => set({ readonly: Boolean(checked) })}
          />
        )}
      </Field>
      <Field label={t('userDeviceReadonly')} inline>
        {(id) => (
          <Checkbox
            id={id}
            disabled={!manager}
            checked={Boolean(item?.deviceReadonly)}
            onCheckedChange={(checked) => set({ deviceReadonly: Boolean(checked) })}
          />
        )}
      </Field>
      <Field label={t('userLimitCommands')} inline>
        {(id) => (
          <Checkbox
            id={id}
            disabled={!manager}
            checked={Boolean(item?.limitCommands)}
            onCheckedChange={(checked) => set({ limitCommands: Boolean(checked) })}
          />
        )}
      </Field>
      <Field label={t('userDisableReports')} inline>
        {(id) => (
          <Checkbox
            id={id}
            disabled={!manager}
            checked={Boolean(item?.disableReports)}
            onCheckedChange={(checked) => set({ disableReports: Boolean(checked) })}
          />
        )}
      </Field>
      <Field label={t('userFixedEmail')} inline>
        {(id) => (
          <Checkbox
            id={id}
            disabled={!manager}
            checked={Boolean(item?.fixedEmail)}
            onCheckedChange={(checked) => set({ fixedEmail: Boolean(checked) })}
          />
        )}
      </Field>
      <AttributesAccordion
        attributes={item?.attributes ?? {}}
        setAttributes={(attributes) => set({ attributes })}
        definitions={userAttributeDefinitions}
      />
    </EditItemView>
  );
}
