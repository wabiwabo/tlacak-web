import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { request } from '@/shared/api/crud';
import { useLiveStore } from '@/features/main/model/live-store';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Field } from '@/shared/ui/Field';
import { SettingsLayout } from '@/features/settings';

export default function AccumulatorsPage() {
  const { t } = useTranslation();
  const { deviceId } = useParams();
  const id = Number(deviceId);
  const pushError = useErrorsStore((state) => state.push);
  const position = useLiveStore((state) => state.positions[id]);

  const initialHours = Number(position?.attributes?.hours ?? 0) / 3_600_000;
  const initialDistance = Number(position?.attributes?.totalDistance ?? 0);
  const [hours, setHours] = useState(String(initialHours));
  const [totalDistance, setTotalDistance] = useState(String(initialDistance));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await request(`/devices/${id}/accumulators`, {
        method: 'PUT',
        body: JSON.stringify({
          deviceId: id,
          hours: Number(hours) * 3_600_000,
          totalDistance: Number(totalDistance),
        }),
      });
    } catch (error) {
      pushError((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsLayout titleKey="sharedAccumulators">
      <Card className="mx-auto flex max-w-xl flex-col gap-4 p-4">
        <Field label={t('positionHours')}>
          {(fieldId) => (
            <Input
              id={fieldId}
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          )}
        </Field>
        <Field label={t('deviceTotalDistance')}>
          {(fieldId) => (
            <Input
              id={fieldId}
              type="number"
              value={totalDistance}
              onChange={(e) => setTotalDistance(e.target.value)}
            />
          )}
        </Field>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {t('sharedSave')}
          </Button>
        </div>
      </Card>
    </SettingsLayout>
  );
}
