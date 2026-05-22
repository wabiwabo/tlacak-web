import { useCallback, useState } from 'react';

/**
 * Column-visibility state persisted to localStorage under `report-columns-<key>`.
 * Returns `[visibleColumns, setVisibleColumns]`.
 */
export function useReportColumns(
  key: string,
  defaultColumns: string[],
): [string[], (columns: string[]) => void] {
  const storageKey = `report-columns-${key}`;
  const [columns, setColumnsState] = useState<string[]>(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        return JSON.parse(stored) as string[];
      } catch {
        return defaultColumns;
      }
    }
    return defaultColumns;
  });

  const setColumns = useCallback(
    (next: string[]) => {
      setColumnsState(next);
      localStorage.setItem(storageKey, JSON.stringify(next));
    },
    [storageKey],
  );

  return [columns, setColumns];
}
