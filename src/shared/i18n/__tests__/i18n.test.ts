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

  it('loads the Arabic locale', async () => {
    await i18n.changeLanguage('ar');
    expect(i18n.t('sharedSave')).not.toBe('sharedSave');
  });
});
