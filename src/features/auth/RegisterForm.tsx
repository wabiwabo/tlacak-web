import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useRegister, usePatchServer, useSessionStore, generateTotpKey } from '@/entities/session';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { Button, Input, Label } from '@/shared/ui';

const EMAIL_RE = /(.+)@(.+)\.(.{2,})/;

export function RegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const patchServer = usePatchServer();
  const pushError = useErrorsStore((state) => state.push);

  const server = useSessionStore((state) => state.server);
  const newServer = Boolean(server?.newServer);
  const totpForce = Boolean(server?.attributes.totpForce);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpKey, setTotpKey] = useState<string | null>(null);

  useEffect(() => {
    if (!totpForce) {
      return;
    }
    let cancelled = false;
    generateTotpKey()
      .then((key) => {
        if (!cancelled) {
          setTotpKey(key);
        }
      })
      .catch((error: Error) => pushError(error.message));
    return () => {
      cancelled = true;
    };
  }, [totpForce, pushError]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await registerMutation.mutateAsync({ name, email, password, totpKey });
      patchServer({ newServer: false });
      toast.success(t('loginCreated', 'Registration request sent'));
      navigate('/login');
    } catch (error) {
      pushError(error instanceof Error ? error.message : String(error));
    }
  }

  const valid = Boolean(name) && Boolean(password) && (newServer || EMAIL_RE.test(email));

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4 p-6" noValidate>
      <div className="flex items-center gap-2">
        {!newServer && (
          <button
            type="button"
            aria-label={t('sharedBack', 'Back')}
            className="text-primary hover:underline"
            onClick={() => navigate('/login')}
          >
            ←
          </button>
        )}
        <h1 className="text-xl font-medium uppercase text-primary">{t('loginRegister')}</h1>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">{t('sharedName')}</Label>
        <Input
          id="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t('userEmail')}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t('userPassword')}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {totpForce && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="totpKey">{t('loginTotpKey')}</Label>
          <Input id="totpKey" readOnly value={totpKey ?? ''} />
        </div>
      )}
      <Button type="submit" disabled={!valid || registerMutation.isPending}>
        {t('loginRegister')}
      </Button>
    </form>
  );
}
