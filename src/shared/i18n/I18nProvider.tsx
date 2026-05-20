import { useEffect, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from './index';
import { directionFor } from './rtl';

export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const apply = (language: string) => {
      document.documentElement.lang = language;
      document.documentElement.dir = directionFor(language);
    };
    apply(i18n.language || 'en');
    i18n.on('languageChanged', apply);
    return () => i18n.off('languageChanged', apply);
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
