import { describe, expect, it, beforeAll, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { I18nProvider } from '../I18nProvider';
import { i18n, i18nReady } from '../index';

describe('I18nProvider', () => {
  beforeAll(async () => {
    await i18nReady;
  });

  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('sets dir="rtl" and lang="ar" when language is Arabic', async () => {
    render(
      <I18nProvider>
        <span>x</span>
      </I18nProvider>,
    );

    await act(async () => {
      await i18n.changeLanguage('ar');
    });

    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
  });

  it('sets dir="ltr" when language is English', async () => {
    render(
      <I18nProvider>
        <span>x</span>
      </I18nProvider>,
    );

    await act(async () => {
      await i18n.changeLanguage('en');
    });

    expect(document.documentElement.dir).toBe('ltr');
  });
});
