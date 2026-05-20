import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { nativePostMessage, isNativeEnvironment } from '@/features/native-bridge';
import { Button, Input, Label } from '@/shared/ui';

const currentServer = `${window.location.protocol}//${window.location.host}`;

const officialServers = [
  currentServer,
  'https://demo.traccar.org',
  'https://demo2.traccar.org',
  'https://demo3.traccar.org',
  'https://demo4.traccar.org',
  'https://server.traccar.org',
].filter((value, index, self) => self.indexOf(value) === index);

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function ChangeServerForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [value, setValue] = useState(currentServer);
  const [invalid, setInvalid] = useState(false);

  // NOTE: QR-code scanning of a server URL is deferred to a later plan.
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValidUrl(value)) {
      setInvalid(true);
      return;
    }
    if (isNativeEnvironment()) {
      nativePostMessage(`server|${value}`);
    } else {
      window.location.replace(value);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4 p-6" noValidate>
      <h1 className="text-xl font-medium uppercase text-primary">{t('settingsServer')}</h1>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="server">{t('settingsServer')}</Label>
        <Input
          id="server"
          list="official-servers"
          value={value}
          aria-invalid={invalid}
          onChange={(event) => {
            setValue(event.target.value);
            setInvalid(false);
          }}
        />
        <datalist id="official-servers">
          {officialServers.map((server) => (
            <option key={server} value={server} />
          ))}
        </datalist>
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          {t('sharedCancel')}
        </Button>
        <Button type="submit" disabled={!value}>
          {t('sharedSave')}
        </Button>
      </div>
    </form>
  );
}
