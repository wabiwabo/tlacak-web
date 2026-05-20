import { describe, expect, it, beforeEach } from 'vitest';
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
});
