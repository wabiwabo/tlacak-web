import { useEffect } from 'react';

/** Reveals the index.html `.loader` spinner while mounted; hides it on unmount. */
export function useDocumentLoader(): void {
  useEffect(() => {
    const loader = document.querySelector<HTMLElement>('.loader');
    if (loader) {
      loader.style.display = '';
    }
    return () => {
      if (loader) {
        loader.style.display = 'none';
      }
    };
  }, []);
}
