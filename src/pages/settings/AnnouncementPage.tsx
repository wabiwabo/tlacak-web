import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { request } from '@/shared/api/crud';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Field } from '@/shared/ui/Field';
import { SettingsLayout, SelectField } from '@/features/settings';

export default function AnnouncementPage() {
  const { t } = useTranslation();
  const pushError = useErrorsStore((state) => state.push);
  const [users, setUsers] = useState<number[]>([]);
  const [notificator, setNotificator] = useState<string | undefined>(undefined);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!notificator) {
      return;
    }
    setSending(true);
    try {
      const query = users.map((id) => `userId=${id}`).join('&');
      await request(`/notifications/send/${notificator}${query ? `?${query}` : ''}`, {
        method: 'POST',
        body: JSON.stringify({ subject, body }),
      });
      setSubject('');
      setBody('');
    } catch (error) {
      pushError((error as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <SettingsLayout titleKey="serverAnnouncement">
      <Card className="mx-auto flex max-w-xl flex-col gap-4 p-4">
        <SelectField
          label={t('settingsUsers')}
          endpoint="/users"
          multiple
          value={users}
          onChange={(value) => setUsers(value as number[])}
        />
        <SelectField
          label={t('notificationNotificators')}
          endpoint="/notifications/notificators?announcement=true"
          value={notificator}
          onChange={(value) => setNotificator(value as string | undefined)}
          optionKey={(option) => (option as { type: string }).type}
          optionLabel={(option) => {
            const type = (option as { type: string }).type;
            return t(`notificator${type.charAt(0).toUpperCase()}${type.slice(1)}`);
          }}
        />
        <Field label={t('sharedSubject')}>
          {(id) => <Input id={id} value={subject} onChange={(e) => setSubject(e.target.value)} />}
        </Field>
        <Field label={t('commandMessage')}>
          {(id) => <Textarea id={id} value={body} onChange={(e) => setBody(e.target.value)} />}
        </Field>
        <div className="flex justify-end">
          <Button onClick={send} disabled={sending || !notificator || !subject || !body}>
            {t('sharedSave')}
          </Button>
        </div>
      </Card>
    </SettingsLayout>
  );
}
