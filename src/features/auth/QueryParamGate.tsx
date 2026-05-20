import { useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loginWithToken, useSessionStore } from '@/entities/session';
import { generateLoginToken } from '@/features/native-bridge';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { useDocumentLoader } from '@/shared/lib/use-document-loader';

const HANDLED = ['locale', 'token', 'uniqueId', 'openid'] as const;

function ParamLoader() {
  useDocumentLoader();
  return null;
}

export function QueryParamGate({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const setUser = useSessionStore((state) => state.setUser);
  const pushError = useErrorsStore((state) => state.push);
  const [searchParams, setSearchParams] = useSearchParams();
  const hasParams = HANDLED.some((key) => searchParams.has(key));
  const [processing, setProcessing] = useState(hasParams);

  useEffect(() => {
    if (!hasParams) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    async function run() {
      try {
        const locale = searchParams.get('locale');
        if (locale) {
          await i18n.changeLanguage(locale);
          next.delete('locale');
        }
        const token = searchParams.get('token');
        if (token) {
          const user = await loginWithToken(token);
          setUser(user);
          next.delete('token');
        }
        if (searchParams.has('uniqueId')) {
          // uniqueId-based device pre-selection is handled by the Map subsystem;
          // the param is consumed here so it does not leak into the address bar.
          window.sessionStorage.setItem('pendingUniqueId', searchParams.get('uniqueId') ?? '');
          next.delete('uniqueId');
        }
        if (searchParams.get('openid') === 'success') {
          await generateLoginToken();
        }
        next.delete('openid');
      } catch (error) {
        pushError(error instanceof Error ? error.message : String(error));
      } finally {
        setSearchParams(next, { replace: true });
        setProcessing(false);
      }
    }
    void run();
    // searchParams identity changes after setSearchParams; run once per param set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasParams]);

  if (processing) {
    return <ParamLoader />;
  }
  return children;
}
