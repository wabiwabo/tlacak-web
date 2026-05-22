import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Field } from '@/shared/ui/Field';
import { SettingsLayout } from '@/features/settings';

export default function SharePage() {
  const { t } = useTranslation();
  const { type = 'device', id } = useParams();
  const pushError = useErrorsStore((state) => state.push);
  const [expiration, setExpiration] = useState(dayjs().add(1, 'week').format('YYYY-MM-DD'));
  const [link, setLink] = useState('');

  const generate = async () => {
    try {
      const params = new URLSearchParams({
        [`${type}Id`]: String(id),
        expiration: dayjs(expiration).toISOString(),
      });
      const response = await fetch(`/api/share/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      if (!response.ok) {
        throw new Error((await response.text()) || response.statusText);
      }
      const token = await response.text();
      setLink(`${window.location.origin}?token=${encodeURIComponent(token)}`);
    } catch (error) {
      pushError((error as Error).message);
    }
  };

  return (
    <SettingsLayout titleKey="sharedShare">
      <Card className="mx-auto flex max-w-xl flex-col gap-4 p-4">
        <Field label={t('userExpirationTime')}>
          {(fieldId) => (
            <Input
              id={fieldId}
              type="date"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
            />
          )}
        </Field>
        <Button onClick={generate}>{t('reportShow')}</Button>
        {link ? (
          <Field label={t('sharedLink')}>
            {(fieldId) => (
              <Input id={fieldId} readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
            )}
          </Field>
        ) : null}
      </Card>
    </SettingsLayout>
  );
}
