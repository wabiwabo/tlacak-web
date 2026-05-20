import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMediaQuery } from '../use-media-query';

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

describe('useMediaQuery', () => {
  it('returns true when the query matches', () => {
    stubMatchMedia(true);
    expect(renderHook(() => useMediaQuery('(min-width: 768px)')).result.current).toBe(true);
  });

  it('returns false when the query does not match', () => {
    stubMatchMedia(false);
    expect(renderHook(() => useMediaQuery('(min-width: 768px)')).result.current).toBe(false);
  });
});
