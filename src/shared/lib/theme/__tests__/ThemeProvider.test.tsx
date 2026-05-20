import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';
import { useThemeStore } from '../theme-store';

beforeEach(() => {
  useThemeStore.setState({ mode: 'dark' });
  document.documentElement.classList.remove('dark');
});

describe('ThemeProvider', () => {
  it('applies the dark class to <html> when mode is dark', () => {
    render(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes the dark class when mode is light', () => {
    useThemeStore.setState({ mode: 'light' });
    render(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  describe('system mode resolving to dark', () => {
    const originalMatchMedia = window.matchMedia;

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
      document.documentElement.classList.remove('dark');
    });

    it('applies the dark class when system preference is dark', () => {
      window.matchMedia = (_query: string): MediaQueryList => ({
        matches: true,
        media: _query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      });

      useThemeStore.setState({ mode: 'system' });
      render(
        <ThemeProvider>
          <span>child</span>
        </ThemeProvider>,
      );
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });
});
