import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { createQueryClient } from '../query-client';

describe('createQueryClient', () => {
  it('returns a QueryClient', () => {
    expect(createQueryClient()).toBeInstanceOf(QueryClient);
  });

  it('disables refetch-on-window-focus by default', () => {
    const options = createQueryClient().getDefaultOptions();
    expect(options.queries?.refetchOnWindowFocus).toBe(false);
  });
});
