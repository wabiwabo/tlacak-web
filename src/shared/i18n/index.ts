import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const modules = import.meta.glob('./locales/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, string>>;

const resources = Object.fromEntries(
  Object.entries(modules).map(([path, translation]) => {
    const code = path.replace('./locales/', '').replace('.json', '');
    return [code, { translation }];
  }),
);

export const i18n = i18next.createInstance();

export const i18nReady = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
