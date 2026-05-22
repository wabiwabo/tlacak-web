import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useServerQuery, useUpdateServer } from '@/entities/session';
import type { Server } from '@/entities/session';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { Field } from '@/shared/ui/Field';
import { SettingsLayout, AttributesAccordion } from '@/features/settings';

export default function ServerPage() {
  const { t } = useTranslation();
  const { data: server } = useServerQuery();
  const updateServer = useUpdateServer();
  const pushError = useErrorsStore((state) => state.push);
  // Track only user edits on top of the loaded server data.
  const [edits, setEdits] = useState<Partial<Server>>({});

  // Merge server baseline with pending edits for display/save.
  const item: Server | undefined = server ? { ...server, ...edits } : undefined;

  const set = (patch: Partial<Server>) => setEdits((prev) => ({ ...prev, ...patch }));

  const save = async () => {
    if (!item) {
      return;
    }
    try {
      await updateServer.mutateAsync(item);
      setEdits({});
    } catch (error) {
      pushError((error as Error).message);
    }
  };

  return (
    <SettingsLayout titleKey="settingsServer">
      <Card className="mx-auto flex max-w-xl flex-col gap-4 p-4">
        {item ? (
          <>
            <Field label={t('mapCustomLabel')}>
              {(id) => (
                <Input
                  id={id}
                  value={item.mapUrl ?? ''}
                  onChange={(e) => set({ mapUrl: e.target.value })}
                />
              )}
            </Field>
            <Field label={t('positionLatitude')}>
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  value={item.latitude ?? 0}
                  onChange={(e) => set({ latitude: Number(e.target.value) })}
                />
              )}
            </Field>
            <Field label={t('positionLongitude')}>
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  value={item.longitude ?? 0}
                  onChange={(e) => set({ longitude: Number(e.target.value) })}
                />
              )}
            </Field>
            <Field label={t('serverZoom')}>
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  value={item.zoom ?? 0}
                  onChange={(e) => set({ zoom: Number(e.target.value) })}
                />
              )}
            </Field>
            <Field label={t('serverRegistration')} inline>
              {(id) => (
                <Checkbox
                  id={id}
                  checked={Boolean(item.registration)}
                  onCheckedChange={(checked) => set({ registration: Boolean(checked) })}
                />
              )}
            </Field>
            <Field label={t('serverReadonly')} inline>
              {(id) => (
                <Checkbox
                  id={id}
                  checked={Boolean(item.readonly)}
                  onCheckedChange={(checked) => set({ readonly: Boolean(checked) })}
                />
              )}
            </Field>
            <Field label={t('userDeviceReadonly')} inline>
              {(id) => (
                <Checkbox
                  id={id}
                  checked={Boolean(item.deviceReadonly)}
                  onCheckedChange={(checked) => set({ deviceReadonly: Boolean(checked) })}
                />
              )}
            </Field>
            <Field label={t('userLimitCommands')} inline>
              {(id) => (
                <Checkbox
                  id={id}
                  checked={Boolean(item.limitCommands)}
                  onCheckedChange={(checked) => set({ limitCommands: Boolean(checked) })}
                />
              )}
            </Field>
            <AttributesAccordion
              attributes={item.attributes ?? {}}
              setAttributes={(attributes) => set({ attributes })}
            />
            <div className="flex justify-end">
              <Button onClick={save} disabled={updateServer.isPending}>
                {t('sharedSave')}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t('sharedLoading')}</p>
        )}
      </Card>
    </SettingsLayout>
  );
}
