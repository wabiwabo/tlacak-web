import { describe, expect, it, beforeAll } from 'vitest';
import { i18n, i18nReady } from '../index';

describe('i18n', () => {
  beforeAll(async () => {
    await i18nReady;
  });

  it('loads English translations', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('sharedSave')).toBe('Save');
  });

  it('lazy-loads the Arabic locale on language change', async () => {
    expect(i18n.hasResourceBundle('ar', 'translation')).toBe(false);
    await i18n.changeLanguage('ar');
    // The language switch fires the load asynchronously — wait for it.
    await new Promise((resolve) => {
      const check = () => {
        if (i18n.hasResourceBundle('ar', 'translation')) {
          resolve(undefined);
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });
    expect(i18n.t('sharedSave')).toBe('حفظ');
  });
});
