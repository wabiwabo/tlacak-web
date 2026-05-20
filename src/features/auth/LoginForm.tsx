import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLogin, useSessionStore, loginWithToken, TotpRequiredError } from '@/entities/session';
import {
  generateLoginToken,
  nativePostMessage,
  loginTokenListeners,
} from '@/features/native-bridge';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { Button, Input, Label } from '@/shared/ui';

const EMAIL_KEY = 'loginEmail';

export function LoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const setUser = useSessionStore((state) => state.setUser);
  const pushError = useErrorsStore((state) => state.push);

  const server = useSessionStore((state) => state.server);
  const registrationEnabled = Boolean(server?.registration);
  const emailEnabled = Boolean(server?.emailEnabled);
  const openIdEnabled = Boolean(server?.openIdEnabled);
  const openIdForced = Boolean(server?.openIdEnabled && server?.openIdForce);

  const [email, setEmail] = useState(() => window.localStorage.getItem(EMAIL_KEY) ?? '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeEnabled, setCodeEnabled] = useState(false);
  const [failed, setFailed] = useState(false);

  function finishLogin() {
    void generateLoginToken();
    const target = window.sessionStorage.getItem('postLogin') || '/';
    window.sessionStorage.removeItem('postLogin');
    navigate(target, { replace: true });
  }

  async function handlePasswordLogin(event: FormEvent) {
    event.preventDefault();
    setFailed(false);
    window.localStorage.setItem(EMAIL_KEY, email);
    try {
      await loginMutation.mutateAsync({ email, password, code: code || undefined });
      finishLogin();
    } catch (error) {
      if (error instanceof TotpRequiredError) {
        setCodeEnabled(true);
      } else {
        setFailed(true);
        setPassword('');
      }
    }
  }

  function handleOpenIdLogin() {
    document.location.assign('/api/session/openid/auth');
  }

  useEffect(() => {
    nativePostMessage('authentication');
  }, []);

  useEffect(() => {
    const listener = (token: string) => {
      loginWithToken(token)
        .then((user) => {
          setUser(user);
          navigate('/');
        })
        .catch((error: Error) => pushError(error.message));
    };
    loginTokenListeners.add(listener);
    return () => {
      loginTokenListeners.delete(listener);
    };
  }, [navigate, setUser, pushError]);

  return (
    <>
      {!openIdForced && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t('userEmail')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              aria-invalid={failed}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{t('userPassword')}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              aria-invalid={failed}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {codeEnabled && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">{t('loginTotpCode')}</Label>
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </div>
          )}
          {failed && <p className="text-sm text-destructive">{t('loginFailed')}</p>}
          <Button
            type="submit"
            onClick={handlePasswordLogin}
            disabled={!email || !password || (codeEnabled && !code) || loginMutation.isPending}
          >
            {t('loginLogin')}
          </Button>
        </>
      )}
      {openIdEnabled && (
        <Button type="button" variant="secondary" onClick={handleOpenIdLogin}>
          {t('loginOpenId')}
        </Button>
      )}
      {!openIdForced && (
        <div className="flex justify-center gap-6 text-xs">
          {registrationEnabled && (
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => navigate('/register')}
            >
              {t('loginRegister')}
            </button>
          )}
          {emailEnabled && (
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => navigate('/reset-password')}
            >
              {t('loginReset')}
            </button>
          )}
        </div>
      )}
    </>
  );
}
