import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { request } from '@/shared/api/crud';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Field } from '@/shared/ui/Field';
import { SettingsLayout } from '@/features/settings';

export default function CommandGroupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const groupId = Number(id);
  const pushError = useErrorsStore((state) => state.push);
  const [data, setData] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      await request(`/commands/send?groupId=${groupId}`, {
        method: 'POST',
        body: JSON.stringify({ type: 'custom', attributes: { data } }),
      });
      navigate(-1);
    } catch (error) {
      pushError((error as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <SettingsLayout titleKey="deviceCommand">
      <Card className="mx-auto flex max-w-xl flex-col gap-4 p-4">
        <Field label={t('commandData')}>
          {(fieldId) => (
            <Input id={fieldId} value={data} onChange={(e) => setData(e.target.value)} />
          )}
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate(-1)} disabled={sending}>
            {t('sharedCancel')}
          </Button>
          <Button onClick={send} disabled={!data || sending}>
            {t('commandSend')}
          </Button>
        </div>
      </Card>
    </SettingsLayout>
  );
}
