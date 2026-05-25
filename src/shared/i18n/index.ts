import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import en from './locales/en.json';

dayjs.extend(relativeTime);

// Lazy-load every non-English locale on demand. English ships with the main
// chunk so initial render never blocks on a fetch. Other locales become
// their own JSON chunks that the bundler emits next to the entry.
const loaders = import.meta.glob('./locales/*.json', {
  import: 'default',
}) as Record<string, () => Promise<Record<string, string>>>;

const codeFromPath = (path: string) =>
  path.replace('./locales/', '').replace('.json', '').replace(/_/g, '-');

const availableLanguages = Object.keys(loaders).map(codeFromPath);

const loaded = new Set<string>(['en']);

export const i18n = i18next.createInstance();

i18n.on('languageChanged', (lang) => {
  if (!lang || loaded.has(lang)) {
    return;
  }
  // Look up the loader by language code; tolerate dialect codes that don't
  // match a file (e.g. `en-US` → fall back to `en`).
  const entry = Object.entries(loaders).find(([path]) => codeFromPath(path) === lang);
  if (!entry) {
    return;
  }
  void entry[1]().then((translation) => {
    i18n.addResourceBundle(lang, 'translation', translation, true, true);
    loaded.add(lang);
  });
});

export const i18nReady = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en as Record<string, string> } },
    supportedLngs: availableLanguages,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
