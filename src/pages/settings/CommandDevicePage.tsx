import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { request } from '@/shared/api/crud';
import type { Command } from '@/entities/command';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { SettingsLayout, BaseCommandView } from '@/features/settings';

export default function CommandDevicePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const deviceId = Number(id);
  const pushError = useErrorsStore((state) => state.push);
  const [item, setItem] = useState<Command>({ attributes: {} } as Command);
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      await request('/commands/send', {
        method: 'POST',
        body: JSON.stringify({ ...item, deviceId }),
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
        <BaseCommandView item={item} setItem={setItem} deviceId={deviceId} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate(-1)} disabled={sending}>
            {t('sharedCancel')}
          </Button>
          <Button onClick={send} disabled={!item.type || sending}>
            {t('commandSend')}
          </Button>
        </div>
      </Card>
    </SettingsLayout>
  );
}
