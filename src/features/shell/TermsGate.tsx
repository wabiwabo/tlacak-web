import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSessionStore, useUpdateUser } from '@/entities/session';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui';

export function TermsGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const server = useSessionStore((state) => state.server);
  const updateUser = useUpdateUser();
  const pushError = useErrorsStore((state) => state.push);

  const termsUrl = server?.attributes.termsUrl as string | undefined;
  const privacyUrl = server?.attributes.privacyUrl as string | undefined;
  const accepted = Boolean(user?.attributes.termsAccepted);

  if (!user || !termsUrl || accepted) {
    return children;
  }

  function handleAccept() {
    updateUser.mutate(
      { ...user!, attributes: { ...user!.attributes, termsAccepted: true } },
      { onError: (error) => pushError(error.message) },
    );
  }

  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('userTerms')}</DialogTitle>
          <DialogDescription>{t('userTermsPrompt')}</DialogDescription>
        </DialogHeader>
        <ul className="list-disc ps-6 text-sm">
          <li>
            <a
              className="text-primary hover:underline"
              href={termsUrl}
              target="_blank"
              rel="noreferrer"
            >
              {t('userTerms')}
            </a>
          </li>
          {privacyUrl && (
            <li>
              <a
                className="text-primary hover:underline"
                href={privacyUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t('userPrivacy')}
              </a>
            </li>
          )}
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={() => navigate('/login')}>
            {t('sharedCancel')}
          </Button>
          <Button onClick={handleAccept} disabled={updateUser.isPending}>
            {t('sharedAccept')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
