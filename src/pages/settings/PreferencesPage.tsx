import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionStore, useUpdateUser } from '@/entities/session';
import type { User } from '@/entities/session';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Field } from '@/shared/ui/Field';
import { SettingsLayout } from '@/features/settings';

const liveRoutesOptions = [
  { key: 'none', labelKey: 'sharedDisabled' },
  { key: 'selected', labelKey: 'deviceTitle' },
  { key: 'all', labelKey: 'notificationAlways' },
];

export default function PreferencesPage() {
  const { t } = useTranslation();
  const user = useSessionStore((state) => state.user);
  const updateUser = useUpdateUser();
  const pushError = useErrorsStore((state) => state.push);
  const [attributes, setAttributes] = useState<Record<string, unknown>>(user?.attributes ?? {});

  const setAttr = (key: string, value: unknown) => setAttributes({ ...attributes, [key]: value });
  const boolAttr = (key: string, fallback: boolean) =>
    Object.prototype.hasOwnProperty.call(attributes, key) ? Boolean(attributes[key]) : fallback;

  const save = async () => {
    if (!user) {
      return;
    }
    try {
      await updateUser.mutateAsync({ ...user, attributes } as User);
    } catch (error) {
      pushError((error as Error).message);
    }
  };

  return (
    <SettingsLayout titleKey="sharedPreferences">
      <Card className="mx-auto flex max-w-xl flex-col gap-4 p-4">
        <Field label={t('mapLiveRoutes')}>
          {(id) => (
            <Select
              value={String(attributes.mapLiveRoutes ?? 'selected')}
              onValueChange={(value) => setAttr('mapLiveRoutes', value)}
            >
              <SelectTrigger id={id}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {liveRoutesOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
        <Field label={t('attributeShowGeofences')} inline>
          {(id) => (
            <Checkbox
              id={id}
              checked={boolAttr('mapGeofences', true)}
              onCheckedChange={(checked) => setAttr('mapGeofences', Boolean(checked))}
            />
          )}
        </Field>
        <Field label={t('deviceFollow')} inline>
          {(id) => (
            <Checkbox
              id={id}
              checked={boolAttr('mapFollow', false)}
              onCheckedChange={(checked) => setAttr('mapFollow', Boolean(checked))}
            />
          )}
        </Field>
        <Field label={t('mapClustering')} inline>
          {(id) => (
            <Checkbox
              id={id}
              checked={boolAttr('mapCluster', true)}
              onCheckedChange={(checked) => setAttr('mapCluster', Boolean(checked))}
            />
          )}
        </Field>
        <Field label={t('mapOnSelect')} inline>
          {(id) => (
            <Checkbox
              id={id}
              checked={boolAttr('mapOnSelect', true)}
              onCheckedChange={(checked) => setAttr('mapOnSelect', Boolean(checked))}
            />
          )}
        </Field>
        <div className="flex justify-end">
          <Button onClick={save} disabled={updateUser.isPending}>
            {t('sharedSave')}
          </Button>
        </div>
      </Card>
    </SettingsLayout>
  );
}
