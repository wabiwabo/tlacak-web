import { useEffect, useState, type ReactNode } from 'react';
import { resolveTheme } from './resolve-theme';
import { useThemeStore } from './theme-store';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((state) => state.mode);
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia(DARK_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const resolved = resolveTheme(mode, systemPrefersDark);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, [mode, systemPrefersDark]);

  return children;
}
