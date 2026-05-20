import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { usePasswordReset, usePasswordUpdate } from '@/entities/session';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { Button, Input, Label } from '@/shared/ui';

const EMAIL_RE = /(.+)@(.+)\.(.{2,})/;

export function ResetPasswordForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('passwordReset');

  const resetMutation = usePasswordReset();
  const updateMutation = usePasswordUpdate();
  const pushError = useErrorsStore((state) => state.push);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      if (token) {
        await updateMutation.mutateAsync({ token, password });
        toast.success(t('loginUpdateSuccess', 'Password updated'));
      } else {
        await resetMutation.mutateAsync(email);
        toast.success(t('loginResetSuccess', 'Password reset email sent'));
      }
      navigate('/login');
    } catch (error) {
      pushError(error instanceof Error ? error.message : String(error));
    }
  }

  const valid = token ? Boolean(password) : EMAIL_RE.test(email);
  const pending = resetMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4 p-6" noValidate>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={t('sharedBack', 'Back')}
          className="text-primary hover:underline"
          onClick={() => navigate('/login')}
        >
          ←
        </button>
        <h1 className="text-xl font-medium uppercase text-primary">{t('loginReset')}</h1>
      </div>
      {token ? (
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
      ) : (
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
      )}
      <Button type="submit" disabled={!valid || pending}>
        {t('loginReset')}
      </Button>
    </form>
  );
}
